from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import json
import joblib
import numpy as np
import pandas as pd
from pathlib import Path
from math import log1p


# ============================================================
# FastAPI App
# ============================================================

app = FastAPI(title="중고차 플랫폼 개인 딜러 이탈 예측 시스템")

# React / Spring Boot 연동용 CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# Model Load
# ============================================================

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "dealer_churn_service_model.pkl"

# ============================================================
# Company Model Load
# ============================================================

COMPANY_MODEL_PATH = BASE_DIR / "company_churn_service_model.pkl"

model_company = None
COMPANY_MODEL_FEATURES = []
try:
    model_company_dict = joblib.load(COMPANY_MODEL_PATH)
    model_company = model_company_dict["model"]
    COMPANY_MODEL_FEATURES = model_company_dict["feature_columns"]
    print(f"[Company Model] Loaded successfully from dict: {COMPANY_MODEL_PATH}")
    print(f"[Company Features] {COMPANY_MODEL_FEATURES}")
except Exception as e:
    model_company = None
    print(f"[Company Model] Load Failed: {e}")

model_individual = None
MODEL_FEATURES = []

try:
    model_individual_dict = joblib.load(MODEL_PATH)
    model_individual = model_individual_dict["model"]
    MODEL_FEATURES = model_individual_dict["feature_columns"]
    print(f"[Model Load] Individual model loaded successfully from dict: {MODEL_PATH}")
    print(f"[Individual Features] {MODEL_FEATURES}")
except Exception as e:
    model_individual = None
    print(f"[Model Load Warning] Individual model loading failed: {e}")


# ============================================================
# Vehicle Recommendation Model Load
# ============================================================

VEHICLE_CONDITION_MODEL_PATH = BASE_DIR / "vehicle_condition_catboost_model.pkl"
VEHICLE_MMR_MODEL_PATH = BASE_DIR / "vehicle_mmr_catboost_model.pkl"
VEHICLE_DUMMY_PATH = (
    BASE_DIR.parent
    / "dataset"
    / "dummy_output"
    / "vehicle_recommendation_dummy.json"
)

model_vehicle_condition = None
model_vehicle_mmr = None
VEHICLE_CONDITION_FEATURES = []
VEHICLE_MMR_FEATURES = []
VEHICLE_CONDITION_MIN = 1.0
VEHICLE_CONDITION_MAX = 5.0
VEHICLE_MMR_MIN = 0.0

try:
    vehicle_condition_bundle = joblib.load(VEHICLE_CONDITION_MODEL_PATH)
    model_vehicle_condition = vehicle_condition_bundle["model"]
    VEHICLE_CONDITION_FEATURES = vehicle_condition_bundle["features"]
    VEHICLE_CONDITION_MIN = float(
        vehicle_condition_bundle.get("prediction_min", 1.0)
    )
    VEHICLE_CONDITION_MAX = float(
        vehicle_condition_bundle.get("prediction_max", 5.0)
    )
    print(
        "[Vehicle Condition Model] Loaded successfully from dict: "
        f"{VEHICLE_CONDITION_MODEL_PATH}"
    )
    print(f"[Vehicle Condition Features] {VEHICLE_CONDITION_FEATURES}")
except Exception as e:
    model_vehicle_condition = None
    print(f"[Vehicle Condition Model] Load Failed: {e}")

try:
    vehicle_mmr_bundle = joblib.load(VEHICLE_MMR_MODEL_PATH)
    model_vehicle_mmr = vehicle_mmr_bundle["model"]
    VEHICLE_MMR_FEATURES = vehicle_mmr_bundle["features"]
    VEHICLE_MMR_MIN = float(vehicle_mmr_bundle.get("prediction_min", 0.0))
    print(
        "[Vehicle MMR Model] Loaded successfully from dict: "
        f"{VEHICLE_MMR_MODEL_PATH}"
    )
    print(f"[Vehicle MMR Features] {VEHICLE_MMR_FEATURES}")
except Exception as e:
    model_vehicle_mmr = None
    print(f"[Vehicle MMR Model] Load Failed: {e}")


# ============================================================
# Request Body
# React 또는 Spring Boot에서 FastAPI로 전달할 입력 규격
# ============================================================

