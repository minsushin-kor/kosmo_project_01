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

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatService {

    private final ChatRoomRepository chatRoomRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final CarRepository carRepository;
    private final MemberRepository memberRepository;
    private final DealerRepository dealerRepository;

    @Transactional
    public ChatRoom createOrGetChatRoom(Long carId, String memberLoginId) {
        Member member = memberRepository.findByLoginId(memberLoginId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 회원 계정입니다."));

        Car car = carRepository.findById(carId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 차량 매물입니다."));

        if (car.getDealer() == null) {
            throw new IllegalArgumentException("딜러가 등록한 매물에 대해서만 1:1 채팅 문의를 개설할 수 있습니다.");
        }

        Dealer dealer = car.getDealer();

        return chatRoomRepository
                .findByCarCarIdAndMemberMemberIdAndDealerDealerId(
                        carId,
                        member.getMemberId(),
                        dealer.getDealerId())
                .orElseGet(() -> {
                    ChatRoom newRoom = ChatRoom.builder()
                            .car(car)
                            .member(member)
                            .dealer(dealer)
                            .memberLastReadAt(LocalDateTime.now())
                            .build();

                    return chatRoomRepository.save(newRoom);
                });
    }

    @Transactional(readOnly = true)
    public List<ChatDto.RoomResponse> getChatRooms(
            String loginId,
            Collection<? extends GrantedAuthority> authorities) {

        Participant participant = resolveParticipant(loginId, authorities);

        List<ChatRoom> rooms = participant.isMember()
                ? chatRoomRepository.findByMemberMemberId(participant.member().getMemberId())
                : chatRoomRepository.findByDealerDealerId(participant.dealer().getDealerId());

        return rooms.stream()
                .map(room -> mapToRoomResponse(room, participant.isMember()))
                .sorted(Comparator.comparing(
                        room -> room.getLastMessageTime() != null
                                ? room.getLastMessageTime()
                                : room.getCreatedAt(),
                        Comparator.reverseOrder()))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ChatDto.MessageResponse> getMessagesInRoom(
            Long roomId,
            String loginId) {

        ChatRoom room = getAuthorizedRoom(roomId, loginId);

        return chatMessageRepository
                .findByChatRoomRoomIdOrderByCreatedAtAsc(room.getRoomId())
                .stream()
                .map(this::mapToMessageResponse)
                .collect(Collectors.toList());
    }

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

        Participant participant = resolveParticipant(senderLoginId, authorities);
        ChatRoom room = getAuthorizedRoom(roomId, senderLoginId);

        ChatMessage.ChatMessageBuilder builder = ChatMessage.builder()
                .chatRoom(room)
                .message(normalizedMessage);

        if (participant.isMember()) {
            builder.senderMember(room.getMember());
            room.setMemberLastReadAt(LocalDateTime.now());
        } else {
            builder.senderDealer(room.getDealer());
            room.setDealerLastReadAt(LocalDateTime.now());
        }

        ChatMessage savedMessage = chatMessageRepository.save(builder.build());
        chatRoomRepository.save(room);

        return mapToMessageResponse(savedMessage);
    }

    @Transactional
    public void markRoomAsRead(
            Long roomId,
            String loginId,
            Collection<? extends GrantedAuthority> authorities) {

        Participant participant = resolveParticipant(loginId, authorities);
        ChatRoom room = getAuthorizedRoom(roomId, loginId);
        LocalDateTime now = LocalDateTime.now();

        if (participant.isMember()) {
            room.setMemberLastReadAt(now);
        } else {
            room.setDealerLastReadAt(now);
        }

        chatRoomRepository.save(room);
    }

    private ChatRoom getAuthorizedRoom(Long roomId, String loginId) {
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 채팅방입니다."));

        boolean isMemberParticipant =
                room.getMember() != null &&
                loginId.equals(room.getMember().getLoginId());

        boolean isDealerParticipant =
                room.getDealer() != null &&
                loginId.equals(room.getDealer().getLoginId());

        if (!isMemberParticipant && !isDealerParticipant) {
            throw new AccessDeniedException("해당 채팅방에 접근할 권한이 없습니다.");
        }

        return room;
    }

    private Participant resolveParticipant(
            String loginId,
            Collection<? extends GrantedAuthority> authorities) {

        boolean isMember = authorities.stream()
                .anyMatch(authority -> "ROLE_MEMBER".equals(authority.getAuthority()));

        boolean isDealer = authorities.stream()
                .anyMatch(authority -> "ROLE_DEALER".equals(authority.getAuthority()));

        if (isMember) {
            Member member = memberRepository.findByLoginId(loginId)
                    .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 회원 계정입니다."));
            return new Participant(true, member, null);
        }

        if (isDealer) {
            Dealer dealer = dealerRepository.findByLoginId(loginId)
                    .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 딜러 계정입니다."));
            return new Participant(false, null, dealer);
        }

        throw new AccessDeniedException("채팅 기능을 사용할 수 없는 계정입니다.");
    }

    private ChatDto.RoomResponse mapToRoomResponse(
            ChatRoom room,
            boolean currentUserIsMember) {

        String carName = String.format(
                "%d년식 %s %s",
                room.getCar().getYear(),
                room.getCar().getMake(),
                room.getCar().getModel());

        List<ChatMessage> messages =
                chatMessageRepository.findByChatRoomRoomIdOrderByCreatedAtAsc(room.getRoomId());

        ChatMessage lastMessage = messages.isEmpty()
                ? null
                : messages.get(messages.size() - 1);

        LocalDateTime lastReadAt = currentUserIsMember
                ? room.getMemberLastReadAt()
                : room.getDealerLastReadAt();

        long unreadCount = messages.stream()
                .filter(message -> isMessageFromOtherParticipant(message, currentUserIsMember))
                .filter(message -> lastReadAt == null || message.getCreatedAt().isAfter(lastReadAt))
                .count();

        return ChatDto.RoomResponse.builder()
                .roomId(room.getRoomId())
                .carId(room.getCar().getCarId())
                .carName(carName)
                .memberId(room.getMember().getMemberId())
                .memberName(room.getMember().getName())
                .dealerId(room.getDealer().getDealerId())
                .dealerName(room.getDealer().getName())
                .createdAt(room.getCreatedAt())
                .lastMessage(lastMessage == null ? "" : lastMessage.getMessage())
                .lastMessageTime(lastMessage == null ? null : lastMessage.getCreatedAt())
                .unreadCount(unreadCount)
                .build();
    }

    private boolean isMessageFromOtherParticipant(
            ChatMessage message,
            boolean currentUserIsMember) {

        return currentUserIsMember
                ? message.getSenderDealer() != null
                : message.getSenderMember() != null;
    }

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

    private record Participant(
            boolean isMember,
            Member member,
            Dealer dealer) {
    }
}
