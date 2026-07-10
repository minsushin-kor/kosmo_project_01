import pandas as pd
import numpy as np
import joblib
from pathlib import Path
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.ensemble import RandomForestClassifier

# 1. 파일 경로 정의 (Model 폴더 기준)
BASE_DIR = Path(__file__).resolve().parent
CAR_PATH = Path(r"D:\minsu\workspace_boot\kosmo_project_01\dataset\car_prices_final.csv")
DEALER_PATH = BASE_DIR / "../dataset" / "dealer_churn.csv"
COMPANY_OUTPUT_PATH = BASE_DIR / "../dataset" / "company_churn.csv"

DEALER_MODEL_PATH = BASE_DIR / "dealer_churn_service_model.pkl"
COMPANY_MODEL_PATH = BASE_DIR / "company_churn_service_model.pkl"

print("=====================================================")
print(" [STEP 1] 개인 딜러 데이터셋 이탈률 및 status 갱신 (로그 사용 X)")
print("=====================================================")
try:
    dealer_df = pd.read_csv(DEALER_PATH)
    car_df = pd.read_csv(CAR_PATH)
except FileNotFoundError:
    print(f"❌ 에러: {DEALER_PATH} 또는 {CAR_PATH} 파일을 찾을 수 없습니다. 경로를 확인하세요.")
    raise

# 딜러별 평균 판매가 미리 매핑
car_df["saledate"] = pd.to_datetime(car_df["saledate"], errors="coerce")
dealer_avg_price = car_df.groupby("dealer_id")["sellingprice"].mean().reset_index(name="avg_selling_price")
dealer_df = dealer_df.drop(columns=["avg_selling_price"], errors="ignore").merge(dealer_avg_price, on="dealer_id", how="left")
dealer_df["avg_selling_price"] = dealer_df["avg_selling_price"].fillna(dealer_df["avg_selling_price"].median())

# 비즈니스 상식에 맞춘 딜러 위험도 점수 계산식 정의 (30일 한계치 반영)
inactivity_risk = np.minimum(1.0, dealer_df["last_activity_days"] / 30.0)
recent_trade_risk = np.where(
    dealer_df["recent_60d_trade_count"] == 0,
    1.0,
    np.maximum(0.0, 1.0 - dealer_df["recent_60d_trade_count"] / 10.0)
)
max_price = dealer_df["avg_selling_price"].max()
price_risk = 1.0 - (dealer_df["avg_selling_price"] / max_price)
site_usage_risk = 1.0 - dealer_df["site_usage_rate"]

# 파생 피처 trade_drop_rate 계산 (180일 대비 60일 비례)
expected_60d = np.maximum(1.0, dealer_df["previous_trade_count"] / 3.0)
dealer_df["trade_drop_rate"] = np.where(
    dealer_df["previous_trade_count"] == 0,
    0.0,
    np.maximum(0.0, 1.0 - dealer_df["recent_60d_trade_count"] / expected_60d)
)

# 우량 고객 활동 급감 리스크 산정
vip_weight = np.minimum(1.0, dealer_df["previous_trade_count"] / 50.0)
vip_drop_risk = vip_weight * dealer_df["trade_drop_rate"]

# 쿠폰 기획 맞춤형 황금 비율 + VIP 급감 리스크 5대 비중 적용 (미접속 30% / 이용률 25% / 최근거래 20% / 단가 5% / VIP급감 20%)
dealer_df["new_risk_score"] = (
    inactivity_risk * 0.3000 +
    site_usage_risk * 0.2500 +
    recent_trade_risk * 0.2000 +
    price_risk * 0.0500 +
    vip_drop_risk * 0.2000
)

# 상위 15.0%를 이탈(1)로 정의
churn_threshold = dealer_df["new_risk_score"].quantile(0.85)
dealer_df["is_churn"] = np.where(dealer_df["new_risk_score"] >= churn_threshold, 1, 0)

# 중요: status 값을 is_churn 상태와 100% 매핑하여 업데이트!
dealer_df["status"] = np.where(dealer_df["is_churn"] == 1, "Inactive", "Active")

# 딜러 파일 저장
dealer_df.to_csv(DEALER_PATH, index=False, encoding="utf-8-sig")
print(f"  * 딜러 데이터셋 ({DEALER_PATH}) 업데이트 및 저장 완료!")
print(dealer_df["status"].value_counts())


print("\n=====================================================")
print(" [STEP 2] 회사 데이터셋 생성 및 동기화 (로그 사용 X)")
print("=====================================================")
try:
    car_df = pd.read_csv(CAR_PATH)
except FileNotFoundError:
    print(f"❌ 에러: {CAR_PATH} 파일을 찾을 수 없습니다. 대용량 원본 중고차 데이터를 dataset 폴더에 넣고 실행해 주세요.")
    raise

car_df["saledate"] = pd.to_datetime(car_df["saledate"], errors="coerce")
REFERENCE_DATE = car_df["saledate"].max()

# 딜러-회사 매핑
dealer_company_map = (
    car_df
    .dropna(subset=["dealer_id", "company_id"])
    .groupby("dealer_id")["company_id"]
    .agg(lambda x: x.mode().iloc[0])
    .reset_index()
)

dealer_df_mapped = dealer_df.merge(dealer_company_map, on="dealer_id", how="left").dropna(subset=["company_id"]).copy()