class DealerFeatures(BaseModel):
    Last_Activity_Days: int = Field(..., description="마지막 활동 경과일")
    Recent_60d_Trade_Count: int = Field(..., description="최근 60일 거래 건수")
    Previous_Trade_Count: int = Field(..., description="이전 거래 건수")
    Site_Usage_Rate: float = Field(..., description="사이트 이용률, 0~1 사이 값")
    Avg_Selling_Price: float = Field(default=13000000.0, description="평균 판매 단가")

class CompanyFeatures(BaseModel):
    Dealer_Count: int = Field(..., description="소속 딜러 수")
    Active_Dealer_Ratio: float = Field(..., description="활동 딜러 비율 (0~1)")
    Recent_Trade_Count: int = Field(..., description="최근 거래 건수")
    Previous_Trade_Count: int = Field(..., description="이전 거래 건수")
    Site_Usage_Rate_Avg: float = Field(..., description="평균 사이트 이용률 (0~1)")
    Avg_Selling_Price_Avg: float = Field(default=13000000.0, description="소속 딜러들의 평균 판매 단가")

# ============================================================
# Helper Functions
# ============================================================

def get_risk_grade(probability: float) -> str:
    """이탈 확률을 위험 등급으로 변환"""
    if probability >= 0.8:
        return "Critical"
    elif probability >= 0.6:
        return "High"
    elif probability >= 0.4:
        return "Medium"
    elif probability >= 0.2:
        return "Low"
    else:
        return "Safe"


DEFAULT_RISK_REASON = "현재 설정된 활동 위험 기준에 해당하는 특이사항이 없습니다."


def build_dealer_risk_reasons(
    last_activity_days: int,
    recent_trade_count: int,
    previous_trade_count: int,
    site_usage_rate: float,
    avg_selling_price: float | None = None,
) -> list[str]:
    """개인 딜러의 활동 지표를 동일한 규칙으로 설명 문구로 변환합니다."""
    risk_reasons = []

    if last_activity_days >= 14:
        risk_reasons.append(
            f"마지막 접속 후 {last_activity_days}일간 로그인이 없어 장기 휴면 상태입니다."
        )

    expected_60d = max(1.0, float(previous_trade_count) / 3.0)
    trade_drop_rate = (
        0.0
        if previous_trade_count == 0
        else max(
            0.0,
            1.0 - float(recent_trade_count) / expected_60d,
        )
    )
    if trade_drop_rate >= 0.50 and previous_trade_count >= 30:
        risk_reasons.append(
            f"과거 누적 실적({previous_trade_count}회) 대비 최근 거래가 "
            f"{int(trade_drop_rate * 100)}% 급락했습니다."
        )
    elif recent_trade_count == 0:
        risk_reasons.append("최근 60일 동안 성사된 차량 거래가 전무합니다.")

    if site_usage_rate <= 0.30:
        risk_reasons.append(
            f"사이트 매물 조회 이용률이 {int(site_usage_rate * 100)}%로 매우 저조합니다."
        )

    if avg_selling_price is not None and avg_selling_price <= 3000000.0:
        risk_reasons.append(
            f"평균 판매 단가가 {int(avg_selling_price / 10000)}만원으로 "
            "초저가/영세 차량 위주입니다."
        )

    return risk_reasons or [DEFAULT_RISK_REASON]


def build_company_risk_reasons(
    active_dealer_ratio: float,
    site_usage_rate_avg: float,
    recent_trade_count: int,
    recent_trade_per_dealer: float,
    previous_trade_per_dealer: float,
) -> list[str]:
    """회사의 활동 지표를 동일한 규칙으로 설명 문구로 변환합니다."""
    risk_reasons = []

    if active_dealer_ratio <= 0.60:
        risk_reasons.append(
            f"소속 딜러들의 현재 활동 비율이 {int(active_dealer_ratio * 100)}%로 "
            "과반이 비활성 상태입니다."
        )
    if site_usage_rate_avg <= 0.40:
        risk_reasons.append(
            f"상사 소속 딜러들의 평균 사이트 이용률이 "
            f"{int(site_usage_rate_avg * 100)}%로 저조합니다."
        )
    if recent_trade_count == 0:
        risk_reasons.append(
            "상사 소속 전체 딜러들의 최근 60일간 거래가 전무합니다."
        )

    growth = recent_trade_per_dealer / (previous_trade_per_dealer + 1e-5)
    if growth <= 0.40:
        risk_reasons.append(
            "과거 거래 패턴 대비 상사 전체의 활동성 성장률이 크게 하락했습니다."
        )

    return risk_reasons or [DEFAULT_RISK_REASON]


