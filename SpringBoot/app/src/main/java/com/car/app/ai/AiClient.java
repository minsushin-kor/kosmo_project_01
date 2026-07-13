package com.car.app.ai;

import lombok.Getter;
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
}
