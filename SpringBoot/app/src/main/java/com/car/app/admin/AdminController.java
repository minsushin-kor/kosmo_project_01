package com.car.app.admin;

import com.car.app.car.Car;
import com.car.app.car.CarDto;
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
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

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

    private static final Set<String> ALLOWED_ACCOUNT_STATUSES = Set.of("ACTIVE", "SUSPENDED", "WITHDRAWN", "INACTIVE");

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AccountResponse {
        private Long id;
        private String name;
        private String loginId;
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
        private List<CarDto.Response> recentCars;
        private Map<String, Object> monthlyStats;
    }

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StatusUpdateRequest {
        private String status;
    }

    /**
     * 관리자 회원 목록 조회 (검색어 query, 상태 status 실제 DB 필터링 적용)
     */
    @GetMapping("/members")
    public ResponseEntity<ApiResponse<Page<AccountResponse>>> getMembers(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        List<Member> allMembers = memberRepository.findAll(Sort.by("createdAt").descending());

        List<AccountResponse> filtered = allMembers.stream()
                .filter(m -> query == null || query.isBlank() || m.getName().contains(query) || m.getLoginId().contains(query) || (m.getEmail() != null && m.getEmail().contains(query)) || (m.getPhone() != null && m.getPhone().contains(query)))
                .filter(m -> status == null || status.isBlank() || status.equalsIgnoreCase(m.getStatus()))
                .map(m -> AccountResponse.builder()
                        .id(m.getMemberId())
                        .name(m.getName())
                        .loginId(m.getLoginId())
                        .phone(m.getPhone())
                        .status(m.getStatus() != null ? m.getStatus() : "ACTIVE")
                        .role("ROLE_MEMBER")
                        .createdAt(m.getCreatedAt())
                        .build())
                .collect(Collectors.toList());

        Page<AccountResponse> resultPage = getPagedList(filtered, page, size);
        return ResponseEntity.ok(ApiResponse.success(resultPage, "회원 목록 조회가 완료되었습니다."));
    }

    /**
     * 관리자 회원 상태 실제 DB 수정 및 저장
     */
    @PatchMapping("/members/{memberId}/status")
    public ResponseEntity<ApiResponse<String>> updateMemberStatus(
            @PathVariable Long memberId,
            @RequestBody StatusUpdateRequest request) {
        String newStatus = request.getStatus() != null ? request.getStatus().toUpperCase() : "";
        if (!ALLOWED_ACCOUNT_STATUSES.contains(newStatus)) {
            throw new IllegalArgumentException("허용되지 않는 계정 상태값입니다: " + request.getStatus());
        }
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 회원 계정입니다."));
        member.setStatus(newStatus);
        memberRepository.save(member);
        return ResponseEntity.ok(ApiResponse.success("SUCCESS", "회원 상태가 성공적으로 변경되었습니다."));
    }

    /**
     * 관리자 상사 목록 조회 (query, status 필터링 적용)
     */
    @GetMapping("/companies")
    public ResponseEntity<ApiResponse<Page<AccountResponse>>> getCompanies(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        List<Company> allCompanies = companyRepository.findAll(Sort.by("createdAt").descending());

        List<AccountResponse> filtered = allCompanies.stream()
                .filter(c -> query == null || query.isBlank() || c.getName().contains(query) || c.getMasterEmail().contains(query) || (c.getPhone() != null && c.getPhone().contains(query)))
                .filter(c -> {
                    if (status == null || status.isBlank()) return true;
                    boolean active = c.getMembershipStatus() != null && c.getMembershipStatus();
                    return ("ACTIVE".equalsIgnoreCase(status) && active) || ("INACTIVE".equalsIgnoreCase(status) && !active);
                })
                .map(c -> AccountResponse.builder()
                        .id(c.getCompanyId())
                        .name(c.getName())
                        .loginId(c.getLoginId())
                        .phone(c.getPhone())
                        .status(c.getMembershipStatus() != null && c.getMembershipStatus() ? "ACTIVE" : "INACTIVE")
                        .role("ROLE_COMPANY_MASTER")
                        .createdAt(c.getCreatedAt())
                        .build())
                .collect(Collectors.toList());

        Page<AccountResponse> resultPage = getPagedList(filtered, page, size);
        return ResponseEntity.ok(ApiResponse.success(resultPage, "상사 목록 조회가 완료되었습니다."));
    }

    /**
     * 관리자 상사 상태 변경 (상태값 검증)
     */
    @PatchMapping("/companies/{companyId}/status")
    public ResponseEntity<ApiResponse<String>> updateCompanyStatus(
            @PathVariable Long companyId,
            @RequestBody StatusUpdateRequest request) {
        String newStatus = request.getStatus() != null ? request.getStatus().toUpperCase() : "";
        if (!ALLOWED_ACCOUNT_STATUSES.contains(newStatus)) {
            throw new IllegalArgumentException("허용되지 않는 계정 상태값입니다: " + request.getStatus());
        }
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 상사 계정입니다."));
        company.setMembershipStatus("ACTIVE".equalsIgnoreCase(newStatus));
        companyRepository.save(company);
        return ResponseEntity.ok(ApiResponse.success("SUCCESS", "상사 상태가 성공적으로 변경되었습니다."));
    }

    /**
     * 관리자 딜러 목록 조회 (query, status 필터링 적용)
     */
    @GetMapping("/dealers")
    public ResponseEntity<ApiResponse<Page<AccountResponse>>> getDealers(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        List<Dealer> allDealers = dealerRepository.findAll(Sort.by("createdAt").descending());

        List<AccountResponse> filtered = allDealers.stream()
                .filter(d -> query == null || query.isBlank() || d.getName().contains(query) || d.getLoginId().contains(query) || (d.getPhone() != null && d.getPhone().contains(query)))
                .filter(d -> status == null || status.isBlank() || status.equalsIgnoreCase(d.getStatus()))
                .map(d -> AccountResponse.builder()
                        .id(d.getDealerId())
                        .name(d.getName())
                        .loginId(d.getLoginId())
                        .phone(d.getPhone())
                        .status(d.getStatus())
                        .role("ROLE_DEALER")
                        .createdAt(d.getCreatedAt())
                        .build())
                .collect(Collectors.toList());

        Page<AccountResponse> resultPage = getPagedList(filtered, page, size);
        return ResponseEntity.ok(ApiResponse.success(resultPage, "딜러 목록 조회가 완료되었습니다."));
    }

    /**
     * 관리자 딜러 상태 변경 (상태값 검증)
     */
    @PatchMapping("/dealers/{dealerId}/status")
    public ResponseEntity<ApiResponse<String>> updateDealerStatus(
            @PathVariable Long dealerId,
            @RequestBody StatusUpdateRequest request) {
        String newStatus = request.getStatus() != null ? request.getStatus().toUpperCase() : "";
        if (!ALLOWED_ACCOUNT_STATUSES.contains(newStatus)) {
            throw new IllegalArgumentException("허용되지 않는 계정 상태값입니다: " + request.getStatus());
        }
        Dealer dealer = dealerRepository.findById(dealerId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 딜러 계정입니다."));
        dealer.setStatus(newStatus);
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
     * 관리자 대시보드 통계 요약 정보 조회 (COMPLETED 완료 거래 수 및 동적 DB 월별 통계 적용)
     */
    @GetMapping("/dashboard/summary")
    public ResponseEntity<ApiResponse<DashboardSummaryResponse>> getDashboardSummary() {
        long totalMembers = memberRepository.count();
        long totalCompanies = companyRepository.count();
        long totalDealers = dealerRepository.count();
        long totalCars = carRepository.count();
        long totalCompletedTransactions = transactionRepository.countByStatus("COMPLETED");
        long pendingReports = reportRepository.countByStatus("PENDING");

        List<Member> recentMemberList = memberRepository.findAll(PageRequest.of(0, 5, Sort.by("createdAt").descending())).getContent();
        List<AccountResponse> recentAccounts = recentMemberList.stream()
                .map(m -> AccountResponse.builder()
                        .id(m.getMemberId())
                        .name(m.getName())
                        .loginId(m.getLoginId())
                        .phone(m.getPhone())
                        .status(m.getStatus() != null ? m.getStatus() : "ACTIVE")
                        .role("ROLE_MEMBER")
                        .createdAt(m.getCreatedAt())
                        .build())
                .collect(Collectors.toList());

        List<CarDto.Response> recentCars = carRepository.findTop5ByOrderByCreatedAtDesc().stream()
                .map(carService::mapToResponse)
                .collect(Collectors.toList());

        // 실제 최근 6개월 DB 기준 동적 월별 통계 집계
        Map<String, Object> monthlyStats = calculateMonthlyStatsFromDb();

        DashboardSummaryResponse summary = DashboardSummaryResponse.builder()
                .totalMembers(totalMembers)
                .totalCompanies(totalCompanies)
                .totalDealers(totalDealers)
                .totalCars(totalCars)
                .totalCompletedTransactions(totalCompletedTransactions)
                .pendingReportsCount(pendingReports)
                .recentAccounts(recentAccounts)
                .recentCars(recentCars)
                .monthlyStats(monthlyStats)
                .build();

        return ResponseEntity.ok(ApiResponse.success(summary, "관리자 대시보드 요약 정보 조회가 완료되었습니다."));
    }

    private Map<String, Object> calculateMonthlyStatsFromDb() {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM");
        List<String> months = new ArrayList<>();
        List<Long> memberCounts = new ArrayList<>();
        List<Long> carCounts = new ArrayList<>();
        List<Long> transactionCounts = new ArrayList<>();

        LocalDateTime now = LocalDateTime.now();
        List<Member> allMembers = memberRepository.findAll();
        List<Car> allCars = carRepository.findAll();
        List<com.car.app.transaction.Transaction> allTransactions = transactionRepository.findAll();

        for (int i = 5; i >= 0; i--) {
            LocalDateTime monthStart = now.minusMonths(i).withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0);
            LocalDateTime monthEnd = monthStart.plusMonths(1).minusNanos(1);
            String monthLabel = monthStart.format(formatter);
            months.add(monthLabel);

            long mCount = allMembers.stream().filter(m -> m.getCreatedAt() != null && !m.getCreatedAt().isAfter(monthEnd)).count();
            long cCount = allCars.stream().filter(c -> c.getCreatedAt() != null && !c.getCreatedAt().isAfter(monthEnd)).count();
            long tCount = allTransactions.stream().filter(t -> "COMPLETED".equalsIgnoreCase(t.getStatus()) && t.getCreatedAt() != null && !t.getCreatedAt().isAfter(monthEnd)).count();

            memberCounts.add(mCount);
            carCounts.add(cCount);
            transactionCounts.add(tCount);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("months", months);
        result.put("members", memberCounts);
        result.put("cars", carCounts);
        result.put("transactions", transactionCounts);
        return result;
    }

    private <T> Page<T> getPagedList(List<T> list, int page, int size) {
        int start = Math.min(page * size, list.size());
        int end = Math.min(start + size, list.size());
        List<T> sublist = list.subList(start, end);
        return new PageImpl<>(sublist, PageRequest.of(page, size), list.size());
    }
}
