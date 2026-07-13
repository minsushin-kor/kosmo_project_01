package com.car.app.ai;

import com.car.app.car.CarDto;
import com.car.app.security.ApiResponse;
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
            String dealerLoginId = authentication.getName();

            List<CarDto.Response> recommendations = aiService.getRecommendationsForDealer(dealerLoginId);
            return ResponseEntity.ok(ApiResponse.success(recommendations, "AI 추천 차량 목록 조회가 성공적으로 완료되었습니다."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.fail("ERR_INVALID_REQUEST", e.getMessage()));
        }
    }
}
