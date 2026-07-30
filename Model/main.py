from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import json
import joblib
import numpy as np
import pandas as pd
import re
from pathlib import Path
from difflib import SequenceMatcher
from math import log1p
from datetime import datetime, timezone


# ============================================================
# FastAPI App
# ============================================================

app = FastAPI(title="중고차 플랫폼 개인 딜러 이탈 예측 시스템")

API_CONTRACT_VERSION = "1.0"
UNAVAILABLE_MODEL_VERSION = "unavailable"

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


def build_model_version(model_path: Path, model_bundle: dict) -> str:
    """응답에서 모델 산출물을 식별할 수 있는 안정적인 버전 문자열을 만듭니다."""
    model_name = (
        model_bundle.get("selected_model")
        or model_bundle.get("model_type")
        or "model"
    )
    trained_at = model_bundle.get("trained_at_utc")
    version = f"{model_path.stem}:{model_name}"
    return f"{version}:{trained_at}" if trained_at else version

model_company = None
COMPANY_MODEL_FEATURES = []
COMPANY_CHURN_MODEL_VERSION = UNAVAILABLE_MODEL_VERSION
try:
    model_company_dict = joblib.load(COMPANY_MODEL_PATH)
    model_company = model_company_dict["model"]
    COMPANY_MODEL_FEATURES = model_company_dict["feature_columns"]
    COMPANY_CHURN_MODEL_VERSION = build_model_version(
        COMPANY_MODEL_PATH,
        model_company_dict,
    )
    print(f"[Company Model] Loaded successfully from dict: {COMPANY_MODEL_PATH}")
    print(f"[Company Features] {COMPANY_MODEL_FEATURES}")
except Exception as e:
    model_company = None
    print(f"[Company Model] Load Failed: {e}")

model_individual = None
MODEL_FEATURES = []
DEALER_CHURN_MODEL_VERSION = UNAVAILABLE_MODEL_VERSION

try:
    model_individual_dict = joblib.load(MODEL_PATH)
    model_individual = model_individual_dict["model"]
    MODEL_FEATURES = model_individual_dict["feature_columns"]
    DEALER_CHURN_MODEL_VERSION = build_model_version(
        MODEL_PATH,
        model_individual_dict,
    )
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
VEHICLE_CONDITION_MODEL_VERSION = UNAVAILABLE_MODEL_VERSION
VEHICLE_MMR_MODEL_VERSION = UNAVAILABLE_MODEL_VERSION
VEHICLE_CONDITION_MIN = 1.0
VEHICLE_CONDITION_MAX = 5.0
VEHICLE_MMR_MIN = 0.0
vehicle_prediction_cache = None
latest_churn_batch_snapshot = None

try:
    vehicle_condition_bundle = joblib.load(VEHICLE_CONDITION_MODEL_PATH)
    model_vehicle_condition = vehicle_condition_bundle["model"]
    VEHICLE_CONDITION_FEATURES = vehicle_condition_bundle["features"]
    VEHICLE_CONDITION_MODEL_VERSION = build_model_version(
        VEHICLE_CONDITION_MODEL_PATH,
        vehicle_condition_bundle,
    )
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
    VEHICLE_MMR_MODEL_VERSION = build_model_version(
        VEHICLE_MMR_MODEL_PATH,
        vehicle_mmr_bundle,
    )
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


class DealerBatchItem(DealerFeatures):
    dealer_id: int = Field(..., gt=0, description="딜러 고유 번호")
    Last_Activity_Days: int = Field(..., ge=0, description="마지막 활동 경과일")
    Recent_60d_Trade_Count: int = Field(..., ge=0, description="최근 60일 거래 건수")
    Previous_Trade_Count: int = Field(..., ge=0, description="이전 거래 건수")
    Site_Usage_Rate: float = Field(..., ge=0.0, le=1.0, description="사이트 이용률")
    Avg_Selling_Price: float = Field(default=13000000.0, ge=0.0, description="평균 판매 단가")


class CompanyBatchItem(CompanyFeatures):
    company_id: int = Field(..., gt=0, description="회사 고유 번호")
    Dealer_Count: int = Field(..., ge=0, description="소속 딜러 수")
    Active_Dealer_Ratio: float = Field(..., ge=0.0, le=1.0, description="활동 딜러 비율")
    Recent_Trade_Count: int = Field(..., ge=0, description="최근 거래 건수")
    Previous_Trade_Count: int = Field(..., ge=0, description="이전 거래 건수")
    Site_Usage_Rate_Avg: float = Field(..., ge=0.0, le=1.0, description="평균 사이트 이용률")
    Avg_Selling_Price_Avg: float = Field(
        default=13000000.0,
        ge=0.0,
        description="소속 딜러들의 평균 판매 단가",
    )


class BatchChurnRequest(BaseModel):
    dealers: list[DealerBatchItem] = Field(default_factory=list)
    companies: list[CompanyBatchItem] = Field(default_factory=list)


class DealerBatchPrediction(BaseModel):
    dealer_id: int
    churn_probability: float
    churn_probability_percent: float
    active_probability: float
    active_probability_percent: float
    predicted_status: str
    risk_grade: str
    risk_reasons: list[str]
    action: str


class CompanyBatchPrediction(BaseModel):
    company_id: int
    churn_probability: float
    churn_probability_percent: float
    active_probability: float
    active_probability_percent: float
    predicted_status: str
    risk_grade: str
    risk_reasons: list[str]
    action: str


class ChurnModelVersions(BaseModel):
    dealer: str
    company: str


class BatchChurnResponse(BaseModel):
    status: str
    source: str
    api_contract_version: str
    calculated_at: datetime
    dealer_count: int
    company_count: int
    model_versions: ChurnModelVersions
    dealer_predictions: list[DealerBatchPrediction]
    company_predictions: list[CompanyBatchPrediction]


class VehicleRecommendationRequest(BaseModel):
    recommendationPriority: str = Field(
        default="preferred_car",
        pattern="^(preferred_car|recent_search)$",
        description="회원 추천 우선 기준",
    )
    preferredCar: str | None = Field(
        default=None,
        max_length=200,
        description="회원가입 때 입력한 선호차량 자유 입력값",
    )
    preferredMake: str | None = Field(
        default=None,
        max_length=50,
        description="선호 제조사",
    )
    preferredModel: str | None = Field(
        default=None,
        max_length=80,
        description="선호 차량 모델",
    )
    preferredYear: int | None = Field(
        default=None,
        ge=1990,
        le=2030,
        description="희망 연식",
    )
    maxOdometer: float | None = Field(
        default=None,
        gt=0,
        description="희망 최대 주행거리(km)",
    )
    expectedPrice: float | None = Field(
        default=None,
        gt=0,
        description="예상 구매가격(원)",
    )
    preferredColor: str | None = Field(
        default=None,
        max_length=30,
        description="선호 색상",
    )
    preferredRegion: str | None = Field(
        default=None,
        max_length=50,
        description="최근 검색 지역",
    )
    minimumCondition: float | None = Field(
        default=None,
        ge=1.0,
        le=5.0,
        description="최소 차량 상태(5점 만점)",
    )
    priceTolerance: float | None = Field(
        default=None,
        gt=0,
        description="예상 구매가격 기준 허용 오차(±원)",
    )
    options: list[str] = Field(
        default_factory=list,
        max_length=20,
        description="선호 옵션 목록",
    )
    exactMake: bool = Field(
        default=False,
        description="제조사 반드시 일치",
    )
    exactModel: bool = Field(
        default=False,
        description="차량 모델 반드시 일치",
    )


