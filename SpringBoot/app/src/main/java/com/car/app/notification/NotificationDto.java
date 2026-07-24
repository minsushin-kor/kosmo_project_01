package com.car.app.notification;

import lombok.*;

import java.time.LocalDateTime;

/**
 * 알림 서비스 데이터를 주고받기 위한 DTO 클래스들의 홀더 클래스입니다.
 */
public class NotificationDto {

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        private Long notificationId;
        private String recipientType;
        private Long recipientId;
        private String type;
        private String message;
        private Long referenceId;
        private boolean isRead;
        private LocalDateTime createdAt;

        public static Response fromEntity(Notification entity) {
            return Response.builder()
                    .notificationId(entity.getNotificationId())
                    .recipientType(entity.getRecipientType())
                    .recipientId(entity.getRecipientId())
                    .type(entity.getType())
                    .message(entity.getMessage())
                    .referenceId(entity.getReferenceId())
                    .isRead(entity.isRead())
                    .createdAt(entity.getCreatedAt())
                    .build();
        }
    }

    @Getter
    @Setter
    @AllArgsConstructor
    @NoArgsConstructor
    public static class UnreadCountResponse {
        private long unreadCount;
    }
}
