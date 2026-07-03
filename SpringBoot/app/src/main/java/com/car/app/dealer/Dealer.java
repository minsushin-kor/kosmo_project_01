package com.car.app.dealer;

import com.car.app.company.Company;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "dealers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Dealer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "dealer_id")
    private Long dealerId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @Column(name = "login_id", unique = true, nullable = false, length = 50)
    private String loginId;

    @Column(name = "password", nullable = false)
    private String password;

    @Column(name = "name", nullable = false, length = 50)
    private String name;

    @Column(name = "phone", nullable = false, length = 20)
    private String phone;

    @Column(name = "profile_image_url", length = 500)
    private String profileImageUrl;

    @Column(name = "status", length = 20)
    @Builder.Default
    private String status = "ACTIVE";

    @Column(name = "tier", length = 20)
    @Builder.Default
    private String tier = "NORMAL";

    @Column(name = "risk_score")
    @Builder.Default
    private Double riskScore = 0.0;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
