package com.car.app.ai.controller;

import com.car.app.ai.service.AiService;
import com.car.app.company.entity.Company;
import com.car.app.company.entity.CompanyChurn;
import com.car.app.company.repository.CompanyChurnRepository;
import com.car.app.company.repository.CompanyRepository;
import com.car.app.coupon.entity.Coupon;
import com.car.app.coupon.repository.CouponRepository;
import com.car.app.dealer.entity.Dealer;
import com.car.app.dealer.entity.DealerChurn;
import com.car.app.dealer.repository.DealerChurnRepository;
import com.car.app.dealer.repository.DealerRepository;
import com.car.app.global.response.ApiResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.*;

/**
 * AI 관련 관리자용 배치 강제 구동 및 이탈 위험도 모니터링 컨트롤러입니다.
 */
@RestController
@RequestMapping("/api/admin/ai")
@RequiredArgsConstructor
public class AiAdminController {

    private static final String CHURN_COUPON_TYPE = "COMMISSION_DISCOUNT";
    private static final double CHURN_COUPON_RISK_THRESHOLD = 70.0;
    private static final ZoneId KOREA_ZONE = ZoneId.of("Asia/Seoul");

    private final AiService aiService;
    private final DealerRepository dealerRepository;
    private final CompanyRepository companyRepository;
    private final DealerChurnRepository dealerChurnRepository;
    private final CompanyChurnRepository companyChurnRepository;
    private final CouponRepository couponRepository;

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
        private OffsetDateTime calculatedAt;
        private String couponStatus;
        private boolean couponEligible;
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
        private OffsetDateTime calculatedAt;
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChurnStatusResponse {
        private String status;
        private OffsetDateTime lastCalculatedAt;
        private int dealerCount;
        private int companyCount;
    }

