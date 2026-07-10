package com.car.app.coupon;

import com.car.app.dealer.Dealer;
import com.car.app.dealer.DealerRepository;
import com.car.app.transaction.Transaction;
import com.car.app.transaction.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.car.app.company.CompanyRepository;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CouponService {

    private final CouponRepository couponRepository;
    private final DealerRepository dealerRepository;
    private final TransactionRepository transactionRepository;
    private final CompanyRepository companyRepository;

    /**
     * 이탈위험 점수가 75점 이상인 활성 딜러에게 50% 수수료 감면 쿠폰을 자동 발행합니다.
     * 중복 발급 방지: 이미 미사용 상태의 COMMISSION_DISCOUNT 쿠폰을 가진 딜러는 제외합니다.
     */
    @Transactional
    public void issueRiskCoupons() {
        List<Dealer> activeDealers = dealerRepository.findAll(); // 이탈점수가 존재하므로 전체 조회 후 필터링
        for (Dealer dealer : activeDealers) {
            if ("ACTIVE".equalsIgnoreCase(dealer.getStatus()) && dealer.getRiskScore() != null && dealer.getRiskScore() >= 75.0) {
                // 1. 중복 발행 방지: 이미 미사용 상태의 감면 쿠폰을 소유하고 있다면 패스
                boolean hasUnusedCoupon = couponRepository.existsByDealerDealerIdAndCouponTypeAndStatus(
                        dealer.getDealerId(), "COMMISSION_DISCOUNT", "UNUSED"
                );
                if (hasUnusedCoupon) {
                    continue;
                }

                // 2. 1달(30일) 재발급 기한 제약: 최근 30일 이내에 동일한 타입의 쿠폰을 이미 발급받았었다면 패스
                Optional<Coupon> latestCouponOpt = couponRepository.findFirstByDealerDealerIdAndCouponTypeOrderByIssuedAtDesc(
                        dealer.getDealerId(), "COMMISSION_DISCOUNT"
                );
                if (latestCouponOpt.isPresent()) {
                    Coupon latest = latestCouponOpt.get();
                    if (latest.getIssuedAt().isAfter(LocalDateTime.now().minusDays(30))) {
                        continue;
                    }
                }

                // 3. 신규 50% 감면 쿠폰 발행
                Coupon coupon = Coupon.builder()
                        .name("이탈 방지 딜러 수수료 50% 감면 쿠폰")
                        .couponType("COMMISSION_DISCOUNT")
                        .discountRate(new BigDecimal("0.5000")) // 50% 감면
                        .dealer(dealer)
                        .status("UNUSED")
                        .issuedAt(LocalDateTime.now())
                        .expiredAt(LocalDateTime.now().plusDays(30)) // 30일 유효
                        .build();
                couponRepository.save(coupon);
            }
        }
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
        BigDecimal baseRate = new BigDecimal("0.0030"); // 기본 0.3%
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
        return couponRepository.findByDealerDealerIdAndCouponTypeAndStatus(
                dealer.getDealerId(), "COMMISSION_DISCOUNT", "UNUSED"
        );
    }

    /**
     * 상위 5% 최우수 상사를 실적(소속 딜러들의 거래 건수) 기준 정렬하여 식별하고
     * 골든 뱃지 상태를 갱신하며 멤버십 가입 할인 쿠폰을 자동 발급합니다.
     */
    @Transactional
    public void updateCompanyTiersAndBadges() {
        List<com.car.app.company.Company> companies = companyRepository.findAll();
        if (companies.isEmpty()) {
            return;
        }

        // 1. 각 상사의 소속 딜러 실적(성사 거래 건수)을 취합합니다.
        class CompanyScore implements Comparable<CompanyScore> {
            com.car.app.company.Company company;
            int score;

            CompanyScore(com.car.app.company.Company company, int score) {
                this.company = company;
                this.score = score;
            }

            @Override
            public int compareTo(CompanyScore o) {
                return Integer.compare(o.score, this.score); // 성적 내림차순 정렬
            }
        }

        List<CompanyScore> scores = new java.util.ArrayList<>();
        for (com.car.app.company.Company company : companies) {
            List<Dealer> dealers = dealerRepository.findByCompanyCompanyId(company.getCompanyId());
            int totalDeals = 0;
            for (Dealer dealer : dealers) {
                totalDeals += transactionRepository.findBySellerTypeAndSellerId("DEALER", dealer.getDealerId()).size();
                totalDeals += transactionRepository.findByBuyerTypeAndBuyerId("DEALER", dealer.getDealerId()).size();
            }
            scores.add(new CompanyScore(company, totalDeals));
        }

        java.util.Collections.sort(scores);

        // 상위 5% 상사 개수 결정 (최소 1개 상사 보장)
        int topCount = (int) Math.ceil(companies.size() * 0.05);

        for (int i = 0; i < scores.size(); i++) {
            com.car.app.company.Company company = scores.get(i).company;
            if (i < topCount) {
                // 상위 5% 상사 지정
                company.setTier("TOP_5");
                company.setGoldenBadgeStatus(true);

                // 멤버십 20% 할인 쿠폰 자동 발급 (중복 발급 방지: 이미 UNUSED 상태의 MEMBERSHIP_DISCOUNT 쿠폰이 있는지 검사)
                boolean hasUnusedCoupon = couponRepository.existsByCompanyCompanyIdAndCouponTypeAndStatus(
                        company.getCompanyId(), "MEMBERSHIP_DISCOUNT", "UNUSED"
                );
                if (!hasUnusedCoupon) {
                    Coupon coupon = Coupon.builder()
                            .name("최우수 상사 5% 멤버십 가입 20% 할인 쿠폰")
                            .couponType("MEMBERSHIP_DISCOUNT")
                            .discountRate(new BigDecimal("0.2000")) // 20% 할인
                            .company(company)
                            .status("UNUSED")
                            .issuedAt(LocalDateTime.now())
                            .expiredAt(LocalDateTime.now().plusDays(90)) // 90일 유효
                            .build();
                    couponRepository.save(coupon);
                }
            } else {
                // 상위 5% 외 상사들 강등 및 골든 뱃지 박탈
                company.setTier("NORMAL");
                company.setGoldenBadgeStatus(false);
            }
            companyRepository.save(company);
        }
    }
}
