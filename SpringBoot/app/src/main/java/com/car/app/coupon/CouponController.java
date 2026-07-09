package com.car.app.coupon;

import com.car.app.security.ApiResponse;
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
}
