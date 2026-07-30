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

import java.time.LocalDate;
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
    public static class RecentCarResponse {

        private Long id;

        /*
         * 딜러 매물은 딜러 소속 회사명,
         * 일반회원 매물은 개인 판매로 반환합니다.
         */
        private String companyName;

        /*
         * 제조사와 모델을 합친 차량명입니다.
         */
        private String carName;

        /*
         * 일반회원 또는 딜러
         */
        private String accountType;

        private Long price;
        private String status;
        private LocalDateTime createdAt;
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DashboardCardResponse {

        private String key;
        private String title;
        private long value;
        private String unit;
        private String description;

        /*
         * 최근 30일 동안 새로 증가한 건수
         */
        private long currentPeriodCount;

        /*
         * 직전 30일 동안 새로 증가한 건수
         */
        private long previousPeriodCount;

        /*
         * 직전 30일 대비 최근 30일 증감률
         */
        private double changeRate;

        /*
         * UP, DOWN, SAME
         */
        private String trend;

        /*
         * 최근 30일간 일별 누적 그래프 값
         */
        private List<Long> chartData;
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

        /*
         * 전체 완료 거래 수
         */
        private long totalCompletedTransactions;

        /*
         * 이번 달 완료 거래 수
         */
        private long currentMonthCompletedTransactions;

        private long pendingReportsCount;

        /*
         * 관리자 대시보드 상단 카드
         */
        private List<DashboardCardResponse> summaryCards;

        private List<AccountResponse> recentAccounts;
        private List<RecentCarResponse> recentCars;
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
                        || containsIgnoreCase(
                                member.getName(),
                                normalizedQuery)
                        || containsIgnoreCase(
                                member.getLoginId(),
                                normalizedQuery)
                        || containsIgnoreCase(
                                member.getEmail(),
                                normalizedQuery)
                        || containsIgnoreCase(
                                member.getPhone(),
                                normalizedQuery))
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
                        || containsIgnoreCase(
                                company.getName(),
                                normalizedQuery)
                        || containsIgnoreCase(
                                company.getLoginId(),
                                normalizedQuery)
                        || containsIgnoreCase(
                                company.getMasterEmail(),
                                normalizedQuery)
                        || containsIgnoreCase(
                                company.getPhone(),
                                normalizedQuery))
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
                        || containsIgnoreCase(
                                dealer.getName(),
                                normalizedQuery)
                        || containsIgnoreCase(
                                dealer.getLoginId(),
                                normalizedQuery)
                        || containsIgnoreCase(
                                dealer.getEmail(),
                                normalizedQuery)
                        || containsIgnoreCase(
                                dealer.getPhone(),
                                normalizedQuery))
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

        if (request == null
                || request.getStatus() == null
                || request.getStatus().isBlank()) {

            throw new IllegalArgumentException(
                    "변경할 차량 상태를 입력해 주세요.");
        }

        carService.updateCarStatusByAdmin(
                carId,
                request.getStatus()
                        .trim()
                        .toUpperCase(Locale.ROOT));

        return ResponseEntity.ok(
                ApiResponse.success(
                        "SUCCESS",
                        "차량 상태가 성공적으로 변경되었습니다."));
    }

    /**
     * 관리자 대시보드 통계 요약 조회
     *
     * 회원수:
     * 현재 등록된 일반회원 전체 수
     *
     * 기업수:
     * 현재 등록된 기업 전체 수
     *
     * 등록매물:
     * 현재 DB에 저장된 차량 전체 수
     *
     * 이번 달 거래:
     * 이번 달에 COMPLETED 상태로 완료된 거래 수
     *
     * 증감률:
     * 최근 30일 신규 건수와 직전 30일 신규 건수를 비교
     */
    @GetMapping("/dashboard/summary")
    public ResponseEntity<ApiResponse<DashboardSummaryResponse>> getDashboardSummary() {

        List<Member> allMembers = memberRepository.findAll();

        List<Company> allCompanies = companyRepository.findAll();

        List<Car> allCars = carRepository.findAll();

        List<Transaction> allTransactions = transactionRepository.findAll();

        long totalMembers = allMembers.size();

        long totalCompanies = allCompanies.size();

        long totalDealers = dealerRepository.count();

        long totalCars = allCars.size();

        long totalCompletedTransactions = allTransactions.stream()
                .filter(this::isCompletedTransaction)
                .count();

        LocalDate today = LocalDate.now();

        LocalDateTime monthStart = today.withDayOfMonth(1)
                .atStartOfDay();

        LocalDateTime tomorrowStart = today.plusDays(1)
                .atStartOfDay();

        long currentMonthCompletedTransactions = allTransactions.stream()
                .filter(this::isCompletedTransaction)
                .filter(transaction -> isBetween(
                        transaction.getCompletedAt(),
                        monthStart,
                        tomorrowStart))
                .count();

        long pendingReports = reportRepository.countByStatus(
                "PENDING");

        List<DashboardCardResponse> summaryCards = createDashboardCards(
                allMembers,
                allCompanies,
                allCars,
                allTransactions);

        List<Member> recentMemberList = memberRepository.findAll(
                PageRequest.of(
                        0,
                        5,
                        Sort.by(
                                Sort.Direction.DESC,
                                "createdAt")))
                .getContent();

        List<AccountResponse> recentAccounts = recentMemberList.stream()
                .map(this::mapMemberToAccountResponse)
                .collect(Collectors.toList());

        List<RecentCarResponse> recentCars = carRepository
                .findTop5ByOrderByCreatedAtDesc()
                .stream()
                .map(this::mapRecentCarResponse)
                .collect(Collectors.toList());

        Map<String, Object> monthlyStats = calculateMonthlyStatsFromDb(
                allMembers,
                allCars,
                allTransactions);

        DashboardSummaryResponse summary = DashboardSummaryResponse.builder()
                .totalMembers(totalMembers)
                .totalCompanies(totalCompanies)
                .totalDealers(totalDealers)
                .totalCars(totalCars)
                .totalCompletedTransactions(
                        totalCompletedTransactions)
                .currentMonthCompletedTransactions(
                        currentMonthCompletedTransactions)
                .pendingReportsCount(
                        pendingReports)
                .summaryCards(summaryCards)
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
     * 대시보드 상단 카드 4개를 생성합니다.
     */
    private List<DashboardCardResponse> createDashboardCards(
            List<Member> members,
            List<Company> companies,
            List<Car> cars,
            List<Transaction> transactions) {

        LocalDate today = LocalDate.now();

        /*
         * 오늘을 포함한 최근 30일
         */
        LocalDateTime currentPeriodStart = today.minusDays(29)
                .atStartOfDay();

        LocalDateTime currentPeriodEnd = today.plusDays(1)
                .atStartOfDay();

        /*
         * 최근 30일 직전의 30일
         */
        LocalDateTime previousPeriodStart = today.minusDays(59)
                .atStartOfDay();

        LocalDateTime previousPeriodEnd = currentPeriodStart;

        long currentMemberCount = members.stream()
                .filter(member -> isBetween(
                        member.getCreatedAt(),
                        currentPeriodStart,
                        currentPeriodEnd))
                .count();

        long previousMemberCount = members.stream()
                .filter(member -> isBetween(
                        member.getCreatedAt(),
                        previousPeriodStart,
                        previousPeriodEnd))
                .count();

        long currentCompanyCount = companies.stream()
                .filter(company -> isBetween(
                        company.getCreatedAt(),
                        currentPeriodStart,
                        currentPeriodEnd))
                .count();

        long previousCompanyCount = companies.stream()
                .filter(company -> isBetween(
                        company.getCreatedAt(),
                        previousPeriodStart,
                        previousPeriodEnd))
                .count();

        long currentCarCount = cars.stream()
                .filter(car -> isBetween(
                        car.getCreatedAt(),
                        currentPeriodStart,
                        currentPeriodEnd))
                .count();

        long previousCarCount = cars.stream()
                .filter(car -> isBetween(
                        car.getCreatedAt(),
                        previousPeriodStart,
                        previousPeriodEnd))
                .count();

        long currentTransactionCount = transactions.stream()
                .filter(this::isCompletedTransaction)
                .filter(transaction -> isBetween(
                        transaction.getCompletedAt(),
                        currentPeriodStart,
                        currentPeriodEnd))
                .count();

        long previousTransactionCount = transactions.stream()
                .filter(this::isCompletedTransaction)
                .filter(transaction -> isBetween(
                        transaction.getCompletedAt(),
                        previousPeriodStart,
                        previousPeriodEnd))
                .count();

        LocalDateTime monthStart = today.withDayOfMonth(1)
                .atStartOfDay();

        long currentMonthCompletedCount = transactions.stream()
                .filter(this::isCompletedTransaction)
                .filter(transaction -> isBetween(
                        transaction.getCompletedAt(),
                        monthStart,
                        currentPeriodEnd))
                .count();

        List<DashboardCardResponse> cards = new ArrayList<>();

        cards.add(
                createDashboardCard(
                        "members",
                        "회원수",
                        members.size(),
                        "명",
                        "현재 가입된 일반회원",
                        currentMemberCount,
                        previousMemberCount,
                        createMemberChart(
                                members,
                                currentPeriodStart)));

        cards.add(
                createDashboardCard(
                        "companies",
                        "기업수",
                        companies.size(),
                        "곳",
                        "현재 등록된 기업",
                        currentCompanyCount,
                        previousCompanyCount,
                        createCompanyChart(
                                companies,
                                currentPeriodStart)));

        cards.add(
                createDashboardCard(
                        "cars",
                        "등록매물",
                        cars.size(),
                        "대",
                        "현재 DB에 등록된 차량",
                        currentCarCount,
                        previousCarCount,
                        createCarChart(
                                cars,
                                currentPeriodStart)));

        cards.add(
                createDashboardCard(
                        "transactions",
                        "이번 달 거래",
                        currentMonthCompletedCount,
                        "건",
                        "거래완료 상태 기준",
                        currentTransactionCount,
                        previousTransactionCount,
                        createTransactionChart(
                                transactions,
                                currentPeriodStart)));

        return cards;
    }

    /**
     * 대시보드 카드 응답을 생성합니다.
     */
    private DashboardCardResponse createDashboardCard(
            String key,
            String title,
            long value,
            String unit,
            String description,
            long currentPeriodCount,
            long previousPeriodCount,
            List<Long> chartData) {

        double changeRate = calculateChangeRate(
                currentPeriodCount,
                previousPeriodCount);

        return DashboardCardResponse.builder()
                .key(key)
                .title(title)
                .value(value)
                .unit(unit)
                .description(description)
                .currentPeriodCount(
                        currentPeriodCount)
                .previousPeriodCount(
                        previousPeriodCount)
                .changeRate(changeRate)
                .trend(
                        getTrend(
                                currentPeriodCount,
                                previousPeriodCount))
                .chartData(chartData)
                .build();
    }

    /**
     * 직전 기간 대비 현재 기간의 증감률을 계산합니다.
     *
     * 직전 기간이 0이고 현재 기간이 0보다 크면
     * 비교 가능한 기준값이 없으므로 100% 증가로 표시합니다.
     */
    private double calculateChangeRate(
            long currentCount,
            long previousCount) {

        if (previousCount == 0) {
            return currentCount == 0
                    ? 0.0
                    : 100.0;
        }

        double rate = ((double) (currentCount
                - previousCount)
                / previousCount) * 100.0;

        return Math.round(rate * 10.0) / 10.0;
    }

    /**
     * 증감 방향을 반환합니다.
     */
    private String getTrend(
            long currentCount,
            long previousCount) {

        if (currentCount > previousCount) {
            return "UP";
        }

        if (currentCount < previousCount) {
            return "DOWN";
        }

        return "SAME";
    }

    /**
     * 최근 30일 회원 전체 누적 수 그래프를 생성합니다.
     */
    private List<Long> createMemberChart(
            List<Member> members,
            LocalDateTime chartStart) {

        List<Long> chartData = new ArrayList<>();

        for (int day = 0; day < 30; day++) {

            LocalDateTime dayEnd = chartStart.plusDays(day + 1);

            long count = members.stream()
                    .filter(member -> member.getCreatedAt() != null
                            && member.getCreatedAt()
                                    .isBefore(dayEnd))
                    .count();

            chartData.add(count);
        }

        return chartData;
    }

    /**
     * 최근 30일 기업 전체 누적 수 그래프를 생성합니다.
     */
    private List<Long> createCompanyChart(
            List<Company> companies,
            LocalDateTime chartStart) {

        List<Long> chartData = new ArrayList<>();

        for (int day = 0; day < 30; day++) {

            LocalDateTime dayEnd = chartStart.plusDays(day + 1);

            long count = companies.stream()
                    .filter(company -> company.getCreatedAt() != null
                            && company.getCreatedAt()
                                    .isBefore(dayEnd))
                    .count();

            chartData.add(count);
        }

        return chartData;
    }

    /**
     * 최근 30일 등록매물 전체 누적 수 그래프를 생성합니다.
     */
    private List<Long> createCarChart(
            List<Car> cars,
            LocalDateTime chartStart) {

        List<Long> chartData = new ArrayList<>();

        for (int day = 0; day < 30; day++) {

            LocalDateTime dayEnd = chartStart.plusDays(day + 1);

            long count = cars.stream()
                    .filter(car -> car.getCreatedAt() != null
                            && car.getCreatedAt()
                                    .isBefore(dayEnd))
                    .count();

            chartData.add(count);
        }

        return chartData;
    }

    /**
     * 최근 30일 내 완료된 거래의 누적 수 그래프를 생성합니다.
     */
    private List<Long> createTransactionChart(
            List<Transaction> transactions,
            LocalDateTime chartStart) {

        List<Long> chartData = new ArrayList<>();

        for (int day = 0; day < 30; day++) {

            LocalDateTime dayEnd = chartStart.plusDays(day + 1);

            long count = transactions.stream()
                    .filter(this::isCompletedTransaction)
                    .filter(transaction -> isBetween(
                            transaction.getCompletedAt(),
                            chartStart,
                            dayEnd))
                    .count();

            chartData.add(count);
        }

        return chartData;
    }

    /**
     * 최근 6개월 누적 회원·차량·완료 거래 수를 계산합니다.
     */
    private Map<String, Object> calculateMonthlyStatsFromDb(
            List<Member> allMembers,
            List<Car> allCars,
            List<Transaction> allTransactions) {

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM");

        List<String> months = new ArrayList<>();

        List<Long> memberCounts = new ArrayList<>();

        List<Long> carCounts = new ArrayList<>();

        List<Long> transactionCounts = new ArrayList<>();

        LocalDateTime now = LocalDateTime.now();

        for (int i = 5; i >= 0; i--) {

            LocalDateTime monthStart = now.minusMonths(i)
                    .withDayOfMonth(1)
                    .withHour(0)
                    .withMinute(0)
                    .withSecond(0)
                    .withNano(0);

            LocalDateTime monthEndExclusive = monthStart.plusMonths(1);

            String monthLabel = monthStart.format(formatter);

            months.add(monthLabel);

            long memberCount = allMembers.stream()
                    .filter(member -> member.getCreatedAt() != null
                            && member.getCreatedAt()
                                    .isBefore(
                                            monthEndExclusive))
                    .count();

            long carCount = allCars.stream()
                    .filter(car -> car.getCreatedAt() != null
                            && car.getCreatedAt()
                                    .isBefore(
                                            monthEndExclusive))
                    .count();

            long transactionCount = allTransactions.stream()
                    .filter(this::isCompletedTransaction)
                    .filter(transaction -> transaction.getCompletedAt()
                            .isBefore(
                                    monthEndExclusive))
                    .count();

            memberCounts.add(memberCount);
            carCounts.add(carCount);
            transactionCounts.add(transactionCount);
        }

        Map<String, Object> result = new HashMap<>();

        result.put("months", months);
        result.put("members", memberCounts);
        result.put("cars", carCounts);
        result.put(
                "transactions",
                transactionCounts);

        return result;
    }

    /**
     * 거래완료 상태이고 완료일이 있는 거래인지 확인합니다.
     */
    private boolean isCompletedTransaction(
            Transaction transaction) {

        return transaction != null
                && "COMPLETED".equalsIgnoreCase(
                        transaction.getStatus())
                && transaction.getCompletedAt() != null;
    }

    /**
     * 날짜가 시작 시각 이상이고 종료 시각 미만인지 확인합니다.
     */
    private boolean isBetween(
            LocalDateTime value,
            LocalDateTime start,
            LocalDateTime endExclusive) {

        return value != null
                && !value.isBefore(start)
                && value.isBefore(endExclusive);
    }

    /**
     * 차량 엔티티를 관리자 대시보드 최근 매물 응답으로 변환합니다.
     */
    private RecentCarResponse mapRecentCarResponse(
            Car car) {

        boolean memberListing = car.getMember() != null;

        boolean dealerListing = car.getDealer() != null;

        String companyName = "개인 판매";
        String accountType = "-";

        if (memberListing) {
            accountType = "일반회원";
        } else if (dealerListing) {
            accountType = "딜러";

            Company company = car.getDealer().getCompany();

            companyName = company != null
                    && company.getName() != null
                    && !company.getName().isBlank()
                            ? company.getName()
                            : "소속 회사 없음";
        }

        String carName = createCarName(car);

        return RecentCarResponse.builder()
                .id(car.getCarId())
                .companyName(companyName)
                .carName(carName)
                .accountType(accountType)
                .price(
                        car.getSellingPrice() != null
                                ? car.getSellingPrice()
                                : 0L)
                .status(
                        car.getStatus() != null
                                && !car.getStatus().isBlank()
                                        ? car.getStatus()
                                        : "REGISTERED")
                .createdAt(car.getCreatedAt())
                .build();
    }

    /**
     * 제조사와 모델을 결합해 차량명을 생성합니다.
     */
    private String createCarName(
            Car car) {

        String make = car.getMake() != null
                ? car.getMake().trim()
                : "";

        String model = car.getModel() != null
                ? car.getModel().trim()
                : "";

        String carName = (make + " " + model).trim();

        if (!carName.isBlank()) {
            return carName;
        }

        return "차량 #" + car.getCarId();
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

        long dealerCount = dealerRepository
                .countByCompanyCompanyId(
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
    private String normalizeOptionalStatus(
            String status) {

        if (status == null || status.isBlank()) {
            return "";
        }

        String normalizedStatus = status.trim()
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
     * DB 상태값이 비어 있으면 기본 상태를 반환합니다.
     */
    private String normalizeStoredStatus(
            String status,
            String defaultStatus) {

        if (status == null || status.isBlank()) {
            return defaultStatus;
        }

        return status.trim()
                .toUpperCase(Locale.ROOT);
    }

    /**
     * 검색어를 소문자로 변환합니다.
     */
    private String normalizeKeyword(
            String query) {

        if (query == null || query.isBlank()) {
            return "";
        }

        return query.trim()
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
     * 페이지 요청값을 검증합니다.
     */
    private void validatePageRequest(
            int page,
            int size) {

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