class BuyerRecommendationVehicle(BaseModel):
    """Spring Boot가 DB에서 조회해 전달하는 일반 판매 차량 규격입니다."""

    carId: int = Field(..., gt=0, description="DB 차량 고유 번호")
    year: int = Field(..., ge=1990, le=2030, description="제작 연도")
    make: str = Field(..., min_length=1, max_length=50, description="제조사")
    model: str = Field(..., min_length=1, max_length=100, description="모델명")
    odometer: float = Field(..., ge=0, description="주행거리(km)")
    option: str | None = Field(default=None, description="쉼표로 구분된 옵션")
    body: str | None = Field(default=None, max_length=50, description="차종")
    fuel: str | None = Field(default=None, max_length=30, description="연료")
    color: str | None = Field(default=None, max_length=30, description="외장 색상")
    sellingPrice: int | None = Field(default=None, ge=0, description="판매가(원)")
    state: str | None = Field(default=None, max_length=50, description="차량 등록 지역")
    status: str | None = Field(default=None, max_length=20, description="판매 상태")
    ownerType: str | None = Field(default=None, max_length=20, description="판매자 유형")


class BuyerVehicleRecommendationRequest(BaseModel):
    """Spring Boot가 전달하는 구매 조건과 DB 차량 후보 목록입니다."""

    preferences: VehicleRecommendationRequest
    vehicles: list[BuyerRecommendationVehicle] = Field(default_factory=list)


class VehiclePredictionBatchRequest(BaseModel):
    """DB 차량 전체의 Condition과 MMR 일괄 예측 요청입니다."""

    vehicles: list[BuyerRecommendationVehicle] = Field(default_factory=list)


class VehicleModelVersions(BaseModel):
    condition: str
    mmr: str


class VehiclePredictionResult(BaseModel):
    carId: int
    vehicle_id: str
    year: int
    make: str
    model: str
    odometer: int
    body: str | None = None
    fuel: str | None = None
    color: str | None
    option: list[str]
    sellingPrice: int | None
    state: str | None
    status: str | None
    ownerType: str | None
    predicted_condition: float
    predicted_mmr: float


class VehiclePredictionBatchResponse(BaseModel):
    status: str
    source: str
    api_contract_version: str
    calculated_at: datetime
    model_versions: VehicleModelVersions
    source_vehicle_count: int
    skipped_vehicle_count: int
    count: int
    recommendations: list[VehiclePredictionResult]


class DemoVehiclePredictionResult(VehiclePredictionResult):
    carId: str


class DemoVehiclePredictionBatchResponse(VehiclePredictionBatchResponse):
    recommendations: list[DemoVehiclePredictionResult]


class RecommendationScoreBreakdown(BaseModel):
    condition: str
    weight: float
    match_ratio: float
    earned_score: float


class ExcludedRecommendationCondition(BaseModel):
    condition: str
    reason: str


class BuyerVehiclePredictionResult(VehiclePredictionResult):
    match_score: float
    matched_condition_count: int
    score_breakdown: list[RecommendationScoreBreakdown]
    recommendation_reasons: list[str]


class BuyerVehicleRecommendationResponse(BaseModel):
    status: str
    source: str
    api_contract_version: str
    calculated_at: datetime
    model_versions: VehicleModelVersions
    message: str
    input_basic_condition_count: int
    input_optional_condition_count: int
    excluded_conditions: list[ExcludedRecommendationCondition]
    input_vehicle_count: int
    source_vehicle_count: int
    skipped_vehicle_count: int
    candidate_count: int
    count: int
    recommendations: list[BuyerVehiclePredictionResult]


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


def build_dealer_risk_reasons(
    last_activity_days: int,
    recent_trade_count: int,
    previous_trade_count: int,
    site_usage_rate: float,
) -> list[str]:
    """모델 입력 지표가 위험 기준에 해당할 때 실제 수치만 설명합니다."""
    risk_reasons = []

    if last_activity_days >= 14:
        risk_reasons.append(
            f"마지막 활동 후 {last_activity_days}일 경과 (위험 기준: 14일 이상)"
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
            f"이전 거래 {previous_trade_count}건 대비 최근 60일 거래 "
            f"{recent_trade_count}건 (감소율: {int(trade_drop_rate * 100)}%)"
        )
    elif recent_trade_count == 0:
        risk_reasons.append("최근 60일 거래 0건")

    if site_usage_rate <= 0.30:
        risk_reasons.append(
            f"사이트 이용률 {site_usage_rate * 100:.1f}% (위험 기준: 30% 이하)"
        )

    return risk_reasons


def build_company_risk_reasons(
    active_dealer_ratio: float,
    site_usage_rate_avg: float,
    recent_trade_count: int,
    recent_trade_per_dealer: float,
    previous_trade_per_dealer: float,
) -> list[str]:
    """모델 입력 지표가 위험 기준에 해당할 때 실제 수치만 설명합니다."""
    risk_reasons = []

    if active_dealer_ratio <= 0.60:
        risk_reasons.append(
            f"활성 딜러 비율 {active_dealer_ratio * 100:.1f}% (위험 기준: 60% 이하)"
        )
    if site_usage_rate_avg <= 0.40:
        risk_reasons.append(
            f"평균 사이트 이용률 {site_usage_rate_avg * 100:.1f}% (위험 기준: 40% 이하)"
        )
    if recent_trade_count == 0:
        risk_reasons.append("회사 소속 딜러의 최근 60일 거래 합계 0건")

    growth = recent_trade_per_dealer / (previous_trade_per_dealer + 1e-5)
    if growth <= 0.40:
        risk_reasons.append(
            f"딜러 1인당 이전 거래 {previous_trade_per_dealer:.1f}건 대비 "
            f"최근 거래 {recent_trade_per_dealer:.1f}건 "
            f"(활동 비율: {growth * 100:.1f}%)"
        )

    return risk_reasons


def clamp(value: float, min_value: float, max_value: float) -> float:
    """입력값을 안전 범위로 보정"""
    return max(min_value, min(max_value, float(value)))


VEHICLE_MAKE_ALIASES = {
    "현대": "hyundai",
    "현대차": "hyundai",
    "기아": "kia",
    "기아차": "kia",
    "제네시스": "genesis",
    "르노": "renault",
    "르노코리아": "renault",
    "kg모빌리티": "kgmobility",
    "쌍용": "kgmobility",
    "벤츠": "mercedes-benz",
    "메르세데스벤츠": "mercedes-benz",
    "쉐보레": "chevrolet",
    "폭스바겐": "volkswagen",
    "토요타": "toyota",
    "도요타": "toyota",
    "혼다": "honda",
    "닛산": "nissan",
    "렉서스": "lexus",
    "캐딜락": "cadillac",
    "포드": "ford",
    "닷지": "dodge",
    "크라이슬러": "chrysler",
    "아우디": "audi",
    "비엠더블유": "bmw",
    "미니": "mini",
    "미쓰비시": "mitsubishi",
    "마쓰다": "mazda",
    "인피니티": "infiniti",
    "재규어": "jaguar",
    "지프": "jeep",
    "아큐라": "acura",
    "뷰익": "buick",
}

