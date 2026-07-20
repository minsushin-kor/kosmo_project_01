from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import joblib
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
PROJECT_MODEL_PATH = BASE_DIR / "dealer_churn_service_model.pkl"
ORIGINAL_MODEL_PATH = Path.home() / "Downloads" / "dealer_churn_service_model.pkl"
MODEL_PATH = ORIGINAL_MODEL_PATH if ORIGINAL_MODEL_PATH.exists() else PROJECT_MODEL_PATH

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
dealer_threshold = 0.8184715639566639  # default fallback value

try:
    model_individual_dict = joblib.load(MODEL_PATH)
    model_individual = model_individual_dict["model"]
    MODEL_FEATURES = model_individual_dict["feature_columns"]
    dealer_threshold = model_individual_dict.get("threshold", 0.8184715639566639)
    print(f"[Model Load] Individual model loaded successfully from dict: {MODEL_PATH}")
    print(f"[Model Load] Threshold: {dealer_threshold}")
    print(f"[Individual Features] {MODEL_FEATURES}")
except Exception as e:
    model_individual = None
    print(f"[Model Load Warning] Individual model loading failed: {e}")


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

def get_probability(model, input_df: pd.DataFrame) -> tuple[int, float, float]:
    """모델 예측 결과를 Active/Inactive 확률로 변환"""
    prediction = int(model.predict(input_df)[0])

    if not hasattr(model, "predict_proba"):
        raise ValueError("현재 모델은 predict_proba를 지원하지 않습니다.")

    probabilities = model.predict_proba(input_df)[0]

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

    active_probability = float(probabilities[active_idx])
    churn_probability = float(probabilities[churn_idx])

    return prediction, active_probability, churn_probability
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

        predicted_status = "Inactive" if churn_probability >= dealer_threshold else "Active"
        risk_grade = get_risk_grade(churn_probability)

        # 실시간 이탈 위험 감지 설명 사유 빌드
        risk_reasons = []
        if features.Last_Activity_Days >= 14:
            risk_reasons.append(f"마지막 접속 후 {features.Last_Activity_Days}일간 로그인이 없어 장기 휴면 상태입니다.")
        
        # trade_drop_rate 내부 계산식
        expected_60d = max(1.0, features.Previous_Trade_Count / 3.0)
        trade_drop_rate = 0.0 if features.Previous_Trade_Count == 0 else max(0.0, 1.0 - features.Recent_60d_Trade_Count / expected_60d)
        
        if trade_drop_rate >= 0.50 and features.Previous_Trade_Count >= 30:
            risk_reasons.append(f"과거 누적 실적({features.Previous_Trade_Count}회) 대비 최근 거래가 {int(trade_drop_rate * 100)}% 급락했습니다.")
        elif features.Recent_60d_Trade_Count == 0:
            risk_reasons.append("최근 60일 동안 성사된 차량 거래가 전무합니다.")
            
        if features.Site_Usage_Rate <= 0.30:
            risk_reasons.append(f"사이트 매물 조회 이용률이 {int(features.Site_Usage_Rate * 100)}%로 매우 저조합니다.")
            
        if features.Avg_Selling_Price <= 3000000.0:
            risk_reasons.append(f"평균 판매 단가가 {int(features.Avg_Selling_Price / 10000)}만원으로 초저가/영세 차량 위주입니다.")

        # 안전군인 경우 특이사항 없음 처리
        if churn_probability < 0.50:
            risk_reasons = ["특이 위험 징후가 감지되지 않았으며 정상 유지 중입니다."]

        print("--- [Prediction Result] ---")
        print(f"predicted_status: {predicted_status} (Threshold: {dealer_threshold})")
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

        # 회사(상사) 이탈 위험 사유 진단
        risk_reasons = []
        if features.Active_Dealer_Ratio <= 0.60:
            risk_reasons.append(f"소속 딜러들의 현재 활동 비율이 {int(features.Active_Dealer_Ratio * 100)}%로 과반이 비활성 상태입니다.")
        if features.Site_Usage_Rate_Avg <= 0.40:
            risk_reasons.append(f"상사 소속 딜러들의 평균 사이트 이용률이 {int(features.Site_Usage_Rate_Avg * 100)}%로 저조합니다.")
        if features.Recent_Trade_Count == 0:
            risk_reasons.append("상사 소속 전체 딜러들의 최근 60일간 거래가 전무합니다.")
            
        dc = max(1, features.Dealer_Count)
        recent_tpd = features.Recent_Trade_Count / dc
        prev_tpd = features.Previous_Trade_Count / dc
        growth = recent_tpd / (prev_tpd + 1e-5)
        if growth <= 0.40:
            risk_reasons.append("과거 거래 패턴 대비 상사 전체의 활동성 성장률이 크게 하락했습니다.")

        if churn_prob < 0.50:
            risk_reasons = ["특이 위험 징후가 감지되지 않았으며 정상 유지 중입니다."]

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
    
    import json
    with open(dummy_path, "r", encoding="utf-8") as f:
        data = json.load(f)
        
    result_list = []
    for row in data:
        d_id = int(row["dealer_id"])
        last_days = int(row["last_activity_days"])
        recent_trades = int(row["recent_60d_trade_count"])
        prev_trades = int(row["previous_trade_count"])
        usage = float(row["site_usage_rate"])
        input_df = pd.DataFrame([{
            "last_activity_days": float(last_days),
            "recent_60d_trade_count": float(recent_trades),
            "recent_60d_trade_count_log": float(row["recent_60d_trade_count_log"]),
            "previous_trade_count": float(prev_trades),
            "previous_trade_count_log": float(row["previous_trade_count_log"]),
            "site_usage_rate": usage,
        }])[MODEL_FEATURES]
        _, _, prob = get_probability(model_individual, input_df)
        prob_pct = round(prob * 100, 2)
        
        # 설명 사유 빌드
        risk_reasons = []
        if last_days >= 14:
            risk_reasons.append(f"마지막 접속 후 {last_days}일간 로그인이 없어 장기 휴면 상태입니다.")
        expected_60d = max(1.0, float(prev_trades) / 3.0)
        trade_drop_rate = (
            0.0
            if prev_trades == 0
            else max(0.0, 1.0 - float(recent_trades) / expected_60d)
        )
        if trade_drop_rate >= 0.50 and prev_trades >= 30:
            risk_reasons.append(
                f"과거 누적 실적({prev_trades}회) 대비 최근 거래가 "
                f"{int(trade_drop_rate * 100)}% 급락했습니다."
            )
        elif recent_trades == 0:
            risk_reasons.append("최근 60일 동안 성사된 차량 거래가 전무합니다.")
        if usage <= 0.30:
            risk_reasons.append(f"사이트 매물 조회 이용률이 {int(usage * 100)}%로 매우 저조합니다.")

        if prob < 0.50:
            risk_reasons = ["특이 위험 징후가 감지되지 않았으며 정상 유지 중입니다."]

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
        elif risk_grade_kr == "보통":
            action = "전화 상담 필요"

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
            "status": row.get("predicted_status", "처리전"),
            "reason": ", ".join(risk_reasons)
        })
        
    result_list = sorted(result_list, key=lambda x: x["churnRateRaw"], reverse=True)
    return result_list


