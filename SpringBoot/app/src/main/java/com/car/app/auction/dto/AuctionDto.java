package com.car.app.auction.dto;

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
    public static class DealerBidResponse {
        private Long bidId;
        private Long auctionId;
        private Long carId;
        private String carName;
        private Long bidAmount;
        private LocalDateTime bidCreatedAt;
        private String auctionStatus;
        private LocalDateTime auctionStartTime;
        private LocalDateTime auctionEndTime;
        private Boolean winner;
        private Long winningBidAmount;
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