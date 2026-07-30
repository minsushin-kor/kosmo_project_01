package com.car.app.chat.controller;

import com.car.app.chat.dto.ChatDto;
import com.car.app.chat.entity.ChatRoom;
import com.car.app.chat.service.ChatService;
import com.car.app.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @PostMapping("/rooms")
    @PreAuthorize("hasRole('MEMBER')")
    public ResponseEntity<ApiResponse<ChatDto.RoomResponse>> createRoom(
            @RequestBody ChatDto.RoomCreateRequest request) {

        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        ChatRoom room = chatService.createOrGetChatRoom(
                request.getCarId(),
                authentication.getName());

        String carName = String.format(
                "%d년식 %s %s",
                room.getCar().getYear(),
                room.getCar().getMake(),
                room.getCar().getModel());

        ChatDto.RoomResponse response = ChatDto.RoomResponse.builder()
                .roomId(room.getRoomId())
                .carId(room.getCar().getCarId())
                .carName(carName)
                .memberId(room.getMember().getMemberId())
                .memberName(room.getMember().getName())
                .dealerId(room.getDealer().getDealerId())
                .dealerName(room.getDealer().getName())
                .createdAt(room.getCreatedAt())
                .lastMessage("")
                .lastMessageTime(null)
                .unreadCount(0)
                .build();

        return ResponseEntity.ok(
                ApiResponse.success(
                        response,
                        "1:1 채팅방 개설/진입이 성공적으로 처리되었습니다."));
    }

    @GetMapping("/rooms")
    @PreAuthorize("hasAnyRole('MEMBER', 'DEALER')")
    public ResponseEntity<ApiResponse<List<ChatDto.RoomResponse>>> getMyRooms() {
        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        List<ChatDto.RoomResponse> rooms = chatService.getChatRooms(
                authentication.getName(),
                authentication.getAuthorities());

        return ResponseEntity.ok(
                ApiResponse.success(
                        rooms,
                        "참여 중인 채팅방 목록 조회가 성공적으로 처리되었습니다."));
    }

    @GetMapping("/rooms/{roomId}/messages")
    @PreAuthorize("hasAnyRole('MEMBER', 'DEALER')")
    public ResponseEntity<ApiResponse<List<ChatDto.MessageResponse>>> getRoomMessages(
            @PathVariable Long roomId) {

        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        List<ChatDto.MessageResponse> messages =
                chatService.getMessagesInRoom(
                        roomId,
                        authentication.getName());

        return ResponseEntity.ok(
                ApiResponse.success(
                        messages,
                        "채팅방 대화 내역 조회가 성공적으로 처리되었습니다."));
    }

    @PostMapping("/rooms/{roomId}/messages")
    @PreAuthorize("hasAnyRole('MEMBER', 'DEALER')")
    public ResponseEntity<ApiResponse<ChatDto.MessageResponse>> sendMessage(
            @PathVariable Long roomId,
            @RequestBody ChatDto.MessageRequest request) {

        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        ChatDto.MessageResponse response = chatService.saveMessage(
                roomId,
                request.getMessage(),
                authentication.getName(),
                authentication.getAuthorities());

        return ResponseEntity.ok(
                ApiResponse.success(
                        response,
                        "메시지 전송이 성공적으로 처리되었습니다."));
    }

    @PostMapping("/rooms/{roomId}/read")
    @PreAuthorize("hasAnyRole('MEMBER', 'DEALER')")
    public ResponseEntity<ApiResponse<Void>> markRoomAsRead(
            @PathVariable Long roomId) {

        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        chatService.markRoomAsRead(
                roomId,
                authentication.getName(),
                authentication.getAuthorities());

        return ResponseEntity.ok(
                ApiResponse.success(
                        null,
                        "채팅방 읽음 처리가 성공적으로 완료되었습니다."));
    }
}
