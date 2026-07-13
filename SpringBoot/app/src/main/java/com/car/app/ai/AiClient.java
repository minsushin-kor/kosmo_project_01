package com.car.app.ai;

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
    public static class RecommendationResponse {
        private String status;
        private Long dealerId;
        private List<Long> recommendedCarIds;
    }

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DealerFeatures {
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
    public static class CompanyFeatures {
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
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChurnPredictionResponse {
        private String status;
        @com.fasterxml.jackson.annotation.JsonProperty("predicted_status")
        private String predictedStatus;
        @com.fasterxml.jackson.annotation.JsonProperty("churn_probability")
        private double churnProbability;
        @com.fasterxml.jackson.annotation.JsonProperty("risk_grade")
        private String riskGrade;
        @com.fasterxml.jackson.annotation.JsonProperty("risk_reasons")
        private List<String> riskReasons;
    }

    /**
     * FastAPI 서버의 /api/ai/recommendations API를 호출하여 딜러 맞춤 추천 차량 ID 목록을 수신합니다.
     *
     * @param dealerId 딜러 ID
     * @return 추천 차량 ID 목록 (에러 발생 시 빈 리스트 반환)
     */
    public List<Long> getRecommendedCarIds(Long dealerId) {
        try {
            String url = UriComponentsBuilder.fromUriString(baseUrl)
                    .path("/api/ai/recommendations")
                    .queryParam("dealerId", dealerId)
                    .build()
                    .toUriString();

            log.info("FastAPI 서버로 차량 추천 요청 송신: {}", url);
            RecommendationResponse response = restTemplate.getForObject(url, RecommendationResponse.class);

            if (response != null && "success".equalsIgnoreCase(response.getStatus()) && response.getRecommendedCarIds() != null) {
                log.info("FastAPI 서버로부터 딜러 {}의 추천 차량 ID {}개를 성공적으로 수신했습니다.",
                        dealerId, response.getRecommendedCarIds().size());
                return response.getRecommendedCarIds();
            }
        } catch (Exception e) {
            log.error("FastAPI 서버로부터 딜러 {}의 차량 추천 정보를 가져오는데 실패했습니다: {}", dealerId, e.getMessage());
        }
        return new ArrayList<>();
    }

    /**
     * FastAPI 서버의 /api/ai/predict-churn/individual API를 호출하여 딜러의 이탈 위험도를 예측합니다.
     *
     * @param features 딜러 활동 특징량
     * @return 예측 결과 응답 DTO (실패 시 null 반환)
     */
    public ChurnPredictionResponse predictDealerChurn(DealerFeatures features) {
        try {
            String url = UriComponentsBuilder.fromUriString(baseUrl)
                    .path("/api/ai/predict-churn/individual")
                    .build()
                    .toUriString();

            log.info("FastAPI 서버로 딜러 이탈 예측 요청 송신: {}", url);
            return restTemplate.postForObject(url, features, ChurnPredictionResponse.class);
        } catch (Exception e) {
            log.error("FastAPI 서버로 딜러 이탈 예측을 요청하는데 실패했습니다: {}", e.getMessage());
            return null;
        }
    }

    /**
     * FastAPI 서버의 /api/ai/predict-churn/company API를 호출하여 상사의 이탈 위험도를 예측합니다.
     *
     * @param features 상사 활동 특징량
     * @return 예측 결과 응답 DTO (실패 시 null 반환)
     */
    public ChurnPredictionResponse predictCompanyChurn(CompanyFeatures features) {
        try {
            String url = UriComponentsBuilder.fromUriString(baseUrl)
                    .path("/api/ai/predict-churn/company")
                    .build()
                    .toUriString();

            log.info("FastAPI 서버로 상사 이탈 예측 요청 송신: {}", url);
            return restTemplate.postForObject(url, features, ChurnPredictionResponse.class);
        } catch (Exception e) {
            log.error("FastAPI 서버로 상사 이탈 예측을 요청하는데 실패했습니다: {}", e.getMessage());
            return null;
        }
    }
}