VEHICLE_MODEL_ALIASES = {
    "그랜저": "azera",
    "쏘나타": "sonata",
    "소나타": "sonata",
    "아반떼": "elantra",
    "엑센트": "accent",
    "제네시스": "genesis",
    "쏘렌토": "sorento",
    "스포티지": "sportage",
}

VEHICLE_BODY_ALIASES = {
    "suv": "suv",
    "스포츠유틸리티": "suv",
    "세단": "sedan",
    "sedan": "sedan",
    "해치백": "hatchback",
    "hatchback": "hatchback",
    "쿠페": "coupe",
    "coupe": "coupe",
    "왜건": "wagon",
    "wagon": "wagon",
    "트럭": "truck",
    "truck": "truck",
    "밴": "van",
    "van": "van",
}

VEHICLE_FUEL_ALIASES = {
    "가솔린": "gasoline",
    "휘발유": "gasoline",
    "gasoline": "gasoline",
    "gas": "gasoline",
    "디젤": "diesel",
    "경유": "diesel",
    "diesel": "diesel",
    "하이브리드": "hybrid",
    "hev": "hybrid",
    "hybrid": "hybrid",
    "전기": "electric",
    "전기차": "electric",
    "ev": "electric",
    "electric": "electric",
    "lpg": "lpg",
}

PREFERRED_CAR_TOKEN_SEPARATOR = re.compile(r"[\s,;/|]+")
PREFERRED_CAR_YEAR_PATTERN = re.compile(
    r"^(?P<year>(?:19|20)\d{2})(?:년|year)?$",
    re.IGNORECASE,
)
PREFERRED_CAR_ODOMETER_PATTERN = re.compile(
    r"^(?P<prefix>주행거리)?(?P<value>\d+(?:\.\d+)?)"
    r"(?P<ten_thousand>만)?(?P<unit>km|킬로미터|킬로)?$",
    re.IGNORECASE,
)


def clean_optional_text(value: str | None) -> str | None:
    """빈 문자열을 추천 조건에서 제외할 수 있도록 정리합니다."""
    if value is None:
        return None

    cleaned = str(value).strip()
    return cleaned or None


def normalize_vehicle_text(
    value: str | None,
    aliases: dict[str, str] | None = None,
) -> str:
    """공백·대소문자와 일부 한글 차량명을 비교 가능한 값으로 변환합니다."""
    cleaned = clean_optional_text(value)
    if cleaned is None:
        return ""

    normalized = "".join(cleaned.casefold().split())
    if aliases:
        return aliases.get(normalized, normalized)
    return normalized


def split_preferred_car_tokens(value: str | None) -> list[str]:
    """선호차량 자유 입력값을 공백과 일반 구분자로 안전하게 나눕니다."""
    cleaned = clean_optional_text(value)
    if cleaned is None:
        return []

    cleaned = re.sub(r"(?<=\d),(?=\d{3}(?:\D|$))", "", cleaned)
    tokens = []
    seen = set()
    for token in PREFERRED_CAR_TOKEN_SEPARATOR.split(cleaned):
        token = token.strip()
        normalized = normalize_vehicle_text(token)
        if not normalized or normalized in seen:
            continue
        seen.add(normalized)
        tokens.append(token)
    return tokens


def is_known_alias(value: str, aliases: dict[str, str]) -> bool:
    normalized = normalize_vehicle_text(value)
    return normalized in aliases or normalized in set(aliases.values())


def parse_preferred_car(value: str | None) -> dict:
    """자유 입력 선호차량에서 추천 기본 조건과 검색 전용 조건을 분리합니다."""
    tokens = split_preferred_car_tokens(value)
    parsed = {
        "tokens": tokens,
        "preferredMake": None,
        "preferredModel": None,
        "preferredBody": None,
        "preferredFuel": None,
        "preferredYear": None,
        "maxOdometer": None,
        "remainingKeywords": [],
    }

    for token in tokens:
        normalized_token = normalize_vehicle_text(token)
        year_match = PREFERRED_CAR_YEAR_PATTERN.fullmatch(normalized_token)
        if year_match:
            year = int(year_match.group("year"))
            if 1990 <= year <= 2030:
                parsed["preferredYear"] = year
            continue

        odometer_match = PREFERRED_CAR_ODOMETER_PATTERN.fullmatch(
            normalized_token
        )
        if odometer_match:
            odometer = float(odometer_match.group("value"))
            has_mileage_marker = any(
                odometer_match.group(group_name)
                for group_name in ("prefix", "ten_thousand", "unit")
            )
            if odometer_match.group("ten_thousand"):
                odometer *= 10000
            if odometer > 0 and (has_mileage_marker or odometer >= 1000):
                parsed["maxOdometer"] = odometer
                continue

        if normalized_token in {"km", "킬로", "킬로미터", "년"}:
            continue

        if (
            parsed["preferredMake"] is None
            and is_known_alias(token, VEHICLE_MAKE_ALIASES)
        ):
            parsed["preferredMake"] = token
            continue
        if (
            parsed["preferredBody"] is None
            and is_known_alias(token, VEHICLE_BODY_ALIASES)
        ):
            parsed["preferredBody"] = token
            continue
        if (
            parsed["preferredFuel"] is None
            and is_known_alias(token, VEHICLE_FUEL_ALIASES)
        ):
            parsed["preferredFuel"] = token
            continue
        if (
            parsed["preferredModel"] is None
            and is_known_alias(token, VEHICLE_MODEL_ALIASES)
        ):
            parsed["preferredModel"] = token
            continue
        parsed["remainingKeywords"].append(token)

    if parsed["preferredModel"] is None and parsed["remainingKeywords"]:
        parsed["preferredModel"] = parsed["remainingKeywords"].pop(0)

    return parsed


def get_text_match_ratio(
    preferred_value: str,
    actual_value: str,
    aliases: dict[str, str] | None = None,
) -> float:
    """문자 조건의 정확 일치와 유사 일치를 0~1 점수로 변환합니다."""
    preferred = normalize_vehicle_text(preferred_value, aliases)
    actual = normalize_vehicle_text(actual_value, aliases)
    if not preferred or not actual:
        return 0.0
    if preferred == actual:
        return 1.0
    if preferred in actual or actual in preferred:
        return 0.85

    similarity = SequenceMatcher(None, preferred, actual).ratio()
    return round(similarity * 0.7, 6) if similarity >= 0.5 else 0.0


def normalize_requested_options(options: list[str]) -> list[str]:
    """빈 옵션과 대소문자 중복을 제거하고 입력 순서를 유지합니다."""
    normalized_options = []
    seen = set()

    for option in options:
        cleaned = clean_optional_text(option)
        if cleaned is None:
            continue

        key = normalize_vehicle_text(cleaned)
        if key in seen:
            continue
        seen.add(key)
        normalized_options.append(cleaned)

    return normalized_options


def get_option_match_ratio(
    preferred_options: list[str],
    vehicle_options: list[str],
) -> tuple[float, list[str]]:
    """사용자가 선택한 옵션 중 차량이 보유한 옵션 비율을 반환합니다."""
    if not preferred_options:
        return 0.0, []

    actual_by_key = {
        normalize_vehicle_text(option): str(option)
        for option in vehicle_options
        if clean_optional_text(str(option)) is not None
    }
    matched_options = [
        option
        for option in preferred_options
        if normalize_vehicle_text(option) in actual_by_key
    ]
    return len(matched_options) / len(preferred_options), matched_options