def clamp(value: float, min_value: float, max_value: float) -> float:
    """입력값을 안전 범위로 보정"""
    return max(min_value, min(max_value, float(value)))


def normalize_input(features: DealerFeatures) -> pd.DataFrame:
    """React/Spring Boot 입력값을 모델 학습 컬럼명으로 변환"""
    site_usage_rate = max(0.0, min(1.0, float(features.Site_Usage_Rate)))

    # 파생 피처 trade_drop_rate 계산 (180일 대비 60일 비례)
    expected_60d = max(1.0, float(features.Previous_Trade_Count) / 3.0)
    trade_drop_rate = 0.0 if features.Previous_Trade_Count == 0 else max(0.0, 1.0 - float(features.Recent_60d_Trade_Count) / expected_60d)

    input_dict = {
        "last_activity_days": float(features.Last_Activity_Days),
        "recent_60d_trade_count": float(features.Recent_60d_Trade_Count),
        "recent_60d_trade_count_log": log1p(float(features.Recent_60d_Trade_Count)),
        "previous_trade_count": float(features.Previous_Trade_Count),
        "previous_trade_count_log": log1p(float(features.Previous_Trade_Count)),
        "trade_drop_rate": trade_drop_rate,
        "avg_selling_price": float(features.Avg_Selling_Price),
        "site_usage_rate": site_usage_rate,
    }

    input_df = pd.DataFrame([input_dict])
    input_df = input_df[MODEL_FEATURES]

    return input_df

def normalize_company_input(features: CompanyFeatures) -> pd.DataFrame:
    dc = max(1, features.Dealer_Count)
    adr = clamp(features.Active_Dealer_Ratio, 0.0, 1.0)
    rtc = max(0, features.Recent_Trade_Count)
    ptc = max(0, features.Previous_Trade_Count)

    recent_tpd = rtc / dc
    prev_tpd = ptc / dc
    growth = recent_tpd / (prev_tpd + 1e-5)
    recent_tpd_log = log1p(recent_tpd)
    prev_tpd_log = log1p(prev_tpd)

    input_dict = {
        "dealer_count": float(dc),
        "active_dealer_ratio": float(adr),
        "recent_trade_per_dealer": float(recent_tpd),
        "previous_trade_per_dealer": float(prev_tpd),
        "recent_trade_per_dealer_log": recent_tpd_log,
        "previous_trade_per_dealer_log": prev_tpd_log,
        "activity_growth": float(growth),
        "activity_growth_log": recent_tpd_log - prev_tpd_log,
        "site_usage_rate_avg": clamp(features.Site_Usage_Rate_Avg, 0.0, 1.0),
        "avg_selling_price_avg": float(features.Avg_Selling_Price_Avg),
    }

    input_df = pd.DataFrame([input_dict])
    return input_df[COMPANY_MODEL_FEATURES]

def get_probability_columns(model, input_df: pd.DataFrame) -> tuple:
    """여러 입력 행의 Active/Inactive 확률을 한 번에 반환"""
    if not hasattr(model, "predict_proba"):
        raise ValueError("현재 모델은 predict_proba를 지원하지 않습니다.")

    probabilities = model.predict_proba(input_df)

    # 일반적으로 classes_는 [0, 1]이지만, 안전하게 class index를 확인
    if hasattr(model, "named_steps"):
        classifier = (
            model.named_steps.get("classifier")
            or model.named_steps.get("model")
        )
    else:
        classifier = model
    classes = list(getattr(classifier, "classes_", [0, 1]))

    active_idx = classes.index(0)
    churn_idx = classes.index(1)

    return probabilities[:, active_idx], probabilities[:, churn_idx]


def get_probability(model, input_df: pd.DataFrame) -> tuple[int, float, float]:
    """단일 입력의 모델 예측 등급과 Active/Inactive 확률을 반환"""
    active_probabilities, churn_probabilities = get_probability_columns(
        model,
        input_df,
    )
    active_probability = float(active_probabilities[0])
    churn_probability = float(churn_probabilities[0])
    prediction = int(churn_probability > active_probability)

    return (
        prediction,
        active_probability,
        churn_probability,
    )
# API Endpoints
# ============================================================

@app.get("/")
def health_check():
    return {
        "status": "running",
        "model_loaded": model_individual is not None,
        "model_path": str(MODEL_PATH),
        "model_features": MODEL_FEATURES,
    }


