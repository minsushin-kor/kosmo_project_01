package com.car.app.notification;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/**
 * 알림 데이터 처리를 위한 데이터 접근 리포지토리 인터페이스입니다.
 */
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByRecipientTypeAndRecipientIdOrderByCreatedAtDesc(String recipientType, Long recipientId);

    long countByRecipientTypeAndRecipientIdAndIsReadFalse(String recipientType, Long recipientId);

    List<Notification> findByRecipientTypeAndRecipientIdAndIsReadFalse(String recipientType, Long recipientId);
}