def parse_vehicle_options(options) -> list[str]:
    """문자열 또는 배열로 전달된 옵션을 추천 계산용 배열로 정리합니다."""
    if isinstance(options, list):
        return [
            str(option).strip()
            for option in options
            if clean_optional_text(option) is not None
        ]
    if isinstance(options, str):
        return [option.strip() for option in options.split(",") if option.strip()]
    return []


def get_vehicle_model_versions() -> dict[str, str]:
    return {
        "condition": VEHICLE_CONDITION_MODEL_VERSION,
        "mmr": VEHICLE_MMR_MODEL_VERSION,
    }


def ensure_unique_vehicle_ids(
    vehicles: list[BuyerRecommendationVehicle],
) -> None:
    """Spring DB의 차량 결과를 안전하게 되돌려 주기 위해 ID 중복을 거부합니다."""
    seen_ids = set()
    duplicate_ids = set()
    for vehicle in vehicles:
        if vehicle.carId in seen_ids:
            duplicate_ids.add(vehicle.carId)
        seen_ids.add(vehicle.carId)

    if duplicate_ids:
        duplicate_text = ", ".join(str(value) for value in sorted(duplicate_ids))
        raise HTTPException(
            status_code=400,
            detail=f"중복된 carId가 포함되어 있습니다: {duplicate_text}",
        )


def validate_numeric_predictions(
    values,
    expected_count: int,
    prediction_name: str,
) -> np.ndarray:
    """모델 출력 개수와 NaN/무한대 여부를 API 응답 전에 검증합니다."""
    predictions = np.asarray(values, dtype=float).reshape(-1)
    if predictions.size != expected_count:
        raise ValueError(
            f"{prediction_name} 모델 출력 개수가 요청 차량 수와 다릅니다: "
            f"expected={expected_count}, actual={predictions.size}"
        )
    if not np.all(np.isfinite(predictions)):
        raise ValueError(f"{prediction_name} 모델 출력에 NaN 또는 무한대가 있습니다.")
    return predictions


def validate_probability_predictions(
    active_probabilities,
    churn_probabilities,
    expected_count: int,
    prediction_name: str,
) -> tuple[np.ndarray, np.ndarray]:
    active_values = validate_numeric_predictions(
        active_probabilities,
        expected_count,
        f"{prediction_name} active_probability",
    )
    churn_values = validate_numeric_predictions(
        churn_probabilities,
        expected_count,
        f"{prediction_name} churn_probability",
    )
    if (
        np.any(active_values < 0.0)
        or np.any(active_values > 1.0)
        or np.any(churn_values < 0.0)
        or np.any(churn_values > 1.0)
    ):
        raise ValueError(f"{prediction_name} 확률이 0~1 범위를 벗어났습니다.")
    return active_values, churn_values


def build_vehicle_prediction_catalog(vehicles: list[dict]) -> list[dict]:
    """전달받은 차량 전체의 Condition과 MMR을 모델별 한 번에 예측합니다."""
    if model_vehicle_condition is None or model_vehicle_mmr is None:
        raise HTTPException(
            status_code=503,
            detail="차량 Condition 또는 MMR 예측 모델을 불러오지 못했습니다.",
        )

    if not isinstance(vehicles, list) or not vehicles:
        raise ValueError("추천에 사용할 차량 목록이 비어 있거나 배열 형식이 아닙니다.")

    required_fields = {"year", "make", "model", "odometer"}
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

    predicted_conditions = validate_numeric_predictions(
        model_vehicle_condition.predict(condition_input_df),
        len(vehicles),
        "Condition",
    )
    predicted_conditions = np.clip(
        predicted_conditions,
        VEHICLE_CONDITION_MIN,
        VEHICLE_CONDITION_MAX,
    )

    mmr_input_df = condition_input_df.copy()
    mmr_input_df["condition"] = predicted_conditions
    mmr_input_df = mmr_input_df[VEHICLE_MMR_FEATURES]

    predicted_mmrs = validate_numeric_predictions(
        model_vehicle_mmr.predict(mmr_input_df),
        len(vehicles),
        "MMR",
    )
    predicted_mmrs = np.maximum(predicted_mmrs, VEHICLE_MMR_MIN)

    catalog = []
    for vehicle, condition, mmr in zip(
        vehicles,
        predicted_conditions,
        predicted_mmrs,
    ):
        vehicle_id = vehicle.get("carId", vehicle.get("vehicle_id"))
        if vehicle_id is None:
            raise ValueError("차량 목록에 carId 또는 vehicle_id가 없습니다.")

        catalog.append(
            {
                "carId": vehicle_id,
                "vehicle_id": str(vehicle_id),
                "year": int(vehicle["year"]),
                "make": str(vehicle["make"]),
                "model": str(vehicle["model"]),
                "odometer": int(float(vehicle["odometer"])),
                "body": clean_optional_text(vehicle.get("body")),
                "fuel": clean_optional_text(vehicle.get("fuel")),
                "color": clean_optional_text(vehicle.get("color")),
                "option": parse_vehicle_options(vehicle.get("option")),
                "sellingPrice": vehicle.get("sellingPrice"),
                "state": clean_optional_text(vehicle.get("state")),
                "status": clean_optional_text(vehicle.get("status")),
                "ownerType": clean_optional_text(vehicle.get("ownerType")),
                "predicted_condition": round(float(condition), 2),
                "predicted_mmr": round(float(mmr), 2),
            }
        )

    return catalog


def get_vehicle_prediction_catalog() -> list[dict]:
    """더미 차량을 한 번에 예측하고 이후 요청에서는 메모리 결과를 재사용합니다."""
    global vehicle_prediction_cache

    if vehicle_prediction_cache is not None:
        return vehicle_prediction_cache

    if not VEHICLE_DUMMY_PATH.exists():
        raise HTTPException(
            status_code=404,
            detail="vehicle_recommendation_dummy.json 파일을 찾을 수 없습니다.",
        )

    with open(VEHICLE_DUMMY_PATH, "r", encoding="utf-8") as f:
        vehicles = json.load(f)

    catalog = build_vehicle_prediction_catalog(vehicles)
    vehicle_prediction_cache = catalog
    return vehicle_prediction_cache


