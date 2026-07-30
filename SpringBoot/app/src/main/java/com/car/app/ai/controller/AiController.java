package com.car.app.ai.controller;

import com.car.app.ai.service.AiService;
import com.car.app.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 일반 구매자 대상 AI 차량 추천 REST 컨트롤러입니다.
 */
@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiService aiService;

    /**
     * React 프론트엔드로부터 일반 구매자 선호 조건(preferences)을 수신하면,
     * DB에서 전체 판매 가능 딜러 차량 목록(vehicles)을 가져와 FastAPI에 중계 전달하고 추천 연산 결과를 반환합니다.
    */
    @PostMapping("/recommend-buyer")
    @PreAuthorize("hasRole('MEMBER')")
    public ResponseEntity<ApiResponse<Object>> recommendVehiclesForBuyer(
            @RequestBody Map<String, Object> preferences,
            Authentication authentication) {
        try {
            String memberLoginId = authentication != null ? authentication.getName() : null;
            Object result = aiService.recommendVehiclesForBuyer(preferences, memberLoginId);
            if (result != null) {
                return ResponseEntity.ok(ApiResponse.success(result, "일반 구매자 AI 차량 추천 계산이 성공적으로 완료되었습니다."));
            }
            return ResponseEntity.badRequest().body(ApiResponse.fail("ERR_AI_RECOMMEND_FAILED", "AI 서버로부터 추천 결과를 가져오는데 실패했습니다."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.fail("ERR_INVALID_RECOMMENDATION", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(ApiResponse.fail("ERR_AI_SERVER_UNAVAILABLE", e.getMessage()));
        }
    }
}
