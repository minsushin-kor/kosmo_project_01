import sys
import unittest
from pathlib import Path
from unittest.mock import patch

import numpy as np
from fastapi import HTTPException


MODEL_DIR = Path(__file__).resolve().parent
if str(MODEL_DIR) not in sys.path:
    sys.path.insert(0, str(MODEL_DIR))

import main as api


class SequencePredictionModel:
    def __init__(self, values):
        self.values = np.asarray(values, dtype=float)

    def predict(self, input_frame):
        return self.values[: len(input_frame)]


def vehicle(car_id, status="REGISTERED", owner_type="MEMBER"):
    return api.BuyerRecommendationVehicle(
        carId=car_id,
        year=2022,
        make="Hyundai",
        model=f"Model-{car_id}",
        odometer=25000,
        option="내비게이션, 열선시트",
        color="Black",
        sellingPrice=25000000,
        state="SEOUL",
        status=status,
        ownerType=owner_type,
    )


class FastApiContractTest(unittest.TestCase):
    def test_demo_catalog_keeps_string_ids_separate_from_db_contract(self):
        demo_prediction = {
            "carId": "DEMO-CAR-001",
            "vehicle_id": "DEMO-CAR-001",
            "year": 2021,
            "make": "Kia",
            "model": "K5",
            "odometer": 30000,
            "color": None,
            "option": [],
            "sellingPrice": 22000000,
            "state": None,
            "status": "REGISTERED",
            "ownerType": None,
            "predicted_condition": 4.1,
            "predicted_mmr": 21000000,
        }
        with patch.object(
            api,
            "get_vehicle_prediction_catalog",
            return_value=[demo_prediction],
        ):
            raw_response = api.get_vehicle_recommendations()

        response = api.DemoVehiclePredictionBatchResponse.model_validate(
            raw_response
        )
        self.assertEqual(response.recommendations[0].carId, "DEMO-CAR-001")

    def test_vehicle_batch_contract_filters_and_sorts_predictions(self):
        request = api.VehiclePredictionBatchRequest(
            vehicles=[vehicle(1), vehicle(2, "SOLD"), vehicle(3)]
        )

        with (
            patch.object(
                api,
                "model_vehicle_condition",
                SequencePredictionModel([4.2, 4.2]),
            ),
            patch.object(
                api,
                "model_vehicle_mmr",
                SequencePredictionModel([15000000, 18000000]),
            ),
        ):
            raw_response = api.predict_vehicle_recommendations(request)

        response = api.VehiclePredictionBatchResponse.model_validate(raw_response)
        self.assertEqual(response.status, "success")
        self.assertEqual(response.source, "spring_db")
        self.assertEqual(response.source_vehicle_count, 3)
        self.assertEqual(response.skipped_vehicle_count, 1)
        self.assertEqual(response.count, 2)
        self.assertEqual(
            [item.carId for item in response.recommendations],
            [3, 1],
        )
        self.assertEqual(response.recommendations[0].predicted_condition, 4.2)
        self.assertEqual(response.recommendations[0].predicted_mmr, 18000000)

    def test_vehicle_batch_rejects_duplicate_car_ids(self):
        request = api.VehiclePredictionBatchRequest(
            vehicles=[vehicle(10), vehicle(10)]
        )

        with self.assertRaises(HTTPException) as raised:
            api.predict_vehicle_recommendations(request)

        self.assertEqual(raised.exception.status_code, 400)
        self.assertIn("10", raised.exception.detail)

    def test_churn_batch_returns_metadata_and_full_prediction_contract(self):
        request = api.BatchChurnRequest(
            dealers=[
                api.DealerBatchItem(
                    dealer_id=1,
                    Last_Activity_Days=20,
                    Recent_60d_Trade_Count=1,
                    Previous_Trade_Count=8,
                    Site_Usage_Rate=0.1,
                    Avg_Selling_Price=12000000,
                )
            ],
            companies=[
                api.CompanyBatchItem(
                    company_id=2,
                    Dealer_Count=4,
                    Active_Dealer_Ratio=0.75,
                    Recent_Trade_Count=6,
                    Previous_Trade_Count=12,
                    Site_Usage_Rate_Avg=0.4,
                    Avg_Selling_Price_Avg=15000000,
                )
            ],
        )

        probabilities = [
            (np.array([0.2]), np.array([0.8])),
            (np.array([0.7]), np.array([0.3])),
        ]
        with (
            patch.object(api, "model_individual", object()),
            patch.object(api, "model_company", object()),
            patch.object(
                api,
                "get_probability_columns",
                side_effect=probabilities,
            ),
        ):
            raw_response = api.predict_churn_batch(request)

        response = api.BatchChurnResponse.model_validate(raw_response)
        self.assertEqual(response.source, "spring_batch")
        self.assertEqual(response.dealer_count, 1)
        self.assertEqual(response.company_count, 1)
        self.assertEqual(response.dealer_predictions[0].churn_probability, 0.8)
        self.assertEqual(response.dealer_predictions[0].risk_grade, "Critical")
        self.assertEqual(response.company_predictions[0].churn_probability, 0.3)
        self.assertIsNotNone(response.calculated_at.tzinfo)

    def test_buyer_recommendation_has_explicit_response_contract(self):
        request = api.BuyerVehicleRecommendationRequest(
            preferences=api.VehicleRecommendationRequest(
                preferredMake="Hyundai",
                expectedPrice=20000000,
            ),
            vehicles=[vehicle(20, owner_type="DEALER"), vehicle(21)],
        )

        with (
            patch.object(
                api,
                "model_vehicle_condition",
                SequencePredictionModel([4.5]),
            ),
            patch.object(
                api,
                "model_vehicle_mmr",
                SequencePredictionModel([19000000]),
            ),
        ):
            raw_response = api.recommend_vehicles_for_buyer(request)

        response = api.BuyerVehicleRecommendationResponse.model_validate(
            raw_response
        )
        self.assertEqual(response.input_vehicle_count, 2)
        self.assertEqual(response.source_vehicle_count, 1)
        self.assertEqual(response.skipped_vehicle_count, 1)
        self.assertEqual(response.recommendations[0].carId, 20)


if __name__ == "__main__":
    unittest.main()
