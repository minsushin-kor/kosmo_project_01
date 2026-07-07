from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import joblib
import pandas as pd
from pathlib import Path


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

COMPANY_MODEL_FEATURES = [
    "dealer_count",
    "active_dealer_ratio",
    "recent_trade_per_dealer_log",
    "previous_trade_per_dealer_log",
    "activity_growth_log",
    "site_usage_rate_avg"
]

model_company = None
try:
    model_company_dict = joblib.load(COMPANY_MODEL_PATH)
    model_company = model_company_dict["model"]
    print(f"[Company Model] Loaded successfully from dict: {COMPANY_MODEL_PATH}")
    print(f"[Company Features] {COMPANY_MODEL_FEATURES}")
except Exception as e:
    model_company = None
    print(f"[Company Model] Load Failed: {e}")

MODEL_FEATURES = [
    "last_activity_days",
    "recent_60d_trade_count_log",
    "previous_trade_count_log",
    "site_usage_rate"
]

model_individual = None
dealer_threshold = 0.8184715639566639  # default fallback value

try:
    model_individual_dict = joblib.load(MODEL_PATH)
    model_individual = model_individual_dict["model"]
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

class CompanyFeatures(BaseModel):
    Dealer_Count: int = Field(..., description="소속 딜러 수")
    Active_Dealer_Ratio: float = Field(..., description="활동 딜러 비율 (0~1)")
    Recent_Trade_Count: int = Field(..., description="최근 거래 건수")
    Previous_Trade_Count: int = Field(..., description="이전 거래 건수")
    Site_Usage_Rate_Avg: float = Field(..., description="평균 사이트 이용률 (0~1)")

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
    import numpy as np

    site_usage_rate = max(0.0, min(1.0, float(features.Site_Usage_Rate)))

    input_dict = {
        "last_activity_days": float(features.Last_Activity_Days),
        "recent_60d_trade_count_log": np.log1p(float(features.Recent_60d_Trade_Count)),
        "previous_trade_count_log": np.log1p(float(features.Previous_Trade_Count)),
        "site_usage_rate": site_usage_rate,
    }

    input_df = pd.DataFrame([input_dict])
    input_df = input_df[MODEL_FEATURES]

    return input_df

def normalize_company_input(features: CompanyFeatures) -> pd.DataFrame:
    import numpy as np

    dc = max(1, features.Dealer_Count)
    adr = clamp(features.Active_Dealer_Ratio, 0.0, 1.0)
    rtc = max(0, features.Recent_Trade_Count)
    ptc = max(0, features.Previous_Trade_Count)

    recent_tpd = rtc / dc
    prev_tpd = ptc / dc
    growth = rtc / (ptc + 1e-5)

    input_dict = {
        "dealer_count": float(dc),
        "active_dealer_ratio": float(adr),
        "recent_trade_per_dealer_log": np.log1p(recent_tpd),
        "previous_trade_per_dealer_log": np.log1p(prev_tpd),
        "activity_growth_log": np.log1p(growth),
        "site_usage_rate_avg": clamp(features.Site_Usage_Rate_Avg, 0.0, 1.0),
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

        print("--- [Prediction Result] ---")
        print(f"predicted_status: {predicted_status} (Threshold: {dealer_threshold})")
        print(f"active_probability: {active_probability}")
        print(f"churn_probability: {churn_probability}")

        return {
            "status": "success",
            "predicted_status": predicted_status,
            "churn_probability": round(churn_probability, 4),
            "churn_probability_percent": round(churn_probability * 100, 2),
            "active_probability": round(active_probability, 4),
            "active_probability_percent": round(active_probability * 100, 2),
            "risk_grade": risk_grade,
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

        print("--- [Prediction Result (Company)] ---")
        print(f"predicted_status: {predicted_status}")
        print(f"active_probability: {active_probability}")
        print(f"churn_probability: {churn_probability}")

        return {
            "status": "success",
            "predicted_status": predicted_status,
            "churn_probability": round(churn_probability, 4),
            "churn_probability_percent": round(churn_probability * 100, 2),
            "active_probability": round(active_probability, 4),
            "active_probability_percent": round(active_probability * 100, 2),
            "risk_grade": get_risk_grade(churn_probability),
            "input_features": input_df.iloc[0].to_dict()
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"예측 도중 에러 발생: {str(e)}",
        )