# 회사 기본 피처 생성 (dealer_df의 업데이트된 값을 기반으로 합산 및 평균 연산)
company_df = (
    dealer_df_mapped
    .groupby("company_id")
    .agg(
        dealer_count=("dealer_id", "nunique"),
        active_dealer_count=("status", lambda x: (x == "Active").sum()),
        recent_60d_trade_count=("recent_60d_trade_count", "sum"),
        previous_trade_count=("previous_trade_count", "sum"),
        site_usage_rate_avg=("site_usage_rate", "mean"),
        avg_selling_price_avg=("avg_selling_price", "mean")
    )
    .reset_index()
)

company_df["active_dealer_ratio"] = np.where(
    company_df["dealer_count"] > 0,
    company_df["active_dealer_count"] / company_df["dealer_count"],
    0
)
company_df["site_usage_rate_avg"] = company_df["site_usage_rate_avg"].fillna(0).clip(0, 1)
company_df["avg_selling_price_avg"] = company_df["avg_selling_price_avg"].fillna(company_df["avg_selling_price_avg"].median())

company_df["recent_trade_per_dealer"] = np.where(company_df["dealer_count"] > 0, company_df["recent_60d_trade_count"] / company_df["dealer_count"], 0)
company_df["previous_trade_per_dealer"] = np.where(company_df["dealer_count"] > 0, company_df["previous_trade_count"] / company_df["dealer_count"], 0)

# 순수 나눗셈 성장률 피처 생성 (로그 사용 X)
company_df["activity_growth"] = company_df["recent_trade_per_dealer"] / (company_df["previous_trade_per_dealer"] + 1e-5)

# 개선된 임계치 로컬 정규화 공식 적용 (특정 피처 편향 해소)
company_df["active_ratio_risk"] = 1.0 - company_df["active_dealer_ratio"]
company_df["site_usage_risk"] = 1.0 - company_df["site_usage_rate_avg"]

# 1인당 최근 거래 5대 이상이면 위험도 0, 미만이면 비례 상승
company_df["recent_trade_risk"] = np.maximum(0.0, 1.0 - company_df["recent_trade_per_dealer"] / 5.0)

# 성장률이 1.0(100%) 이상이면 위험도 0, 미만이면 하락폭 비례 상승
company_df["growth_risk"] = np.maximum(0.0, np.minimum(1.0, 1.0 - company_df["activity_growth"]))

company_df["company_risk_score"] = (
    company_df["active_ratio_risk"] * 0.30 +
    company_df["site_usage_risk"] * 0.25 +
    company_df["recent_trade_risk"] * 0.25 +
    company_df["growth_risk"] * 0.20
)

risk_threshold = company_df["company_risk_score"].quantile(0.85)
company_df["is_company_churn"] = np.where(company_df["company_risk_score"] >= risk_threshold, 1, 0)

# 최종 저장 컬럼 (previous_60d_trade_count 대신 previous_trade_count 사용)
final_columns = [
    "company_id", "dealer_count", "active_dealer_count", "active_dealer_ratio",
    "recent_60d_trade_count", "previous_trade_count", "recent_trade_per_dealer",
    "previous_trade_per_dealer", "activity_growth", "site_usage_rate_avg", 
    "avg_selling_price_avg", "is_company_churn"
]
company_df = company_df[final_columns]
company_df.to_csv(COMPANY_OUTPUT_PATH, index=False, encoding="utf-8-sig")
print(f"  * 회사 데이터셋 ({COMPANY_OUTPUT_PATH}) 저장 완료!")

from sklearn.calibration import CalibratedClassifierCV

print("\n=====================================================")
print(" [STEP 3] 개인 딜러 RandomForest 모델 학습 및 저장")
print("=====================================================")
DEALER_FEATURES = ["last_activity_days", "recent_60d_trade_count", "trade_drop_rate", "avg_selling_price", "site_usage_rate"]
X_d = dealer_df[DEALER_FEATURES]
y_d = dealer_df["is_churn"]

base_rf = RandomForestClassifier(n_estimators=500, max_depth=5, min_samples_leaf=1, class_weight="balanced", random_state=42, n_jobs=-1)

dealer_pipeline = Pipeline([
    ("imputer", SimpleImputer(strategy="median")),
    ("classifier", base_rf)
])
dealer_pipeline.fit(X_d, y_d)
joblib.dump({"model": dealer_pipeline, "feature_columns": DEALER_FEATURES, "selected_model": "RandomForest", "threshold": 0.5}, DEALER_MODEL_PATH)
print(f"  * 개인 모델 ({DEALER_MODEL_PATH}) 학습 및 저장 완료!")

print("\n=====================================================")
print(" [STEP 4] 회사 RandomForest 모델 학습 및 저장")
print("=====================================================")
COMPANY_FEATURES = ["dealer_count", "active_dealer_ratio", "recent_trade_per_dealer", "previous_trade_per_dealer", "activity_growth", "site_usage_rate_avg", "avg_selling_price_avg"]
X_c = company_df[COMPANY_FEATURES]
y_c = company_df["is_company_churn"]

base_company_rf = RandomForestClassifier(n_estimators=500, max_depth=5, min_samples_leaf=1, class_weight="balanced", random_state=42, n_jobs=-1)

company_pipeline = Pipeline([
    ("imputer", SimpleImputer(strategy="median")),
    ("classifier", base_company_rf)
])
company_pipeline.fit(X_c, y_c)
joblib.dump({"model": company_pipeline, "feature_columns": COMPANY_FEATURES, "selected_model": "RandomForest", "threshold": 0.5}, COMPANY_MODEL_PATH)
print(f"  * 회사 모델 ({COMPANY_MODEL_PATH}) 학습 및 저장 완료!")

print("\n[SUCCESS] 모든 데이터 갱신 및 AI 모델 빌드가 한 번에 완료되었습니다!")
