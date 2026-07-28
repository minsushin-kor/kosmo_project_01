package com.car.app.notification;

import com.car.app.dealer.Dealer;
import com.car.app.dealer.DealerRepository;
import com.car.app.member.Member;
import com.car.app.member.MemberRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 알림 저장, 조회, 읽음 처리 및 실시간 WebSocket 푸시 송신을 담당하는 서비스 클래스입니다.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final MemberRepository memberRepository;
    private final DealerRepository dealerRepository;
    private final SimpMessagingTemplate messagingTemplate;

    /**
     * 알림 데이터를 DB에 저장하고, 실시간 WebSocket 푸시 채널로 전송합니다.
     */
    @Transactional
    public NotificationDto.Response sendNotification(String recipientType, Long recipientId, String type, String message, Long referenceId) {
        Notification notification = Notification.builder()
                .recipientType(recipientType)
                .recipientId(recipientId)
                .type(type)
                .message(message)
                .referenceId(referenceId)
                .isRead(false)
                .build();

        Notification saved = notificationRepository.save(notification);
        NotificationDto.Response response = NotificationDto.Response.fromEntity(saved);

        // 실시간 웹소켓 푸시 전송 (구독 경로 예: /sub/notifications/member/1 또는 /sub/notifications/dealer/2)
        String destination = "/sub/notifications/" + recipientType.toLowerCase() + "/" + recipientId;
        try {
            messagingTemplate.convertAndSend(destination, response);
            log.info("실시간 알림 푸시 전송 성공 [대상: {}, ID: {}]: {}", recipientType, recipientId, message);
        } catch (Exception e) {
            log.error("실시간 알림 푸시 전송 실패 [대상: {}, ID: {}]: {}", recipientType, recipientId, e.getMessage());
        }

        return response;
    }

    /**
     * 로그인한 본인의 알림 목록을 최신순으로 조회합니다.
     */
    @Transactional(readOnly = true)
    public List<NotificationDto.Response> getMyNotifications(String username, Collection<? extends GrantedAuthority> authorities) {
        RecipientInfo recipient = resolveRecipient(username, authorities);
        List<Notification> list = notificationRepository.findByRecipientTypeAndRecipientIdOrderByCreatedAtDesc(
                recipient.type, recipient.id);

        return list.stream()
                .map(NotificationDto.Response::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * 안 읽은 알림의 개수를 반환합니다.
     */
    @Transactional(readOnly = true)
    public long getUnreadCount(String username, Collection<? extends GrantedAuthority> authorities) {
        RecipientInfo recipient = resolveRecipient(username, authorities);
        return notificationRepository.countByRecipientTypeAndRecipientIdAndIsReadFalse(recipient.type, recipient.id);
    }

    /**
     * 특정 알림 단건을 읽음 처리합니다.
     */
    @Transactional
    public void markAsRead(Long notificationId, String username, Collection<? extends GrantedAuthority> authorities) {
        RecipientInfo recipient = resolveRecipient(username, authorities);
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 알림입니다."));

        if (!notification.getRecipientType().equalsIgnoreCase(recipient.type) ||
                !notification.getRecipientId().equals(recipient.id)) {
            throw new AccessDeniedException("본인에게 발송된 알림만 읽음 처리할 수 있습니다.");
        }

        notification.setRead(true);
        notificationRepository.save(notification);
    }

    /**
     * 안 읽은 전체 알림을 일괄 읽음 처리합니다.
     */
    @Transactional
    public void markAllAsRead(String username, Collection<? extends GrantedAuthority> authorities) {
        RecipientInfo recipient = resolveRecipient(username, authorities);
        List<Notification> unreadList = notificationRepository.findByRecipientTypeAndRecipientIdAndIsReadFalse(
                recipient.type, recipient.id);

        for (Notification notification : unreadList) {
            notification.setRead(true);
        }
        notificationRepository.saveAll(unreadList);
    }

    /**
     * 로그인 유저 정보 및 권한으로 수신자 유형(MEMBER/DEALER)과 수신자 PK를 식별합니다.
     */
    private RecipientInfo resolveRecipient(String username, Collection<? extends GrantedAuthority> authorities) {
        boolean isMember = authorities.stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_MEMBER"));

        if (isMember) {
            Member member = memberRepository.findByEmail(username)
                    .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 회원 계정입니다."));
            return new RecipientInfo("MEMBER", member.getMemberId());
        } else {
            Dealer dealer = dealerRepository.findByLoginId(username)
                    .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 딜러 계정입니다."));
            return new RecipientInfo("DEALER", dealer.getDealerId());
        }
    }

    private static class RecipientInfo {
        final String type;
        final Long id;

        RecipientInfo(String type, Long id) {
            this.type = type;
            this.id = id;
        }
    }
}
