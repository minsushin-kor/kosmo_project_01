package com.car.app.coupon.controller;

import com.car.app.coupon.service.CouponService;
import com.car.app.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 관리자가 이탈 위험 딜러에게 쿠폰을 수동 지급하는 API입니다.
 */
@RestController
@RequestMapping("/api/admin/coupons")
@RequiredArgsConstructor
public class AdminCouponController {

    private final CouponService couponService;

    @PostMapping("/churn-risk/batch")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<CouponService.RiskCouponIssueResult>> issueChurnRiskCoupons() {
        CouponService.RiskCouponIssueResult result = couponService.issueRiskCouponsManually();
        return ResponseEntity.ok(ApiResponse.success(result, "이탈 위험 딜러 쿠폰 수동 지급이 완료되었습니다."));
    }
}
