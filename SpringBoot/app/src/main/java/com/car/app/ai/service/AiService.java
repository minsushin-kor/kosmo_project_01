package com.car.app.ai.service;

import com.car.app.ai.client.AiClient;
import com.car.app.auction.repository.AuctionRepository;
import com.car.app.auction.repository.BidRepository;
import com.car.app.car.entity.Car;
import com.car.app.car.dto.CarDto;
import com.car.app.car.repository.CarRepository;
import com.car.app.company.entity.Company;
import com.car.app.company.repository.CompanyRepository;
import com.car.app.coupon.service.CouponService;
import com.car.app.dealer.entity.Dealer;
import com.car.app.dealer.repository.DealerRepository;
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
    private final CouponService couponService;
    private final DealerChurnRepository dealerChurnRepository;
    private final CompanyChurnRepository companyChurnRepository;

    /**
     * 현재 로그인한 딜러를 위한 AI 추천 차량 목록을 상세 DTO 포맷으로 가공하여 조회합니다.


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

        // 1. 매일 자정 원본 DB(거래, 입찰)에서 실시간 최신 지표 집계
        LocalDateTime sixtyDaysAgo = LocalDateTime.now().minusDays(60);

        List<TransactionRepository.DealerTradeSummary> tradeSummaries = transactionRepository.getDealerTradeSummaries(sixtyDaysAgo);
        Map<Long, TransactionRepository.DealerTradeSummary> tradeMap = tradeSummaries.stream()
                .collect(Collectors.toMap(TransactionRepository.DealerTradeSummary::getDealerId, t -> t, (t1, t2) -> t1));

        List<BidRepository.DealerBidSummary> bidSummaries = bidRepository.getDealerBidSummaries();
        Map<Long, BidRepository.DealerBidSummary> bidMap = bidSummaries.stream()
                .collect(Collectors.toMap(BidRepository.DealerBidSummary::getDealerId, b -> b, (b1, b2) -> b1));

        long totalAuctionsCount = auctionRepository.count();

        // 2. 실시간 집계 지표로 FastAPI 송신용 뱃치 아이템 조립
        Map<Long, AiClient.DealerBatchItem> dealerItemMap = new HashMap<>();
        List<AiClient.DealerBatchItem> dealerBatchItems = new ArrayList<>();

        for (Dealer dealer : dealers) {
            AiClient.DealerBatchItem item = createDealerBatchItemInMemory(dealer, tradeMap.get(dealer.getDealerId()), bidMap.get(dealer.getDealerId()), totalAuctionsCount);
            dealerBatchItems.add(item);
            dealerItemMap.put(dealer.getDealerId(), item);
        }

        Map<Long, AiClient.CompanyBatchItem> companyItemMap = new HashMap<>();
        List<AiClient.CompanyBatchItem> companyBatchItems = new ArrayList<>();
        for (Company company : companies) {
            AiClient.CompanyBatchItem item = createCompanyBatchItemInMemory(company, dealerItemMap);
            companyBatchItems.add(item);
            companyItemMap.put(company.getCompanyId(), item);
        }

        AiClient.BatchChurnRequest batchRequest = AiClient.BatchChurnRequest.builder()
                .dealers(dealerBatchItems)
                .companies(companyBatchItems)
                .build();

        // 3. FastAPI 서버 단일 뱃치 API 호출 (1회 통신)
        AiClient.BatchChurnResponse batchResponse = aiClient.predictBatchChurn(batchRequest);

        LocalDateTime now = LocalDateTime.now();

        if (batchResponse != null && "success".equalsIgnoreCase(batchResponse.getStatus())) {
            List<DealerChurn> dealerChurnSnapshots = new ArrayList<>();
            List<CompanyChurn> companyChurnSnapshots = new ArrayList<>();

            // 4. 딜러 이탈 예측 결과 DB 반영 및 dealer_churn 스냅샷 저장
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

                        String reasonsStr = (pred.getRiskReasons() != null && !pred.getRiskReasons().isEmpty())
                                ? String.join(", ", pred.getRiskReasons())
                                : "활동 특이사항 없음";

                        if (item != null) {
                            dealerChurnSnapshots.add(DealerChurn.builder()
                                    .dealer(dealer)
                                    .lastActivityDays((long) item.getLastActivityDays())
                                    .recent60dTradeCount((long) item.getRecent60dTradeCount())
                                    .previousTradeCount((long) item.getPreviousTradeCount())
                                    .siteUsageRate(item.getSiteUsageRate())
                                    .riskGrade(pred.getRiskGrade())
                                    .riskReasons(reasonsStr)
                                    .action(pred.getAction())
                                    .calculatedAt(now)
                                    .build());
                        }
                    }
                }
                dealerRepository.saveAll(dealers);
                if (!dealerChurnSnapshots.isEmpty()) {
                    dealerChurnRepository.saveAll(dealerChurnSnapshots);
                }
                log.info("딜러 전체 {}명의 이탈 위험도 점수, 등급 및 스냅샷 일괄 저장 완료.", dealers.size());
            }

            // 5. 상사 이탈 예측 결과 DB 반영 및 company_churn 스냅샷 저장
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
                        // (이후 updateCompanyTiersAndBadges에서 상위 5% 실적 상사만 TOP_5로 덮어쓰고, 탈락 상사는 CARE_REQUIRED/NORMAL을 보존)
                        company.setTier(riskScore >= 70.0 ? "CARE_REQUIRED" : "NORMAL");
                        company.setRiskGrade(pred.getRiskGrade());

                        String reasonsStr = (pred.getRiskReasons() != null && !pred.getRiskReasons().isEmpty())
                                ? String.join(", ", pred.getRiskReasons())
                                : "활동 특이사항 없음";

                        if (item != null) {
                            companyChurnSnapshots.add(CompanyChurn.builder()
                                    .company(company)
                                    .dealerCount((long) item.getDealerCount())
                                    .activeDealerRatio(item.getActiveDealerRatio())
                                    .recentTradeCount((long) item.getRecentTradeCount())
                                    .previousTradeCount((long) item.getPreviousTradeCount())
                                    .siteUsageRateAvg(item.getSiteUsageRateAvg())
                                    .riskGrade(pred.getRiskGrade())
                                    .riskReasons(reasonsStr)
                                    .action(pred.getAction())
                                    .calculatedAt(now)
                                    .build());
                        }
                    }
                }
                companyRepository.saveAll(companies);
                if (!companyChurnSnapshots.isEmpty()) {
                    companyChurnRepository.saveAll(companyChurnSnapshots);
                }
                log.info("상사 전체 {}개의 이탈 위험도 점수, 등급 및 스냅샷 일괄 저장 완료.", companies.size());
            }

            // 이탈 방지 쿠폰은 관리자 화면에서 수동으로만 발급합니다.
            try {
                log.info("상위 5% 상사 골든 뱃지 갱신 배치 실행...");
                couponService.updateCompanyTiersAndBadges();
            } catch (Exception e) {
                log.error("상위 5% 상사 골든 뱃지 갱신 중 오류 발생: {}", e.getMessage());
            }

        } else {
            log.warn("FastAPI 이탈 예측 뱃치 응답이 비어있거나 실패하여 이탈 등급과 골든 뱃지 갱신을 보류합니다.");
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
