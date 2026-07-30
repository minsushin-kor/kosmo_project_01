package com.car.app.coupon.service;

import com.car.app.coupon.entity.Coupon;
import com.car.app.coupon.repository.CouponRepository;
import com.car.app.dealer.entity.Dealer;
import com.car.app.dealer.repository.DealerRepository;
import com.car.app.transaction.entity.Transaction;
import com.car.app.transaction.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.car.app.company.entity.Company;
import com.car.app.company.repository.CompanyRepository;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import com.car.app.notification.service.NotificationService;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CouponService {

    private static final String CHURN_COUPON_TYPE = "COMMISSION_DISCOUNT";
    private static final double CHURN_COUPON_RISK_THRESHOLD = 70.0;
    private static final double COMPANY_CARE_RISK_THRESHOLD = 70.0;

    private final CouponRepository couponRepository;
    private final DealerRepository dealerRepository;
    private final TransactionRepository transactionRepository;
    private final CompanyRepository companyRepository;
    private final NotificationService notificationService;

    @Getter
    @Builder
    public static class RiskCouponIssueResult {
        private int riskTargetCount;
        private int issuedCount;
        private int skippedUnusedCount;
        private int skippedUsedCount;
        private int skippedExpiredOrOtherCount;
        private int skippedInactiveCount;
    }

    /**
     * 관리자가 요청한 경우에만 이탈위험 점수가 70점 이상인 활성 딜러에게
     * 50% 수수료 감면 쿠폰을 발급합니다.
     * 동일한 쿠폰을 한 번이라도 발급받은 딜러는 상태와 관계없이 재발급하지 않습니다.
     */
    @Transactional
    public synchronized RiskCouponIssueResult issueRiskCouponsManually() {
        List<Dealer> dealers = dealerRepository.findAll();
        List<Coupon> couponsToIssue = new ArrayList<>();
        LocalDateTime issuedAt = LocalDateTime.now();

        int riskTargetCount = 0;
        int skippedUnusedCount = 0;
        int skippedUsedCount = 0;
        int skippedExpiredOrOtherCount = 0;
        int skippedInactiveCount = 0;

        for (Dealer dealer : dealers) {
            if (dealer.getRiskScore() == null || dealer.getRiskScore() < CHURN_COUPON_RISK_THRESHOLD) {
                continue;
            }

            riskTargetCount++;

            if (!"ACTIVE".equalsIgnoreCase(dealer.getStatus())) {
                skippedInactiveCount++;
                continue;
            }

            Optional<Coupon> previousCoupon = couponRepository
                    .findFirstByDealerDealerIdAndCouponTypeOrderByIssuedAtDesc(
                            dealer.getDealerId(),
                            CHURN_COUPON_TYPE
                    );

            if (previousCoupon.isPresent()) {
                Coupon prev = previousCoupon.get();
                // 30일 이내에 이미 발급받은 이력이 있는 경우 (USED, UNUSED 불문) 재발급 방지
                if (prev.getIssuedAt() != null && prev.getIssuedAt().isAfter(issuedAt.minusDays(30))) {
                    if ("USED".equalsIgnoreCase(prev.getStatus())) {
                        skippedUsedCount++;
                    } else if ("UNUSED".equalsIgnoreCase(prev.getStatus())) {
                        skippedUnusedCount++;
                    } else {
                        skippedExpiredOrOtherCount++;
                    }
                    continue;
                }
            }

            couponsToIssue.add(Coupon.builder()
                    .name("이탈 방지 딜러 수수료 50% 감면 쿠폰")
                    .couponType(CHURN_COUPON_TYPE)
                    .discountRate(new BigDecimal("0.5000"))
                    .dealer(dealer)
                    .status("UNUSED")
                    .issuedAt(issuedAt)
                    .expiredAt(issuedAt.plusDays(30))
                    .build());
        }

        if (!couponsToIssue.isEmpty()) {
            List<Coupon> savedCoupons = couponRepository.saveAll(couponsToIssue);
            for (Coupon coupon : savedCoupons) {
                if (coupon.getDealer() != null) {
                    String alertMessage = String.format("🎁 [%s]이 발급되었습니다! 경매 낙찰 시 수수료 할인 혜택을 받아보세요.", coupon.getName());
                    notificationService.sendNotification(
                            "DEALER",
                            coupon.getDealer().getDealerId(),
                            "COUPON_ISSUED",
                            alertMessage,
                            coupon.getCouponId()
                    );
                }
            }
        }

        return RiskCouponIssueResult.builder()
                .riskTargetCount(riskTargetCount)
                .issuedCount(couponsToIssue.size())
                .skippedUnusedCount(skippedUnusedCount)
                .skippedUsedCount(skippedUsedCount)
                .skippedExpiredOrOtherCount(skippedExpiredOrOtherCount)
                .skippedInactiveCount(skippedInactiveCount)
                .build();
    }

    /**
     * 딜러 본인의 미사용 수수료 감면 쿠폰 개수를 조회합니다. (헤더 뱃지 1 표시용)
     */
    @Transactional(readOnly = true)
    public int getUnusedCouponCount(String dealerLoginId) {
        Dealer dealer = dealerRepository.findByLoginId(dealerLoginId).orElse(null);
        if (dealer == null) return 0;
        return couponRepository.findByDealerDealerIdAndCouponTypeAndStatus(
                dealer.getDealerId(), "COMMISSION_DISCOUNT", "UNUSED"
        ).size();
    }

    /**
     * 특정 딜러가 본인 성사 거래 건에 대해 보유한 수수료 할인 쿠폰을 수동 적용합니다.
     *
     * @param transactionId 거래 ID
     * @param couponId      딜러가 소유한 쿠폰 ID
     * @param dealerLoginId 요청을 보내는 딜러의 로그인 ID
     */
    @Transactional
    public void applyCouponToTransaction(Long transactionId, Long couponId, String dealerLoginId) {
        Transaction transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 거래 내역입니다."));

        Dealer dealer = dealerRepository.findByLoginId(dealerLoginId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 딜러 계정입니다."));

        Coupon coupon = couponRepository.findById(couponId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 쿠폰입니다."));

        // 1. 거래 권한 검증: 이 거래에 딜러 본인이 구매자 또는 판매자로 관여되어 있어야 함
        boolean isBuyer = "DEALER".equalsIgnoreCase(transaction.getBuyerType()) && transaction.getBuyerId().equals(dealer.getDealerId());
        boolean isSeller = "DEALER".equalsIgnoreCase(transaction.getSellerType()) && transaction.getSellerId().equals(dealer.getDealerId());

        if (!isBuyer && !isSeller) {
            throw new SecurityException("본인이 참여한 거래 건에 대해서만 쿠폰을 적용할 수 있습니다.");
        }

        // 2. 거래 중복 적용 여부 검증: 해당 거래에 이미 연계된 쿠폰이 있는지 확인
        if (couponRepository.existsByUsedTransactionTransactionId(transactionId)) {
            throw new IllegalArgumentException("이미 해당 거래 건에 쿠폰이 적용되어 있습니다.");
        }

        // 3. 쿠폰 유효성 검증 (소유자 일치, 타입 일치, 미사용 상태, 유효기간 미과)
        if (coupon.getDealer() == null || !coupon.getDealer().getDealerId().equals(dealer.getDealerId())) {
            throw new IllegalArgumentException("본인이 보유한 쿠폰만 사용할 수 있습니다.");
        }

        if (!"COMMISSION_DISCOUNT".equalsIgnoreCase(coupon.getCouponType())) {
            throw new IllegalArgumentException("수수료 감면 전용 쿠폰만 적용 가능합니다.");
        }

        if (!"UNUSED".equalsIgnoreCase(coupon.getStatus())) {
            throw new IllegalArgumentException("이미 사용 완료되었거나 사용할 수 없는 쿠폰입니다.");
        }

        if (coupon.getExpiredAt().isBefore(LocalDateTime.now())) {
            coupon.setStatus("EXPIRED");
            couponRepository.save(coupon);
            throw new IllegalArgumentException("만료 기한이 경과한 쿠폰입니다.");
        }

        // 4. 수수료 조정 및 거래 데이터 수정 (50% 감면)
        BigDecimal baseRate = new BigDecimal("0.0300"); // 기본 3.0%
        BigDecimal discount = coupon.getDiscountRate(); // e.g. 0.5000 (50%)
        BigDecimal newRate = baseRate.multiply(BigDecimal.ONE.subtract(discount)); // 0.0015 (0.15%)

        long dealPrice = transaction.getDealPrice();
        long newCommissionAmount = (long) (dealPrice * newRate.doubleValue());

        transaction.setCommissionRate(newRate);
        transaction.setCommissionAmount(newCommissionAmount);
        transactionRepository.save(transaction);

        // 5. 쿠폰 사용 완료 처리 및 거래 정보 연동
        coupon.setStatus("USED");
        coupon.setUsedTransaction(transaction);
        couponRepository.save(coupon);
    }

    /**
     * 딜러 본인의 사용 가능한 수수료 감면 쿠폰 목록을 조회합니다.
     */
    @Transactional(readOnly = true)
    public List<Coupon> getMyUnusedCommissionCoupons(String dealerLoginId) {
        Dealer dealer = dealerRepository.findByLoginId(dealerLoginId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 딜러 계정입니다."));
        return couponRepository.findByDealerDealerIdAndCouponTypeAndStatusAndExpiredAtAfter(
                dealer.getDealerId(),
                CHURN_COUPON_TYPE,
                "UNUSED",
                LocalDateTime.now()
        );
    }

    /**
     * 경매 낙찰 건에 대해 딜러가 보유한 쿠폰을 사용 처리합니다.
     * 거래(Transaction) 없이 쿠폰만 USED 처리합니다.
     *
     * @param couponId      사용할 쿠폰 ID
     * @param dealerLoginId 요청 딜러 로그인 ID
     */
    @Transactional
    public void useAuctionCoupon(Long couponId, String dealerLoginId) {
        Dealer dealer = dealerRepository.findByLoginId(dealerLoginId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 딜러 계정입니다."));

        Coupon coupon = couponRepository.findById(couponId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 쿠폰입니다."));

        if (coupon.getDealer() == null || !coupon.getDealer().getDealerId().equals(dealer.getDealerId())) {
            throw new IllegalArgumentException("본인이 보유한 쿠폰만 사용할 수 있습니다.");
        }

        if (!"COMMISSION_DISCOUNT".equalsIgnoreCase(coupon.getCouponType())) {
            throw new IllegalArgumentException("수수료 감면 전용 쿠폰만 사용 가능합니다.");
        }

        if (!"UNUSED".equalsIgnoreCase(coupon.getStatus())) {
            throw new IllegalArgumentException("이미 사용 완료되었거나 사용할 수 없는 쿠폰입니다.");
        }

        if (coupon.getExpiredAt().isBefore(LocalDateTime.now())) {
            coupon.setStatus("EXPIRED");
            couponRepository.save(coupon);
            throw new IllegalArgumentException("만료 기한이 경과한 쿠폰입니다.");
        }

        // 쿠폰 사용 완료 처리 (삭제하지 않고 USED 상태로 변경 및 저장)
        coupon.setStatus("USED");
        couponRepository.save(coupon);
    }

    /**
     * FastAPI가 계산해 companies.risk_score에 저장한 이탈 확률을 기준으로
     * 이탈 위험이 가장 낮은 상위 5% 회사를 선정해 골든 뱃지를 갱신합니다.
     */
    @Transactional
    public void updateCompanyTiersAndBadges() {
        List<Company> companies = companyRepository.findAll();
        if (companies.isEmpty()) {
            return;
        }

        List<Company> rankedCompanies = companies.stream()
                .filter(this::hasFastApiChurnPrediction)
                .sorted(Comparator
                        .comparingDouble(Company::getRiskScore)
                        .thenComparing(Company::getCompanyId))
                .toList();

        if (rankedCompanies.isEmpty()) {
            return;
        }

        // FastAPI 예측이 완료된 회사 중 이탈 위험이 낮은 상위 5%를 선정합니다.
        int topCount = Math.max(1, (int) Math.ceil(rankedCompanies.size() * 0.05));
        Set<Long> topCompanyIds = new HashSet<>();
        for (int i = 0; i < topCount; i++) {
            topCompanyIds.add(rankedCompanies.get(i).getCompanyId());
        }

        for (Company company : companies) {
            boolean previousBadge = Boolean.TRUE.equals(company.getGoldenBadgeStatus());
            boolean isTopCompany = topCompanyIds.contains(company.getCompanyId());

            if (isTopCompany) {
                // 이탈 위험이 낮은 상위 5% 회사로 지정
                company.setTier("TOP_5");
                company.setGoldenBadgeStatus(true);

                // 골든 뱃지 신규 획득 알림 전송 🏆
                if (!previousBadge) {
                    String badgeMsg = String.format("🏆 축하합니다! [%s]이(가) AI 이탈 안정도 상위 5%% 회사로 선정되어 [골든 뱃지]가 부여되었습니다.", company.getName());
                    notificationService.sendNotification("COMPANY_MASTER", company.getCompanyId(), "GOLDEN_BADGE_AWARDED", badgeMsg, company.getCompanyId());
                }

                // 멤버십 20% 할인 쿠폰 자동 발급 (중복 발급 방지: 이미 UNUSED 상태의 MEMBERSHIP_DISCOUNT 쿠폰이 있는지 검사)
                boolean hasUnusedCoupon = couponRepository.existsByCompanyCompanyIdAndCouponTypeAndStatus(
                        company.getCompanyId(), "MEMBERSHIP_DISCOUNT", "UNUSED"
                );
                if (!hasUnusedCoupon) {
                    Coupon coupon = Coupon.builder()
                            .name("AI 이탈 안정도 상위 5% 멤버십 가입 20% 할인 쿠폰")
                            .couponType("MEMBERSHIP_DISCOUNT")
                            .discountRate(new BigDecimal("0.2000")) // 20% 할인
                            .company(company)
                            .status("UNUSED")
                            .issuedAt(LocalDateTime.now())
                            .expiredAt(LocalDateTime.now().plusDays(90)) // 90일 유효
                            .build();
                    Coupon savedCoupon = couponRepository.save(coupon);
                    String alertMessage = String.format("🏆 AI 이탈 안정도 상위 5%% 회사 선정! [%s]이 발급되었습니다.", savedCoupon.getName());
                    notificationService.sendNotification(
                            "COMPANY_MASTER",
                            company.getCompanyId(),
                            "COUPON_ISSUED",
                            alertMessage,
                            savedCoupon.getCouponId()
                    );
                }
            } else {
                // 상위 5% 외 상사들 강등 및 골든 뱃지 박탈
                if ("TOP_5".equals(company.getTier())) {
                    boolean careRequired = company.getRiskScore() != null
                            && company.getRiskScore() >= COMPANY_CARE_RISK_THRESHOLD;
                    company.setTier(careRequired ? "CARE_REQUIRED" : "NORMAL");
                }
                company.setGoldenBadgeStatus(false);

                // 골든 뱃지 탈락 알림 전송 📢
                if (previousBadge) {
                    String revokeMsg = String.format("📢 [%s]이(가) AI 이탈 안정도 상위 5%%에서 제외되어 [골든 뱃지]가 해제되었습니다.", company.getName());
                    notificationService.sendNotification("COMPANY_MASTER", company.getCompanyId(), "GOLDEN_BADGE_REVOKED", revokeMsg, company.getCompanyId());
                }
            }
            companyRepository.save(company);
        }
    }

    private boolean hasFastApiChurnPrediction(Company company) {
        Double riskScore = company.getRiskScore();
        return riskScore != null
                && Double.isFinite(riskScore)
                && riskScore >= 0.0
                && riskScore <= 100.0
                && company.getRiskGrade() != null
                && !company.getRiskGrade().isBlank();
    }

    @Transactional(readOnly = true)
    public List<Coupon> getMyCompanyCoupons(String masterLoginId) {
        Company company = companyRepository.findByLoginId(masterLoginId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 회사 계정입니다."));
        return couponRepository.findByCompanyCompanyId(company.getCompanyId());
    }

    /**
     * 특정 딜러에게 수수료 감면 쿠폰을 발급하고 즉시 알림을 전송합니다.
     */
    @Transactional
    public Coupon issueCouponToDealer(Long dealerId, String couponName, BigDecimal discountRate) {
        Dealer dealer = dealerRepository.findById(dealerId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 딜러입니다."));

        // 최근 30일 이내 수수료 감면 쿠폰 발급 이력이 있는지 검사
        Optional<Coupon> recent = couponRepository.findFirstByDealerDealerIdAndCouponTypeOrderByIssuedAtDesc(
                dealerId, CHURN_COUPON_TYPE);
        if (recent.isPresent() && recent.get().getIssuedAt() != null
                && recent.get().getIssuedAt().isAfter(LocalDateTime.now().minusDays(30))) {
            throw new IllegalArgumentException("해당 딜러에게는 최근 30일 이내에 이미 수수료 감면 쿠폰이 발급된 기록이 있습니다.");
        }

        Coupon coupon = Coupon.builder()
                .name(couponName != null ? couponName : "낙찰 수수료 50% 감면 쿠폰")
                .couponType(CHURN_COUPON_TYPE)
                .discountRate(discountRate != null ? discountRate : new BigDecimal("0.5000"))
                .dealer(dealer)
                .status("UNUSED")
                .issuedAt(LocalDateTime.now())
                .expiredAt(LocalDateTime.now().plusDays(30))
                .build();

        Coupon saved = couponRepository.save(coupon);

        // 딜러에게 즉시 알림 🔔 발송
        String alertMessage = String.format("🎁 [%s]이 발급되었습니다! 경매 낙찰 시 수수료 할인 혜택을 받아보세요.", saved.getName());
        notificationService.sendNotification(
                "DEALER",
                dealer.getDealerId(),
                "COUPON_ISSUED",
                alertMessage,
                saved.getCouponId()
        );

        return saved;
    }

    /**
     * 관리자가 특정 이탈위험 딜러 1명을 지정하여 수수료 50% 감면 쿠폰을 수동으로 발급하고 알림을 보냅니다.
     */
    @Transactional
    public Coupon issueRiskCouponToDealer(Long dealerId) {
        Dealer dealer = dealerRepository.findById(dealerId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 딜러 계정입니다."));

        // 최근 30일 이내 수수료 감면 쿠폰 발급 이력이 있는지 검사
        Optional<Coupon> recent = couponRepository.findFirstByDealerDealerIdAndCouponTypeOrderByIssuedAtDesc(
                dealerId, CHURN_COUPON_TYPE);
        if (recent.isPresent() && recent.get().getIssuedAt() != null
                && recent.get().getIssuedAt().isAfter(LocalDateTime.now().minusDays(30))) {
            throw new IllegalArgumentException("해당 딜러에게는 최근 30일 이내에 이미 수수료 감면 쿠폰이 발급된 기록이 있습니다.");
        }

        Coupon coupon = Coupon.builder()
                .name("이탈 방지 딜러 수수료 50% 감면 쿠폰")
                .couponType(CHURN_COUPON_TYPE)
                .discountRate(new BigDecimal("0.5000"))
                .dealer(dealer)
                .status("UNUSED")
                .issuedAt(LocalDateTime.now())
                .expiredAt(LocalDateTime.now().plusDays(30))
                .build();

        Coupon saved = couponRepository.save(coupon);

        String alertMessage = "🎁 [이탈 방지 딜러 수수료 50% 감면 쿠폰]이 발급되었습니다! 경매 낙찰 시 수수료 할인 혜택을 받아보세요.";
        notificationService.sendNotification(
                "DEALER",
                dealer.getDealerId(),
                "COUPON_ISSUED",
                alertMessage,
                saved.getCouponId()
        );

        return saved;
    }
}
