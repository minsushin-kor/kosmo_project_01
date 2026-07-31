package com.car.app.notification.service;

import com.car.app.company.entity.Company;
import com.car.app.company.repository.CompanyRepository;
import com.car.app.dealer.repository.DealerRepository;
import com.car.app.member.repository.MemberRepository;
import com.car.app.notification.entity.Notification;
import com.car.app.notification.repository.NotificationRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private MemberRepository memberRepository;

    @Mock
    private DealerRepository dealerRepository;

    @Mock
    private CompanyRepository companyRepository;

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @InjectMocks
    private NotificationService notificationService;

    @Test
    void companyMasterReadsOnlyCompanyNotifications() {
        Company company = Company.builder()
                .companyId(12L)
                .loginId("company12")
                .build();
        Notification notification = Notification.builder()
                .recipientType("COMPANY_MASTER")
                .recipientId(12L)
                .type("GOLDEN_BADGE_AWARDED")
                .message("골든 배지가 부여되었습니다.")
                .isRead(false)
                .build();

        when(companyRepository.findByLoginId("company12"))
                .thenReturn(Optional.of(company));
        when(notificationRepository.findByRecipientTypeAndRecipientIdOrderByCreatedAtDesc(
                "COMPANY_MASTER", 12L))
                .thenReturn(List.of(notification));

        var result = notificationService.getMyNotifications(
                "company12",
                List.of(new SimpleGrantedAuthority("ROLE_COMPANY_MASTER")));

        assertEquals(1, result.size());
        verify(notificationRepository)
                .findByRecipientTypeAndRecipientIdOrderByCreatedAtDesc("COMPANY_MASTER", 12L);
    }
}
