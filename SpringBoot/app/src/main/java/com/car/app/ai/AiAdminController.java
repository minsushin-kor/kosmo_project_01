package com.car.app.ai;

import com.car.app.security.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * AI 관련 관리자용 배치 강제 구동 API를 제공하는 컨트롤러입니다.
 */
@RestController
@RequestMapping("/api/admin/ai")
@RequiredArgsConstructor
public class AiAdminController {

    private final AiService aiService;

    /**
     * 이탈 위험도 예측 및 혜택 발급 배치를 즉시(수동) 실행합니다.
     */
    @PostMapping("/churn-batch")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<String>> triggerChurnBatch() {
        try {
            aiService.runChurnPredictionBatch();
            return ResponseEntity.ok(ApiResponse.success("이탈 위험도 예측 배치가 성공적으로 실행 완료되었습니다."));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(ApiResponse.fail("ERR_BATCH_FAILED", "배치 실행 중 오류: " + e.getMessage()));
        }
    }
}
