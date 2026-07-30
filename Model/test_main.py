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


def vehicle(
    car_id,
    status="REGISTERED",
    owner_type="MEMBER",
    make="Hyundai",
    model=None,
    body="SUV",
    year=2022,
    odometer=25000,
):
    return api.BuyerRecommendationVehicle(
        carId=car_id,
        year=year,
        make=make,
        model=model or f"Model-{car_id}",
        odometer=odometer,
        option="내비게이션, 열선시트",
        body=body,
        color="Black",
        sellingPrice=25000000,
        state="SEOUL",
        status=status,
        ownerType=owner_type,
    )


class FastApiContractTest(unittest.TestCase):
    def test_preferred_car_parser_separates_model_and_search_only_terms(self):
        parsed = api.parse_preferred_car("현대 아반떼 SUV 가솔린")

        self.assertEqual(parsed["preferredMake"], "현대")
        self.assertEqual(parsed["preferredModel"], "아반떼")
        self.assertEqual(parsed["preferredBody"], "SUV")
        self.assertEqual(parsed["preferredFuel"], "가솔린")

    def test_preferred_car_parser_reads_year_and_odometer(self):
        parsed = api.parse_preferred_car(
            "현대 아반떼 2022년 5만km"
        )

        self.assertEqual(parsed["preferredYear"], 2022)
        self.assertEqual(parsed["maxOdometer"], 50000)

    def test_preferred_car_filters_count_toward_two_condition_rule(self):
        preferences = api.VehicleRecommendationRequest(
            preferredCar="현대 SUV"
        )

        cleaned, active_keys = api.validate_vehicle_recommendation_request(
            preferences
        )

        self.assertEqual(cleaned["preferredMake"], "현대")
        self.assertEqual(cleaned["preferredBody"], "SUV")
        self.assertEqual(active_keys, ["preferredMake"])

    def test_single_preferred_car_condition_is_rejected(self):
        preferences = api.VehicleRecommendationRequest(preferredCar="현대")

        with self.assertRaises(HTTPException) as raised:
            api.validate_vehicle_recommendation_request(preferences)

        self.assertEqual(raised.exception.status_code, 422)
        self.assertIn("기본 조건을 2개 이상", raised.exception.detail)

    def test_preferred_car_priority_ignores_recent_search_values(self):
        preferences = api.VehicleRecommendationRequest(
            recommendationPriority="preferred_car",
            preferredCar="현대 SUV",
            preferredMake="BMW",
            preferredModel="X5",
            preferredYear=2024,
            expectedPrice=50000000,
            preferredRegion="SEOUL",
        )

        cleaned, active_keys = api.validate_vehicle_recommendation_request(
            preferences
        )

        self.assertEqual(cleaned["preferredMake"], "현대")
        self.assertEqual(cleaned["preferredBody"], "SUV")
        self.assertIsNone(cleaned["preferredModel"])
        self.assertIsNone(cleaned["preferredYear"])
        self.assertIsNone(cleaned["expectedPrice"])
        self.assertIsNone(cleaned["preferredRegion"])
        self.assertEqual(active_keys, ["preferredMake"])

    def test_recent_search_priority_ignores_saved_preferred_car(self):
        preferences = api.VehicleRecommendationRequest(
            recommendationPriority="recent_search",
            preferredCar="현대 SUV",
            preferredMake="BMW",
            preferredModel="X5",
        )

        cleaned, active_keys = api.validate_vehicle_recommendation_request(
            preferences
        )

        self.assertIsNone(cleaned["preferredCar"])
        self.assertEqual(cleaned["preferredMake"], "BMW")
        self.assertEqual(cleaned["preferredModel"], "X5")
        self.assertIsNone(cleaned["preferredBody"])
        self.assertEqual(cleaned["preferredCarTokens"], [])
        self.assertEqual(active_keys, ["preferredMake", "preferredModel"])

    def test_each_priority_ranks_only_its_selected_values(self):
        candidates = [
            vehicle(
                1,
                owner_type="DEALER",
                make="Hyundai",
                model="Tucson",
            ),
            vehicle(
                2,
                owner_type="DEALER",
                make="BMW",
                model="X5",
            ),
        ]

        preferred_request = api.BuyerVehicleRecommendationRequest(
            preferences=api.VehicleRecommendationRequest(
                recommendationPriority="preferred_car",
                preferredCar="현대 SUV",
                preferredMake="BMW",
                preferredModel="X5",
            ),
            vehicles=candidates,
        )
        recent_request = api.BuyerVehicleRecommendationRequest(
            preferences=api.VehicleRecommendationRequest(
                recommendationPriority="recent_search",
                preferredCar="현대 SUV",
                preferredMake="BMW",
                preferredModel="X5",
            ),
            vehicles=candidates,
        )

        with (
            patch.object(
                api,
                "model_vehicle_condition",
                SequencePredictionModel([4.0, 4.0]),
            ),
            patch.object(
                api,
                "model_vehicle_mmr",
                SequencePredictionModel([30000000, 30000000]),
            ),
        ):
            preferred_result = api.recommend_vehicles_for_buyer(
                preferred_request
            )
            recent_result = api.recommend_vehicles_for_buyer(recent_request)

        self.assertEqual(preferred_result["recommendations"][0]["carId"], 1)
        self.assertEqual(recent_result["recommendations"][0]["carId"], 2)

    def test_preferred_year_and_odometer_affect_recommendation_order(self):
        request = api.BuyerVehicleRecommendationRequest(
            preferences=api.VehicleRecommendationRequest(
                recommendationPriority="preferred_car",
                preferredCar="현대 아반떼 2022년 5만km",
            ),
            vehicles=[
                vehicle(
                    1,
                    owner_type="DEALER",
                    model="Elantra",
                    year=2022,
                    odometer=40000,
                ),
                vehicle(
                    2,
                    owner_type="DEALER",
                    model="Elantra",
                    year=2012,
                    odometer=90000,
                ),
            ],
        )

        with (
            patch.object(
                api,
                "model_vehicle_condition",
                SequencePredictionModel([4.0, 4.0]),
            ),
            patch.object(
                api,
                "model_vehicle_mmr",
                SequencePredictionModel([30000000, 30000000]),
            ),
        ):
            result = api.recommend_vehicles_for_buyer(request)

        self.assertEqual(result["recommendations"][0]["carId"], 1)
        self.assertEqual(
            result["recommendations"][0]["match_score"],
            100.0,
        )

    def test_preferred_body_filters_candidates_without_changing_model_score(self):
        preferences = api.VehicleRecommendationRequest(
            preferredCar="현대 아반떼 SUV"
        )
        cleaned, active_keys = api.validate_vehicle_recommendation_request(
            preferences
        )
        catalog = [
            {"body": "SUV", "fuel": None},
            {"body": "Sedan", "fuel": None},
        ]

        filtered, excluded = api.filter_catalog_by_preferred_car_search(
            catalog,
            cleaned,
        )

        self.assertEqual(active_keys, ["preferredMake", "preferredModel"])
        self.assertEqual(filtered, [catalog[0]])
        self.assertEqual(excluded, [])

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
                recommendationPriority="recent_search",
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
