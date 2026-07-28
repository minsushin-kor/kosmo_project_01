package com.car.app.chat;

import com.car.app.car.Car;
import com.car.app.car.CarRepository;
import com.car.app.dealer.Dealer;
import com.car.app.dealer.DealerRepository;
import com.car.app.member.Member;
import com.car.app.member.MemberRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
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
    public ChatRoom createOrGetChatRoom(Long carId, String memberEmail) {
        Member member = memberRepository.findByEmail(memberEmail)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 회원 계정입니다."));

        Car car = carRepository.findById(carId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 차량 매물입니다."));

        // 딜러 소유의 차량이어야만 채팅 문의를 진행할 수 있습니다.
        if (car.getDealer() == null) {
            throw new IllegalArgumentException("딜러가 등록한 매물에 대해서만 1:1 채팅 문의를 개설할 수 있습니다.");
        }

        Dealer dealer = car.getDealer();

        // 본인이 본인 매물에 채팅방을 개설하는 행위를 제한합니다.
        if (member.getEmail().equals(dealer.getLoginId())) {
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
    public List<ChatDto.RoomResponse> getChatRooms(String userEmailOrLoginId, Collection<? extends GrantedAuthority> authorities) {
        boolean isMember = authorities.stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_MEMBER"));

        List<ChatRoom> rooms;

        if (isMember) {
            Member member = memberRepository.findByEmail(userEmailOrLoginId)
                    .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 회원 계정입니다."));
            rooms = chatRoomRepository.findByMemberMemberId(member.getMemberId());
        } else {
            Dealer dealer = dealerRepository.findByLoginId(userEmailOrLoginId)
                    .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 딜러 계정입니다."));
            rooms = chatRoomRepository.findByDealerDealerId(dealer.getDealerId());
        }

        return rooms.stream()
                .map(this::mapToRoomResponse)
                .collect(Collectors.toList());
    }

    /**
     * 특정 채팅방 내의 과거 대화 내역 전체를 조회합니다.
     */
    @Transactional(readOnly = true)
    public List<ChatDto.MessageResponse> getMessagesInRoom(Long roomId, String userEmailOrLoginId) {
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 채팅방입니다."));

        // 조회 요청자가 해당 채팅방의 참여자(일반 회원 혹은 딜러)인지 검증합니다.
        boolean isAuthorized = room.getMember().getEmail().equals(userEmailOrLoginId) ||
                room.getDealer().getLoginId().equals(userEmailOrLoginId);

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
    public ChatDto.MessageResponse saveMessage(Long roomId, String messageText, String senderEmailOrLoginId, boolean isMember) {
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 채팅방입니다."));

        // 전송자가 해당 채팅방 참여자이면서 해당 역할군이 맞는지 체크
        if (isMember && !room.getMember().getEmail().equals(senderEmailOrLoginId)) {
            throw new AccessDeniedException("해당 채팅방에 메시지를 보낼 권한이 없습니다.");
        }
        if (!isMember && !room.getDealer().getLoginId().equals(senderEmailOrLoginId)) {
            throw new AccessDeniedException("해당 채팅방에 메시지를 보낼 권한이 없습니다.");
        }

        ChatMessage.ChatMessageBuilder builder = ChatMessage.builder()
                .chatRoom(room)
                .message(messageText);

        if (isMember) {
            builder.senderMember(room.getMember());
        } else {
            builder.senderDealer(room.getDealer());
        }

        ChatMessage savedMessage = chatMessageRepository.save(builder.build());
        log.info("채팅 메시지 저장 완료 [방 ID: {}]: {}", roomId, messageText);
        return mapToMessageResponse(savedMessage);
    }

    /**
     * ChatRoom 엔티티를 RoomResponse DTO 객체로 안전하게 매핑합니다.
     */
    private ChatDto.RoomResponse mapToRoomResponse(ChatRoom room) {
        String carName = String.format("%d년식 %s %s",
                room.getCar().getYear(), room.getCar().getMake(), room.getCar().getModel());

        // 마지막 대화 메시지 및 시간 확인
        List<ChatMessage> messages = chatMessageRepository.findByChatRoomRoomIdOrderByCreatedAtAsc(room.getRoomId());
        String lastMessage = "";
        java.time.LocalDateTime lastMessageTime = null;

        if (messages != null && !messages.isEmpty()) {
            ChatMessage lastMsg = messages.get(messages.size() - 1);
            lastMessage = lastMsg.getMessage();
            lastMessageTime = lastMsg.getCreatedAt();
        }

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
