package com.car.app.coupon.service;

import com.car.app.company.entity.Company;
import com.car.app.company.repository.CompanyRepository;
import com.car.app.coupon.repository.CouponRepository;
import com.car.app.dealer.repository.DealerRepository;
import com.car.app.notification.service.NotificationService;
import com.car.app.transaction.repository.TransactionRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CouponServiceTest {

    @Mock
    private CouponRepository couponRepository;

    @Mock
    private DealerRepository dealerRepository;

    @Mock
    private TransactionRepository transactionRepository;

    @Mock
    private CompanyRepository companyRepository;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private CouponService couponService;

    @Test
    void excludesCompanyWithoutLoginIdFromBadgeUpdate() {
        Company safestCompany = company(1L, "company_1", 10.0, "Low", "TOP_5", true);
        Company normalCompany = company(2L, "company_2", 20.0, "Low", "TOP_5", false);
        Company missingLoginId = company(3L, null, 5.0, "Safe", "NORMAL", false);

        when(companyRepository.findAll())
                .thenReturn(List.of(safestCompany, normalCompany, missingLoginId));
        when(couponRepository.existsByCompanyCompanyIdAndCouponTypeAndStatus(
                safestCompany.getCompanyId(),
                "MEMBERSHIP_DISCOUNT",
                "UNUSED"))
                .thenReturn(true);

        couponService.updateCompanyTiersAndBadges();

        verify(companyRepository).save(safestCompany);
        verify(companyRepository).save(normalCompany);
        verify(companyRepository, never()).save(missingLoginId);
        assertEquals("TOP_5", safestCompany.getTier());
        assertEquals("NORMAL", normalCompany.getTier());
        assertFalse(normalCompany.getGoldenBadgeStatus());
    }

    private Company company(
            Long companyId,
            String loginId,
            Double riskScore,
            String riskGrade,
            String tier,
            Boolean goldenBadgeStatus) {
        return Company.builder()
                .companyId(companyId)
                .loginId(loginId)
                .riskScore(riskScore)
                .riskGrade(riskGrade)
                .tier(tier)
                .goldenBadgeStatus(goldenBadgeStatus)
                .build();
    }
}
