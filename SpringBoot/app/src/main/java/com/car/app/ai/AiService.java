package com.car.app.ai;

import com.car.app.auction.AuctionRepository;
import com.car.app.auction.BidRepository;
import com.car.app.car.Car;
import com.car.app.car.CarDto;
import com.car.app.car.CarRepository;
import com.car.app.company.Company;
import com.car.app.company.CompanyRepository;
import com.car.app.coupon.CouponService;
import com.car.app.dealer.Dealer;
import com.car.app.dealer.DealerRepository;
import com.car.app.transaction.TransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

import com.car.app.company.CompanyChurn;
import com.car.app.company.CompanyChurnRepository;
import com.car.app.dealer.DealerChurn;
import com.car.app.dealer.DealerChurnRepository;

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
    private final CouponService couponService;
    private final DealerChurnRepository dealerChurnRepository;
    private final CompanyChurnRepository companyChurnRepository;

    /**
     * 현재 로그인한 딜러를 위한 AI 추천 차량 목록을 상세 DTO 포맷으로 가공하여 조회합니다.
     *
     * @param dealerLoginId 로그인한 딜러의 ID
     * @return 추천 차량 상세 목록
     */
    @Transactional(readOnly = true)
    public List<CarDto.Response> getRecommendationsForDealer(String dealerLoginId) {
        Dealer dealer = dealerRepository.findByLoginId(dealerLoginId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 딜러 계정입니다."));

        // 1. FastAPI 클라이언트를 통해 추천 차량 ID 목록을 가져옵니다.
        List<Long> recommendedCarIds = aiClient.getRecommendedCarIds(dealer.getDealerId());

        // 2. ID에 해당하는 차량을 DB에서 조회합니다.
        List<Car> recommendedCars = carRepository.findAllById(recommendedCarIds);

        // 3. 만약 추천받은 매물이 DB에 없거나 비어있는 경우, 최신 매물 5개를 안전용 대체(Fallback) 리스트로 조회합니다.
        if (recommendedCars.isEmpty()) {
            log.info("추천 차량 목록이 비어있거나 DB에서 매핑되는 차량이 없습니다. 최신 매물 5개로 대체하여 추천합니다.");
            recommendedCars = carRepository.findTop5ByOrderByCreatedAtDesc();
        }

        // 4. DTO로 변환하여 응답합니다.
        return recommendedCars.stream()
                .map(this::mapToCarResponse)
                .collect(Collectors.toList());
    }

    /**
     * 일반 구매자 추천 조건을 받아 DB에서 판매 가능한 딜러 차량 전체를 조회한 후,
     * preferences와 vehicles 후보 목록을 조립하여 FastAPI에 전달하고 추천 연산 결과를 반환합니다.
     */
    @Transactional(readOnly = true)
    public Object recommendVehiclesForBuyer(Object preferences) {
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
                        .color(car.getColor())
                        .sellingPrice(car.getSellingPrice())
                        .state(car.getState())
                        .status(car.getStatus())
                        .ownerType(car.getOwnerType())
                        .build())
                .collect(Collectors.toList());

        // 3. FastAPI 요청 객체 조립
        AiClient.BuyerRecommendApiRequest apiRequest = AiClient.BuyerRecommendApiRequest.builder()
                .preferences(preferences)
                .vehicles(vehicleItems)
                .build();

        // 4. FastAPI 호출 및 결과 전달
        return aiClient.recommendVehiclesForBuyer(apiRequest);
    }

    /**
     * 매일 자정 실행되는 이탈 위험도 예측 및 등급 업데이트 배치 처리 메소드입니다.
     * SQL GROUP BY 단일 집계 쿼리로 DB 조회를 최소화(2회)하고 FastAPI 뱃치 API를 호출 후 saveAll()로 일괄 저장합니다.
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

        // 1. 반복 DB 조회(N+1) 방지: SQL GROUP BY 집계 쿼리로 거래 및 입찰 데이터를 단 2회 쿼리로 일괄 수집
        LocalDateTime sixtyDaysAgo = LocalDateTime.now().minusDays(60);

        List<TransactionRepository.DealerTradeSummary> tradeSummaries = transactionRepository.getDealerTradeSummaries(sixtyDaysAgo);
        Map<Long, TransactionRepository.DealerTradeSummary> tradeMap = tradeSummaries.stream()
                .collect(Collectors.toMap(TransactionRepository.DealerTradeSummary::getDealerId, t -> t, (t1, t2) -> t1));

        List<BidRepository.DealerBidSummary> bidSummaries = bidRepository.getDealerBidSummaries();
        Map<Long, BidRepository.DealerBidSummary> bidMap = bidSummaries.stream()
                .collect(Collectors.toMap(BidRepository.DealerBidSummary::getDealerId, b -> b, (b1, b2) -> b1));

        long totalAuctionsCount = auctionRepository.count();

        // 2. 메모리 상에서 딜러 및 상사 뱃지 요청 객체 조립 (DB 쿼리 발생 0회)
        Map<Long, AiClient.DealerBatchItem> dealerItemMap = new HashMap<>();
        List<AiClient.DealerBatchItem> dealerBatchItems = new ArrayList<>();
        List<DealerChurn> newDealerChurns = new ArrayList<>();

        for (Dealer dealer : dealers) {
            AiClient.DealerBatchItem item = createDealerBatchItemInMemory(dealer, tradeMap.get(dealer.getDealerId()), bidMap.get(dealer.getDealerId()), totalAuctionsCount);
            dealerBatchItems.add(item);
            dealerItemMap.put(dealer.getDealerId(), item);

            // dealer_churn 레코드가 없는 신규 딜러의 경우 활동 지표 스냅샷을 dealer_churn 테이블에 자동 생성
            if (!dealerChurnRepository.findFirstByDealerDealerIdOrderByCalculatedAtDesc(dealer.getDealerId()).isPresent()) {
                newDealerChurns.add(DealerChurn.builder()
                        .dealer(dealer)
                        .lastActivityDays((long) item.getLastActivityDays())
                        .recent60dTradeCount((long) item.getRecent60dTradeCount())
                        .previousTradeCount((long) item.getPreviousTradeCount())
                        .siteUsageRate(item.getSiteUsageRate())
                        .calculatedAt(LocalDateTime.now())
                        .build());
            }
        }
        if (!newDealerChurns.isEmpty()) {
            dealerChurnRepository.saveAll(newDealerChurns);
        }

        List<AiClient.CompanyBatchItem> companyBatchItems = new ArrayList<>();
        List<CompanyChurn> newCompanyChurns = new ArrayList<>();

        for (Company company : companies) {
            AiClient.CompanyBatchItem item = createCompanyBatchItemInMemory(company, dealerItemMap);
            companyBatchItems.add(item);

            // company_churn 레코드가 없는 신규 상사의 경우 요약 지표 스냅샷을 company_churn 테이블에 자동 생성
            if (!companyChurnRepository.findFirstByCompanyCompanyIdOrderByCalculatedAtDesc(company.getCompanyId()).isPresent()) {
                newCompanyChurns.add(CompanyChurn.builder()
                        .company(company)
                        .dealerCount((long) item.getDealerCount())
                        .activeDealerRatio(item.getActiveDealerRatio())
                        .recentTradeCount((long) item.getRecentTradeCount())
                        .previousTradeCount((long) item.getPreviousTradeCount())
                        .siteUsageRateAvg(item.getSiteUsageRateAvg())
                        .calculatedAt(LocalDateTime.now())
                        .build());
            }
        }
        if (!newCompanyChurns.isEmpty()) {
            companyChurnRepository.saveAll(newCompanyChurns);
        }

        AiClient.BatchChurnRequest batchRequest = AiClient.BatchChurnRequest.builder()
                .dealers(dealerBatchItems)
                .companies(companyBatchItems)
                .build();

        // 3. FastAPI 서버 단일 뱃치 API 호출 (1회 통신)
        AiClient.BatchChurnResponse batchResponse = aiClient.predictBatchChurn(batchRequest);

        if (batchResponse != null && "success".equalsIgnoreCase(batchResponse.getStatus())) {
            // 4. 딜러 이탈 예측 결과 반영 및 saveAll() 일괄 저장
            if (batchResponse.getDealerPredictions() != null) {
                Map<Long, AiClient.DealerPredictionResult> dealerPredMap = batchResponse.getDealerPredictions().stream()
                        .collect(Collectors.toMap(AiClient.DealerPredictionResult::getDealerId, p -> p, (p1, p2) -> p1));

                for (Dealer dealer : dealers) {
                    AiClient.DealerPredictionResult pred = dealerPredMap.get(dealer.getDealerId());
                    if (pred != null) {
                        double riskScore = pred.getChurnProbability() * 100.0;
                        dealer.setRiskScore(riskScore);
                        dealer.setTier(riskScore >= 75.0 ? "CARE_REQUIRED" : "NORMAL");
                    }
                }
                dealerRepository.saveAll(dealers);
                log.info("딜러 전체 {}명의 이탈 위험도 점수 및 등급 일괄 저장(saveAll) 완료.", dealers.size());
            }

            // 5. 상사 이탈 예측 결과 반영 및 saveAll() 일괄 저장
            if (batchResponse.getCompanyPredictions() != null) {
                Map<Long, AiClient.CompanyPredictionResult> companyPredMap = batchResponse.getCompanyPredictions().stream()
                        .collect(Collectors.toMap(AiClient.CompanyPredictionResult::getCompanyId, p -> p, (p1, p2) -> p1));

                for (Company company : companies) {
                    AiClient.CompanyPredictionResult pred = companyPredMap.get(company.getCompanyId());
                    if (pred != null) {
                        double riskScore = pred.getChurnProbability() * 100.0;
                        company.setRiskScore(riskScore);
                        company.setTier(riskScore >= 70.0 ? "CARE_REQUIRED" : "NORMAL");
                    }
                }
                companyRepository.saveAll(companies);
                log.info("상사 전체 {}개의 이탈 위험도 점수 및 등급 일괄 저장(saveAll) 완료.", companies.size());
            }
        } else {
            log.warn("FastAPI 이탈 예측 뱃치 응답이 비어있거나 실패하여 기본 뱃치 저장을 보류합니다.");
        }

        // 6. 이탈 방지 쿠폰 자동 발급 및 골든 뱃지 갱신 배치 연쇄 호출
        try {
            log.info("이탈 방지 쿠폰 자동 발급 배치 실행...");
            couponService.issueRiskCoupons();
        } catch (Exception e) {
            log.error("이탈 방지 쿠폰 자동 발급 중 오류 발생: {}", e.getMessage());
        }

        try {
            log.info("상위 5% 상사 골든 뱃지 갱신 배치 실행...");
            couponService.updateCompanyTiersAndBadges();
        } catch (Exception e) {
            log.error("상위 5% 상사 골든 뱃지 갱신 중 오류 발생: {}", e.getMessage());
        }

        log.info("자정 이탈 위험도 예측 뱃치 연산 완료.");
    }

    /**
     * DB 추가 쿼리 없이 메모리 상의 집계 요약 정보(Projection Map)로 딜러 요약 아이템을 조립합니다.
     */
    private AiClient.DealerBatchItem createDealerBatchItemInMemory(Dealer dealer,
                                                                   TransactionRepository.DealerTradeSummary tradeSummary,
                                                                   BidRepository.DealerBidSummary bidSummary,
                                                                   long totalAuctionsCount) {
        // 1. dealer_churn 테이블에 수집된 분석 지표 데이터가 존재하는지 먼저 확인
        Optional<DealerChurn> churnOpt = dealerChurnRepository.findFirstByDealerDealerIdOrderByCalculatedAtDesc(dealer.getDealerId());
        if (churnOpt.isPresent()) {
            DealerChurn churn = churnOpt.get();
            return AiClient.DealerBatchItem.builder()
                    .dealerId(dealer.getDealerId())
                    .lastActivityDays(churn.getLastActivityDays().intValue())
                    .recent60dTradeCount(churn.getRecent60dTradeCount().intValue())
                    .previousTradeCount(churn.getPreviousTradeCount().intValue())
                    .siteUsageRate(churn.getSiteUsageRate())
                    .avgSellingPrice(13000000.0)
                    .build();
        }

        // 2. dealer_churn 레코드가 없는 경우 거래/입찰 테이블 실시간 집계값 사용 (Fallback)
        int recent60dTradeCount = (tradeSummary != null && tradeSummary.getRecent60dTradeCount() != null) ? tradeSummary.getRecent60dTradeCount().intValue() : 0;
        int previousTradeCount = (tradeSummary != null && tradeSummary.getPreviousTradeCount() != null) ? tradeSummary.getPreviousTradeCount().intValue() : 0;
        double avgSellingPrice = (tradeSummary != null && tradeSummary.getAvgDealPrice() != null) ? tradeSummary.getAvgDealPrice() : 13000000.0;

        long bidsCount = (bidSummary != null && bidSummary.getBidCount() != null) ? bidSummary.getBidCount() : 0L;
        double siteUsageRate = totalAuctionsCount > 0 ? (double) bidsCount / totalAuctionsCount : 0.5;
        siteUsageRate = Math.min(1.0, Math.max(0.0, siteUsageRate));

        LocalDateTime latestActivity = null;
        if (bidSummary != null && bidSummary.getLatestBidTime() != null) {
            latestActivity = bidSummary.getLatestBidTime();
        }
        if (tradeSummary != null && tradeSummary.getLatestTradeTime() != null) {
            if (latestActivity == null || tradeSummary.getLatestTradeTime().isAfter(latestActivity)) {
                latestActivity = tradeSummary.getLatestTradeTime();
            }
        }

        int lastActivityDays = 180;
        if (latestActivity != null) {
            long days = ChronoUnit.DAYS.between(latestActivity, LocalDateTime.now());
            lastActivityDays = (int) Math.max(0, days);
        }

        return AiClient.DealerBatchItem.builder()
                .dealerId(dealer.getDealerId())
                .lastActivityDays(lastActivityDays)
                .recent60dTradeCount(recent60dTradeCount)
                .previousTradeCount(previousTradeCount)
                .siteUsageRate(siteUsageRate)
                .avgSellingPrice(avgSellingPrice)
                .build();
    }

    /**
     * DB 추가 쿼리 없이 소속 딜러들의 맵 항목으로 상사 요약 아이템을 조립합니다.
     */
    private AiClient.CompanyBatchItem createCompanyBatchItemInMemory(Company company, Map<Long, AiClient.DealerBatchItem> dealerItemMap) {
        // 1. company_churn 테이블에 수집된 분석 지표 데이터가 존재하는지 먼저 확인
        Optional<CompanyChurn> churnOpt = companyChurnRepository.findFirstByCompanyCompanyIdOrderByCalculatedAtDesc(company.getCompanyId());
        if (churnOpt.isPresent()) {
            CompanyChurn churn = churnOpt.get();
            return AiClient.CompanyBatchItem.builder()
                    .companyId(company.getCompanyId())
                    .dealerCount(churn.getDealerCount().intValue())
                    .activeDealerRatio(churn.getActiveDealerRatio())
                    .recentTradeCount(churn.getRecentTradeCount().intValue())
                    .previousTradeCount(churn.getPreviousTradeCount().intValue())
                    .siteUsageRateAvg(churn.getSiteUsageRateAvg())
                    .avgSellingPriceAvg(13000000.0)
                    .build();
        }

        // 2. company_churn 레코드가 없는 경우 소속 딜러 맵 집계값 사용 (Fallback)
        List<Dealer> companyDealers = dealerRepository.findByCompanyCompanyId(company.getCompanyId());
        int dealerCount = companyDealers.size();
        long activeCount = companyDealers.stream()
                .filter(d -> "ACTIVE".equalsIgnoreCase(d.getStatus()))
                .count();
        double activeDealerRatio = dealerCount > 0 ? (double) activeCount / dealerCount : 0.0;

        int totalRecentTrade = 0;
        int totalPreviousTrade = 0;
        double sumSiteUsageRate = 0.0;
        double sumAvgSellingPrice = 0.0;

        for (Dealer d : companyDealers) {
            AiClient.DealerBatchItem df = dealerItemMap.get(d.getDealerId());
            if (df != null) {
                totalRecentTrade += df.getRecent60dTradeCount();
                totalPreviousTrade += df.getPreviousTradeCount();
                sumSiteUsageRate += df.getSiteUsageRate();
                sumAvgSellingPrice += df.getAvgSellingPrice();
            }
        }

        double siteUsageRateAvg = dealerCount > 0 ? sumSiteUsageRate / dealerCount : 0.0;
        double avgSellingPriceAvg = dealerCount > 0 ? sumAvgSellingPrice / dealerCount : 13000000.0;

        return AiClient.CompanyBatchItem.builder()
                .companyId(company.getCompanyId())
                .dealerCount(dealerCount)
                .activeDealerRatio(activeDealerRatio)
                .recentTradeCount(totalRecentTrade)
                .previousTradeCount(totalPreviousTrade)
                .siteUsageRateAvg(siteUsageRateAvg)
                .avgSellingPriceAvg(avgSellingPriceAvg)
                .build();
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
}
