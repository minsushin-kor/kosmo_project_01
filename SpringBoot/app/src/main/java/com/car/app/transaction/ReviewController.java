package com.car.app.transaction;

import com.car.app.security.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    /**
     * 거래 완료 후 딜러에 대한 리뷰 및 평점을 등록합니다. (일반 회원만 작성 가능)
     */
    @PostMapping("/{transactionId}/reviews")
    @PreAuthorize("hasRole('MEMBER')")
    public ResponseEntity<ApiResponse<ReviewDto.Response>> createReview(
            @PathVariable Long transactionId,
            @RequestBody ReviewDto.Request request) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String writerEmail = authentication.getName();

            Review review = reviewService.createReview(transactionId, writerEmail, request);

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
}
