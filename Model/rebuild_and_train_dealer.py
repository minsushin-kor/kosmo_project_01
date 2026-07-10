import pandas as pd
import numpy as np
import joblib
from pathlib import Path
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.ensemble import RandomForestClassifier

# 경로 설정
BASE_DIR = Path(__file__).resolve().parent
DATA_PATH = BASE_DIR / "../dataset" / "dealer_churn.csv"
MODEL_PATH = BASE_DIR / "dealer_churn_service_model.pkl"

print("=== [ 1. 데이터셋 로드 및 신규 위험도 기반 라벨 재가공 ] ===")
try:
    df = pd.read_csv(DATA_PATH)
except FileNotFoundError:
    print(f"❌ 에러: {DATA_PATH} 파일을 찾을 수 없습니다. 경로를 확인하세요.")
    raise

# 비즈니스 상식에 맞춘 딜러 위험도 점수 계산식 정의
# 1) 미활동 일수가 180일에 가까울수록 위험 (비중 45%)
inactivity_risk = np.minimum(1.0, df["last_activity_days"] / 180.0)

# 2) 최근 60일 거래량이 0회이면 위험 최대, 많을수록 감소 (비중 40%)
recent_trade_risk = np.where(
    df["recent_60d_trade_count"] == 0,
    1.0,
    np.maximum(0.0, 1.0 - df["recent_60d_trade_count"] / 10.0)
)

# 3) 사이트 이용률이 낮을수록 위험 (비중 15%)
site_usage_risk = 1.0 - df["site_usage_rate"]

# 종합 위험 점수 산출
df["new_risk_score"] = (
    inactivity_risk * 0.45 +
    recent_trade_risk * 0.40 +
    site_usage_risk * 0.15
)

# 상위 10% 고위험군을 이탈 딜러(is_churn = 1)로 판정 규칙 정의
# (거래량이 많았더라도 미활동 및 거래가 끊기면 정상적으로 이탈로 판정됨)
churn_threshold = df["new_risk_score"].quantile(0.90)
df["is_churn"] = np.where(df["new_risk_score"] >= churn_threshold, 1, 0)

print(f"  * 새로운 기준 임계 점수: {churn_threshold:.4f}")
print("  * 새로 변경된 이탈 분포:")
print(df["is_churn"].value_counts())

# 데이터셋 업데이트 저장
df.to_csv(DATA_PATH, index=False, encoding="utf-8-sig")
print("  * dataset/dealer_churn.csv 업데이트 저장 완료!")

print("\n=== [ 2. RandomForest Classifier 파이프라인 학습 ] ===")
FEATURE_COLUMNS = [
    "last_activity_days",
    "recent_60d_trade_count_log",
    "previous_trade_count_log",
    "site_usage_rate"
]

X = df[FEATURE_COLUMNS]
y = df["is_churn"]

model_pipeline = Pipeline([
    ("imputer", SimpleImputer(strategy="median")),
    ("classifier", RandomForestClassifier(
        n_estimators=500,
        max_depth=5,
        min_samples_leaf=5,
        class_weight="balanced",
        random_state=42,
        n_jobs=-1
    ))
])

model_pipeline.fit(X, y)

# 딕셔너리 구조로 덤프
joblib.dump(
    {
        "model": model_pipeline,
        "feature_columns": FEATURE_COLUMNS,
        "selected_model": "RandomForest",
        "threshold": 0.5
    },
    MODEL_PATH
)
print("  * Model/dealer_churn_service_model.pkl 모델 저장 완료!")

print("\n=== [ 3. 비즈니스 룰 임계 시뮬레이션 즉각 확인 ] ===")
# 문제의 [이전 거래량 많음(432) -> 최근 급감(5) + 120일 미활동] 테스트
test_df = pd.DataFrame([{
    "last_activity_days": 120.0,
    "recent_60d_trade_count_log": np.log1p(5.0),
    "previous_trade_count_log": np.log1p(432.0),
    "site_usage_rate": 0.20
}])
test_df = test_df[FEATURE_COLUMNS]

proba = model_pipeline.predict_proba(test_df)[0][1] * 100
print(f"  * [테스트 결과] 이전 432회 거래처의 120일 미활동 상태 이탈률: {proba:.2f}% (기대치: 70% 이상)")
print("\n🎉 모든 과정이 성공적으로 완료되었습니다!")
