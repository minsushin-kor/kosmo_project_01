package com.car.app.chat;

import lombok.*;

import java.time.LocalDateTime;

/**
 * 실시간 라이브 채팅 관련 데이터를 전달하기 위한 DTO 클래스들의 홀더 클래스입니다.
 */
public class ChatDto {

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RoomResponse {
        private Long roomId;
        private Long carId;
        private String carName;
        private Long memberId;
        private String memberName;
        private Long dealerId;
        private String dealerName;
        private LocalDateTime createdAt;
        private String lastMessage;
        private LocalDateTime lastMessageTime;
    }

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MessageResponse {
        private Long messageId;
        private Long roomId;
        private String senderType; // "MEMBER" 또는 "DEALER"
        private Long senderId;
        private String senderName;
        private String message;
        private LocalDateTime createdAt;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MessageRequest {
        private String message;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RoomCreateRequest {
        private Long carId;
    }
}
