package com.car.app.company;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "company_churn")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CompanyChurn {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "company_churn_id")
    private Long companyChurnId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @Column(name = "dealer_count", nullable = false)
    private Long dealerCount;

    @Column(name = "active_dealer_ratio", nullable = false)
    private Double activeDealerRatio;

    @Column(name = "recent_trade_count", nullable = false)
    private Long recentTradeCount;

    @Column(name = "previous_trade_count", nullable = false)
    private Long previousTradeCount;

    @Column(name = "site_usage_rate_avg", nullable = false)
    private Double siteUsageRateAvg;

    @Column(name = "risk_grade")
    private String riskGrade;

    @Column(name = "risk_reasons", length = 1000)
    private String riskReasons;

    @Column(name = "action")
    private String action;

    @Column(name = "calculated_at", nullable = false)
    private LocalDateTime calculatedAt;
}
