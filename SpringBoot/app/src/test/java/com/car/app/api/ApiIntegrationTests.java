package com.car.app.api;

import com.car.app.admin.AdminController;
import com.car.app.car.Car;
import com.car.app.car.CarRepository;
import com.car.app.company.Company;
import com.car.app.company.CompanyRepository;
import com.car.app.dealer.Dealer;
import com.car.app.dealer.DealerRepository;
import com.car.app.member.Member;
import com.car.app.member.MemberRepository;
import com.car.app.notice.Notice;
import com.car.app.notice.NoticeRepository;
import com.car.app.report.Report;
import com.car.app.report.ReportRepository;
import com.car.app.security.JwtProvider;
import com.car.app.transaction.Review;
import com.car.app.transaction.ReviewRepository;
import com.car.app.transaction.Transaction;
import com.car.app.transaction.TransactionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@ActiveProfiles("test")
public class ApiIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private MemberRepository memberRepository;

    @Autowired
    private DealerRepository dealerRepository;

    @Autowired
    private CompanyRepository companyRepository;

    @Autowired
    private CarRepository carRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private ReportRepository reportRepository;

    @Autowired
    private NoticeRepository noticeRepository;

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private JwtProvider jwtProvider;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private String adminToken;
    private String memberToken;
    private String dealerToken;

    private Member savedMember;
    private Dealer savedDealer;
    private Company savedCompany;
    private Car savedCar;
    private Transaction savedTransaction;

    @BeforeEach
    void setUp() {
        // 1. 회원 / 딜러 / 상사 / 관리자 계정 보장 및 생성
        memberRepository.findByLoginId("admin@test.com")
                .or(() -> memberRepository.findByEmail("admin@test.com"))
                .orElseGet(() -> memberRepository.save(Member.builder()
                        .loginId("admin@test.com")
                        .email("admin@test.com")
                        .password(passwordEncoder.encode("password"))
                        .name("관리자")
                        .phone("010-0000-0000")
                        .role("ADMIN")
                        .status("ACTIVE")
                        .build()));

        savedMember = memberRepository.findByLoginId("testmember@test.com")
                .or(() -> memberRepository.findByEmail("testmember@test.com"))
                .orElseGet(() -> memberRepository.save(Member.builder()
                        .loginId("testmember@test.com")
                        .email("testmember@test.com")
                        .password(passwordEncoder.encode("password"))
                        .name("테스트회원")
                        .phone("010-1111-2222")
                        .role("MEMBER")
                        .status("ACTIVE")
                        .build()));

        savedCompany = companyRepository.findByLoginId("company@test.com")
                .or(() -> companyRepository.findByMasterEmail("company@test.com"))
                .orElseGet(() -> companyRepository.save(Company.builder()
                        .loginId("company@test.com")
                        .name("테스트상사")
                        .masterEmail("company@test.com")
                        .password(passwordEncoder.encode("password"))
                        .phone("02-1234-5678")
                        .businessNumber("123-45-67890")
                        .tier("NORMAL")
                        .membershipStatus(true)
                        .build()));

        savedDealer = dealerRepository.findByLoginId("testdealer")
                .orElseGet(() -> dealerRepository.save(Dealer.builder()
                        .company(savedCompany)
                        .loginId("testdealer")
                        .password(passwordEncoder.encode("password"))
                        .name("테스트딜러")
                        .phone("010-3333-4444")
                        .status("ACTIVE")
                        .tier("NORMAL")
                        .riskScore(10.0)
                        .build()));

        savedCar = carRepository.save(Car.builder()
                .dealer(savedDealer)
                .make("Hyundai")
                .model("Grandeur")
                .year(2022)
                .odometer(30000.0)
                .sellingPrice(25000000L)
                .status("REGISTERED")
                .build());

        savedTransaction = transactionRepository.save(Transaction.builder()
                .car(savedCar)
                .buyerType("MEMBER")
                .buyerId(savedMember.getMemberId())
                .sellerType("DEALER")
                .sellerId(savedDealer.getDealerId())
                .dealPrice(25000000L)
                .commissionRate(new BigDecimal("0.0300"))
                .commissionAmount(750000L)
                .status("PENDING_PAYMENT")
                .build());

        adminToken = "Bearer " + jwtProvider.createToken("admin@test.com", "ROLE_ADMIN", "관리자");
        memberToken = "Bearer " + jwtProvider.createToken("testmember@test.com", "ROLE_MEMBER", "테스트회원");
        dealerToken = "Bearer " + jwtProvider.createToken("testdealer", "ROLE_DEALER", "테스트딜러");
    }

    @Test
    @DisplayName("공개 상사/딜러 조회 시 비밀번호 해시가 포함되지 않은 DTO 반환 검증")
    void testPublicCompanyAndDealerProfileReturnsDtoWithoutPassword() throws Exception {
        mockMvc.perform(get("/api/companies/" + savedCompany.getCompanyId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.password").doesNotExist())
                .andExpect(jsonPath("$.data.name").value("테스트상사"));

        mockMvc.perform(get("/api/dealers/" + savedDealer.getDealerId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.password").doesNotExist())
                .andExpect(jsonPath("$.data.name").value("테스트딜러"));
    }

    @Test
    @DisplayName("거래 조회 API에서 본인 거래만 반환 및 권한 검증")
    void testTransactionSecurityAndMyTransactionsFilter() throws Exception {
        mockMvc.perform(get("/api/users/me/transactions")
                        .header("Authorization", memberToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$.data[0].transactionId").value(savedTransaction.getTransactionId()));

        mockMvc.perform(patch("/api/transactions/" + savedTransaction.getTransactionId() + "/status")
                        .header("Authorization", memberToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\": \"PAID\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("PAID"));
    }

    @Test
    @DisplayName("신고 API 호출 시 JWT에서 신고자 정보 자동 추출 및 타인 명의 위조 방지 검증")
    void testReportSecurityExtractsReporterFromJwt() throws Exception {
        String reportJson = "{\"targetType\":\"CAR\", \"targetId\":" + savedCar.getCarId() + ", \"reason\":\"허위 매물\", \"description\":\"설명\"}";

        mockMvc.perform(post("/api/reports")
                        .header("Authorization", memberToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(reportJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.reporterType").value("MEMBER"))
                .andExpect(jsonPath("$.data.reporterId").value(savedMember.getMemberId()));
    }

    @Test
    @DisplayName("관리자 대시보드 API에서 COMPLETED 거래 수 및 DB 기반 통계 반환 검증")
    void testAdminDashboardReturnsCompletedTransactionCountAndStats() throws Exception {
        mockMvc.perform(get("/api/admin/dashboard/summary")
                        .header("Authorization", adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalMembers").exists())
                .andExpect(jsonPath("$.data.totalCompletedTransactions").value(0))
                .andExpect(jsonPath("$.data.monthlyStats.months").exists());
    }

    @Test
    @DisplayName("딜러 리뷰 API 단독 URL 경로 및 경매/매매 낙찰 딜러 리뷰 정상 반환 검증")
    void testDealerReviewsStandaloneEndpoint() throws Exception {
        Review review = reviewRepository.save(Review.builder()
                .transaction(savedTransaction)
                .rating(5)
                .content("친절한 딜러입니다.")
                .build());

        mockMvc.perform(get("/api/dealers/" + savedDealer.getDealerId() + "/reviews"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].content").value("친절한 딜러입니다."));
    }
}
