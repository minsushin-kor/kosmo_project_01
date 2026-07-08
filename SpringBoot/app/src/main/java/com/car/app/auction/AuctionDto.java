package com.car.app.auction;

import lombok.*;

import java.time.LocalDateTime;

public class AuctionDto {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class BidRequest {
        private Long bidAmount;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class BidResponse {
        private Long bidId;
        private Long auctionId;
        private Long dealerId;
        private String dealerName;
        private Long bidAmount;
        private LocalDateTime createdAt;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CloseResponse {
        private Long auctionId;
        private String status;
        private LocalDateTime endTime;
        private BidResponse winningBid;
    }
}
