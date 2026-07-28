package com.car.app.notification;

import com.car.app.security.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 실시간 푸시 및 인앱 알림 관련 REST API를 제공하는 컨트롤러 클래스입니다.
 */
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    /**
     * 로그인한 사용자의 알림 목록을 최신순으로 조회합니다.
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('MEMBER', 'DEALER')")
    public ResponseEntity<ApiResponse<List<NotificationDto.Response>>> getMyNotifications() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        List<NotificationDto.Response> notifications = notificationService.getMyNotifications(
                authentication.getName(), authentication.getAuthorities());
        return ResponseEntity.ok(ApiResponse.success(notifications, "알림 목록 조회가 성공적으로 처리되었습니다."));
    }

    /**
     * 안 읽은 알림 개수를 조회합니다.
     */
    @GetMapping("/unread-count")
    @PreAuthorize("hasAnyRole('MEMBER', 'DEALER')")
    public ResponseEntity<ApiResponse<NotificationDto.UnreadCountResponse>> getUnreadCount() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        long count = notificationService.getUnreadCount(authentication.getName(), authentication.getAuthorities());
        return ResponseEntity.ok(ApiResponse.success(new NotificationDto.UnreadCountResponse(count), "안 읽은 알림 개수 조회가 완료되었습니다."));
    }

    /**
     * 특정 알림을 읽음 처리 상태로 전환합니다.
     */
    @PatchMapping("/{notificationId}/read")
    @PreAuthorize("hasAnyRole('MEMBER', 'DEALER')")
    public ResponseEntity<ApiResponse<Void>> markAsRead(@PathVariable Long notificationId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        notificationService.markAsRead(notificationId, authentication.getName(), authentication.getAuthorities());
        return ResponseEntity.ok(ApiResponse.success(null, "알림이 읽음 처리되었습니다."));
    }

    /**
     * 안 읽은 알림을 전체 읽음 처리 상태로 전환합니다.
     */
    @PatchMapping("/read-all")
    @PreAuthorize("hasAnyRole('MEMBER', 'DEALER')")
    public ResponseEntity<ApiResponse<Void>> markAllAsRead() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        notificationService.markAllAsRead(authentication.getName(), authentication.getAuthorities());
        return ResponseEntity.ok(ApiResponse.success(null, "전체 알림이 읽음 처리되었습니다."));
    }
}