@app.post("/api/ai/predict-churn/individual")
def predict_personal(features: DealerFeatures):
    if model_individual is None:
        raise HTTPException(
            status_code=503,
            detail="모델 파일 로드에 실패했습니다. dealer_churn_service_model.pkl 위치를 확인하세요.",
        )

    try:
        input_df = normalize_input(features)

        print("--- [Prediction Input] ---")
        print(input_df.to_string(index=False))

        prediction, active_probability, churn_probability = get_probability(
            model_individual,
            input_df,
        )

        predicted_status = "Inactive" if prediction == 1 else "Active"
        risk_grade = get_risk_grade(churn_probability)

        risk_reasons = build_dealer_risk_reasons(
            last_activity_days=features.Last_Activity_Days,
            recent_trade_count=features.Recent_60d_Trade_Count,
            previous_trade_count=features.Previous_Trade_Count,
            site_usage_rate=features.Site_Usage_Rate,
            avg_selling_price=features.Avg_Selling_Price,
        )

        print("--- [Prediction Result] ---")
        print(f"predicted_status: {predicted_status}")
        print(f"active_probability: {active_probability}")
        print(f"churn_probability: {churn_probability}")
        print(f"risk_reasons: {risk_reasons}")

        return {
            "status": "success",
            "predicted_status": predicted_status,
            "churn_probability": round(churn_probability, 4),
            "churn_probability_percent": round(churn_probability * 100, 2),
            "active_probability": round(active_probability, 4),
            "active_probability_percent": round(active_probability * 100, 2),
            "risk_grade": risk_grade,
            "risk_reasons": risk_reasons,
            "input_features": input_df.iloc[0].to_dict(),
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"예측 도중 에러 발생: {str(e)}",
        )


@app.post("/api/ai/predict-churn/company")
def predict_company(features: CompanyFeatures):
    if model_company is None:
        raise HTTPException(
            status_code=503,
            detail="company_churn_service_model.pkl을 불러오지 못했습니다."
        )

    try:
        input_df = normalize_company_input(features)

        print("--- [Prediction Input (Company)] ---")
        print(input_df.to_string(index=False))

        prediction, active_probability, churn_probability = get_probability(
            model_company,
            input_df
        )

        predicted_status = "Inactive" if prediction == 1 else "Active"
        churn_prob = float(churn_probability)

        dc = max(1, features.Dealer_Count)
        recent_tpd = features.Recent_Trade_Count / dc
        prev_tpd = features.Previous_Trade_Count / dc
        risk_reasons = build_company_risk_reasons(
            active_dealer_ratio=features.Active_Dealer_Ratio,
            site_usage_rate_avg=features.Site_Usage_Rate_Avg,
            recent_trade_count=features.Recent_Trade_Count,
            recent_trade_per_dealer=recent_tpd,
            previous_trade_per_dealer=prev_tpd,
        )

        print("--- [Prediction Result (Company)] ---")
        print(f"predicted_status: {predicted_status}")
        print(f"active_probability: {active_probability}")
        print(f"churn_probability: {churn_prob}")
        print(f"risk_reasons: {risk_reasons}")

        return {
            "status": "success",
            "predicted_status": predicted_status,
            "churn_probability": round(churn_prob, 4),
            "churn_probability_percent": round(churn_prob * 100, 2),
            "active_probability": round(active_probability, 4),
            "active_probability_percent": round(active_probability * 100, 2),
            "risk_grade": get_risk_grade(churn_prob),
            "risk_reasons": risk_reasons,
            "input_features": input_df.iloc[0].to_dict()
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"예측 도중 에러 발생: {str(e)}",
        )

@app.get("/api/ai/churn/dealers")
def get_churn_dealers():
    return get_churn_dealers_dummy()

@app.get("/api/ai/churn/companies")
def get_churn_companies():
    return get_churn_companies_dummy()

