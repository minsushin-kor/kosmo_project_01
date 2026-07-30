package com.car.app.admin.controller;

import com.car.app.car.dto.CarDto;
import com.car.app.car.entity.Car;
import com.car.app.car.repository.CarRepository;
import com.car.app.car.service.CarService;
import com.car.app.company.entity.Company;
import com.car.app.company.repository.CompanyRepository;
import com.car.app.dealer.entity.Dealer;
import com.car.app.dealer.repository.DealerRepository;
import com.car.app.global.response.ApiResponse;
import com.car.app.member.entity.Member;
import com.car.app.member.repository.MemberRepository;
import com.car.app.report.repository.ReportRepository;
import com.car.app.transaction.entity.Transaction;
import com.car.app.transaction.repository.TransactionRepository;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private static final Set<String> ALLOWED_ACCOUNT_STATUSES = Set.of(
            "ACTIVE",
            "SUSPENDED",
            "WITHDRAWN",
            "INACTIVE");

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
        private String loginId;
        private String email;
        private String phone;
        private String status;
        private String role;
        private LocalDateTime createdAt;

        /*
         * 기업 관리 페이지에서 사용하는 소속 딜러 수
         */
        private Long dealerCount;

        /*
         * 딜러 관리 페이지에서 사용하는 소속 기업 정보
         */
        private Long companyId;
        private String companyName;
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
     * 관리자 일반회원 목록 조회
     *
     * query:
     * - 회원 이름
     * - 로그인 ID
     * - 이메일
     * - 연락처
     *
     * status:
     * - ACTIVE
     * - INACTIVE
     * - SUSPENDED
     * - WITHDRAWN
     */
    @GetMapping("/members")
    public ResponseEntity<ApiResponse<Page<AccountResponse>>> getMembers(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        validatePageRequest(page, size);

        String normalizedQuery = normalizeKeyword(query);
        String normalizedStatus = normalizeOptionalStatus(status);

        List<Member> allMembers = memberRepository.findAll(
                Sort.by(Sort.Direction.DESC, "createdAt"));

        List<AccountResponse> filteredMembers = allMembers.stream()
                .filter(member -> normalizedQuery.isBlank()
                        || containsIgnoreCase(member.getName(), normalizedQuery)
                        || containsIgnoreCase(member.getLoginId(), normalizedQuery)
                        || containsIgnoreCase(member.getEmail(), normalizedQuery)
                        || containsIgnoreCase(member.getPhone(), normalizedQuery))
                .filter(member -> {
                    if (normalizedStatus.isBlank()) {
                        return true;
                    }

                    String memberStatus = normalizeStoredStatus(
                            member.getStatus(),
                            "ACTIVE");

                    return normalizedStatus.equals(memberStatus);
                })
                .map(this::mapMemberToAccountResponse)
                .collect(Collectors.toList());

        Page<AccountResponse> resultPage = getPagedList(
                filteredMembers,
                page,
                size);

        return ResponseEntity.ok(
                ApiResponse.success(
                        resultPage,
                        "회원 목록 조회가 완료되었습니다."));
    }

    /**
     * 관리자 일반회원 상태 변경
     */
    @PatchMapping("/members/{memberId}/status")
    public ResponseEntity<ApiResponse<String>> updateMemberStatus(
            @PathVariable Long memberId,
            @RequestBody StatusUpdateRequest request) {

        String newStatus = validateAndGetStatus(request);

        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "존재하지 않는 회원 계정입니다."));

        member.setStatus(newStatus);
        memberRepository.save(member);

        return ResponseEntity.ok(
                ApiResponse.success(
                        "SUCCESS",
                        "회원 상태가 성공적으로 변경되었습니다."));
    }

    /**
     * 관리자 기업 목록 조회
     *
     * query:
     * - 기업명
     * - 로그인 ID
     * - 대표 이메일
     * - 연락처
     *
     * 기업 상태는 membershipStatus 값을 기준으로
     * ACTIVE 또는 INACTIVE로 반환합니다.
     */
    @GetMapping("/companies")
    public ResponseEntity<ApiResponse<Page<AccountResponse>>> getCompanies(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        validatePageRequest(page, size);

        String normalizedQuery = normalizeKeyword(query);
        String normalizedStatus = normalizeOptionalStatus(status);

        List<Company> allCompanies = companyRepository.findAll(
                Sort.by(Sort.Direction.DESC, "createdAt"));

        List<AccountResponse> filteredCompanies = allCompanies.stream()
                .filter(company -> normalizedQuery.isBlank()
                        || containsIgnoreCase(company.getName(), normalizedQuery)
                        || containsIgnoreCase(company.getLoginId(), normalizedQuery)
                        || containsIgnoreCase(company.getMasterEmail(), normalizedQuery)
                        || containsIgnoreCase(company.getPhone(), normalizedQuery))
                .filter(company -> {
                    if (normalizedStatus.isBlank()) {
                        return true;
                    }

                    boolean active = Boolean.TRUE.equals(
                            company.getMembershipStatus());

                    String companyStatus = active
                            ? "ACTIVE"
                            : "INACTIVE";

                    return normalizedStatus.equals(companyStatus);
                })
                .map(this::mapCompanyToAccountResponse)
                .collect(Collectors.toList());

        Page<AccountResponse> resultPage = getPagedList(
                filteredCompanies,
                page,
                size);

        return ResponseEntity.ok(
                ApiResponse.success(
                        resultPage,
                        "기업 목록 조회가 완료되었습니다."));
    }

    /**
     * 관리자 기업 상태 변경
     *
     * Company 엔티티는 membershipStatus가 Boolean이므로
     * ACTIVE는 true, 나머지는 false로 저장합니다.
     */
    @PatchMapping("/companies/{companyId}/status")
    public ResponseEntity<ApiResponse<String>> updateCompanyStatus(
            @PathVariable Long companyId,
            @RequestBody StatusUpdateRequest request) {

        String newStatus = validateAndGetStatus(request);

        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "존재하지 않는 기업 계정입니다."));

        company.setMembershipStatus(
                "ACTIVE".equals(newStatus));

        companyRepository.save(company);

        return ResponseEntity.ok(
                ApiResponse.success(
                        "SUCCESS",
                        "기업 상태가 성공적으로 변경되었습니다."));
    }

    /**
     * 관리자 딜러 목록 조회
     *
     * query:
     * - 딜러 이름
     * - 로그인 ID
     * - 이메일
     * - 연락처
     */
    @GetMapping("/dealers")
    public ResponseEntity<ApiResponse<Page<AccountResponse>>> getDealers(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        validatePageRequest(page, size);

        String normalizedQuery = normalizeKeyword(query);
        String normalizedStatus = normalizeOptionalStatus(status);

        List<Dealer> allDealers = dealerRepository.findAll(
                Sort.by(Sort.Direction.DESC, "createdAt"));

        List<AccountResponse> filteredDealers = allDealers.stream()
                .filter(dealer -> normalizedQuery.isBlank()
                        || containsIgnoreCase(dealer.getName(), normalizedQuery)
                        || containsIgnoreCase(dealer.getLoginId(), normalizedQuery)
                        || containsIgnoreCase(dealer.getEmail(), normalizedQuery)
                        || containsIgnoreCase(dealer.getPhone(), normalizedQuery))
                .filter(dealer -> {
                    if (normalizedStatus.isBlank()) {
                        return true;
                    }

                    String dealerStatus = normalizeStoredStatus(
                            dealer.getStatus(),
                            "ACTIVE");

                    return normalizedStatus.equals(dealerStatus);
                })
                .map(this::mapDealerToAccountResponse)
                .collect(Collectors.toList());

        Page<AccountResponse> resultPage = getPagedList(
                filteredDealers,
                page,
                size);

        return ResponseEntity.ok(
                ApiResponse.success(
                        resultPage,
                        "딜러 목록 조회가 완료되었습니다."));
    }

    /**
     * 관리자 딜러 상태 변경
     */
    @PatchMapping("/dealers/{dealerId}/status")
    public ResponseEntity<ApiResponse<String>> updateDealerStatus(
            @PathVariable Long dealerId,
            @RequestBody StatusUpdateRequest request) {

        String newStatus = validateAndGetStatus(request);

        Dealer dealer = dealerRepository.findById(dealerId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "존재하지 않는 딜러 계정입니다."));

        dealer.setStatus(newStatus);
        dealerRepository.save(dealer);

        return ResponseEntity.ok(
                ApiResponse.success(
                        "SUCCESS",
                        "딜러 상태가 성공적으로 변경되었습니다."));
    }

    /**
     * 관리자 차량 상태 변경
     */
    @PatchMapping("/cars/{carId}/status")
    public ResponseEntity<ApiResponse<String>> updateCarStatus(
            @PathVariable Long carId,
            @RequestBody StatusUpdateRequest request) {

        if (request == null || request.getStatus() == null
                || request.getStatus().isBlank()) {
            throw new IllegalArgumentException(
                    "변경할 차량 상태를 입력해 주세요.");
        }

        carService.updateCarStatusByAdmin(
                carId,
                request.getStatus().trim().toUpperCase(Locale.ROOT));

        return ResponseEntity.ok(
                ApiResponse.success(
                        "SUCCESS",
                        "차량 상태가 성공적으로 변경되었습니다."));
    }

    /**
     * 관리자 대시보드 통계 요약 조회
     */
    @GetMapping("/dashboard/summary")
    public ResponseEntity<ApiResponse<DashboardSummaryResponse>> getDashboardSummary() {

        long totalMembers = memberRepository.count();
        long totalCompanies = companyRepository.count();
        long totalDealers = dealerRepository.count();
        long totalCars = carRepository.count();

        long totalCompletedTransactions = transactionRepository.countByStatus("COMPLETED");

        long pendingReports = reportRepository.countByStatus("PENDING");

        List<Member> recentMemberList = memberRepository.findAll(
                PageRequest.of(
                        0,
                        5,
                        Sort.by(Sort.Direction.DESC, "createdAt")))
                .getContent();

        List<AccountResponse> recentAccounts = recentMemberList.stream()
                .map(this::mapMemberToAccountResponse)
                .collect(Collectors.toList());

        List<CarDto.Response> recentCars = carRepository.findTop5ByOrderByCreatedAtDesc()
                .stream()
                .map(carService::mapToResponse)
                .collect(Collectors.toList());

        Map<String, Object> monthlyStats = calculateMonthlyStatsFromDb();

        DashboardSummaryResponse summary = DashboardSummaryResponse.builder()
                .totalMembers(totalMembers)
                .totalCompanies(totalCompanies)
                .totalDealers(totalDealers)
                .totalCars(totalCars)
                .totalCompletedTransactions(
                        totalCompletedTransactions)
                .pendingReportsCount(pendingReports)
                .recentAccounts(recentAccounts)
                .recentCars(recentCars)
                .monthlyStats(monthlyStats)
                .build();

        return ResponseEntity.ok(
                ApiResponse.success(
                        summary,
                        "관리자 대시보드 요약 정보 조회가 완료되었습니다."));
    }

    /**
     * 최근 6개월의 누적 회원·차량·완료 거래 수를 계산합니다.
     */
    private Map<String, Object> calculateMonthlyStatsFromDb() {

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM");

        List<String> months = new ArrayList<>();
        List<Long> memberCounts = new ArrayList<>();
        List<Long> carCounts = new ArrayList<>();
        List<Long> transactionCounts = new ArrayList<>();

        LocalDateTime now = LocalDateTime.now();

        List<Member> allMembers = memberRepository.findAll();
        List<Car> allCars = carRepository.findAll();
        List<Transaction> allTransactions = transactionRepository.findAll();

        for (int i = 5; i >= 0; i--) {

            LocalDateTime monthStart = now.minusMonths(i)
                    .withDayOfMonth(1)
                    .withHour(0)
                    .withMinute(0)
                    .withSecond(0)
                    .withNano(0);

            LocalDateTime monthEnd = monthStart
                    .plusMonths(1)
                    .minusNanos(1);

            String monthLabel = monthStart.format(formatter);

            months.add(monthLabel);

            long memberCount = allMembers.stream()
                    .filter(member -> member.getCreatedAt() != null
                            && !member.getCreatedAt()
                                    .isAfter(monthEnd))
                    .count();

            long carCount = allCars.stream()
                    .filter(car -> car.getCreatedAt() != null
                            && !car.getCreatedAt()
                                    .isAfter(monthEnd))
                    .count();

            long transactionCount = allTransactions.stream()
                    .filter(transaction -> "COMPLETED".equalsIgnoreCase(
                            transaction.getStatus())
                            && transaction.getCreatedAt() != null
                            && !transaction.getCreatedAt()
                                    .isAfter(monthEnd))
                    .count();

            memberCounts.add(memberCount);
            carCounts.add(carCount);
            transactionCounts.add(transactionCount);
        }

        Map<String, Object> result = new HashMap<>();

        result.put("months", months);
        result.put("members", memberCounts);
        result.put("cars", carCounts);
        result.put("transactions", transactionCounts);

        return result;
    }

    /**
     * Member 엔티티를 관리자 계정 응답으로 변환합니다.
     */
    private AccountResponse mapMemberToAccountResponse(
            Member member) {

        return AccountResponse.builder()
                .id(member.getMemberId())
                .name(member.getName())
                .loginId(member.getLoginId())
                .email(member.getEmail())
                .phone(member.getPhone())
                .status(
                        normalizeStoredStatus(
                                member.getStatus(),
                                "ACTIVE"))
                .role("ROLE_MEMBER")
                .createdAt(member.getCreatedAt())
                .build();
    }

    /**
     * Company 엔티티를 관리자 계정 응답으로 변환합니다.
     */
    private AccountResponse mapCompanyToAccountResponse(
            Company company) {

        boolean active = Boolean.TRUE.equals(
                company.getMembershipStatus());

        long dealerCount = dealerRepository.countByCompanyCompanyId(
                company.getCompanyId());

        return AccountResponse.builder()
                .id(company.getCompanyId())
                .name(company.getName())
                .loginId(company.getLoginId())
                .email(company.getMasterEmail())
                .phone(company.getPhone())
                .status(
                        active
                                ? "ACTIVE"
                                : "INACTIVE")
                .role("ROLE_COMPANY_MASTER")
                .createdAt(company.getCreatedAt())
                .dealerCount(dealerCount)
                .companyId(company.getCompanyId())
                .companyName(company.getName())
                .build();
    }

    /**
     * Dealer 엔티티를 관리자 계정 응답으로 변환합니다.
     */
    private AccountResponse mapDealerToAccountResponse(
            Dealer dealer) {

        Company company = dealer.getCompany();

        return AccountResponse.builder()
                .id(dealer.getDealerId())
                .name(dealer.getName())
                .loginId(dealer.getLoginId())
                .email(dealer.getEmail())
                .phone(dealer.getPhone())
                .status(
                        normalizeStoredStatus(
                                dealer.getStatus(),
                                "ACTIVE"))
                .role("ROLE_DEALER")
                .createdAt(dealer.getCreatedAt())
                .companyId(
                        company != null
                                ? company.getCompanyId()
                                : null)
                .companyName(
                        company != null
                                ? company.getName()
                                : null)
                .build();
    }

    /**
     * 계정 상태 요청값을 검증하고 대문자로 반환합니다.
     */
    private String validateAndGetStatus(
            StatusUpdateRequest request) {

        if (request == null
                || request.getStatus() == null
                || request.getStatus().isBlank()) {

            throw new IllegalArgumentException(
                    "변경할 계정 상태를 입력해 주세요.");
        }

        String normalizedStatus = request.getStatus()
                .trim()
                .toUpperCase(Locale.ROOT);

        if (!ALLOWED_ACCOUNT_STATUSES.contains(
                normalizedStatus)) {
            throw new IllegalArgumentException(
                    "허용되지 않는 계정 상태값입니다: "
                            + request.getStatus());
        }

        return normalizedStatus;
    }

    /**
     * 선택적으로 전달된 상태 검색값을 정규화합니다.
     */
    private String normalizeOptionalStatus(String status) {

        if (status == null || status.isBlank()) {
            return "";
        }

        String normalizedStatus = status
                .trim()
                .toUpperCase(Locale.ROOT);

        if ("ALL".equals(normalizedStatus)) {
            return "";
        }

        if (!ALLOWED_ACCOUNT_STATUSES.contains(
                normalizedStatus)) {
            throw new IllegalArgumentException(
                    "허용되지 않는 계정 상태값입니다: "
                            + status);
        }

        return normalizedStatus;
    }

    /**
     * DB에 상태가 비어 있을 경우 기본 상태를 반환합니다.
     */
    private String normalizeStoredStatus(
            String status,
            String defaultStatus) {

        if (status == null || status.isBlank()) {
            return defaultStatus;
        }

        return status.trim().toUpperCase(Locale.ROOT);
    }

    /**
     * 검색어의 앞뒤 공백을 제거하고 소문자로 변환합니다.
     */
    private String normalizeKeyword(String query) {

        if (query == null || query.isBlank()) {
            return "";
        }

        return query
                .trim()
                .toLowerCase(Locale.ROOT);
    }

    /**
     * null을 허용하는 대소문자 구분 없는 포함 검색입니다.
     */
    private boolean containsIgnoreCase(
            String source,
            String normalizedKeyword) {

        if (source == null) {
            return false;
        }

        return source
                .toLowerCase(Locale.ROOT)
                .contains(normalizedKeyword);
    }

    /**
     * 페이지 번호와 크기를 검증합니다.
     */
    private void validatePageRequest(int page, int size) {

        if (page < 0) {
            throw new IllegalArgumentException(
                    "페이지 번호는 0 이상이어야 합니다.");
        }

        if (size < 1 || size > 500) {
            throw new IllegalArgumentException(
                    "페이지 크기는 1 이상 500 이하여야 합니다.");
        }
    }

    /**
     * 필터링된 리스트를 Page 객체로 변환합니다.
     */
    private <T> Page<T> getPagedList(
            List<T> list,
            int page,
            int size) {

        int start = Math.min(
                page * size,
                list.size());

        int end = Math.min(
                start + size,
                list.size());

        List<T> subList = list.subList(start, end);

        return new PageImpl<>(
                subList,
                PageRequest.of(page, size),
                list.size());
    }
}