package com.car.app.car;

import com.car.app.member.Member;
import com.car.app.dealer.Dealer;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "cars")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Car {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "car_id")
    private Long carId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id")
    private Member member;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dealer_id")
    private Dealer dealer;

    @Column(name = "year")
    private Integer year;

    @Column(name = "make", length = 50)
    private String make;

    @Column(name = "model", length = 100)
    private String model;

    @Column(name = "option", length = 100)
    private String option;

    @Column(name = "body", length = 50)
    private String body;

    @Column(name = "transmission", length = 20)
    private String transmission;

    @Column(name = "state", length = 50)
    private String state;

    @Column(name = "condition")
    private Double condition;

    @Column(name = "odometer")
    private Double odometer;

    @Column(name = "color", length = 30)
    private String color;

    @Column(name = "interior", length = 30)
    private String interior;

    @Column(name = "mmr")
    private Double mmr;

    @Column(name = "sellingprice")
    private Long sellingPrice;

    @Column(name = "status", length = 20)
    @Builder.Default
    private String status = "REGISTERED";

    @OneToMany(mappedBy = "car", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<CarImage> images = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Helper methods for polymorphic owner
    public Object getOwner() {
        return member != null ? member : dealer;
    }

    public String getOwnerType() {
        return member != null ? "MEMBER" : "DEALER";
    }
}
