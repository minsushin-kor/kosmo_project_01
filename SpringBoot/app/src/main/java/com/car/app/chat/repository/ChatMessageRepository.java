package com.car.app.chat.repository;

import com.car.app.chat.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    List<ChatMessage> findByChatRoomRoomIdOrderByCreatedAtAsc(Long roomId);
}
