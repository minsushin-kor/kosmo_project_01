import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline


BASE_DIR = Path(__file__).resolve().parent
PROJECT_DIR = BASE_DIR.parent
DUMMY_DIR = PROJECT_DIR / "dataset" / "dummy_output"

DEALER_SOURCE = DUMMY_DIR / "dealer_churn_dummy.json"
COMPANY_SOURCE = DUMMY_DIR / "company_churn_dummy.json"

DEALER_MODEL_PATH = BASE_DIR / "dealer_churn_service_model.pkl"
COMPANY_MODEL_PATH = BASE_DIR / "company_churn_service_model.pkl"
TEST_PAGE_DIR = PROJECT_DIR / "car-front" / "src" / "pages" / "test"
DEALER_PREDICTION_OUTPUT = TEST_PAGE_DIR / "dealer_churn_prediction_dummy.json"
COMPANY_PREDICTION_OUTPUT = TEST_PAGE_DIR / "company_churn_prediction_dummy.json"

DEALER_FEATURES = [
    "last_activity_days",
    "recent_60d_trade_count",
    "trade_drop_rate",
    "avg_selling_price",
    "site_usage_rate",
]

COMPANY_FEATURES = [
    "dealer_count",
    "active_dealer_ratio",
    "recent_trade_per_dealer",
    "previous_trade_per_dealer",
    "activity_growth",
    "site_usage_rate_avg",
    "avg_selling_price_avg",
]


def load_json(path: Path) -> pd.DataFrame:
    with path.open("r", encoding="utf-8") as file:
        return pd.DataFrame(json.load(file))


def build_pipeline(*, max_depth: int, min_samples_leaf: int) -> Pipeline:
    return Pipeline(
        [
            ("imputer", SimpleImputer(strategy="median")),
            (
                "classifier",
                RandomForestClassifier(
                    n_estimators=500,
                    max_depth=max_depth,
                    min_samples_leaf=min_samples_leaf,
                    class_weight="balanced",
                    max_features="sqrt",
                    random_state=42,
                    n_jobs=-1,
                ),
            ),
        ]
    )


def risk_grade(probability: float) -> str:
    if probability >= 0.8:
        return "Critical"
    if probability >= 0.6:
        return "High"
    if probability >= 0.4:
        return "Medium"
    if probability >= 0.2:
        return "Low"
    return "Safe"


