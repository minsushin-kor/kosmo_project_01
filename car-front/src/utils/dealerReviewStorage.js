const DEALER_REVIEW_KEY = "car_front_dealer_reviews";

export function getDealerReviews() {
  try {
    return JSON.parse(localStorage.getItem(DEALER_REVIEW_KEY) || "[]");
  } catch {
    return [];
  }
}

export function getReviewsByDealerId(dealerId) {
  return getDealerReviews()
    .filter((review) => Number(review.dealerId) === Number(dealerId))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function saveDealerReview(review) {
  const reviews = getDealerReviews();
  const duplicated = reviews.some(
    (item) =>
      String(item.tradeId) === String(review.tradeId) &&
      Number(item.memberId) === Number(review.memberId)
  );

  if (duplicated) {
    throw new Error("이미 리뷰를 작성한 거래입니다.");
  }

  const nextReviews = [review, ...reviews];
  localStorage.setItem(DEALER_REVIEW_KEY, JSON.stringify(nextReviews));
  window.dispatchEvent(new Event("dealer-review-change"));
  return nextReviews;
}
