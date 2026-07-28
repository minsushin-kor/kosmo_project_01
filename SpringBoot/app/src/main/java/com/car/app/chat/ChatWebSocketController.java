package com.car.app.chat;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;

import java.security.Principal;

/**
 * WebSocket 프로토콜을 사용한 양방향 실시간 메시지 송수신을 처리하는 컨트롤러 클래스입니다.
 */
@Controller
@RequiredArgsConstructor
@Slf4j
public class ChatWebSocketController {

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;

    /**
     * 클라이언트가 /pub/chat/message/{roomId} 로 발행하는 메시지를 수신하여 처리합니다.
     * 수신 후 데이터베이스에 기록하고, 해당 채팅방 구독자(/sub/chat/room/{roomId})들에게 실시간으로 브로드캐스팅합니다.
     */
    @MessageMapping("/chat/message/{roomId}")
    public void sendMessage(@DestinationVariable Long roomId, ChatDto.MessageRequest request, Principal principal) {
        if (principal == null) {
            log.warn("인증 정보가 유효하지 않은 사용자가 웹소켓 메시지 송신을 시도했습니다.");
            return;
        }

        Authentication auth = (Authentication) principal;
        String senderIdOrEmail = auth.getName(); // 일반 회원의 이메일 또는 딜러 로그인 ID
        
        // 사용자의 역할이 일반 회원(ROLE_MEMBER)인지 판별
        boolean isMember = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_MEMBER"));

        try {
            // 메시지를 DB에 기록하고 응답 포맷으로 가공
            ChatDto.MessageResponse response = chatService.saveMessage(roomId, request.getMessage(), senderIdOrEmail, isMember);

            // 해당 채팅방을 구독 중인 클라이언트들에게 메시지를 실시간으로 뿌려줍니다.
            String destination = "/sub/chat/room/" + roomId;
            log.info("WebSocket 브로드캐스팅 대상: {} -> 메시지: {}", destination, request.getMessage());
            messagingTemplate.convertAndSend(destination, response);

        } catch (Exception e) {
            log.error("실시간 웹소켓 메시지 처리 실패 [방 ID: {}]: {}", roomId, e.getMessage());
        }
    }
}