def save_predictions(path: Path, rows: list[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as file:
        json.dump(rows, file, ensure_ascii=False, indent=2)
        file.write("\n")


def train_dealer_model() -> dict:
    frame = load_json(DEALER_SOURCE)
    expected_60d = np.maximum(1.0, frame["previous_trade_count"] / 3.0)
    frame["trade_drop_rate"] = np.where(
        frame["previous_trade_count"] == 0,
        0.0,
        np.maximum(
            0.0,
            1.0 - frame["recent_60d_trade_count"] / expected_60d,
        ),
    )

    labels = (frame["status"] == "Inactive").astype(int)
    model = build_pipeline(max_depth=5, min_samples_leaf=10)
    model.fit(frame[DEALER_FEATURES], labels)

    artifact = {
        "model": model,
        "feature_columns": DEALER_FEATURES,
        "selected_model": "RandomForest",
        "threshold": 0.5,
        "training_source": str(DEALER_SOURCE),
        "training_rows": int(len(frame)),
        "label_definition": "status == Inactive",
    }
    joblib.dump(artifact, DEALER_MODEL_PATH)

    probabilities = model.predict_proba(frame[DEALER_FEATURES])[:, 1]
    prediction_rows = []
    for index, row in frame.iterrows():
        probability = float(probabilities[index])
        reasons = []
        if row["last_activity_days"] >= 14:
            reasons.append(
                f"마지막 접속 후 {int(row['last_activity_days'])}일간 로그인이 없어 장기 휴면 상태입니다."
            )
        if row["trade_drop_rate"] >= 0.50 and row["previous_trade_count"] >= 30:
            reasons.append(
                f"과거 누적 실적({int(row['previous_trade_count'])}회) 대비 최근 거래가 "
                f"{int(row['trade_drop_rate'] * 100)}% 급락했습니다."
            )
        elif row["recent_60d_trade_count"] == 0:
            reasons.append("최근 60일 동안 성사된 차량 거래가 전무합니다.")
        if row["site_usage_rate"] <= 0.30:
            reasons.append(
                f"사이트 매물 조회 이용률이 {int(row['site_usage_rate'] * 100)}%로 매우 저조합니다."
            )
        if row["avg_selling_price"] <= 3_000_000:
            reasons.append(
                f"평균 판매 단가가 {int(row['avg_selling_price'] / 10_000)}만원으로 초저가/영세 차량 위주입니다."
            )
        if probability < 0.50:
            reasons = ["특이 위험 징후가 감지되지 않았으며 정상 유지 중입니다."]

        output_row = row.drop(labels=["trade_drop_rate"]).to_dict()
        output_row.update(
            {
                "model_churn_probability": round(probability, 4),
                "model_churn_probability_percent": round(probability * 100, 2),
                "model_risk_grade": risk_grade(probability),
                "model_risk_reasons": reasons,
            }
        )
        prediction_rows.append(output_row)
    save_predictions(DEALER_PREDICTION_OUTPUT, prediction_rows)

    return {
        "rows": len(frame),
        "positive_labels": int(labels.sum()),
        "unique_probabilities": len(np.unique(np.round(probabilities, 4))),
        "min_probability": round(float(probabilities.min() * 100), 2),
        "max_probability": round(float(probabilities.max() * 100), 2),
    }


def train_company_model() -> dict:
    frame = load_json(COMPANY_SOURCE)
    labels = frame["is_company_churn"].astype(int)
    model = build_pipeline(max_depth=3, min_samples_leaf=3)
    model.fit(frame[COMPANY_FEATURES], labels)

    artifact = {
        "model": model,
        "feature_columns": COMPANY_FEATURES,
        "selected_model": "RandomForest",
        "threshold": 0.5,
        "training_source": str(COMPANY_SOURCE),
        "training_rows": int(len(frame)),
        "label_definition": "is_company_churn",
    }
    joblib.dump(artifact, COMPANY_MODEL_PATH)

    probabilities = model.predict_proba(frame[COMPANY_FEATURES])[:, 1]
    prediction_rows = []
    for index, row in frame.iterrows():
        probability = float(probabilities[index])
        reasons = []
        if row["active_dealer_ratio"] <= 0.60:
            reasons.append(
                f"소속 딜러들의 현재 활동 비율이 {int(row['active_dealer_ratio'] * 100)}%로 과반이 비활성 상태입니다."
            )
        if row["site_usage_rate_avg"] <= 0.40:
            reasons.append(
                f"상사 소속 딜러들의 평균 사이트 이용률이 {int(row['site_usage_rate_avg'] * 100)}%로 저조합니다."
            )
        if row["recent_60d_trade_count"] == 0:
            reasons.append("상사 소속 전체 딜러들의 최근 60일간 거래가 전무합니다.")
        if row["activity_growth"] <= 0.40:
            reasons.append("과거 거래 패턴 대비 상사 전체의 활동성 성장률이 크게 하락했습니다.")
        if probability < 0.50:
            reasons = ["특이 위험 징후가 감지되지 않았으며 정상 유지 중입니다."]

        output_row = row.to_dict()
        output_row.update(
            {
                "model_churn_probability": round(probability, 4),
                "model_churn_probability_percent": round(probability * 100, 2),
                "model_risk_grade": risk_grade(probability),
                "model_risk_reasons": reasons,
            }
        )
        prediction_rows.append(output_row)
    save_predictions(COMPANY_PREDICTION_OUTPUT, prediction_rows)

    return {
        "rows": len(frame),
        "positive_labels": int(labels.sum()),
        "unique_probabilities": len(np.unique(np.round(probabilities, 4))),
        "min_probability": round(float(probabilities.min() * 100), 2),
        "max_probability": round(float(probabilities.max() * 100), 2),
    }


if __name__ == "__main__":
    result = {
        "dealer": train_dealer_model(),
        "company": train_company_model(),
    }
    print(json.dumps(result, ensure_ascii=False, indent=2))
