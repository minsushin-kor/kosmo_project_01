from __future__ import annotations

import argparse
from datetime import datetime, timezone
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from catboost import CatBoostRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import KFold


MODEL_DIR = Path(__file__).resolve().parent
DEFAULT_DATA_PATH = Path(
    r"D:\minsu\workspace_boot\kosmo_project_01\dataset\car_prices_final.csv"
)
DEFAULT_MODEL_PATH = MODEL_DIR / "vehicle_mmr_catboost_model.pkl"

FEATURES = ["year", "make", "model", "odometer", "condition"]
CATEGORICAL_FEATURES = ["make", "model"]
TARGET = "mmr"
DATE_COLUMN = "saledate"
RANDOM_STATE = 42

BASE_MODEL_PARAMS = {
    "iterations": 1_200,
    "depth": 9,
    "learning_rate": 0.05,
    "loss_function": "RMSE",
    "eval_metric": "RMSE",
    "l2_leaf_reg": 5,
    "random_seed": RANDOM_STATE,
    "thread_count": -1,
    "allow_writing_files": False,
    "verbose": False,
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Train the dealer vehicle-MMR CatBoost model."
    )
    parser.add_argument("--data", type=Path, default=DEFAULT_DATA_PATH)
    parser.add_argument("--output", type=Path, default=DEFAULT_MODEL_PATH)
    return parser.parse_args()


def load_training_data(data_path: Path) -> pd.DataFrame:
    required_columns = FEATURES + [TARGET, DATE_COLUMN]
    data = pd.read_csv(data_path, usecols=required_columns)

    data[DATE_COLUMN] = pd.to_datetime(data[DATE_COLUMN], utc=True, errors="coerce")
    data["year"] = pd.to_numeric(data["year"], errors="coerce")
    data["odometer"] = pd.to_numeric(data["odometer"], errors="coerce")
    data["condition"] = pd.to_numeric(data["condition"], errors="coerce")
    data[TARGET] = pd.to_numeric(data[TARGET], errors="coerce")

    data[CATEGORICAL_FEATURES] = (
        data[CATEGORICAL_FEATURES].fillna("Unknown").astype(str)
    )
    # Missing condition rows are excluded instead of being imputed because
    # condition is a core explanatory variable for MMR.
    data = data.dropna(
        subset=["year", "odometer", "condition", TARGET, DATE_COLUMN]
    )
    data = data[data["condition"].between(1.0, 5.0)]
    data = data[data[TARGET] > 0]

    return data.sort_values(DATE_COLUMN).reset_index(drop=True)


def regression_metrics(actual: np.ndarray, predicted: np.ndarray) -> dict[str, float]:
    predicted = np.maximum(np.asarray(predicted, dtype=float), 0.0)
    actual = np.asarray(actual, dtype=float)
    absolute_percentage_error = np.abs(actual - predicted) / actual

    return {
        "mae": float(mean_absolute_error(actual, predicted)),
        "rmse": float(mean_squared_error(actual, predicted) ** 0.5),
        "r2": float(r2_score(actual, predicted)),
        "mape": float(np.mean(absolute_percentage_error)),
        "median_ape": float(np.median(absolute_percentage_error)),
        "within_10_rate": float(np.mean(absolute_percentage_error <= 0.10)),
        "within_20_rate": float(np.mean(absolute_percentage_error <= 0.20)),
    }


