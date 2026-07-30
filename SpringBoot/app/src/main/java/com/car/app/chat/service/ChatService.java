package com.car.app.chat.service;

import com.car.app.chat.dto.ChatDto;
import com.car.app.chat.entity.ChatMessage;
import com.car.app.chat.entity.ChatRoom;
import com.car.app.chat.repository.ChatMessageRepository;
import com.car.app.chat.repository.ChatRoomRepository;
import com.car.app.car.entity.Car;
import com.car.app.car.repository.CarRepository;
import com.car.app.dealer.entity.Dealer;
import com.car.app.dealer.repository.DealerRepository;
import com.car.app.member.entity.Member;
import com.car.app.member.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 실시간 라이브 채팅 비즈니스 로직을 수행하는 서비스 클래스입니다.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ChatService {

    private final ChatRoomRepository chatRoomRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final CarRepository carRepository;
    private final MemberRepository memberRepository;
    private final DealerRepository dealerRepository;

    /**
     * 1:1 라이브 채팅방을 개설하거나 기존에 존재하던 채팅방을 조회하여 반환합니다.
     */
    @Transactional
    public ChatRoom createOrGetChatRoom(Long carId, String memberLoginId) {
        Member member = memberRepository.findByLoginId(memberLoginId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 회원 계정입니다."));

        Car car = carRepository.findById(carId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 차량 매물입니다."));

        // 딜러 소유의 차량이어야만 채팅 문의를 진행할 수 있습니다.
        if (car.getDealer() == null) {
            throw new IllegalArgumentException("딜러가 등록한 매물에 대해서만 1:1 채팅 문의를 개설할 수 있습니다.");
        }

        Dealer dealer = car.getDealer();

        // 본인이 본인 매물에 채팅방을 개설하는 행위를 제한합니다.
        if (member.getLoginId().equals(dealer.getLoginId())) {
            throw new IllegalArgumentException("본인이 소유한 매물에는 문의 채팅방을 개설할 수 없습니다.");
        }

        // 기존에 개설된 채팅방이 있는지 조회
        return chatRoomRepository.findByCarCarIdAndMemberMemberIdAndDealerDealerId(carId, member.getMemberId(), dealer.getDealerId())
                .orElseGet(() -> {
                    log.info("새로운 1:1 채팅방 개설: 차량 ID {}, 일반 회원 {}, 담당 딜러 {}", carId, member.getName(), dealer.getName());
                    ChatRoom newRoom = ChatRoom.builder()
                            .car(car)
                            .member(member)
                            .dealer(dealer)
                            .build();
                    return chatRoomRepository.save(newRoom);
                });
    }

    /**
     * 사용자가 참가하고 있는 모든 채팅방 리스트를 조회합니다.
     */
    @Transactional(readOnly = true)
    public List<ChatDto.RoomResponse> getChatRooms(String loginId, Collection<? extends GrantedAuthority> authorities) {
        boolean isMember = authorities.stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_MEMBER"));

        List<ChatRoom> rooms;

        if (isMember) {
            Member member = memberRepository.findByLoginId(loginId)
                    .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 회원 계정입니다."));
            rooms = chatRoomRepository.findByMemberMemberId(member.getMemberId());
        } else {
            Dealer dealer = dealerRepository.findByLoginId(loginId)
                    .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 딜러 계정입니다."));
            rooms = chatRoomRepository.findByDealerDealerId(dealer.getDealerId());
        }

        return rooms.stream()
                .map(this::mapToRoomResponse)
                .sorted(Comparator.comparing(
                        room -> room.getLastMessageTime() != null
                                ? room.getLastMessageTime()
                                : room.getCreatedAt(),
                        Comparator.reverseOrder()))
                .collect(Collectors.toList());
    }

    /**
     * 특정 채팅방 내의 과거 대화 내역 전체를 조회합니다.
     */
    @Transactional(readOnly = true)
    public List<ChatDto.MessageResponse> getMessagesInRoom(Long roomId, String loginId) {
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 채팅방입니다."));

        // 조회 요청자가 해당 채팅방의 참여자(일반 회원 혹은 딜러)인지 검증합니다.
        boolean isAuthorized = room.getMember().getLoginId().equals(loginId) ||
                room.getDealer().getLoginId().equals(loginId);

        if (!isAuthorized) {
            throw new AccessDeniedException("해당 채팅방의 대화 내역을 조회할 권한이 없습니다.");
        }

        List<ChatMessage> messages = chatMessageRepository.findByChatRoomRoomIdOrderByCreatedAtAsc(roomId);
        return messages.stream()
                .map(this::mapToMessageResponse)
                .collect(Collectors.toList());
    }

    /**
     * 수신된 실시간 채팅 메시지를 데이터베이스에 안전하게 기록하고 응답 DTO로 반환합니다.
     */
    @Transactional
    public ChatDto.MessageResponse saveMessage(
            Long roomId,
            String messageText,
            String senderLoginId,
            Collection<? extends GrantedAuthority> authorities) {
        String normalizedMessage = messageText == null ? "" : messageText.trim();
        if (normalizedMessage.isEmpty()) {
            throw new IllegalArgumentException("메시지 내용을 입력해 주세요.");
        }
        if (normalizedMessage.length() > 1000) {
            throw new IllegalArgumentException("메시지는 1000자 이하로 입력해 주세요.");
        }

        boolean isMember = authorities.stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_MEMBER"));
        boolean isDealer = authorities.stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_DEALER"));

        if (!isMember && !isDealer) {
            throw new AccessDeniedException("채팅 메시지를 보낼 수 없는 계정입니다.");
        }
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 채팅방입니다."));

        // 전송자가 해당 채팅방 참여자이면서 해당 역할군이 맞는지 체크
        if (isMember && !room.getMember().getLoginId().equals(senderLoginId)) {
            throw new AccessDeniedException("해당 채팅방에 메시지를 보낼 권한이 없습니다.");
        }
        if (!isMember && !room.getDealer().getLoginId().equals(senderLoginId)) {
            throw new AccessDeniedException("해당 채팅방에 메시지를 보낼 권한이 없습니다.");
        }

        ChatMessage.ChatMessageBuilder builder = ChatMessage.builder()
                .chatRoom(room)
                .message(normalizedMessage);

        if (isMember) {
            builder.senderMember(room.getMember());
        } else {
            builder.senderDealer(room.getDealer());
        }

        ChatMessage savedMessage = chatMessageRepository.save(builder.build());
        log.info("채팅 메시지 저장 완료 [방 ID: {}]", roomId);
        return mapToMessageResponse(savedMessage);
    }

    /**
     * ChatRoom 엔티티를 RoomResponse DTO 객체로 안전하게 매핑합니다.
     */
    private ChatDto.RoomResponse mapToRoomResponse(ChatRoom room) {
        String carName = String.format("%d년식 %s %s",
                room.getCar().getYear(), room.getCar().getMake(), room.getCar().getModel());

        ChatMessage lastMsg = chatMessageRepository
                .findTopByChatRoomRoomIdOrderByCreatedAtDesc(room.getRoomId())
                .orElse(null);
        String lastMessage = lastMsg == null ? "" : lastMsg.getMessage();
        java.time.LocalDateTime lastMessageTime = lastMsg == null
                ? null
                : lastMsg.getCreatedAt();

        return ChatDto.RoomResponse.builder()
                .roomId(room.getRoomId())
                .carId(room.getCar().getCarId())
                .carName(carName)
                .memberId(room.getMember().getMemberId())
                .memberName(room.getMember().getName())
                .dealerId(room.getDealer().getDealerId())
                .dealerName(room.getDealer().getName())
                .createdAt(room.getCreatedAt())
                .lastMessage(lastMessage)
                .lastMessageTime(lastMessageTime)
                .build();
    }

    /**
     * ChatMessage 엔티티를 MessageResponse DTO 객체로 안전하게 매핑합니다.
     */
    private ChatDto.MessageResponse mapToMessageResponse(ChatMessage message) {
        String senderType;
        Long senderId;
        String senderName;

        if (message.getSenderMember() != null) {
            senderType = "MEMBER";
            senderId = message.getSenderMember().getMemberId();
            senderName = message.getSenderMember().getName();
        } else if (message.getSenderDealer() != null) {
            senderType = "DEALER";
            senderId = message.getSenderDealer().getDealerId();
            senderName = message.getSenderDealer().getName();
        } else {
            senderType = "SYSTEM";
            senderId = null;
            senderName = "시스템";
        }

        return ChatDto.MessageResponse.builder()
                .messageId(message.getMessageId())
                .roomId(message.getChatRoom().getRoomId())
                .senderType(senderType)
                .senderId(senderId)
                .senderName(senderName)
                .message(message.getMessage())
                .createdAt(message.getCreatedAt())
                .build();
    }
}
