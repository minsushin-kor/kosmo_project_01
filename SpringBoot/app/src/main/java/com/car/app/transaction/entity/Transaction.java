package com.car.app.transaction.entity;

import com.car.app.car.entity.Car;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "transactions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "transaction_id")
    private Long transactionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "car_id", nullable = false)
    private Car car;

    @Column(name = "buyer_type", nullable = false, length = 20)
    private String buyerType; // 'MEMBER' or 'DEALER'

    @Column(name = "buyer_id", nullable = false)
    private Long buyerId;

    @Column(name = "seller_type", nullable = false, length = 20)
    private String sellerType; // 'MEMBER' or 'DEALER'

    @Column(name = "seller_id", nullable = false)
    private Long sellerId;

    @Column(name = "deal_price", nullable = false)
    private Long dealPrice;

    @Column(name = "commission_rate", precision = 5, scale = 4)
    @Builder.Default
    private BigDecimal commissionRate = new BigDecimal("0.0300");

    @Column(name = "commission_amount", nullable = false)
    private Long commissionAmount;

    @Column(name = "status", length = 30)
    @Builder.Default
    private String status = "PENDING_PAYMENT";

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
