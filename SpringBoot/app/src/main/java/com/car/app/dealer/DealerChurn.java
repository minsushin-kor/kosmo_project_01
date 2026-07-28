package com.car.app.dealer;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "dealer_churn")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DealerChurn {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "dealer_churn_id")
    private Long dealerChurnId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dealer_id", nullable = false)
    private Dealer dealer;

    @Column(name = "last_activity_days", nullable = false)
    private Long lastActivityDays;

    @Column(name = "recent_60d_trade_count", nullable = false)
    private Long recent60dTradeCount;

    @Column(name = "previous_trade_count", nullable = false)
    private Long previousTradeCount;

    @Column(name = "site_usage_rate", nullable = false)
    private Double siteUsageRate;

    @Column(name = "risk_grade")
    private String riskGrade;

    @Column(name = "risk_reasons", length = 1000)
    private String riskReasons;

    @Column(name = "action")
    private String action;

    @Column(name = "calculated_at", nullable = false)
    private LocalDateTime calculatedAt;
}
