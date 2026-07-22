package com.car.app.chat;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.*;

/**
 * WebSocket 및 STOMP 메시지 브로커를 설정하는 클래스입니다.
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // 클라이언트에서 웹소켓에 접속할 엔드포인트를 지정합니다.
        // CORS 허용을 위해 allowedOriginPatterns("*")를 바인딩하고 SockJS 폴백을 설정합니다.
        registry.addEndpoint("/ws-chat")
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // 메시지 브로커 설정
        // /sub로 시작하는 목적지 주소를 구독하는 클라이언트들에게 브로드캐스팅합니다.
        registry.enableSimpleBroker("/sub");
        
        // 클라이언트가 서버로 메시지를 보낼 때 목적지 접두사를 /pub로 지정합니다.
        registry.setApplicationDestinationPrefixes("/pub");
    }
}