def train_with_cross_validation(
    train_data: pd.DataFrame,
) -> tuple[list[dict[str, float]], int]:
    inputs = train_data[FEATURES]
    target = train_data[TARGET].to_numpy()
    splitter = KFold(n_splits=5, shuffle=True, random_state=RANDOM_STATE)

    fold_results: list[dict[str, float]] = []
    best_iterations: list[int] = []

    for fold_number, (fit_indices, validation_indices) in enumerate(
        splitter.split(inputs), start=1
    ):
        model = CatBoostRegressor(**BASE_MODEL_PARAMS)
        model.fit(
            inputs.iloc[fit_indices],
            target[fit_indices],
            cat_features=CATEGORICAL_FEATURES,
            eval_set=(inputs.iloc[validation_indices], target[validation_indices]),
            use_best_model=True,
            early_stopping_rounds=80,
            verbose=False,
        )

        predictions = model.predict(inputs.iloc[validation_indices])
        metrics = regression_metrics(target[validation_indices], predictions)
        best_iteration = max(1, int(model.get_best_iteration()) + 1)
        best_iterations.append(best_iteration)
        fold_results.append(
            {
                "fold": fold_number,
                "best_iteration": best_iteration,
                **metrics,
            }
        )

        print(
            f"[Fold {fold_number}/5] "
            f"iteration={best_iteration}, "
            f"MAE={metrics['mae']:,.0f}, "
            f"RMSE={metrics['rmse']:,.0f}, "
            f"R2={metrics['r2']:.4f}, "
            f"MAPE={metrics['mape'] * 100:.2f}%, "
            f"within_20={metrics['within_20_rate'] * 100:.2f}%"
        )

    final_iterations = int(round(float(np.median(best_iterations))))
    return fold_results, final_iterations


def main() -> None:
    args = parse_args()
    data_path = args.data.resolve()
    output_path = args.output.resolve()

    if not data_path.exists():
        raise FileNotFoundError(f"Training data not found: {data_path}")

    data = load_training_data(data_path)
    split_index = int(len(data) * 0.8)
    train_data = data.iloc[:split_index].copy()
    holdout_data = data.iloc[split_index:].copy()

    print(f"[Data] total={len(data):,}")
    print(f"[Split] train={len(train_data):,}, holdout={len(holdout_data):,}")
    print(
        f"[Period] train_end={train_data[DATE_COLUMN].max()}, "
        f"holdout_start={holdout_data[DATE_COLUMN].min()}"
    )

    fold_results, final_iterations = train_with_cross_validation(train_data)
    print(f"[CV] selected_iterations={final_iterations}")

    final_params = {**BASE_MODEL_PARAMS, "iterations": final_iterations}
    final_model = CatBoostRegressor(**final_params)
    final_model.fit(
        train_data[FEATURES],
        train_data[TARGET],
        cat_features=CATEGORICAL_FEATURES,
        verbose=False,
    )

    holdout_predictions = final_model.predict(holdout_data[FEATURES])
    holdout_metrics = regression_metrics(
        holdout_data[TARGET].to_numpy(), holdout_predictions
    )

    metric_names = [
        "mae",
        "rmse",
        "r2",
        "mape",
        "median_ape",
        "within_10_rate",
        "within_20_rate",
    ]
    cv_summary = {
        metric: float(np.mean([fold[metric] for fold in fold_results]))
        for metric in metric_names
    }
    bundle = {
        "model": final_model,
        "model_type": "CatBoostRegressor",
        "features": FEATURES,
        "categorical_features": CATEGORICAL_FEATURES,
        "target": TARGET,
        "prediction_min": 0.0,
        "split": {
            "method": "chronological_80_20",
            "train_rows": len(train_data),
            "holdout_rows": len(holdout_data),
            "train_end": train_data[DATE_COLUMN].max().isoformat(),
            "holdout_start": holdout_data[DATE_COLUMN].min().isoformat(),
            "holdout_end": holdout_data[DATE_COLUMN].max().isoformat(),
        },
        "cross_validation": {
            "method": "KFold",
            "n_splits": 5,
            "shuffle": True,
            "random_state": RANDOM_STATE,
            "folds": fold_results,
            "mean": cv_summary,
            "selected_iterations": final_iterations,
        },
        "holdout_metrics": holdout_metrics,
        "trained_at_utc": datetime.now(timezone.utc).isoformat(),
        "training_data": str(data_path),
    }

    output_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(bundle, output_path)

    print(
        "[Holdout] "
        f"MAE={holdout_metrics['mae']:,.0f}, "
        f"RMSE={holdout_metrics['rmse']:,.0f}, "
        f"R2={holdout_metrics['r2']:.4f}, "
        f"MAPE={holdout_metrics['mape'] * 100:.2f}%, "
        f"within_20={holdout_metrics['within_20_rate'] * 100:.2f}%"
    )
    print(f"[Saved] {output_path}")


if __name__ == "__main__":
    main()
