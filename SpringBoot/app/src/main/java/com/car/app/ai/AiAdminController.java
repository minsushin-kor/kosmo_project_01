package com.car.app.ai;

import com.car.app.company.Company;
import com.car.app.company.CompanyChurn;
import com.car.app.company.CompanyChurnRepository;
import com.car.app.company.CompanyRepository;
import com.car.app.dealer.Dealer;
import com.car.app.dealer.DealerChurn;
import com.car.app.dealer.DealerChurnRepository;
import com.car.app.dealer.DealerRepository;
import com.car.app.security.ApiResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

/**
 * AI 관련 관리자용 배치 강제 구동 및 이탈 위험도 모니터링 컨트롤러입니다.
 */
@RestController
@RequestMapping("/api/admin/ai")
@RequiredArgsConstructor
public class AiAdminController {

    private final AiService aiService;
    private final DealerRepository dealerRepository;
    private final CompanyRepository companyRepository;
    private final DealerChurnRepository dealerChurnRepository;
    private final CompanyChurnRepository companyChurnRepository;

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AdminDealerChurnResponse {
        private Long dealerId;
        private String loginId;
        private String name;
        private String phone;
        private Double riskScore;
        private String tier;
        private String riskGrade;
        private String riskReasons;
        private String action;
        private LocalDateTime calculatedAt;
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AdminCompanyChurnResponse {
        private Long companyId;
        private String companyName;
        private String businessNumber;
        private Double riskScore;
        private String tier;
        private String riskGrade;
        private String riskReasons;
        private String action;
        private LocalDateTime calculatedAt;
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChurnStatusResponse {
        private String status;
        private LocalDateTime lastCalculatedAt;
        private int dealerCount;
        private int companyCount;
    }

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

    /**
     * 전체 딜러의 최신 이탈 위험도 및 사유/조치 목록을 조회합니다.
     */
    @GetMapping("/churn-dealers")
    public ResponseEntity<ApiResponse<List<AdminDealerChurnResponse>>> getDealerChurnList() {
        List<Dealer> dealers = dealerRepository.findAll();
        List<AdminDealerChurnResponse> result = new ArrayList<>();

        for (Dealer dealer : dealers) {
            Optional<DealerChurn> churnOpt = dealerChurnRepository.findFirstByDealerDealerIdOrderByCalculatedAtDesc(dealer.getDealerId());

            result.add(AdminDealerChurnResponse.builder()
                    .dealerId(dealer.getDealerId())
                    .loginId(dealer.getLoginId())
                    .name(dealer.getName())
                    .phone(dealer.getPhone())
                    .riskScore(dealer.getRiskScore())
                    .tier(dealer.getTier())
                    .riskGrade(churnOpt.map(DealerChurn::getRiskGrade).orElse(dealer.getRiskScore() != null && dealer.getRiskScore() >= 75.0 ? "CARE_REQUIRED" : "NORMAL"))
                    .riskReasons(churnOpt.map(DealerChurn::getRiskReasons).orElse("활동 특이사항 없음"))
                    .action(churnOpt.map(DealerChurn::getAction).orElse("모니터링"))
                    .calculatedAt(churnOpt.map(DealerChurn::getCalculatedAt).orElse(null))
                    .build());
        }

        result.sort((d1, d2) -> {
            Double s1 = d1.getRiskScore() != null ? d1.getRiskScore() : 0.0;
            Double s2 = d2.getRiskScore() != null ? d2.getRiskScore() : 0.0;
            return s2.compareTo(s1);
        });

        return ResponseEntity.ok(ApiResponse.success(result, "전체 딜러 이탈 위험도 목록 조회가 완료되었습니다."));
    }

    /**
     * 전체 상사의 최신 이탈 위험도 및 사유/조치 목록을 조회합니다.
     */
    @GetMapping("/churn-companies")
    public ResponseEntity<ApiResponse<List<AdminCompanyChurnResponse>>> getCompanyChurnList() {
        List<Company> companies = companyRepository.findAll();
        List<AdminCompanyChurnResponse> result = new ArrayList<>();

        for (Company company : companies) {
            Optional<CompanyChurn> churnOpt = companyChurnRepository.findFirstByCompanyCompanyIdOrderByCalculatedAtDesc(company.getCompanyId());

            result.add(AdminCompanyChurnResponse.builder()
                    .companyId(company.getCompanyId())
                    .companyName(company.getName())
                    .businessNumber(company.getBusinessNumber())
                    .riskScore(company.getRiskScore())
                    .tier(company.getTier())
                    .riskGrade(churnOpt.map(CompanyChurn::getRiskGrade).orElse(company.getRiskScore() != null && company.getRiskScore() >= 70.0 ? "CARE_REQUIRED" : "NORMAL"))
                    .riskReasons(churnOpt.map(CompanyChurn::getRiskReasons).orElse("활동 특이사항 없음"))
                    .action(churnOpt.map(CompanyChurn::getAction).orElse("모니터링"))
                    .calculatedAt(churnOpt.map(CompanyChurn::getCalculatedAt).orElse(null))
                    .build());
        }

        result.sort((c1, c2) -> {
            Double s1 = c1.getRiskScore() != null ? c1.getRiskScore() : 0.0;
            Double s2 = c2.getRiskScore() != null ? c2.getRiskScore() : 0.0;
            return s2.compareTo(s1);
        });

        return ResponseEntity.ok(ApiResponse.success(result, "전체 상사 이탈 위험도 목록 조회가 완료되었습니다."));
    }

    /**
     * 마지막 이탈 위험도 예측 계산 시각 및 뱃치 상태 정보를 조회합니다.
     */
    @GetMapping("/churn-status")
    public ResponseEntity<ApiResponse<ChurnStatusResponse>> getChurnStatus() {
        List<DealerChurn> latestDealerChurns = dealerChurnRepository.findAllByOrderByCalculatedAtDesc();
        LocalDateTime lastCalculatedAt = latestDealerChurns.isEmpty() ? null : latestDealerChurns.get(0).getCalculatedAt();

        ChurnStatusResponse response = ChurnStatusResponse.builder()
                .status("ACTIVE")
                .lastCalculatedAt(lastCalculatedAt)
                .dealerCount((int) dealerRepository.count())
                .companyCount((int) companyRepository.count())
                .build();

        return ResponseEntity.ok(ApiResponse.success(response, "이탈 예측 뱃치 계산 시각 및 상태 조회가 완료되었습니다."));
    }
}
