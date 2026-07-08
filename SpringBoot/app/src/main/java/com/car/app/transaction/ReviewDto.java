package com.car.app.transaction;

import lombok.*;

import java.time.LocalDateTime;

public class ReviewDto {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Request {
        private Integer rating; // 1 ~ 5 별점
        private String content;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Response {
        private Long reviewId;
        private Long transactionId;
        private Integer rating;
        private String content;
        private LocalDateTime createdAt;
    }
}