def validate_vehicle_recommendation_request(
    preferences: VehicleRecommendationRequest,
) -> tuple[dict, list[str]]:
    """추천에 사용할 입력값을 정리하고 기본 조건 개수를 검증합니다."""
    prefer_saved_car = preferences.recommendationPriority == "preferred_car"
    parsed_preferred_car = (
        parse_preferred_car(preferences.preferredCar)
        if prefer_saved_car
        else parse_preferred_car(None)
    )
    explicit_make = (
        None
        if prefer_saved_car
        else clean_optional_text(preferences.preferredMake)
    )
    explicit_model = (
        None
        if prefer_saved_car
        else clean_optional_text(preferences.preferredModel)
    )
    cleaned_preferences = {
        "recommendationPriority": preferences.recommendationPriority,
        "preferredCar": (
            clean_optional_text(preferences.preferredCar)
            if prefer_saved_car
            else None
        ),
        "preferredMake": (
            parsed_preferred_car["preferredMake"]
            if prefer_saved_car
            else explicit_make
        ),
        "preferredModel": (
            parsed_preferred_car["preferredModel"]
            if prefer_saved_car
            else explicit_model
        ),
        "preferredBody": (
            parsed_preferred_car["preferredBody"]
            if prefer_saved_car
            else None
        ),
        "preferredFuel": (
            parsed_preferred_car["preferredFuel"]
            if prefer_saved_car
            else None
        ),
        "preferredCarTokens": (
            parsed_preferred_car["tokens"]
            if prefer_saved_car
            else []
        ),
        "preferredYear": (
            parsed_preferred_car["preferredYear"]
            if prefer_saved_car
            else preferences.preferredYear
        ),
        "maxOdometer": (
            parsed_preferred_car["maxOdometer"]
            if prefer_saved_car
            else preferences.maxOdometer
        ),
        "expectedPrice": None if prefer_saved_car else preferences.expectedPrice,
        "preferredColor": (
            None
            if prefer_saved_car
            else clean_optional_text(preferences.preferredColor)
        ),
        "preferredRegion": (
            None
            if prefer_saved_car
            else clean_optional_text(preferences.preferredRegion)
        ),
        "minimumCondition": (
            None if prefer_saved_car else preferences.minimumCondition
        ),
        "priceTolerance": (
            None if prefer_saved_car else preferences.priceTolerance
        ),
        "options": (
            []
            if prefer_saved_car
            else normalize_requested_options(preferences.options)
        ),
        "exactMake": preferences.exactMake,
        "exactModel": preferences.exactModel,
    }

    basic_keys = [
        "preferredMake",
        "preferredModel",
        "preferredYear",
        "maxOdometer",
        "expectedPrice",
    ]
    active_basic_keys = [
        key
        for key in basic_keys
        if cleaned_preferences[key] is not None
    ]
    filter_keys = [
        "preferredBody",
        "preferredFuel",
        "preferredRegion",
    ]
    active_filter_keys = [
        key
        for key in filter_keys
        if cleaned_preferences[key] is not None
    ]
    if len(active_basic_keys) + len(active_filter_keys) < 2:
        raise HTTPException(
            status_code=422,
            detail=(
                "추천 조건이 부족해 차량 추천이 어렵습니다. "
                "검색 조건 또는 회원가입 선호차량에서 기본 조건을 2개 이상 준비해 주세요."
            ),
        )

    if preferences.exactMake and cleaned_preferences["preferredMake"] is None:
        raise HTTPException(
            status_code=422,
            detail="제조사 필수 일치를 사용하려면 선호 제조사를 입력해야 합니다.",
        )
    if preferences.exactModel and cleaned_preferences["preferredModel"] is None:
        raise HTTPException(
            status_code=422,
            detail="모델 필수 일치를 사용하려면 선호 차량 모델을 입력해야 합니다.",
        )
    if (
        cleaned_preferences["priceTolerance"] is not None
        and cleaned_preferences["expectedPrice"] is None
    ):
        raise HTTPException(
            status_code=422,
            detail="가격 허용 범위를 사용하려면 예상 구매가격을 입력해야 합니다.",
        )

    return cleaned_preferences, active_basic_keys


def filter_catalog_by_preferred_car_search(
    catalog: list[dict],
    preferences: dict,
) -> tuple[list[dict], list[dict]]:
    """차종·연료 선호는 모델 점수가 아닌 후보 차량 검색에만 사용합니다."""
    filtered_catalog = list(catalog)
    excluded_conditions = []
    search_filters = [
        ("preferredBody", "body", VEHICLE_BODY_ALIASES, "차종"),
        ("preferredFuel", "fuel", VEHICLE_FUEL_ALIASES, "연료"),
        ("preferredRegion", "state", None, "지역"),
    ]

    for preference_key, vehicle_key, aliases, label in search_filters:
        preferred_value = preferences.get(preference_key)
        if preferred_value is None:
            continue

        supported = any(
            clean_optional_text(vehicle.get(vehicle_key)) is not None
            for vehicle in catalog
        )
        if not supported:
            excluded_conditions.append(
                {
                    "condition": preference_key,
                    "reason": (
                        f"전달된 차량 데이터에 {label} 정보가 없어 "
                        "후보 검색에서 제외했습니다."
                    ),
                }
            )
            continue

        filtered_catalog = [
            vehicle
            for vehicle in filtered_catalog
            if get_text_match_ratio(
                preferred_value,
                vehicle.get(vehicle_key) or "",
                aliases,
            )
            >= 0.85
        ]

    return filtered_catalog, excluded_conditions


def add_score_breakdown(
    breakdown: list[dict],
    condition_name: str,
    weight: float,
    match_ratio: float,
) -> float:
    """조건별 점수 내역을 추가하고 획득 점수를 반환합니다."""
    safe_ratio = clamp(match_ratio, 0.0, 1.0)
    earned_score = weight * safe_ratio
    breakdown.append(
        {
            "condition": condition_name,
            "weight": round(weight, 2),
            "match_ratio": round(safe_ratio, 4),
            "earned_score": round(earned_score, 2),
        }
    )
    return earned_score


