package com.car.app.coupon;

import com.car.app.company.Company;
import com.car.app.dealer.Dealer;
import com.car.app.transaction.Transaction;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "coupons")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Coupon {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "coupon_id")
    private Long couponId;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "coupon_type", nullable = false, length = 50)
    private String couponType; // 'COMMISSION_DISCOUNT', 'MEMBERSHIP_DISCOUNT'

    @Column(name = "discount_rate", nullable = false, precision = 5, scale = 4)
    private BigDecimal discountRate; // 예: 0.5000 (50% 할인)

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dealer_id")
    private Dealer dealer; // Nullable (딜러 소유 쿠폰)

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id")
    private Company company; // Nullable (상사 소유 쿠폰)

    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private String status = "UNUSED"; // 'UNUSED', 'USED', 'EXPIRED'

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "used_transaction_id")
    private Transaction usedTransaction; // Nullable (사용된 거래처 정보)

    @Column(name = "issued_at", nullable = false)
    private LocalDateTime issuedAt;

    @Column(name = "expired_at", nullable = false)
    private LocalDateTime expiredAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
