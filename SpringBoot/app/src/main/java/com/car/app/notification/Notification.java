package com.car.app.notification;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * 실시간 푸시 및 인앱 알림 이력을 관리하기 위한 엔티티 클래스입니다.
 */
@Entity
@Table(name = "notifications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "notification_id")
    private Long notificationId;

    @Column(name = "recipient_type", nullable = false, length = 20)
    private String recipientType; // "MEMBER" 또는 "DEALER"

    @Column(name = "recipient_id", nullable = false)
    private Long recipientId; // 수신 회원 PK 또는 수신 딜러 PK

    @Column(name = "type", nullable = false, length = 50)
    private String type; // "AUCTION_WON", "AUCTION_FAILED", "CAR_SOLD", "BID_WIN" 등

    @Column(name = "message", nullable = false, columnDefinition = "TEXT")
    private String message; // 알림 상세 메시지 내용

    @Column(name = "reference_id")
    private Long referenceId; // 연관 매물/경매/거래 PK (선택)

    @Builder.Default
    @Column(name = "is_read", nullable = false)
    private boolean isRead = false; // 읽음 처리 여부

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