    /**
     * 이탈 위험도 예측 배치를 즉시(수동) 실행합니다.
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
        LocalDateTime now = LocalDateTime.now();

        Map<Long, DealerChurn> latestChurnByDealerId = new HashMap<>();
        for (DealerChurn churn : dealerChurnRepository.findAllByOrderByCalculatedAtDesc()) {
            if (churn.getDealer() != null) {
                latestChurnByDealerId.putIfAbsent(churn.getDealer().getDealerId(), churn);
            }
        }

        Map<Long, Coupon> latestCouponByDealerId = new HashMap<>();
        for (Coupon coupon : couponRepository.findByCouponTypeOrderByIssuedAtDesc(CHURN_COUPON_TYPE)) {
            if (coupon.getDealer() != null) {
                latestCouponByDealerId.putIfAbsent(coupon.getDealer().getDealerId(), coupon);
            }
        }

        for (Dealer dealer : dealers) {
            Optional<DealerChurn> churnOpt = Optional.ofNullable(
                    latestChurnByDealerId.get(dealer.getDealerId())
            );
            Optional<Coupon> couponOpt = Optional.ofNullable(
                    latestCouponByDealerId.get(dealer.getDealerId())
            );
            boolean couponEligible = isCouponEligible(dealer, couponOpt);

            result.add(AdminDealerChurnResponse.builder()
                    .dealerId(dealer.getDealerId())
                    .loginId(dealer.getLoginId())
                    .name(dealer.getName())
                    .phone(dealer.getPhone())
                    .riskScore(dealer.getRiskScore())
                    .tier(dealer.getTier())
                    .riskGrade(churnOpt.map(DealerChurn::getRiskGrade).orElse(dealer.getRiskScore() != null && dealer.getRiskScore() >= 75.0 ? "CARE_REQUIRED" : "NORMAL"))
                    .riskReasons(churnOpt.map(DealerChurn::getRiskReasons).orElse(null))
                    .action(churnOpt.map(DealerChurn::getAction).orElse(null))
                    .calculatedAt(churnOpt
                            .map(DealerChurn::getCalculatedAt)
                            .map(this::toKoreanTime)
                            .orElse(null))
                    .couponStatus(resolveCouponStatus(couponOpt, couponEligible, now))
                    .couponEligible(couponEligible)
                    .build());
        }

        result.sort((d1, d2) -> {
            Double s1 = d1.getRiskScore() != null ? d1.getRiskScore() : 0.0;
            Double s2 = d2.getRiskScore() != null ? d2.getRiskScore() : 0.0;
            return s2.compareTo(s1);
        });

        return ResponseEntity.ok(ApiResponse.success(result, "전체 딜러 이탈 위험도 목록 조회가 완료되었습니다."));
    }

    private boolean isCouponEligible(Dealer dealer, Optional<Coupon> couponOpt) {
        return "ACTIVE".equalsIgnoreCase(dealer.getStatus())
                && dealer.getRiskScore() != null
                && dealer.getRiskScore() >= CHURN_COUPON_RISK_THRESHOLD
                && couponOpt.isEmpty();
    }

    private String resolveCouponStatus(
            Optional<Coupon> couponOpt,
            boolean couponEligible,
            LocalDateTime now
    ) {
        if (couponOpt.isEmpty()) {
            return couponEligible ? "ELIGIBLE" : "NOT_ELIGIBLE";
        }

        Coupon coupon = couponOpt.get();
        if ("USED".equalsIgnoreCase(coupon.getStatus())) {
            return "USED";
        }
        if ("EXPIRED".equalsIgnoreCase(coupon.getStatus())
                || !coupon.getExpiredAt().isAfter(now)) {
            return "EXPIRED";
        }
        return "UNUSED";
    }

    /**
     * 전체 상사의 최신 이탈 위험도 및 사유/조치 목록을 조회합니다.
     */
    @GetMapping("/churn-companies")
    public ResponseEntity<ApiResponse<List<AdminCompanyChurnResponse>>> getCompanyChurnList() {
        List<Company> companies = companyRepository.findAll();
        List<AdminCompanyChurnResponse> result = new ArrayList<>();

        Map<Long, CompanyChurn> latestChurnByCompanyId = new HashMap<>();
        for (CompanyChurn churn : companyChurnRepository.findAllByOrderByCalculatedAtDesc()) {
            if (churn.getCompany() != null) {
                latestChurnByCompanyId.putIfAbsent(churn.getCompany().getCompanyId(), churn);
            }
        }

        for (Company company : companies) {
            Optional<CompanyChurn> churnOpt = Optional.ofNullable(
                    latestChurnByCompanyId.get(company.getCompanyId())
            );

            result.add(AdminCompanyChurnResponse.builder()
                    .companyId(company.getCompanyId())
                    .companyName(company.getName())
                    .businessNumber(company.getBusinessNumber())
                    .riskScore(company.getRiskScore())
                    .tier(company.getTier())
                    .riskGrade(churnOpt.map(CompanyChurn::getRiskGrade).orElse(company.getRiskScore() != null && company.getRiskScore() >= 70.0 ? "CARE_REQUIRED" : "NORMAL"))
                    .riskReasons(churnOpt.map(CompanyChurn::getRiskReasons).orElse(null))
                    .action(churnOpt.map(CompanyChurn::getAction).orElse(null))
                    .calculatedAt(churnOpt
                            .map(CompanyChurn::getCalculatedAt)
                            .map(this::toKoreanTime)
                            .orElse(null))
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
        OffsetDateTime lastCalculatedAt = latestDealerChurns.isEmpty()
                ? null
                : toKoreanTime(latestDealerChurns.get(0).getCalculatedAt());

        ChurnStatusResponse response = ChurnStatusResponse.builder()
                .status("ACTIVE")
                .lastCalculatedAt(lastCalculatedAt)
                .dealerCount((int) dealerRepository.count())
                .companyCount((int) companyRepository.count())
                .build();

        return ResponseEntity.ok(ApiResponse.success(response, "이탈 예측 뱃치 계산 시각 및 상태 조회가 완료되었습니다."));
    }

    private OffsetDateTime toKoreanTime(LocalDateTime calculatedAt) {
        return calculatedAt
                .atZone(ZoneId.systemDefault())
                .withZoneSameInstant(KOREA_ZONE)
                .toOffsetDateTime();
    }
}
