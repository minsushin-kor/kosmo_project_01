package com.car.app.chat;

import com.car.app.security.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 1:1 라이브 채팅 관련 REST API를 제공하는 컨트롤러 클래스입니다.
 */
@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    /**
     * 일반 회원이 차량 상세 조회 페이지에서 딜러에게 1:1 문의를 위한 채팅방을 신규 개설하거나 기존 대화방을 조회합니다.
     */
    @PostMapping("/rooms")
    @PreAuthorize("hasRole('MEMBER')")
    public ResponseEntity<ApiResponse<ChatDto.RoomResponse>> createRoom(@RequestBody ChatDto.RoomCreateRequest request) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String memberEmail = authentication.getName();

            ChatRoom room = chatService.createOrGetChatRoom(request.getCarId(), memberEmail);
            
            // Response DTO 매핑
            String carName = String.format("%d년식 %s %s",
                    room.getCar().getYear(), room.getCar().getMake(), room.getCar().getModel());

            ChatDto.RoomResponse response = ChatDto.RoomResponse.builder()
                    .roomId(room.getRoomId())
                    .carId(room.getCar().getCarId())
                    .carName(carName)
                    .memberId(room.getMember().getMemberId())
                    .memberName(room.getMember().getName())
                    .dealerId(room.getDealer().getDealerId())
                    .dealerName(room.getDealer().getName())
                    .createdAt(room.getCreatedAt())
                    .build();

            return ResponseEntity.ok(ApiResponse.success(response, "1:1 채팅방 개설/진입이 성공적으로 처리되었습니다."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.fail("ERR_INVALID_REQUEST", e.getMessage()));
        }
    }

    /**
     * 로그인한 본인(일반 회원 또는 딜러)이 소속된 모든 1:1 채팅방 목록을 조회합니다.
     */
    @GetMapping("/rooms")
    @PreAuthorize("hasAnyRole('MEMBER', 'DEALER')")
    public ResponseEntity<ApiResponse<List<ChatDto.RoomResponse>>> getMyRooms() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String username = authentication.getName(); // 이메일 또는 딜러 로그인 ID

            List<ChatDto.RoomResponse> rooms = chatService.getChatRooms(username, authentication.getAuthorities());
            return ResponseEntity.ok(ApiResponse.success(rooms, "참여 중인 채팅방 목록 조회가 성공적으로 처리되었습니다."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.fail("ERR_INVALID_REQUEST", e.getMessage()));
        }
    }

    /**
     * 특정 1:1 채팅방의 과거 대화 내역 전체를 조회합니다.
     */
    @GetMapping("/rooms/{roomId}/messages")
    @PreAuthorize("hasAnyRole('MEMBER', 'DEALER')")
    public ResponseEntity<ApiResponse<List<ChatDto.MessageResponse>>> getRoomMessages(@PathVariable Long roomId) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String username = authentication.getName(); // 이메일 또는 딜러 로그인 ID

            List<ChatDto.MessageResponse> messages = chatService.getMessagesInRoom(roomId, username);
            return ResponseEntity.ok(ApiResponse.success(messages, "채팅방 대화 내역 조회가 성공적으로 처리되었습니다."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.fail("ERR_INVALID_REQUEST", e.getMessage()));
        }
    }
}
