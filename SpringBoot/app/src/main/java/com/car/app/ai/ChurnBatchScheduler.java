package com.car.app.ai;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * 매일 자정에 이탈 위험도 배치 작업을 수행하는 스케줄러 클래스입니다.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ChurnBatchScheduler {

    private final AiService aiService;

    /**
     * 매일 자정(0시 0분 0초)에 실행되어 딜러/상사의 이탈 위험도를 예측 및 업데이트합니다.
     */
    @Scheduled(cron = "0 0 0 * * ?")
    public void runMidnightBatch() {
        log.info("자정 배치 스케줄러: 이탈 위험도 갱신 작업을 시작합니다.");
        try {
            aiService.runChurnPredictionBatch();
            log.info("자정 배치 스케줄러: 이탈 위험도 갱신 작업을 성공적으로 마쳤습니다.");
        } catch (Exception e) {
            log.error("자정 배치 스케줄러: 작업 중 예상치 못한 에러가 발생했습니다: {}", e.getMessage());
        }
    }
}
