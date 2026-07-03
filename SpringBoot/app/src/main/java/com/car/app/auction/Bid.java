package com.car.app.auction;

import com.car.app.dealer.Dealer;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(
    name = "bids",
    uniqueConstraints = {
        @UniqueConstraint(columnNames = {"auction_id", "dealer_id"})
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Bid {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "bid_id")
    private Long bidId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "auction_id", nullable = false)
    private Auction auction;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dealer_id", nullable = false)
    private Dealer dealer;

    @Column(name = "bid_amount", nullable = false)
    private Long bidAmount;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
