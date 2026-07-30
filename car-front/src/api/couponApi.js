import apiClient from "./apiClient";

// 딜러 보유 수수료 감면 쿠폰 목록 조회
export function getMyCommissionCoupons() {
  return apiClient.get("/coupons/my-commission-coupons");
}

// 딜러 미사용 쿠폰 개수 조회 (헤더/알림 뱃지 1 표시용)
export function getUnusedCouponCount() {
  return apiClient.get("/coupons/my-count");
}

// 거래 건에 50% 수수료 할인 쿠폰 적용 (1회용 사용 처리)
export function applyCouponToTransaction(transactionId, couponId) {
  return apiClient.post(`/transactions/${transactionId}/apply-coupon?couponId=${couponId}`);
}

// 상사 보유 쿠폰 목록 조회
export function getMyCompanyCoupons() {
  return apiClient.get("/coupons/my-company-coupons");
}
