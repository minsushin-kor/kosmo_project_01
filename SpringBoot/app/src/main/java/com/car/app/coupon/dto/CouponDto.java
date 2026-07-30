package com.car.app.coupon.dto;

import com.car.app.coupon.entity.Coupon;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class CouponDto {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Response {
        private Long couponId;
        private String name;
        private String couponType;
        private BigDecimal discountRate;
        private String status;
        private LocalDateTime issuedAt;
        private LocalDateTime expiredAt;

        public static Response fromEntity(Coupon coupon) {
            if (coupon == null) return null;
            return Response.builder()
                    .couponId(coupon.getCouponId())
                    .name(coupon.getName())
                    .couponType(coupon.getCouponType())
                    .discountRate(coupon.getDiscountRate())
                    .status(coupon.getStatus())
                    .issuedAt(coupon.getIssuedAt())
                    .expiredAt(coupon.getExpiredAt())
                    .build();
        }
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ApplyRequest {
        private Long transactionId;
        private Long couponId;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UnusedCountResponse {
        private int unusedCount;
    }
}
