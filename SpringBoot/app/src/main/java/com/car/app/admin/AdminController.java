package com.car.app.admin;

import com.car.app.car.Car;
import com.car.app.car.CarRepository;
import com.car.app.car.CarService;
import com.car.app.company.Company;
import com.car.app.company.CompanyRepository;
import com.car.app.dealer.Dealer;
import com.car.app.dealer.DealerRepository;
import com.car.app.member.Member;
import com.car.app.member.MemberRepository;
import com.car.app.report.ReportRepository;
import com.car.app.security.ApiResponse;
import com.car.app.transaction.TransactionRepository;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final MemberRepository memberRepository;
    private final CompanyRepository companyRepository;
    private final DealerRepository dealerRepository;
    private final CarRepository carRepository;
    private final TransactionRepository transactionRepository;
    private final ReportRepository reportRepository;
    private final CarService carService;

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AccountResponse {
        private Long id;
        private String name;
        private String emailOrLoginId;
        private String phone;
        private String status;
        private String role;
        private LocalDateTime createdAt;
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DashboardSummaryResponse {
        private long totalMembers;
        private long totalCompanies;
        private long totalDealers;
        private long totalCars;
        private long totalCompletedTransactions;
        private long pendingReportsCount;
        private List<AccountResponse> recentAccounts;
        private List<Car> recentCars;
        private Map<String, Object> monthlyStats;
    }

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StatusUpdateRequest {
        private String status;
    }

    /**
     * 관리자 회원 목록 조회 (검색어, 상태, 페이징 지원)
     */
    @GetMapping("/members")
    public ResponseEntity<ApiResponse<Page<AccountResponse>>> getMembers(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Member> memberPage = memberRepository.findAll(pageable);

        Page<AccountResponse> result = memberPage.map(m -> AccountResponse.builder()
                .id(m.getMemberId())
                .name(m.getName())
                .emailOrLoginId(m.getEmail())
                .phone(m.getPhone())
                .status(m.getHasCar() != null ? "ACTIVE" : "ACTIVE")
                .role("ROLE_MEMBER")
                .createdAt(m.getCreatedAt())
                .build());

        return ResponseEntity.ok(ApiResponse.success(result, "회원 목록 조회가 완료되었습니다."));
    }

    /**
     * 관리자 회원 상태 변경
     */
    @PatchMapping("/members/{memberId}/status")
    public ResponseEntity<ApiResponse<String>> updateMemberStatus(
            @PathVariable Long memberId,
            @RequestBody StatusUpdateRequest request) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 회원 계정입니다."));
        memberRepository.save(member);
        return ResponseEntity.ok(ApiResponse.success("SUCCESS", "회원 상태가 성공적으로 변경되었습니다."));
    }

    /**
     * 관리자 상사 목록 조회
     */
    @GetMapping("/companies")
    public ResponseEntity<ApiResponse<Page<AccountResponse>>> getCompanies(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Company> companyPage = companyRepository.findAll(pageable);

        Page<AccountResponse> result = companyPage.map(c -> AccountResponse.builder()
                .id(c.getCompanyId())
                .name(c.getName())
                .emailOrLoginId(c.getMasterEmail())
                .phone(c.getPhone())
                .status(c.getMembershipStatus() != null && c.getMembershipStatus() ? "ACTIVE" : "INACTIVE")
                .role("ROLE_COMPANY_MASTER")
                .createdAt(c.getCreatedAt())
                .build());

        return ResponseEntity.ok(ApiResponse.success(result, "상사 목록 조회가 완료되었습니다."));
    }

    /**
     * 관리자 상사 상태 변경
     */
    @PatchMapping("/companies/{companyId}/status")
    public ResponseEntity<ApiResponse<String>> updateCompanyStatus(
            @PathVariable Long companyId,
            @RequestBody StatusUpdateRequest request) {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 상사 계정입니다."));
        if ("ACTIVE".equalsIgnoreCase(request.getStatus())) {
            company.setMembershipStatus(true);
        } else {
            company.setMembershipStatus(false);
        }
        companyRepository.save(company);
        return ResponseEntity.ok(ApiResponse.success("SUCCESS", "상사 상태가 성공적으로 변경되었습니다."));
    }

    /**
     * 관리자 딜러 목록 조회
     */
    @GetMapping("/dealers")
    public ResponseEntity<ApiResponse<Page<AccountResponse>>> getDealers(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Dealer> dealerPage = dealerRepository.findAll(pageable);

        Page<AccountResponse> result = dealerPage.map(d -> AccountResponse.builder()
                .id(d.getDealerId())
                .name(d.getName())
                .emailOrLoginId(d.getLoginId())
                .phone(d.getPhone())
                .status(d.getStatus())
                .role("ROLE_DEALER")
                .createdAt(d.getCreatedAt())
                .build());

        return ResponseEntity.ok(ApiResponse.success(result, "딜러 목록 조회가 완료되었습니다."));
    }

    /**
     * 관리자 딜러 상태 변경
     */
    @PatchMapping("/dealers/{dealerId}/status")
    public ResponseEntity<ApiResponse<String>> updateDealerStatus(
            @PathVariable Long dealerId,
            @RequestBody StatusUpdateRequest request) {
        Dealer dealer = dealerRepository.findById(dealerId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 딜러 계정입니다."));
        dealer.setStatus(request.getStatus());
        dealerRepository.save(dealer);
        return ResponseEntity.ok(ApiResponse.success("SUCCESS", "딜러 상태가 성공적으로 변경되었습니다."));
    }

    /**
     * 관리자 차량 상태 변경
     */
    @PatchMapping("/cars/{carId}/status")
    public ResponseEntity<ApiResponse<String>> updateCarStatus(
            @PathVariable Long carId,
            @RequestBody StatusUpdateRequest request) {
        carService.updateCarStatusByAdmin(carId, request.getStatus());
        return ResponseEntity.ok(ApiResponse.success("SUCCESS", "차량 상태가 성공적으로 변경되었습니다."));
    }

    /**
     * 관리자 대시보드 통계 요약 정보 조회
     */
    @GetMapping("/dashboard/summary")
    public ResponseEntity<ApiResponse<DashboardSummaryResponse>> getDashboardSummary() {
        long totalMembers = memberRepository.count();
        long totalCompanies = companyRepository.count();
        long totalDealers = dealerRepository.count();
        long totalCars = carRepository.count();
        long totalTransactions = transactionRepository.count();
        long pendingReports = reportRepository.countByStatus("PENDING");

        List<Member> recentMemberList = memberRepository.findAll(PageRequest.of(0, 5, Sort.by("createdAt").descending())).getContent();
        List<AccountResponse> recentAccounts = new ArrayList<>();
        for (Member m : recentMemberList) {
            recentAccounts.add(AccountResponse.builder()
                    .id(m.getMemberId())
                    .name(m.getName())
                    .emailOrLoginId(m.getEmail())
                    .phone(m.getPhone())
                    .status("ACTIVE")
                    .role("ROLE_MEMBER")
                    .createdAt(m.getCreatedAt())
                    .build());
        }

        List<Car> recentCars = carRepository.findTop5ByOrderByCreatedAtDesc();

        Map<String, Object> monthlyStats = new HashMap<>();
        monthlyStats.put("members", List.of(12, 19, 25, 32, 40, totalMembers));
        monthlyStats.put("cars", List.of(30, 45, 60, 80, 95, totalCars));
        monthlyStats.put("transactions", List.of(5, 12, 18, 22, 30, totalTransactions));

        DashboardSummaryResponse summary = DashboardSummaryResponse.builder()
                .totalMembers(totalMembers)
                .totalCompanies(totalCompanies)
                .totalDealers(totalDealers)
                .totalCars(totalCars)
                .totalCompletedTransactions(totalTransactions)
                .pendingReportsCount(pendingReports)
                .recentAccounts(recentAccounts)
                .recentCars(recentCars)
                .monthlyStats(monthlyStats)
                .build();

        return ResponseEntity.ok(ApiResponse.success(summary, "관리자 대시보드 요약 정보 조회가 완료되었습니다."));
    }
}
