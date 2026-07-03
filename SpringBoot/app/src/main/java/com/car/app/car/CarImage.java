package com.car.app.car;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "car_images")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CarImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "car_image_id")
    private Long carImageId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "car_id", nullable = false)
    private Car car;

    @Column(name = "image_url", nullable = false, length = 500)
    private String imageUrl;

    @Column(name = "is_main")
    @Builder.Default
    private Boolean isMain = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