def score_vehicle_for_buyer(
    vehicle: dict,
    preferences: dict,
    active_basic_keys: list[str],
    active_optional_keys: list[str],
) -> dict:
    """차량 한 대와 사용자 입력 조건을 비교해 추천 적합도를 계산합니다."""
    basic_weight = 80.0 / len(active_basic_keys)
    optional_weight = (
        20.0 / len(active_optional_keys)
        if active_optional_keys
        else 0.0
    )
    maximum_score = 100.0 if active_optional_keys else 80.0
    raw_score = 0.0
    breakdown = []
    reasons = []

    if "preferredMake" in active_basic_keys:
        ratio = get_text_match_ratio(
            preferences["preferredMake"],
            vehicle["make"],
            VEHICLE_MAKE_ALIASES,
        )
        raw_score += add_score_breakdown(
            breakdown,
            "선호 제조사",
            basic_weight,
            ratio,
        )
        if ratio == 1.0:
            reasons.append("선호 제조사와 정확히 일치합니다.")
        elif ratio >= 0.7:
            reasons.append("선호 제조사와 유사한 차량입니다.")

    if "preferredModel" in active_basic_keys:
        ratio = get_text_match_ratio(
            preferences["preferredModel"],
            vehicle["model"],
            VEHICLE_MODEL_ALIASES,
        )
        raw_score += add_score_breakdown(
            breakdown,
            "선호 차량 모델",
            basic_weight,
            ratio,
        )
        if ratio == 1.0:
            reasons.append("선호 차량 모델과 정확히 일치합니다.")
        elif ratio >= 0.7:
            reasons.append("선호 차량 모델과 유사합니다.")

    if "preferredYear" in active_basic_keys:
        year_difference = abs(vehicle["year"] - preferences["preferredYear"])
        ratio = max(0.0, 1.0 - year_difference / 10.0)
        raw_score += add_score_breakdown(
            breakdown,
            "희망 연식",
            basic_weight,
            ratio,
        )
        if year_difference == 0:
            reasons.append("희망 연식과 정확히 일치합니다.")
        elif year_difference <= 2:
            reasons.append(
                f"희망 연식과 {year_difference}년 차이로 가깝습니다."
            )

    if "maxOdometer" in active_basic_keys:
        max_odometer = float(preferences["maxOdometer"])
        if vehicle["odometer"] <= max_odometer:
            ratio = 1.0
            reasons.append("최대 주행거리 조건을 충족합니다.")
        else:
            excess_ratio = (vehicle["odometer"] - max_odometer) / max_odometer
            ratio = max(0.0, 1.0 - excess_ratio)
        raw_score += add_score_breakdown(
            breakdown,
            "최대 주행거리",
            basic_weight,
            ratio,
        )

    price_difference = None
    if "expectedPrice" in active_basic_keys:
        expected_price = float(preferences["expectedPrice"])
        price_difference = abs(vehicle["predicted_mmr"] - expected_price)
        ratio = max(0.0, 1.0 - price_difference / expected_price)
        raw_score += add_score_breakdown(
            breakdown,
            "예상 구매가격",
            basic_weight,
            ratio,
        )
        if price_difference <= expected_price * 0.1:
            reasons.append(
                f"예상 MMR이 희망가격과 약 "
                f"{round(price_difference / 10000):,}만원 차이입니다."
            )

    if "preferredColor" in active_optional_keys:
        ratio = get_text_match_ratio(
            preferences["preferredColor"],
            vehicle.get("color") or "",
        )
        raw_score += add_score_breakdown(
            breakdown,
            "선호 색상",
            optional_weight,
            ratio,
        )
        if ratio == 1.0:
            reasons.append("선호 색상과 일치합니다.")

    if "minimumCondition" in active_optional_keys:
        minimum_condition = float(preferences["minimumCondition"])
        condition = float(vehicle["predicted_condition"])
        ratio = (
            1.0
            if condition >= minimum_condition
            else condition / minimum_condition
        )
        raw_score += add_score_breakdown(
            breakdown,
            "최소 차량 상태",
            optional_weight,
            ratio,
        )
        if condition >= minimum_condition:
            reasons.append(
                f"예상 Condition {condition:.2f}점으로 최소 상태 조건을 충족합니다."
            )

    if "priceTolerance" in active_optional_keys:
        tolerance = float(preferences["priceTolerance"])
        price_difference = price_difference or abs(
            vehicle["predicted_mmr"] - float(preferences["expectedPrice"])
        )
        ratio = 1.0 if price_difference <= tolerance else 0.0
        raw_score += add_score_breakdown(
            breakdown,
            "가격 허용 범위",
            optional_weight,
            ratio,
        )
        if price_difference <= tolerance:
            reasons.append("예상 MMR이 입력한 가격 허용 범위 안에 있습니다.")

    if "options" in active_optional_keys:
        ratio, matched_options = get_option_match_ratio(
            preferences["options"],
            vehicle["option"],
        )
        raw_score += add_score_breakdown(
            breakdown,
            "선호 옵션",
            optional_weight,
            ratio,
        )
        if matched_options:
            reasons.append(
                f"선호 옵션 {len(matched_options)}개를 포함합니다: "
                f"{', '.join(matched_options)}."
            )

    match_score = clamp(raw_score / maximum_score * 100.0, 0.0, 100.0)
    matched_condition_count = sum(
        1
        for item in breakdown
        if item["match_ratio"] >= 0.8
    )

    if not reasons:
        reasons.append("입력 조건과의 상대적 유사도를 기준으로 추천했습니다.")

    return {
        **vehicle,
        "match_score": round(match_score, 2),
        "matched_condition_count": matched_condition_count,
        "score_breakdown": breakdown,
        "recommendation_reasons": reasons,
    }


def build_dealer_model_input(features: DealerFeatures) -> dict:
    """딜러 단건·일괄 예측에서 공통으로 사용하는 모델 입력 행을 생성합니다."""
    site_usage_rate = clamp(features.Site_Usage_Rate, 0.0, 1.0)
    recent_trade_count = float(features.Recent_60d_Trade_Count)
    previous_trade_count = float(features.Previous_Trade_Count)

    expected_60d = max(1.0, previous_trade_count / 3.0)
    trade_drop_rate = (
        0.0
        if previous_trade_count == 0
        else max(0.0, 1.0 - recent_trade_count / expected_60d)
    )

    return {
        "last_activity_days": float(features.Last_Activity_Days),
        "recent_60d_trade_count": recent_trade_count,
        "recent_60d_trade_count_log": log1p(recent_trade_count),
        "previous_trade_count": previous_trade_count,
        "previous_trade_count_log": log1p(previous_trade_count),
        "trade_drop_rate": trade_drop_rate,
        "avg_selling_price": float(features.Avg_Selling_Price),
        "site_usage_rate": site_usage_rate,
    }


def normalize_dealer_inputs(features_list: list[DealerFeatures]) -> pd.DataFrame:
    """딜러 여러 명의 모델 입력을 하나의 DataFrame으로 변환합니다."""
    input_rows = [build_dealer_model_input(features) for features in features_list]
    return pd.DataFrame(input_rows)[MODEL_FEATURES]


def normalize_input(features: DealerFeatures) -> pd.DataFrame:
    """딜러 단건 입력을 기존 모델 학습 컬럼 순서로 변환합니다."""
    return normalize_dealer_inputs([features])


def build_company_model_input(features: CompanyFeatures) -> dict:
    """회사 단건·일괄 예측에서 공통으로 사용하는 모델 입력 행을 생성합니다."""
    dealer_count = max(1, features.Dealer_Count)
    active_dealer_ratio = clamp(features.Active_Dealer_Ratio, 0.0, 1.0)
    recent_trade_count = max(0, features.Recent_Trade_Count)
    previous_trade_count = max(0, features.Previous_Trade_Count)

    recent_trade_per_dealer = recent_trade_count / dealer_count
    previous_trade_per_dealer = previous_trade_count / dealer_count
    recent_trade_per_dealer_log = log1p(recent_trade_per_dealer)
    previous_trade_per_dealer_log = log1p(previous_trade_per_dealer)

    return {
        "dealer_count": float(dealer_count),
        "active_dealer_ratio": float(active_dealer_ratio),
        "recent_trade_per_dealer": float(recent_trade_per_dealer),
        "previous_trade_per_dealer": float(previous_trade_per_dealer),
        "recent_trade_per_dealer_log": recent_trade_per_dealer_log,
        "previous_trade_per_dealer_log": previous_trade_per_dealer_log,
        "activity_growth_log": (
            recent_trade_per_dealer_log - previous_trade_per_dealer_log
        ),
        "site_usage_rate_avg": clamp(features.Site_Usage_Rate_Avg, 0.0, 1.0),
        "avg_selling_price_avg": float(features.Avg_Selling_Price_Avg),
    }


def normalize_company_inputs(features_list: list[CompanyFeatures]) -> pd.DataFrame:
    """회사 여러 곳의 모델 입력을 하나의 DataFrame으로 변환합니다."""
    input_rows = [build_company_model_input(features) for features in features_list]
    return pd.DataFrame(input_rows)[COMPANY_MODEL_FEATURES]


