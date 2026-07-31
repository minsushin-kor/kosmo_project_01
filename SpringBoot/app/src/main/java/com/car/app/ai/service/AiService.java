package com.car.app.ai.service;

import com.car.app.ai.client.AiClient;
import com.car.app.auction.repository.AuctionRepository;
import com.car.app.auction.repository.BidRepository;
import com.car.app.car.entity.Car;
import com.car.app.car.dto.CarDto;
import com.car.app.car.repository.CarRepository;
import com.car.app.company.entity.Company;
import com.car.app.company.repository.CompanyRepository;
import com.car.app.dealer.entity.Dealer;
import com.car.app.dealer.repository.DealerRepository;
import com.car.app.member.entity.Member;
import com.car.app.member.repository.MemberRepository;
import com.car.app.transaction.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

import com.car.app.company.entity.CompanyChurn;
import com.car.app.company.repository.CompanyChurnRepository;
import com.car.app.dealer.entity.DealerChurn;
import com.car.app.dealer.repository.DealerChurnRepository;

/**
 * AI 연동 및 데이터 매핑 비즈니스 로직을 수행하는 서비스 클래스입니다.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AiService {

    private final AiClient aiClient;
    private final DealerRepository dealerRepository;
    private final CarRepository carRepository;
    private final BidRepository bidRepository;
    private final TransactionRepository transactionRepository;
    private final CompanyRepository companyRepository;
    private final AuctionRepository auctionRepository;
    private final DealerChurnRepository dealerChurnRepository;
    private final CompanyChurnRepository companyChurnRepository;
    private final MemberRepository memberRepository;

    /**
     * 현재 로그인한 딜러를 위한 AI 추천 차량 목록을 상세 DTO 포맷으로 가공하여 조회합니다.


    /**
     * 일반 구매자 추천 조건을 받아 DB에서 판매 가능한 딜러 차량 전체를 조회한 후,
     * preferences와 vehicles 후보 목록을 조립하여 FastAPI에 전달하고 추천 연산 결과를 반환합니다.
     */
    @Transactional(readOnly = true)
    public Object recommendVehiclesForBuyer(
            Map<String, Object> preferences,
            String memberLoginId) {
        if (memberLoginId == null || memberLoginId.isBlank()) {
            throw new IllegalArgumentException("로그인한 일반회원 정보를 확인할 수 없습니다.");
        }

        Member member = memberRepository.findByLoginId(memberLoginId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 일반회원 계정입니다."));

        String recommendationPriority = preferences != null
                ? String.valueOf(preferences.getOrDefault("recommendationPriority", "preferred_car"))
                : "preferred_car";
        boolean hasPreferredCar = member.getPreferredCar() != null
                && !member.getPreferredCar().isBlank();

        if (!hasPreferredCar && "preferred_car".equals(recommendationPriority)) {
            throw new IllegalArgumentException(
                    "회원가입 시 등록한 선호차량이 없어 추천하기 어렵습니다. 최근 검색 우선을 선택해 주세요.");
        }

        Map<String, Object> mergedPreferences = new LinkedHashMap<>();
        if (preferences != null) {
            mergedPreferences.putAll(preferences);
        }
        if (hasPreferredCar) {
            mergedPreferences.put("preferredCar", member.getPreferredCar().trim());
        }

        // 1. DB에서 조건에 부합하는 딜러 판매 매물 전체 목록 조회 (dealer_id 존재, member_id 없음, status == 'REGISTERED')
        List<Car> candidateCars = carRepository.findByDealerIsNotNullAndMemberIsNullAndStatusOrderByCreatedAtDesc("REGISTERED");

        // 2. FastAPI 전달용 VehicleItem 목록으로 변환
        List<AiClient.VehicleItem> vehicleItems = candidateCars.stream()
                .map(car -> AiClient.VehicleItem.builder()
                        .carId(car.getCarId())
                        .year(car.getYear())
                        .make(car.getMake())
                        .model(car.getModel())
                        .odometer(car.getOdometer())
                        .option(car.getOption())
                        .body(car.getBody())
                        .color(car.getColor())
                        .sellingPrice(car.getSellingPrice())
                        .state(car.getState())
                        .status(car.getStatus())
                        .ownerType(car.getOwnerType())
                        .build())
                .collect(Collectors.toList());

        // 3. FastAPI 요청 객체 조립
        AiClient.BuyerRecommendApiRequest apiRequest = AiClient.BuyerRecommendApiRequest.builder()
                .preferences(mergedPreferences)
                .vehicles(vehicleItems)
                .build();

        // 4. FastAPI 호출 및 결과 전달
        return aiClient.recommendVehiclesForBuyer(apiRequest);
    }

    /**
     * 매일 자정 실행되는 이탈 위험도 예측 및 등급 업데이트 배치 처리 메소드입니다.
     * churn 테이블의 최신 집계값을 기준으로 실제 거래·입찰 정보가 있는 항목만 갱신한 뒤
     * FastAPI 뱃치 API를 호출하고 예측 결과를 일괄 저장합니다.
     */
    @Transactional
    public void runChurnPredictionBatch() {
        log.info("자정 이탈 위험도 예측 뱃치 연산 시작...");

        List<Dealer> dealers = dealerRepository.findAll();
        List<Company> companies = companyRepository.findAll();

        if (dealers.isEmpty() && companies.isEmpty()) {
            log.info("예측 대상 딜러 및 상사 데이터가 존재하지 않습니다.");
            return;
        }

        // 1. churn 테이블에 저장된 최신 활동 요약을 FastAPI 입력으로 사용합니다.
        // 아직 예측되지 않은 입력 행을 우선 선택하여 과거 배치가 만든 초기값 행이
        // 더미데이터나 새 집계값을 가리는 문제를 방지합니다.
        Map<Long, DealerChurn> latestDealerChurnMap = selectDealerChurnInputs(
                dealerChurnRepository.findAllByOrderByCalculatedAtDesc());
        Map<Long, CompanyChurn> latestCompanyChurnMap = selectCompanyChurnInputs(
                companyChurnRepository.findAllByOrderByCalculatedAtDesc());

        LocalDateTime sixtyDaysAgo = LocalDateTime.now().minusDays(60);
        Map<Long, TransactionRepository.DealerTradeSummary> tradeMap = transactionRepository
                .getDealerTradeSummaries(sixtyDaysAgo)
                .stream()
                .collect(Collectors.toMap(
                        TransactionRepository.DealerTradeSummary::getDealerId,
                        summary -> summary,
                        (first, ignored) -> first));
        Map<Long, BidRepository.DealerBidSummary> bidMap = bidRepository
                .getDealerBidSummaries()
                .stream()
                .collect(Collectors.toMap(
                        BidRepository.DealerBidSummary::getDealerId,
                        summary -> summary,
                        (first, ignored) -> first));
        long totalAuctionsCount = auctionRepository.count();

        // 2. 저장된 churn 값만 사용합니다. 데이터가 없을 때 0이나 180일 같은
        // 초기값으로 생성하지 않고 해당 대상만 건너뜁니다.
        Map<Long, AiClient.DealerBatchItem> dealerItemMap = new HashMap<>();
        List<AiClient.DealerBatchItem> dealerBatchItems = new ArrayList<>();

        for (Dealer dealer : dealers) {
            DealerChurn churn = latestDealerChurnMap.get(dealer.getDealerId());
            if (churn == null) {
                log.warn("dealer_churn 데이터가 없어 딜러 {}의 이탈 예측을 건너뜁니다.", dealer.getDealerId());
                continue;
            }

            TransactionRepository.DealerTradeSummary tradeSummary = tradeMap.get(dealer.getDealerId());
            BidRepository.DealerBidSummary bidSummary = bidMap.get(dealer.getDealerId());
            refreshDealerChurnFromActivity(churn, tradeSummary, bidSummary, totalAuctionsCount);

            AiClient.DealerBatchItem item = createDealerBatchItemFromChurn(dealer, churn, tradeSummary);
            dealerBatchItems.add(item);
            dealerItemMap.put(dealer.getDealerId(), item);
        }

        Map<Long, AiClient.CompanyBatchItem> companyItemMap = new HashMap<>();
        List<AiClient.CompanyBatchItem> companyBatchItems = new ArrayList<>();
        Map<Long, List<Dealer>> dealersByCompanyId = dealers.stream()
                .filter(dealer -> dealer.getCompany() != null)
                .collect(Collectors.groupingBy(dealer -> dealer.getCompany().getCompanyId()));
        for (Company company : companies) {
            if (company.getLoginId() == null || company.getLoginId().isBlank()) {
                log.warn(
                        "login_id가 없는 회사 {}는 이탈률 예측과 저장에서 제외합니다.",
                        company.getCompanyId());
                continue;
            }

            CompanyChurn churn = latestCompanyChurnMap.get(company.getCompanyId());
            if (churn == null) {
                log.warn("company_churn 데이터가 없어 회사 {}의 이탈 예측을 건너뜁니다.", company.getCompanyId());
                continue;
            }

            refreshCompanyChurnFromDealers(
                    churn,
                    dealersByCompanyId.getOrDefault(company.getCompanyId(), Collections.emptyList()),
                    latestDealerChurnMap);
            AiClient.CompanyBatchItem item = createCompanyBatchItemFromChurn(company, churn);
            companyBatchItems.add(item);
            companyItemMap.put(company.getCompanyId(), item);
        }

        if (dealerBatchItems.isEmpty() && companyBatchItems.isEmpty()) {
            log.warn("이탈 예측에 사용할 churn 데이터가 없어 배치를 종료합니다.");
            return;
        }

        AiClient.BatchChurnRequest batchRequest = AiClient.BatchChurnRequest.builder()
                .dealers(dealerBatchItems)
                .companies(companyBatchItems)
                .build();

        // 3. FastAPI 서버 단일 뱃치 API 호출 (1회 통신)
        AiClient.BatchChurnResponse batchResponse = aiClient.predictBatchChurn(batchRequest);

        LocalDateTime now = LocalDateTime.now();

        if (batchResponse != null && "success".equalsIgnoreCase(batchResponse.getStatus())) {
            List<Dealer> dealerUpdates = new ArrayList<>();
            List<Company> companyUpdates = new ArrayList<>();
            List<DealerChurn> dealerChurnUpdates = new ArrayList<>();
            List<CompanyChurn> companyChurnUpdates = new ArrayList<>();

            // 4. 딜러 이탈 예측 결과를 회원 정보와 기존 최신 churn 행에 반영합니다.
            if (batchResponse.getDealerPredictions() != null) {
                Map<Long, AiClient.DealerPredictionResult> dealerPredMap = batchResponse.getDealerPredictions().stream()
                        .collect(Collectors.toMap(AiClient.DealerPredictionResult::getDealerId, p -> p, (p1, p2) -> p1));

                for (Dealer dealer : dealers) {
                    AiClient.DealerPredictionResult pred = dealerPredMap.get(dealer.getDealerId());
                    AiClient.DealerBatchItem item = dealerItemMap.get(dealer.getDealerId());

                    if (pred != null) {
                        double riskScore = pred.getChurnProbability() * 100.0;
                        dealer.setRiskScore(riskScore);
                        // tier: 기존 시스템 등급(NORMAL, CARE_REQUIRED), riskGrade: FastAPI 상세 등급(Critical, High, Medium, Low, Safe) 분리
                        dealer.setTier(riskScore >= 75.0 ? "CARE_REQUIRED" : "NORMAL");
                        dealer.setRiskGrade(pred.getRiskGrade());
                        dealerUpdates.add(dealer);

                        String reasonsStr = (pred.getRiskReasons() != null && !pred.getRiskReasons().isEmpty())
                                ? String.join("\n", pred.getRiskReasons())
                                : null;

                        if (item != null) {
                            DealerChurn churn = latestDealerChurnMap.get(dealer.getDealerId());
                            if (churn != null) {
                                churn.setRiskGrade(pred.getRiskGrade());
                                churn.setRiskReasons(reasonsStr);
                                churn.setAction(pred.getAction());
                                churn.setCalculatedAt(now);
                                dealerChurnUpdates.add(churn);
                            }
                        }
                    }
                }
                if (!dealerUpdates.isEmpty()) {
                    dealerRepository.saveAll(dealerUpdates);
                }
                if (!dealerChurnUpdates.isEmpty()) {
                    dealerChurnRepository.saveAll(dealerChurnUpdates);
                }
                log.info("딜러 {}명의 이탈 위험도와 최신 churn 분석 결과 저장 완료.", dealerUpdates.size());
            }

            // 5. 회사 이탈 예측 결과를 회사 정보와 기존 최신 churn 행에 반영합니다.
            if (batchResponse.getCompanyPredictions() != null) {
                Map<Long, AiClient.CompanyPredictionResult> companyPredMap = batchResponse.getCompanyPredictions().stream()
                        .collect(Collectors.toMap(AiClient.CompanyPredictionResult::getCompanyId, p -> p, (p1, p2) -> p1));

                for (Company company : companies) {
                    AiClient.CompanyPredictionResult pred = companyPredMap.get(company.getCompanyId());
                    AiClient.CompanyBatchItem item = companyItemMap.get(company.getCompanyId());

                    if (pred != null) {
                        double riskScore = pred.getChurnProbability() * 100.0;
                        company.setRiskScore(riskScore);
                        // tier: 기존 TOP_5 여부와 무관하게 1차적으로 이탈 위험도(70점 이상 CARE_REQUIRED, 70점 미만 NORMAL)로 지정
                        // (이후 updateCompanyTiersAndBadges에서 이탈 위험이 낮은 상위 5% 회사만 TOP_5로 덮어씁니다.)
                        company.setTier(riskScore >= 70.0 ? "CARE_REQUIRED" : "NORMAL");
                        company.setRiskGrade(pred.getRiskGrade());
                        companyUpdates.add(company);

                        String reasonsStr = (pred.getRiskReasons() != null && !pred.getRiskReasons().isEmpty())
                                ? String.join("\n", pred.getRiskReasons())
                                : null;

                        if (item != null) {
                            CompanyChurn churn = latestCompanyChurnMap.get(company.getCompanyId());
                            if (churn != null) {
                                churn.setRiskGrade(pred.getRiskGrade());
                                churn.setRiskReasons(reasonsStr);
                                churn.setAction(pred.getAction());
                                churn.setCalculatedAt(now);
                                companyChurnUpdates.add(churn);
                            }
                        }
                    }
                }
                if (!companyUpdates.isEmpty()) {
                    companyRepository.saveAll(companyUpdates);
                }
                if (!companyChurnUpdates.isEmpty()) {
                    companyChurnRepository.saveAll(companyChurnUpdates);
                }
                log.info("회사 {}곳의 이탈 위험도와 최신 churn 분석 결과 저장 완료.", companyUpdates.size());
            }

        } else {
            log.warn("FastAPI 이탈 예측 뱃치 응답이 비어있거나 실패하여 이탈 등급과 골든 뱃지 갱신을 보류합니다.");
        }

        log.info("자정 이탈 위험도 예측 뱃치 연산 완료.");
    }

    /**
     * 실제 거래나 입찰 요약이 조회된 항목만 갱신합니다.
     * 조회되지 않은 항목은 기존 churn 값을 유지하여 초기값으로 되돌아가지 않게 합니다.
     */
    private void refreshDealerChurnFromActivity(
            DealerChurn churn,
            TransactionRepository.DealerTradeSummary tradeSummary,
            BidRepository.DealerBidSummary bidSummary,
            long totalAuctionsCount) {
        if (tradeSummary != null) {
            if (tradeSummary.getRecent60dTradeCount() != null) {
                churn.setRecent60dTradeCount(tradeSummary.getRecent60dTradeCount());
            }
            if (tradeSummary.getPreviousTradeCount() != null) {
                churn.setPreviousTradeCount(tradeSummary.getPreviousTradeCount());
            }
        }

        if (bidSummary != null && bidSummary.getBidCount() != null && totalAuctionsCount > 0) {
            double siteUsageRate = (double) bidSummary.getBidCount() / totalAuctionsCount;
            churn.setSiteUsageRate(Math.min(1.0, Math.max(0.0, siteUsageRate)));
        }

        LocalDateTime latestActivity = null;
        if (tradeSummary != null && tradeSummary.getLatestTradeTime() != null) {
            latestActivity = tradeSummary.getLatestTradeTime();
        }
        if (bidSummary != null && bidSummary.getLatestBidTime() != null
                && (latestActivity == null || bidSummary.getLatestBidTime().isAfter(latestActivity))) {
            latestActivity = bidSummary.getLatestBidTime();
        }
        if (latestActivity != null) {
            long days = ChronoUnit.DAYS.between(latestActivity, LocalDateTime.now());
            churn.setLastActivityDays(Math.max(0, days));
        }
    }

    /**
     * 모든 소속 딜러에게 churn 데이터가 있을 때만 회사 집계값을 갱신합니다.
     * 일부 데이터가 누락된 상태에서는 기존 회사 값을 보존합니다.
     */
    private void refreshCompanyChurnFromDealers(
            CompanyChurn churn,
            List<Dealer> companyDealers,
            Map<Long, DealerChurn> dealerChurnMap) {
        if (companyDealers.isEmpty()) {
            return;
        }

        List<DealerChurn> dealerChurns = companyDealers.stream()
                .map(dealer -> dealerChurnMap.get(dealer.getDealerId()))
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
        if (dealerChurns.size() != companyDealers.size()) {
            return;
        }

        long activeDealerCount = companyDealers.stream()
                .filter(dealer -> "ACTIVE".equalsIgnoreCase(dealer.getStatus()))
                .count();
        long recentTradeCount = dealerChurns.stream()
                .mapToLong(DealerChurn::getRecent60dTradeCount)
                .sum();
        long previousTradeCount = dealerChurns.stream()
                .mapToLong(DealerChurn::getPreviousTradeCount)
                .sum();
        double siteUsageRateAvg = dealerChurns.stream()
                .mapToDouble(DealerChurn::getSiteUsageRate)
                .average()
                .orElse(churn.getSiteUsageRateAvg());

        churn.setDealerCount((long) companyDealers.size());
        churn.setActiveDealerRatio((double) activeDealerCount / companyDealers.size());
        churn.setRecentTradeCount(recentTradeCount);
        churn.setPreviousTradeCount(previousTradeCount);
        churn.setSiteUsageRateAvg(siteUsageRateAvg);
    }

    /**
     * dealer_churn에 저장된 활동 요약값을 FastAPI 요청으로 변환합니다.
     */
    private AiClient.DealerBatchItem createDealerBatchItemFromChurn(
            Dealer dealer,
            DealerChurn churn,
            TransactionRepository.DealerTradeSummary tradeSummary) {
        double avgSellingPrice = tradeSummary != null && tradeSummary.getAvgDealPrice() != null
                ? tradeSummary.getAvgDealPrice()
                : 0.0;

        return AiClient.DealerBatchItem.builder()
                .dealerId(dealer.getDealerId())
                .lastActivityDays(churn.getLastActivityDays().intValue())
                .recent60dTradeCount(churn.getRecent60dTradeCount().intValue())
                .previousTradeCount(churn.getPreviousTradeCount().intValue())
                .siteUsageRate(churn.getSiteUsageRate())
                .avgSellingPrice(avgSellingPrice)
                .build();
    }

    /**
     * company_churn에 저장된 활동 요약값을 변경하지 않고 FastAPI 요청으로 변환합니다.
     */
    private AiClient.CompanyBatchItem createCompanyBatchItemFromChurn(Company company, CompanyChurn churn) {
        return AiClient.CompanyBatchItem.builder()
                .companyId(company.getCompanyId())
                .dealerCount(churn.getDealerCount().intValue())
                .activeDealerRatio(churn.getActiveDealerRatio())
                .recentTradeCount(churn.getRecentTradeCount().intValue())
                .previousTradeCount(churn.getPreviousTradeCount().intValue())
                .siteUsageRateAvg(churn.getSiteUsageRateAvg())
                .avgSellingPriceAvg(0.0)
                .build();
    }

    private Map<Long, DealerChurn> selectDealerChurnInputs(List<DealerChurn> orderedChurnRows) {
        Map<Long, DealerChurn> latestRows = new LinkedHashMap<>();
        Map<Long, DealerChurn> unprocessedRows = new LinkedHashMap<>();

        for (DealerChurn churn : orderedChurnRows) {
            Long dealerId = churn.getDealer().getDealerId();
            latestRows.putIfAbsent(dealerId, churn);
            if (!hasPredictionResult(churn.getRiskGrade(), churn.getRiskReasons(), churn.getAction())) {
                unprocessedRows.putIfAbsent(dealerId, churn);
            }
        }

        unprocessedRows.forEach(latestRows::put);
        return latestRows;
    }

    private Map<Long, CompanyChurn> selectCompanyChurnInputs(List<CompanyChurn> orderedChurnRows) {
        Map<Long, CompanyChurn> latestRows = new LinkedHashMap<>();
        Map<Long, CompanyChurn> unprocessedRows = new LinkedHashMap<>();

        for (CompanyChurn churn : orderedChurnRows) {
            Long companyId = churn.getCompany().getCompanyId();
            latestRows.putIfAbsent(companyId, churn);
            if (!hasPredictionResult(churn.getRiskGrade(), churn.getRiskReasons(), churn.getAction())) {
                unprocessedRows.putIfAbsent(companyId, churn);
            }
        }

        unprocessedRows.forEach(latestRows::put);
        return latestRows;
    }

    private boolean hasPredictionResult(String riskGrade, String riskReasons, String action) {
        return (riskGrade != null && !riskGrade.isBlank())
                || (riskReasons != null && !riskReasons.isBlank())
                || (action != null && !action.isBlank());
    }

    /**
     * Car 엔티티를 CarDto.Response 포맷으로 매핑하는 내부 도우미 메소드입니다.
     */
    private CarDto.Response mapToCarResponse(Car car) {
        List<CarDto.ImageDto> imageDtos = new ArrayList<>();
        if (car.getImages() != null) {
            imageDtos = car.getImages().stream()
                    .map(img -> CarDto.ImageDto.builder()
                            .imageUrl(img.getImageUrl())
                            .isMain(img.getIsMain())
                            .build())
                    .collect(Collectors.toList());
        }

        String ownerType = null;
        Long ownerId = null;
        String ownerName = null;
        String saleType = null;
        String sellerType = null;
        Boolean goldenBadgeStatus = false;

        if (car.getMember() != null) {
            ownerType = "MEMBER";
            ownerId = car.getMember().getMemberId();
            ownerName = car.getMember().getName();
            saleType = "AUCTION";
            sellerType = "일반회원";
        } else if (car.getDealer() != null) {
            ownerType = "DEALER";
            ownerId = car.getDealer().getDealerId();
            ownerName = car.getDealer().getName();
            saleType = "NORMAL";
            sellerType = "회사딜러";
            if (car.getDealer().getCompany() != null) {
                goldenBadgeStatus = Boolean.TRUE.equals(car.getDealer().getCompany().getGoldenBadgeStatus());
            }
        }

        return CarDto.Response.builder()
                .carId(car.getCarId())
                .year(car.getYear())
                .make(car.getMake())
                .model(car.getModel())
                .option(car.getOption())
                .body(car.getBody())
                .transmission(car.getTransmission())
                .state(car.getState())
                .condition(car.getCondition())
                .odometer(car.getOdometer())
                .color(car.getColor())
                .interior(car.getInterior())
                .sellingPrice(car.getSellingPrice())
                .mmr(car.getMmr())
                .status(car.getStatus())
                .createdAt(car.getCreatedAt())
                .ownerType(ownerType)
                .ownerId(ownerId)
                .ownerName(ownerName)
                .saleType(saleType)
                .sellerType(sellerType)
                .images(imageDtos)
                .goldenBadgeStatus(goldenBadgeStatus)
                .build();
    }

    /**
     * FastAPI /api/ai/vehicle-recommendations API를 호출하여 전달받은 차량들의 Condition과 MMR을 예측하고 DB에 저장합니다.
     */
    @Transactional
    public void predictVehicleConditionAndMmrForCars(List<Car> cars) {
        if (cars == null || cars.isEmpty()) return;

        List<AiClient.VehicleItem> items = cars.stream()
                .map(car -> AiClient.VehicleItem.builder()
                        .carId(car.getCarId())
                        .year(car.getYear())
                        .make(car.getMake())
                        .model(car.getModel())
                        .odometer(car.getOdometer())
                        .option(car.getOption())
                        .body(car.getBody())
                        .color(car.getColor())
                        .sellingPrice(car.getSellingPrice())
                        .state(car.getState())
                        .status(car.getStatus())
                        .ownerType(car.getMember() != null ? "MEMBER" : "DEALER")
                        .build())
                .collect(Collectors.toList());

        try {
            AiClient.VehiclePredictionBatchResponse response = aiClient.predictVehicleConditionAndMmr(items);
            if (response != null && response.getRecommendations() != null) {
                Map<Long, AiClient.VehiclePredictionResult> resultMap = response.getRecommendations().stream()
                        .collect(Collectors.toMap(AiClient.VehiclePredictionResult::getCarId, r -> r, (r1, r2) -> r1));

                for (Car car : cars) {
                    AiClient.VehiclePredictionResult res = resultMap.get(car.getCarId());
                    if (res != null) {
                        if (res.getPredictedCondition() != null) {
                            car.setCondition(res.getPredictedCondition());
                        }
                        if (res.getPredictedMmr() != null) {
                            car.setMmr(res.getPredictedMmr().doubleValue());
                        }
                    }
                }
                carRepository.saveAll(cars);
                log.info("차량 {}대에 대한 FastAPI Condition/MMR 예측 및 DB 저장 완료.", cars.size());
            }
        } catch (Exception e) {
            log.error("차량 Condition/MMR 예측 중 오류 발생 (차량 등록 상태 유지): {}", e.getMessage());
        }
    }

    /**
     * 딜러를 위한 경매 차량 추천 목록을 조회합니다.
     * 일반회원이 등록한 경매 가능 차량(member != null, status == "REGISTERED")을 조회하고
     * FastAPI 또는 DB에서 Condition DESC, MMR DESC 기준으로 정렬하여 반환합니다.
     */
    @Transactional
    public List<CarDto.Response> getRecommendedCarsForDealer(String dealerLoginId) {
        List<Car> auctionCars = carRepository.findByMemberIsNotNullAndDealerIsNullAndStatusOrderByCreatedAtDesc("REGISTERED");

        if (auctionCars.isEmpty()) {
            return new ArrayList<>();
        }

        // Condition 또는 MMR이 미계산된 차량이 포함되어 있는 경우 FastAPI 일괄 예측 구동
        List<Car> uncalculated = auctionCars.stream()
                .filter(c -> c.getCondition() == null || c.getMmr() == null)
                .collect(Collectors.toList());

        if (!uncalculated.isEmpty()) {
            predictVehicleConditionAndMmrForCars(uncalculated);
        }

        // Condition 내림차순, MMR 내림차순 정렬
        auctionCars.sort((c1, c2) -> {
            Double cond1 = c1.getCondition() != null ? c1.getCondition() : 0.0;
            Double cond2 = c2.getCondition() != null ? c2.getCondition() : 0.0;
            int condComp = cond2.compareTo(cond1);
            if (condComp != 0) return condComp;

            Double mmr1 = c1.getMmr() != null ? c1.getMmr() : 0.0;
            Double mmr2 = c2.getMmr() != null ? c2.getMmr() : 0.0;
            return mmr2.compareTo(mmr1);
        });

        return auctionCars.stream()
                .map(this::mapToCarResponse)
                .collect(Collectors.toList());
    }
}
