package com.car.app.ai.controller;

import com.car.app.ai.service.AiService;
import com.car.app.car.dto.CarDto;
import com.car.app.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 딜러 대상 AI 맞춤 차량 추천 API를 노출하는 컨트롤러 클래스입니다.
 */
@RestController
@RequestMapping("/api/dealers")
@RequiredArgsConstructor
public class DealerRecommendationController {

    private final AiService aiService;

    /**
     * 현재 로그인한 딜러를 대상으로 AI가 분석한 추천 차량 목록을 조회합니다.
     */
    @GetMapping("/recommendations")
    @PreAuthorize("hasRole('DEALER')")
    public ResponseEntity<ApiResponse<List<CarDto.Response>>> getDealerRecommendations() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String dealerLoginId = (authentication != null) ? authentication.getName() : null;

            List<CarDto.Response> recommendations = aiService.getRecommendedCarsForDealer(dealerLoginId);
            return ResponseEntity.ok(ApiResponse.success(recommendations, "Condition/MMR 기준 딜러 맞춤 추천 경매 차량 목록 조회가 성공적으로 완료되었습니다."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.fail("ERR_INVALID_REQUEST", e.getMessage()));
        }
    }
}