def normalize_company_input(features: CompanyFeatures) -> pd.DataFrame:
    """회사 단건 입력을 기존 모델 학습 컬럼 순서로 변환합니다."""
    return normalize_company_inputs([features])

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
        "api_contract_version": API_CONTRACT_VERSION,
        "model_loaded": model_individual is not None,
        "individual_model_loaded": model_individual is not None,
        "company_model_loaded": model_company is not None,
        "vehicle_condition_model_loaded": model_vehicle_condition is not None,
        "vehicle_mmr_model_loaded": model_vehicle_mmr is not None,
        "latest_churn_batch_available": latest_churn_batch_snapshot is not None,
        "model_path": str(MODEL_PATH),
        "model_features": MODEL_FEATURES,
        "model_versions": {
            "dealer_churn": DEALER_CHURN_MODEL_VERSION,
            "company_churn": COMPANY_CHURN_MODEL_VERSION,
            "vehicle_condition": VEHICLE_CONDITION_MODEL_VERSION,
            "vehicle_mmr": VEHICLE_MMR_MODEL_VERSION,
        },
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

@app.post(
    "/api/ai/predict-churn/batch",
    response_model=BatchChurnResponse,
)
def predict_churn_batch(request: BatchChurnRequest):
    """Spring Boot가 전달한 딜러·회사 활동 데이터를 모델별 한 번에 예측합니다."""
    global latest_churn_batch_snapshot

    if not request.dealers and not request.companies:
        raise HTTPException(
            status_code=400,
            detail="예측할 딜러 또는 회사 데이터가 한 건 이상 필요합니다.",
        )

    dealer_ids = [item.dealer_id for item in request.dealers]
    company_ids = [item.company_id for item in request.companies]

    if len(dealer_ids) != len(set(dealer_ids)):
        raise HTTPException(
            status_code=400,
            detail="중복된 dealer_id가 포함되어 있습니다.",
        )
    if len(company_ids) != len(set(company_ids)):
        raise HTTPException(
            status_code=400,
            detail="중복된 company_id가 포함되어 있습니다.",
        )

    if request.dealers and model_individual is None:
        raise HTTPException(
            status_code=503,
            detail="개인 딜러 예측 모델을 불러오지 못했습니다.",
        )
    if request.companies and model_company is None:
        raise HTTPException(
            status_code=503,
            detail="회사 예측 모델을 불러오지 못했습니다.",
        )

    try:
        dealer_predictions = []
        if request.dealers:
            dealer_input_df = normalize_dealer_inputs(request.dealers)
            dealer_active_probs, dealer_churn_probs = get_probability_columns(
                model_individual,
                dealer_input_df,
            )
            dealer_active_probs, dealer_churn_probs = (
                validate_probability_predictions(
                    dealer_active_probs,
                    dealer_churn_probs,
                    len(request.dealers),
                    "딜러 이탈",
                )
            )

            for item, active_prob, churn_prob in zip(
                request.dealers,
                dealer_active_probs,
                dealer_churn_probs,
            ):
                active_probability = float(active_prob)
                churn_probability = float(churn_prob)
                risk_grade = get_risk_grade(churn_probability)
                risk_reasons = build_dealer_risk_reasons(
                    last_activity_days=item.Last_Activity_Days,
                    recent_trade_count=item.Recent_60d_Trade_Count,
                    previous_trade_count=item.Previous_Trade_Count,
                    site_usage_rate=item.Site_Usage_Rate,
                )
                action = (
                    "수수료 50% 쿠폰발송"
                    if risk_grade in {"Critical", "High"}
                    else "모니터링"
                )

                dealer_predictions.append({
                    "dealer_id": item.dealer_id,
                    "churn_probability": round(churn_probability, 4),
                    "churn_probability_percent": round(
                        churn_probability * 100,
                        2,
                    ),
                    "active_probability": round(active_probability, 4),
                    "active_probability_percent": round(
                        active_probability * 100,
                        2,
                    ),
                    "predicted_status": (
                        "Inactive"
                        if churn_probability > active_probability
                        else "Active"
                    ),
                    "risk_grade": risk_grade,
                    "risk_reasons": risk_reasons,
                    "action": action,
                })

            dealer_predictions.sort(
                key=lambda prediction: prediction["churn_probability"],
                reverse=True,
            )

        company_predictions = []
        if request.companies:
            company_input_df = normalize_company_inputs(request.companies)
            company_active_probs, company_churn_probs = get_probability_columns(
                model_company,
                company_input_df,
            )
            company_active_probs, company_churn_probs = (
                validate_probability_predictions(
                    company_active_probs,
                    company_churn_probs,
                    len(request.companies),
                    "상사 이탈",
                )
            )

            for item, active_prob, churn_prob in zip(
                request.companies,
                company_active_probs,
                company_churn_probs,
            ):
                active_probability = float(active_prob)
                churn_probability = float(churn_prob)
                dealer_count = max(1, item.Dealer_Count)
                recent_trade_per_dealer = (
                    item.Recent_Trade_Count / dealer_count
                )
                previous_trade_per_dealer = (
                    item.Previous_Trade_Count / dealer_count
                )
                risk_reasons = build_company_risk_reasons(
                    active_dealer_ratio=item.Active_Dealer_Ratio,
                    site_usage_rate_avg=item.Site_Usage_Rate_Avg,
                    recent_trade_count=item.Recent_Trade_Count,
                    recent_trade_per_dealer=recent_trade_per_dealer,
                    previous_trade_per_dealer=previous_trade_per_dealer,
                )
                action = (
                    "멤버십 30% 쿠폰발송"
                    if churn_probability >= 0.80
                    else "모니터링"
                )

                company_predictions.append({
                    "company_id": item.company_id,
                    "churn_probability": round(churn_probability, 4),
                    "churn_probability_percent": round(
                        churn_probability * 100,
                        2,
                    ),
                    "active_probability": round(active_probability, 4),
                    "active_probability_percent": round(
                        active_probability * 100,
                        2,
                    ),
                    "predicted_status": (
                        "Inactive"
                        if churn_probability > active_probability
                        else "Active"
                    ),
                    "risk_grade": get_risk_grade(churn_probability),
                    "risk_reasons": risk_reasons,
                    "action": action,
                })

            company_predictions.sort(
                key=lambda prediction: prediction["churn_probability"],
                reverse=True,
            )

        print(
            "[Batch Prediction] "
            f"dealers={len(dealer_predictions)}, "
            f"companies={len(company_predictions)}"
        )

        calculated_at = datetime.now(timezone.utc)
        response = {
            "status": "success",
            "source": "spring_batch",
            "api_contract_version": API_CONTRACT_VERSION,
            "calculated_at": calculated_at,
            "dealer_count": len(dealer_predictions),
            "company_count": len(company_predictions),
            "model_versions": {
                "dealer": DEALER_CHURN_MODEL_VERSION,
                "company": COMPANY_CHURN_MODEL_VERSION,
            },
            "dealer_predictions": dealer_predictions,
            "company_predictions": company_predictions,
        }

        dealer_features_by_id = {
            item.dealer_id: item.model_dump()
            for item in request.dealers
        }
        company_features_by_id = {
            item.company_id: item.model_dump()
            for item in request.companies
        }

        latest_churn_batch_snapshot = {
            "status": "success",
            "source": "spring_batch",
            "api_contract_version": API_CONTRACT_VERSION,
            "calculated_at": calculated_at.isoformat(),
            "model_versions": response["model_versions"],
            "dealer_count": len(dealer_predictions),
            "company_count": len(company_predictions),
            "dealers": [
                {
                    **dealer_features_by_id[prediction["dealer_id"]],
                    **prediction,
                }
                for prediction in dealer_predictions
            ],
            "companies": [
                {
                    **company_features_by_id[prediction["company_id"]],
                    **prediction,
                }
                for prediction in company_predictions
            ],
        }

        return response
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"일괄 예측 도중 에러 발생: {str(e)}",
        )


