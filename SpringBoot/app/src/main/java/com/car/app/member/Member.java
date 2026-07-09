package com.car.app.member;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "members")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Member {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "member_id")
    private Long memberId;

    @Column(name = "email", unique = true, nullable = false, length = 100)
    private String email;

    @Column(name = "password", nullable = false)
    private String password;

    @Column(name = "name", nullable = false, length = 50)
    private String name;

    @Column(name = "phone", nullable = false, length = 20)
    private String phone;

    @Column(name = "profile_image_url", length = 500)
    private String profileImageUrl;

    @Column(name = "has_car")
    private Boolean hasCar;

    @Column(name = "owned_car_image_url", length = 500)
    private String ownedCarImageUrl;

    @Column(name = "owned_car_make", length = 50)
    private String ownedCarMake;

    @Column(name = "owned_car_model", length = 100)
    private String ownedCarModel;

    @Column(name = "owned_car_odometer")
    private Double ownedCarOdometer;

    @Column(name = "owned_car_year")
    private Integer ownedCarYear;

    @Column(name = "role", nullable = false, length = 20)
    @Builder.Default
    private String role = "MEMBER";

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
