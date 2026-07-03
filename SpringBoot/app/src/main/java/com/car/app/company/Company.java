package com.car.app.company;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "companies")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Company {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "company_id")
    private Long companyId;

    @Column(name = "business_number", unique = true, nullable = false, length = 20)
    private String businessNumber;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "master_email", unique = true, nullable = false, length = 100)
    private String masterEmail;

    @Column(name = "password", nullable = false)
    private String password;

    @Column(name = "address", length = 255)
    private String address;

    @Column(name = "phone", length = 20)
    private String phone;

    @Column(name = "profile_image_url", length = 500)
    private String profileImageUrl;

    @Column(name = "membership_status")
    @Builder.Default
    private Boolean membershipStatus = false;

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
