package com.car.app.ai.client;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.ArrayList;
import java.util.List;

/**
 * FastAPI AI 서버와의 HTTP REST 통신을 담당하는 클라이언트 클래스입니다.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class AiClient {

    private final RestTemplate restTemplate;

    @Value("${ai.fastapi.base-url}")
    private String baseUrl;



    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DealerBatchItem {
        @com.fasterxml.jackson.annotation.JsonProperty("dealer_id")
        private Long dealerId;

        @com.fasterxml.jackson.annotation.JsonProperty("Last_Activity_Days")
        private int lastActivityDays;

        @com.fasterxml.jackson.annotation.JsonProperty("Recent_60d_Trade_Count")
        private int recent60dTradeCount;

        @com.fasterxml.jackson.annotation.JsonProperty("Previous_Trade_Count")
        private int previousTradeCount;

        @com.fasterxml.jackson.annotation.JsonProperty("Site_Usage_Rate")
        private double siteUsageRate;

        @com.fasterxml.jackson.annotation.JsonProperty("Avg_Selling_Price")
        private double avgSellingPrice;
    }

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CompanyBatchItem {
        @com.fasterxml.jackson.annotation.JsonProperty("company_id")
        private Long companyId;

        @com.fasterxml.jackson.annotation.JsonProperty("Dealer_Count")
        private int dealerCount;

        @com.fasterxml.jackson.annotation.JsonProperty("Active_Dealer_Ratio")
        private double activeDealerRatio;

        @com.fasterxml.jackson.annotation.JsonProperty("Recent_Trade_Count")
        private int recentTradeCount;

        @com.fasterxml.jackson.annotation.JsonProperty("Previous_Trade_Count")
        private int previousTradeCount;

        @com.fasterxml.jackson.annotation.JsonProperty("Site_Usage_Rate_Avg")
        private double siteUsageRateAvg;

        @com.fasterxml.jackson.annotation.JsonProperty("Avg_Selling_Price_Avg")
        private double avgSellingPriceAvg;
    }

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BatchChurnRequest {
        private List<DealerBatchItem> dealers;
        private List<CompanyBatchItem> companies;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DealerPredictionResult {
        @com.fasterxml.jackson.annotation.JsonProperty("dealer_id")
        private Long dealerId;

        @com.fasterxml.jackson.annotation.JsonProperty("churn_probability")
        private double churnProbability;

        @com.fasterxml.jackson.annotation.JsonProperty("predicted_status")
        private String predictedStatus;

        @com.fasterxml.jackson.annotation.JsonProperty("risk_grade")
        private String riskGrade;

        @com.fasterxml.jackson.annotation.JsonProperty("risk_reasons")
        private List<String> riskReasons;

        @com.fasterxml.jackson.annotation.JsonProperty("action")
        private String action;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CompanyPredictionResult {
        @com.fasterxml.jackson.annotation.JsonProperty("company_id")
        private Long companyId;

        @com.fasterxml.jackson.annotation.JsonProperty("churn_probability")
        private double churnProbability;

        @com.fasterxml.jackson.annotation.JsonProperty("predicted_status")
        private String predictedStatus;

        @com.fasterxml.jackson.annotation.JsonProperty("risk_grade")
        private String riskGrade;

        @com.fasterxml.jackson.annotation.JsonProperty("risk_reasons")
        private List<String> riskReasons;

        @com.fasterxml.jackson.annotation.JsonProperty("action")
        private String action;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BatchChurnResponse {
        private String status;
        @com.fasterxml.jackson.annotation.JsonProperty("dealer_predictions")
        private List<DealerPredictionResult> dealerPredictions;
        @com.fasterxml.jackson.annotation.JsonProperty("company_predictions")
        private List<CompanyPredictionResult> companyPredictions;
    }

    /**
     * FastAPI 서버의 /api/ai/predict-churn/batch API를 1회 단일 호출하여 딜러 및 상사 목록의 이탈 위험도를 뱃지로 통합 예측합니다.
     *
     * @param request 딜러 및 상사 요약 뱃치 요청 DTO
     * @return 뱃치 예측 응답 DTO (실패 시 null 반환)
     */
    public BatchChurnResponse predictBatchChurn(BatchChurnRequest request) {
        try {
            String url = UriComponentsBuilder.fromUriString(baseUrl)
                    .path("/api/ai/predict-churn/batch")
                    .build()
                    .toUriString();

            log.info("FastAPI 서버로 통합 뱃치 이탈 예측 요청 송신: {}", url);
            return restTemplate.postForObject(url, request, BatchChurnResponse.class);
        } catch (Exception e) {
            log.error("FastAPI 서버로 통합 뱃치 이탈 예측을 요청하는데 실패했습니다: {}", e.getMessage());
            return null;
        }
    }

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VehicleItem {
        private Long carId;
        private Integer year;
        private String make;
        private String model;
        private Double odometer;
        private String option;
        private String color;
        private Long sellingPrice;
        private String state;
        private String status;
        private String ownerType;
    }

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VehiclePredictionBatchRequest {
        private List<VehicleItem> vehicles;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VehiclePredictionResult {
        private Long carId;
        @com.fasterxml.jackson.annotation.JsonProperty("predicted_condition")
        private Double predictedCondition;
        @com.fasterxml.jackson.annotation.JsonProperty("predicted_mmr")
        private Double predictedMmr;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VehiclePredictionBatchResponse {
        private String status;
        private Integer count;
        private List<VehiclePredictionResult> recommendations;
    }

    /**
     * FastAPI /api/ai/vehicle-recommendations API를 호출하여 차량의 Condition과 MMR을 일괄 예측합니다.
     */
    public VehiclePredictionBatchResponse predictVehicleConditionAndMmr(List<VehicleItem> vehicles) {
        try {
            String url = UriComponentsBuilder.fromUriString(baseUrl)
                    .path("/api/ai/vehicle-recommendations")
                    .build()
                    .toUriString();

            VehiclePredictionBatchRequest request = VehiclePredictionBatchRequest.builder()
                    .vehicles(vehicles)
                    .build();

            log.info("FastAPI 서버로 차량 Condition/MMR 예측 요청 송신 (대상 {}대): {}", vehicles.size(), url);
            return restTemplate.postForObject(url, request, VehiclePredictionBatchResponse.class);
        } catch (Exception e) {
            log.error("FastAPI 서버로 차량 Condition/MMR 예측 요청 실패: {}", e.getMessage());
            return null;
        }
    }

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BuyerRecommendApiRequest {
        private Object preferences;
        private List<VehicleItem> vehicles;
    }

    /**
     * FastAPI 서버로 구매자 선호 조건(preferences)과 DB 차량 목록(vehicles)을 전송하여 AI 추천 결과를 수신합니다.
     */
    public Object recommendVehiclesForBuyer(BuyerRecommendApiRequest request) {
        try {
            String url = UriComponentsBuilder.fromUriString(baseUrl)
                    .path("/api/ai/vehicle-recommendations/buyer")
                    .build()
                    .toUriString();

            log.info("FastAPI 서버로 일반 구매자 AI 차량 추천 요청 송신: {} (차량 후보 수: {}대)", url,
                    request.getVehicles() != null ? request.getVehicles().size() : 0);
            return restTemplate.postForObject(url, request, Object.class);
        } catch (Exception e) {
            log.error("FastAPI 서버로 일반 구매자 AI 차량 추천 요청 실패: {}", e.getMessage());
            return null;
        }
    }
}
