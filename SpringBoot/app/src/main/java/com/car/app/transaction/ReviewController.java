package com.car.app.transaction;

import com.car.app.security.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;
    private final ReviewRepository reviewRepository;

    /**
     * 거래 완료 후 딜러에 대한 리뷰 및 평점을 등록합니다. (일반 회원만 작성 가능)
     */
    @PostMapping("/api/transactions/{transactionId}/reviews")
    @PreAuthorize("hasRole('MEMBER')")
    public ResponseEntity<ApiResponse<ReviewDto.Response>> createReview(
            @PathVariable Long transactionId,
            @RequestBody ReviewDto.Request request) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String writerLoginId = authentication.getName();

            Review review = reviewService.createReview(transactionId, writerLoginId, request);

            ReviewDto.Response response = ReviewDto.Response.builder()
                    .reviewId(review.getReviewId())
                    .transactionId(review.getTransaction().getTransactionId())
                    .rating(review.getRating())
                    .content(review.getContent())
                    .createdAt(review.getCreatedAt())
                    .build();

            return ResponseEntity.ok(ApiResponse.success(response, "거래 리뷰가 성공적으로 등록되었습니다."));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(ApiResponse.fail("ERR_UNAUTHORIZED", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.fail("ERR_INVALID_REQUEST", e.getMessage()));
        }
    }

    /**
     * 거래 단건의 리뷰 상세 조회 (DTO 반환)
     */
    @GetMapping("/api/transactions/{transactionId}/review")
    public ResponseEntity<ApiResponse<ReviewDto.Response>> getTransactionReview(@PathVariable Long transactionId) {
        Review review = reviewRepository.findByTransactionTransactionId(transactionId).orElse(null);
        if (review == null) {
            return ResponseEntity.ok(ApiResponse.success(null, "작성된 리뷰가 없습니다."));
        }
        ReviewDto.Response response = ReviewDto.Response.builder()
                .reviewId(review.getReviewId())
                .transactionId(review.getTransaction().getTransactionId())
                .rating(review.getRating())
                .content(review.getContent())
                .createdAt(review.getCreatedAt())
                .build();
        return ResponseEntity.ok(ApiResponse.success(response, "거래 리뷰 조회가 완료되었습니다."));
    }

    /**
     * 특정 딜러가 작성받은 전체 리뷰 목록 조회 (올바른 /api/dealers/{dealerId}/reviews URL 및 경매 낙찰 딜러 포함)
     */
    @GetMapping("/api/dealers/{dealerId}/reviews")
    public ResponseEntity<ApiResponse<List<ReviewDto.Response>>> getDealerReviews(@PathVariable Long dealerId) {
        List<ReviewDto.Response> responses = reviewRepository.findAllReviewsForDealer(dealerId).stream()
                .map(r -> ReviewDto.Response.builder()
                        .reviewId(r.getReviewId())
                        .transactionId(r.getTransaction().getTransactionId())
                        .rating(r.getRating())
                        .content(r.getContent())
                        .createdAt(r.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(responses, "딜러 리뷰 목록 조회가 완료되었습니다."));
    }
}
