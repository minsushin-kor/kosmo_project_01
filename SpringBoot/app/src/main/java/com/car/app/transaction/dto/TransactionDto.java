package com.car.app.transaction.dto;

import com.car.app.transaction.entity.Transaction;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class TransactionDto {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Response {
        private Long transactionId;
        private Long carId;
        private String carMake;
        private String carModel;
        private String carImageUrl;
        private String buyerType;
        private Long buyerId;
        private String buyerName;
        private String sellerType;
        private Long sellerId;
        private Long dealPrice;
        private BigDecimal commissionRate;
        private Long commissionAmount;
        private String status;
        private LocalDateTime paidAt;
        private LocalDateTime completedAt;
        private LocalDateTime cancelledAt;
        private LocalDateTime createdAt;

        public static Response fromEntity(Transaction transaction) {
            if (transaction == null) return null;
            return Response.builder()
                    .transactionId(transaction.getTransactionId())
                    .carId(transaction.getCar() != null ? transaction.getCar().getCarId() : null)
                    .carMake(transaction.getCar() != null ? transaction.getCar().getMake() : null)
                    .carModel(transaction.getCar() != null ? transaction.getCar().getModel() : null)
                    .carImageUrl(transaction.getCar() != null && !transaction.getCar().getImages().isEmpty() ? transaction.getCar().getImages().get(0).getImageUrl() : null)
                    .buyerType(transaction.getBuyerType())
                    .buyerId(transaction.getBuyerId())
                    .sellerType(transaction.getSellerType())
                    .sellerId(transaction.getSellerId())
                    .dealPrice(transaction.getDealPrice())
                    .commissionRate(transaction.getCommissionRate())
                    .commissionAmount(transaction.getCommissionAmount())
                    .status(transaction.getStatus())
                    .paidAt(transaction.getPaidAt())
                    .completedAt(transaction.getCompletedAt())
                    .cancelledAt(transaction.getCancelledAt())
                    .createdAt(transaction.getCreatedAt())
                    .build();
        }
    }
}