@app.get(
    "/api/ai/predict-churn/latest",
    deprecated=True,
    summary="최근 이탈 예측 메모리 스냅샷 조회(진단용)",
)
def get_latest_churn_batch():
    """컨테이너 재시작 시 사라지는 진단용 결과이며 운영 저장소가 아닙니다."""
    if latest_churn_batch_snapshot is None:
        raise HTTPException(
            status_code=404,
            detail="아직 Spring Boot에서 수신한 이탈 예측 배치가 없습니다.",
        )

    return latest_churn_batch_snapshot


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


@app.get(
    "/api/ai/vehicle-recommendations",
    response_model=DemoVehiclePredictionBatchResponse,
)
def get_vehicle_recommendations():
    """시연용 차량 전체를 Condition과 MMR 모델로 일괄 예측합니다."""
    try:
        recommendations = [
            dict(vehicle)
            for vehicle in get_vehicle_prediction_catalog()
        ]

        recommendations.sort(
            key=lambda item: (
                item["predicted_condition"],
                item["predicted_mmr"],
            ),
            reverse=True,
        )

        return {
            "status": "success",
            "source": "dummy_catalog",
            "api_contract_version": API_CONTRACT_VERSION,
            "calculated_at": datetime.now(timezone.utc),
            "model_versions": get_vehicle_model_versions(),
            "source_vehicle_count": len(recommendations),
            "skipped_vehicle_count": 0,
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


@app.post(
    "/api/ai/vehicle-recommendations",
    response_model=VehiclePredictionBatchResponse,
)
def predict_vehicle_recommendations(
    request: VehiclePredictionBatchRequest,
):
    """Spring Boot가 DB에서 조회한 차량 전체를 모델로 일괄 예측합니다."""
    try:
        ensure_unique_vehicle_ids(request.vehicles)
        source_vehicle_count = len(request.vehicles)
        eligible_vehicles = []
        for vehicle in request.vehicles:
            status = clean_optional_text(vehicle.status)
            if status is not None and status.upper() != "REGISTERED":
                continue
            eligible_vehicles.append(vehicle.model_dump())

        if not eligible_vehicles:
            raise HTTPException(
                status_code=422,
                detail="예측 가능한 DB 차량이 없습니다.",
            )

        recommendations = build_vehicle_prediction_catalog(eligible_vehicles)
        recommendations.sort(
            key=lambda item: (
                item["predicted_condition"],
                item["predicted_mmr"],
            ),
            reverse=True,
        )

        return {
            "status": "success",
            "source": "spring_db",
            "api_contract_version": API_CONTRACT_VERSION,
            "calculated_at": datetime.now(timezone.utc),
            "model_versions": get_vehicle_model_versions(),
            "source_vehicle_count": source_vehicle_count,
            "skipped_vehicle_count": source_vehicle_count - len(eligible_vehicles),
            "count": len(recommendations),
            "recommendations": recommendations,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"DB 차량 추천 예측 중 오류 발생: {str(e)}",
        )


@app.post(
    "/api/ai/vehicle-recommendations/buyer",
    response_model=BuyerVehicleRecommendationResponse,
)
def recommend_vehicles_for_buyer(
    request: BuyerVehicleRecommendationRequest,
):
    """Spring Boot가 전달한 DB 차량과 구매 조건으로 적합도 상위 10대를 반환합니다."""
    try:
        ensure_unique_vehicle_ids(request.vehicles)
        input_vehicle_count = len(request.vehicles)
        preferences = request.preferences
        cleaned_preferences, active_basic_keys = (
            validate_vehicle_recommendation_request(preferences)
        )

        eligible_vehicles = []
        for vehicle in request.vehicles:
            owner_type = clean_optional_text(vehicle.ownerType)
            status = clean_optional_text(vehicle.status)
            if owner_type is not None and owner_type.upper() != "DEALER":
                continue
            if status is not None and status.upper() != "REGISTERED":
                continue
            eligible_vehicles.append(vehicle.model_dump())

        if not eligible_vehicles:
            raise HTTPException(
                status_code=422,
                detail="추천 가능한 DB 딜러 판매 차량이 없습니다.",
            )

        catalog = build_vehicle_prediction_catalog(eligible_vehicles)

        preferred_make = cleaned_preferences["preferredMake"]
        preferred_model = cleaned_preferences["preferredModel"]
        search_filtered_catalog, excluded_conditions = (
            filter_catalog_by_preferred_car_search(
                catalog,
                cleaned_preferences,
            )
        )
        filtered_catalog = []
        for vehicle in search_filtered_catalog:
            if (
                cleaned_preferences["exactMake"]
                and get_text_match_ratio(
                    preferred_make,
                    vehicle["make"],
                    VEHICLE_MAKE_ALIASES,
                )
                != 1.0
            ):
                continue
            if (
                cleaned_preferences["exactModel"]
                and get_text_match_ratio(
                    preferred_model,
                    vehicle["model"],
                    VEHICLE_MODEL_ALIASES,
                )
                != 1.0
            ):
                continue
            filtered_catalog.append(vehicle)

        active_optional_keys = []
        color_supported = any(
            clean_optional_text(vehicle.get("color")) is not None
            for vehicle in catalog
        )
        if cleaned_preferences["preferredColor"] is not None:
            if color_supported:
                active_optional_keys.append("preferredColor")
            else:
                excluded_conditions.append(
                    {
                        "condition": "preferredColor",
                        "reason": "전달된 차량 데이터에 색상 정보가 없어 점수에서 제외했습니다.",
                    }
                )
        if cleaned_preferences["minimumCondition"] is not None:
            active_optional_keys.append("minimumCondition")
        if cleaned_preferences["priceTolerance"] is not None:
            active_optional_keys.append("priceTolerance")
        if cleaned_preferences["options"]:
            active_optional_keys.append("options")

        scored_vehicles = [
            score_vehicle_for_buyer(
                vehicle,
                cleaned_preferences,
                active_basic_keys,
                active_optional_keys,
            )
            for vehicle in filtered_catalog
        ]
        scored_vehicles.sort(
            key=lambda item: (
                -item["match_score"],
                -item["predicted_condition"],
                -item["predicted_mmr"],
                item["odometer"],
                -item["year"],
                item["vehicle_id"],
            )
        )
        recommendations = scored_vehicles[:10]

        return {
            "status": "success",
            "source": "spring_db",
            "api_contract_version": API_CONTRACT_VERSION,
            "calculated_at": datetime.now(timezone.utc),
            "model_versions": get_vehicle_model_versions(),
            "message": (
                "추천 결과가 없습니다. 필수 일치 조건을 완화해 주세요."
                if not recommendations
                else "입력한 조건을 기준으로 차량 추천을 완료했습니다."
            ),
            "input_basic_condition_count": len(active_basic_keys),
            "input_optional_condition_count": len(active_optional_keys),
            "excluded_conditions": excluded_conditions,
            "input_vehicle_count": input_vehicle_count,
            "source_vehicle_count": len(eligible_vehicles),
            "skipped_vehicle_count": input_vehicle_count - len(eligible_vehicles),
            "candidate_count": len(filtered_catalog),
            "count": len(recommendations),
            "recommendations": recommendations,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"구매자 차량 추천 중 오류 발생: {str(e)}",
        )