@app.get("/api/ai/churn/companies/dummy")
def get_churn_companies_dummy():
    dummy_path = BASE_DIR.parent / "dataset" / "dummy_output" / "company_churn_dummy.json"
    if not dummy_path.exists():
        raise HTTPException(status_code=404, detail="company_churn_dummy.json 파일을 찾을 수 없습니다.")
        
    import json
    with open(dummy_path, "r", encoding="utf-8") as f:
        data = json.load(f)
        
    result_list = []
    for row in data:
        comp_id = int(row["company_id"])
        dc = int(row["dealer_count"])
        adc = int(row["active_dealer_count"])
        adr = float(row["active_dealer_ratio"])
        rtc = int(row["recent_60d_trade_count"])
        ptc = int(row["previous_60d_trade_count"])
        recent_tpd = float(row["recent_trade_per_dealer"])
        prev_tpd = float(row["previous_trade_per_dealer"])
        recent_tpd_log = float(row["recent_trade_per_dealer_log"])
        prev_tpd_log = float(row["previous_trade_per_dealer_log"])
        growth_log = float(row["activity_growth_log"])
        growth = recent_tpd / (prev_tpd + 1e-5)
        sur = float(row["site_usage_rate_avg"])
        
        # 모델 예측
        input_df = pd.DataFrame([{
            "dealer_count": float(dc),
            "active_dealer_ratio": float(adr),
            "recent_trade_per_dealer": float(recent_tpd),
            "previous_trade_per_dealer": float(prev_tpd),
            "recent_trade_per_dealer_log": recent_tpd_log,
            "previous_trade_per_dealer_log": prev_tpd_log,
            "activity_growth": float(growth),
            "activity_growth_log": growth_log,
            "site_usage_rate_avg": float(sur),
        }])[COMPANY_MODEL_FEATURES]
        
        _, _, prob = get_probability(model_company, input_df)
        prob_pct = round(prob * 100, 2)
        
        # 설명 사유
        risk_reasons = []
        if adr <= 0.60:
            risk_reasons.append(f"소속 딜러들의 현재 활동 비율이 {int(adr * 100)}%로 과반이 비활성 상태입니다.")
        if sur <= 0.40:
            risk_reasons.append(f"상사 소속 딜러들의 평균 사이트 이용률이 {int(sur * 100)}%로 저조합니다.")
        if rtc == 0:
            risk_reasons.append("상사 소속 전체 딜러들의 최근 60일간 거래가 전무합니다.")
        if growth <= 0.40:
            risk_reasons.append("과거 거래 패턴 대비 상사 전체의 활동성 성장률이 크게 하락했습니다.")
            
        if prob < 0.50:
            risk_reasons = ["특이 위험 징후가 감지되지 않았으며 정상 유지 중입니다."]

        risk_grade_kr = "낮음"
        if prob >= 0.80:
            risk_grade_kr = "높음"
        elif prob >= 0.40:
            risk_grade_kr = "보통"
            
        action = "모니터링"
        if prob >= 0.80:
            action = "멤버십 30% 쿠폰발송"
        elif prob >= 0.40:
            action = "전화 상담 필요"

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
            "status": row.get("predicted_status", "처리전"),
            "reason": ", ".join(risk_reasons)
        })
        
    # 이탈 위험도 내림차순 정렬
    result_list = sorted(result_list, key=lambda x: x["churnRateRaw"], reverse=True)
    return result_list



