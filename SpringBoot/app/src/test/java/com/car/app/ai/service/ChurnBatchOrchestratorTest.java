package com.car.app.ai.service;

import com.car.app.coupon.service.CouponService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InOrder;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.inOrder;

@ExtendWith(MockitoExtension.class)
class ChurnBatchOrchestratorTest {

    @Mock
    private AiService aiService;

    @Mock
    private CouponService couponService;

    @InjectMocks
    private ChurnBatchOrchestrator orchestrator;

    @Test
    void keepsChurnBatchSuccessfulWhenBadgeUpdateFails() {
        doThrow(new IllegalStateException("badge update failed"))
                .when(couponService)
                .updateCompanyTiersAndBadges();

        assertDoesNotThrow(orchestrator::runChurnPredictionBatch);

        InOrder order = inOrder(aiService, couponService);
        order.verify(aiService).runChurnPredictionBatch();
        order.verify(couponService).updateCompanyTiersAndBadges();
    }
}