@app.get("/api/ai/churn/dealers/dummy")
def get_churn_dealers_dummy():
    dummy_path = BASE_DIR.parent / "dataset" / "dummy_output" / "dealer_churn_dummy.json"
    if not dummy_path.exists():
        raise HTTPException(status_code=404, detail="dealer_churn_dummy.json 파일을 찾을 수 없습니다.")

    if model_individual is None:
        raise HTTPException(
            status_code=503,
            detail="개인 딜러 예측 모델을 불러오지 못했습니다.",
        )

    with open(dummy_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    input_rows = [
        {
            "last_activity_days": float(row["last_activity_days"]),
            "recent_60d_trade_count": float(row["recent_60d_trade_count"]),
            "recent_60d_trade_count_log": float(row["recent_60d_trade_count_log"]),
            "previous_trade_count": float(row["previous_trade_count"]),
            "previous_trade_count_log": float(row["previous_trade_count_log"]),
            "site_usage_rate": float(row["site_usage_rate"]),
        }
        for row in data
    ]
    input_df = pd.DataFrame(input_rows)[MODEL_FEATURES]
    _, churn_probabilities = get_probability_columns(
        model_individual,
        input_df,
    )

    result_list = []
    for row, prob in zip(data, churn_probabilities):
        d_id = int(row["dealer_id"])
        last_days = int(row["last_activity_days"])
        recent_trades = int(row["recent_60d_trade_count"])
        prev_trades = int(row["previous_trade_count"])
        usage = float(row["site_usage_rate"])
        prob = float(prob)
        prob_pct = round(prob * 100, 2)
        
        risk_reasons = build_dealer_risk_reasons(
            last_activity_days=last_days,
            recent_trade_count=recent_trades,
            previous_trade_count=prev_trades,
            site_usage_rate=usage,
        )

        model_risk_grade = get_risk_grade(prob)
        if model_risk_grade in {"Critical", "High"}:
            risk_grade_kr = "높음"
        elif model_risk_grade == "Medium":
            risk_grade_kr = "보통"
        else:
            risk_grade_kr = "낮음"
            
        action = "모니터링"
        if risk_grade_kr == "높음":
            action = "수수료 50% 쿠폰발송"

        result_list.append({
            "id": d_id,
            "type": "개인딜러",
            "memberType": "개인딜러",
            "name": f"딜러_{d_id - 1000:03d}",
            "recentActivity": f"{last_days}일 전",
            "churnRate": f"{prob_pct:.2f}%",
            "churnRateRaw": prob_pct,
            "risk": risk_grade_kr,
            "action": action,
            "reason": ", ".join(risk_reasons)
        })
        
    result_list = sorted(result_list, key=lambda x: x["churnRateRaw"], reverse=True)
    return result_list


@app.get("/api/ai/churn/companies/dummy")
def get_churn_companies_dummy():
    dummy_path = BASE_DIR.parent / "dataset" / "dummy_output" / "company_churn_dummy.json"
    if not dummy_path.exists():
        raise HTTPException(status_code=404, detail="company_churn_dummy.json 파일을 찾을 수 없습니다.")

    if model_company is None:
        raise HTTPException(
            status_code=503,
            detail="회사 예측 모델을 불러오지 못했습니다.",
        )

    with open(dummy_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    input_rows = []
    for row in data:
        recent_tpd = float(row["recent_trade_per_dealer"])
        prev_tpd = float(row["previous_trade_per_dealer"])
        input_rows.append({
            "dealer_count": float(row["dealer_count"]),
            "active_dealer_ratio": float(row["active_dealer_ratio"]),
            "recent_trade_per_dealer": recent_tpd,
            "previous_trade_per_dealer": prev_tpd,
            "recent_trade_per_dealer_log": float(row["recent_trade_per_dealer_log"]),
            "previous_trade_per_dealer_log": float(row["previous_trade_per_dealer_log"]),
            "activity_growth": recent_tpd / (prev_tpd + 1e-5),
            "activity_growth_log": float(row["activity_growth_log"]),
            "site_usage_rate_avg": float(row["site_usage_rate_avg"]),
        })

    input_df = pd.DataFrame(input_rows)[COMPANY_MODEL_FEATURES]
    _, churn_probabilities = get_probability_columns(
        model_company,
        input_df,
    )

    result_list = []
    for row, prob in zip(data, churn_probabilities):
        comp_id = int(row["company_id"])
        dc = int(row["dealer_count"])
        adr = float(row["active_dealer_ratio"])
        rtc = int(row["recent_60d_trade_count"])
        recent_tpd = float(row["recent_trade_per_dealer"])
        prev_tpd = float(row["previous_trade_per_dealer"])
        sur = float(row["site_usage_rate_avg"])
        prob = float(prob)
        prob_pct = round(prob * 100, 2)
        
        risk_reasons = build_company_risk_reasons(
            active_dealer_ratio=adr,
            site_usage_rate_avg=sur,
            recent_trade_count=rtc,
            recent_trade_per_dealer=recent_tpd,
            previous_trade_per_dealer=prev_tpd,
        )

        risk_grade_kr = "낮음"
        if prob >= 0.80:
            risk_grade_kr = "높음"
        elif prob >= 0.40:
            risk_grade_kr = "보통"
            
        action = "모니터링"
        if prob >= 0.80:
            action = "멤버십 30% 쿠폰발송"

        result_list.append({
            "id": comp_id,
            "type": "회사",
            "memberType": "회사",
            "name": f"상사_{comp_id:02d}",
            "recentActivity": "최근 거래 있음" if rtc > 0 else "활동 이력 없음",
            "churnRate": f"{prob_pct:.2f}%",
            "churnRateRaw": prob_pct,
            "risk": risk_grade_kr,
            "action": action,
            "reason": ", ".join(risk_reasons)
        })
        
    # 이탈 위험도 내림차순 정렬
    result_list = sorted(result_list, key=lambda x: x["churnRateRaw"], reverse=True)
    return result_list


@app.get("/api/ai/vehicle-recommendations")
def get_vehicle_recommendations():
    """시연용 차량 전체를 Condition과 MMR 모델로 일괄 예측합니다."""
    if model_vehicle_condition is None or model_vehicle_mmr is None:
        raise HTTPException(
            status_code=503,
            detail="차량 Condition 또는 MMR 예측 모델을 불러오지 못했습니다.",
        )

    if not VEHICLE_DUMMY_PATH.exists():
        raise HTTPException(
            status_code=404,
            detail="vehicle_recommendation_dummy.json 파일을 찾을 수 없습니다.",
        )

    try:
        with open(VEHICLE_DUMMY_PATH, "r", encoding="utf-8") as f:
            vehicles = json.load(f)

        if not isinstance(vehicles, list) or not vehicles:
            raise ValueError("차량 더미 데이터가 비어 있거나 배열 형식이 아닙니다.")

        required_fields = {"vehicle_id", "year", "make", "model", "odometer"}
        for index, vehicle in enumerate(vehicles, start=1):
            missing_fields = required_fields - set(vehicle)
            if missing_fields:
                missing_text = ", ".join(sorted(missing_fields))
                raise ValueError(
                    f"{index}번째 차량에 필수 필드가 없습니다: {missing_text}"
                )

        condition_rows = [
            {
                "year": int(vehicle["year"]),
                "make": str(vehicle["make"]),
                "model": str(vehicle["model"]),
                "odometer": float(vehicle["odometer"]),
            }
            for vehicle in vehicles
        ]
        condition_input_df = pd.DataFrame(condition_rows)[
            VEHICLE_CONDITION_FEATURES
        ]

        predicted_conditions = np.asarray(
            model_vehicle_condition.predict(condition_input_df),
            dtype=float,
        )
        predicted_conditions = np.clip(
            predicted_conditions,
            VEHICLE_CONDITION_MIN,
            VEHICLE_CONDITION_MAX,
        )

        mmr_input_df = condition_input_df.copy()
        mmr_input_df["condition"] = predicted_conditions
        mmr_input_df = mmr_input_df[VEHICLE_MMR_FEATURES]

        predicted_mmrs = np.asarray(
            model_vehicle_mmr.predict(mmr_input_df),
            dtype=float,
        )
        predicted_mmrs = np.maximum(predicted_mmrs, VEHICLE_MMR_MIN)

        recommendations = []
        for vehicle, condition, mmr in zip(
            vehicles,
            predicted_conditions,
            predicted_mmrs,
        ):
            options = vehicle.get("option", [])
            recommendations.append(
                {
                    "vehicle_id": str(vehicle["vehicle_id"]),
                    "year": int(vehicle["year"]),
                    "make": str(vehicle["make"]),
                    "model": str(vehicle["model"]),
                    "odometer": int(float(vehicle["odometer"])),
                    "option": options if isinstance(options, list) else [],
                    "predicted_condition": round(float(condition), 2),
                    "predicted_mmr": round(float(mmr), 2),
                }
            )

        recommendations.sort(
            key=lambda item: (
                item["predicted_condition"],
                item["predicted_mmr"],
            ),
            reverse=True,
        )

        return {
            "status": "success",
            "count": len(recommendations),
            "recommendations": recommendations,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"차량 추천 예측 중 오류 발생: {str(e)}",
        )



