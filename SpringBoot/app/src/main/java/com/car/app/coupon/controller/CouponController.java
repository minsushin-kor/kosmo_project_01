package com.car.app.coupon.controller;

import com.car.app.coupon.service.CouponService;
import com.car.app.global.response.ApiResponse;
import lombok.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 딜러용 수수료 감면 쿠폰 조회 및 적용을 담당하는 컨트롤러 클래스입니다.
 */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class CouponController {

    private final CouponService couponService;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CouponResponse {
        private Long couponId;
        private String name;
        private String couponType;
        private BigDecimal discountRate;
        private String status;
        private LocalDateTime expiredAt;
    }

    /**
     * 현재 로그인한 딜러가 성사 거래 건에 사용 가능한 미사용 수수료 감면 쿠폰 목록을 조회합니다.
     */
    @GetMapping("/coupons/my-commission-coupons")
    @PreAuthorize("hasRole('DEALER')")
    public ResponseEntity<ApiResponse<List<CouponResponse>>> getMyUnusedCommissionCoupons() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String dealerLoginId = authentication.getName();

            List<CouponResponse> responseList = couponService.getMyUnusedCommissionCoupons(dealerLoginId).stream()
                    .map(c -> CouponResponse.builder()
                            .couponId(c.getCouponId())
                            .name(c.getName())
                            .couponType(c.getCouponType())
                            .discountRate(c.getDiscountRate())
                            .status(c.getStatus())
                            .expiredAt(c.getExpiredAt())
                            .build())
                    .collect(Collectors.toList());

            return ResponseEntity.ok(ApiResponse.success(responseList, "사용 가능한 수수료 감면 쿠폰 목록 조회 완료"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.fail("ERR_INVALID_REQUEST", e.getMessage()));
        }
    }

    /**
     * 딜러 본인의 미사용 수수료 감면 쿠폰 개수를 조회합니다 (상단 헤더/알림 뱃지 1 표시용).
     */
    @GetMapping("/coupons/my-count")
    @PreAuthorize("hasRole('DEALER')")
    public ResponseEntity<ApiResponse<Integer>> getMyUnusedCouponCount() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String dealerLoginId = authentication.getName();
            int count = couponService.getUnusedCouponCount(dealerLoginId);
            return ResponseEntity.ok(ApiResponse.success(count, "미사용 쿠폰 개수 조회가 완료되었습니다."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.fail("ERR_INVALID_REQUEST", e.getMessage()));
        }
    }

    /**
     * 특정 거래 건에 대해 딜러가 보유한 쿠폰을 수동 적용하여 수수료를 감면받습니다.
     */
    @PostMapping("/transactions/{transactionId}/apply-coupon")
    @PreAuthorize("hasRole('DEALER')")
    public ResponseEntity<ApiResponse<Void>> applyCouponToTransaction(
            @PathVariable Long transactionId,
            @RequestParam Long couponId) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String dealerLoginId = authentication.getName();

            couponService.applyCouponToTransaction(transactionId, couponId, dealerLoginId);

            return ResponseEntity.ok(ApiResponse.success(null, "거래 건에 수수료 할인 쿠폰이 성공적으로 적용되었습니다."));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(ApiResponse.fail("ERR_UNAUTHORIZED", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.fail("ERR_INVALID_REQUEST", e.getMessage()));
        }
    }

    /**
     * 경매 낙찰 건에 쿠폰을 사용 처리합니다 (거래 ID 없이 쿠폰만 삭제).
     */
    @PostMapping("/auctions/use-coupon")
    @PreAuthorize("hasRole('DEALER')")
    public ResponseEntity<ApiResponse<Void>> useAuctionCoupon(@RequestParam Long couponId) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String dealerLoginId = authentication.getName();
            couponService.useAuctionCoupon(couponId, dealerLoginId);
            return ResponseEntity.ok(ApiResponse.success(null, "쿠폰이 성공적으로 사용되었습니다."));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(ApiResponse.fail("ERR_UNAUTHORIZED", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.fail("ERR_INVALID_REQUEST", e.getMessage()));
        }
    }

    /**
     * 현재 로그인한 상사가 보유한 전체 쿠폰 목록을 조회합니다.
     */
    @GetMapping("/coupons/my-company-coupons")
    @PreAuthorize("hasRole('COMPANY_MASTER')")
    public ResponseEntity<ApiResponse<List<CouponResponse>>> getMyCompanyCoupons() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String masterLoginId = authentication.getName();

            List<CouponResponse> responseList = couponService.getMyCompanyCoupons(masterLoginId).stream()
                    .map(c -> CouponResponse.builder()
                            .couponId(c.getCouponId())
                            .name(c.getName())
                            .couponType(c.getCouponType())
                            .discountRate(c.getDiscountRate())
                            .status(c.getStatus())
                            .expiredAt(c.getExpiredAt())
                            .build())
                    .collect(Collectors.toList());

            return ResponseEntity.ok(ApiResponse.success(responseList, "상사 보유 쿠폰 목록 조회가 완료되었습니다."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.fail("ERR_INVALID_REQUEST", e.getMessage()));
        }
    }

    /**
     * 특정 딜러에게 수수료 감면 쿠폰을 직접 발급하고 실시간 알림을 보냅니다.
     */
    @PostMapping("/coupons/issue-to-dealer")
    public ResponseEntity<ApiResponse<CouponResponse>> issueCouponToDealer(
            @RequestParam Long dealerId,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) BigDecimal discountRate) {
        try {
            Coupon coupon = couponService.issueCouponToDealer(dealerId, name, discountRate);
            CouponResponse response = CouponResponse.builder()
                    .couponId(coupon.getCouponId())
                    .name(coupon.getName())
                    .couponType(coupon.getCouponType())
                    .discountRate(coupon.getDiscountRate())
                    .status(coupon.getStatus())
                    .expiredAt(coupon.getExpiredAt())
                    .build();
            return ResponseEntity.ok(ApiResponse.success(response, "딜러에게 쿠폰 발급 및 알림 전송이 성공적으로 완료되었습니다."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.fail("ERR_INVALID_REQUEST", e.getMessage()));
        }
    }

    /**
     * 관리자가 이탈 위험 딜러 전체에게 50% 수수료 감면 쿠폰을 수동으로 일괄 발급하고 알림을 발송합니다.
     */
    @PostMapping("/coupons/issue-risk-coupons")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<CouponService.RiskCouponIssueResult>> issueRiskCouponsManually() {
        try {
            CouponService.RiskCouponIssueResult result = couponService.issueRiskCouponsManually();
            return ResponseEntity.ok(ApiResponse.success(result, "이탈 위험 딜러 수수료 50% 쿠폰 수동 일괄 발송 및 알림 전송이 완료되었습니다."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.fail("ERR_INVALID_REQUEST", e.getMessage()));
        }
    }

    /**
     * 관리자가 특정 이탈 위험 딜러에게 수수료 50% 감면 쿠폰을 수동으로 발급하고 알림을 발송합니다.
     */
    @PostMapping("/coupons/issue-risk-coupon/dealer/{dealerId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<CouponResponse>> issueRiskCouponToDealer(@PathVariable Long dealerId) {
        try {
            Coupon coupon = couponService.issueRiskCouponToDealer(dealerId);
            CouponResponse response = CouponResponse.builder()
                    .couponId(coupon.getCouponId())
                    .name(coupon.getName())
                    .couponType(coupon.getCouponType())
                    .discountRate(coupon.getDiscountRate())
                    .status(coupon.getStatus())
                    .expiredAt(coupon.getExpiredAt())
                    .build();
            return ResponseEntity.ok(ApiResponse.success(response, "해당 딜러에게 이탈 방지 수수료 50% 쿠폰 발급 및 알림 전송이 완료되었습니다."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.fail("ERR_INVALID_REQUEST", e.getMessage()));
        }
    }
}
