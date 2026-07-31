package com.car.app.ai.service;

import com.car.app.coupon.service.CouponService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * 이탈률 예측 저장과 골든 배지 갱신을 순서대로 실행하되,
 * 서로 다른 트랜잭션으로 분리해 배지 오류가 예측 결과를 롤백하지 않게 합니다.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ChurnBatchOrchestrator {

    private final AiService aiService;
    private final CouponService couponService;

    public void runChurnPredictionBatch() {
        aiService.runChurnPredictionBatch();

        try {
            log.info("AI 이탈 위험이 낮은 상위 5% 회사 골든 배지 갱신 배치 실행...");
            couponService.updateCompanyTiersAndBadges();
        } catch (Exception e) {
            log.error("AI 이탈 안정도 상위 5% 회사 골든 배지 갱신 중 오류가 발생했습니다.", e);
        }
    }
}
