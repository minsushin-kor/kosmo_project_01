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

// 경매 낙찰 건에 쿠폰 사용 처리 (쿠폰 삭제)
export function useAuctionCoupon(couponId) {
  return apiClient.post(`/auctions/use-coupon?couponId=${couponId}`);
}

// 관리자: 이탈 위험 딜러 전체에게 수수료 50% 감면 쿠폰 수동 일괄 발송
export function issueRiskCouponsManually() {
  return apiClient.post("/coupons/issue-risk-coupons");
}

// 관리자: 특정 이탈 위험 딜러 1명에게 수수료 50% 감면 쿠폰 수동 발송
export function issueRiskCouponToDealer(dealerId) {
  return apiClient.post(`/coupons/issue-risk-coupon/dealer/${dealerId}`);
}

// 관리자: 특정 딜러에게 수수료 감면 쿠폰 직접 지급
export function issueCouponToDealer(dealerId, name, discountRate) {
  const params = new URLSearchParams();
  params.append("dealerId", dealerId);
  if (name) params.append("name", name);
  if (discountRate) params.append("discountRate", discountRate);
  return apiClient.post(`/coupons/issue-to-dealer?${params.toString()}`);
}
