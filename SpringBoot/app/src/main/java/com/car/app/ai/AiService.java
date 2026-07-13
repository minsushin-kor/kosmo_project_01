package com.car.app.ai;

import com.car.app.auction.AuctionRepository;
import com.car.app.auction.Bid;
import com.car.app.auction.BidRepository;
import com.car.app.car.Car;
import com.car.app.car.CarDto;
import com.car.app.car.CarRepository;
import com.car.app.company.Company;
import com.car.app.company.CompanyRepository;
import com.car.app.coupon.CouponService;
import com.car.app.dealer.Dealer;
import com.car.app.dealer.DealerRepository;
import com.car.app.member.Member;
import com.car.app.transaction.Transaction;
import com.car.app.transaction.TransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

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

        // 4. 조회된 차량 리스트를 CarDto.Response 포맷으로 매핑하여 반환합니다.
        return recommendedCars.stream()
                .map(this::mapToCarResponse)
                .collect(Collectors.toList());
    }

    /**
     * 매일 자정 실행되는 이탈 위험도 예측 및 등급 업데이트 배치 처리 메소드입니다.
     */
    @Transactional
    public void runChurnPredictionBatch() {
        log.info("자정 이탈 위험도 예측 배치 시작...");

        List<Dealer> dealers = dealerRepository.findAll();
        List<Company> companies = companyRepository.findAll();

        // 1. 개별 딜러 이탈 예측 및 업데이트
        for (Dealer dealer : dealers) {
            try {
                // 딜러 활동 특징 가공
                AiClient.DealerFeatures features = calculateDealerFeatures(dealer);

                // FastAPI 호출
                AiClient.ChurnPredictionResponse response = aiClient.predictDealerChurn(features);
                if (response != null && "success".equalsIgnoreCase(response.getStatus())) {
                    double riskScore = response.getChurnProbability() * 100.0;
                    dealer.setRiskScore(riskScore);

                    // 위험 등급 반영 (75점 이상 CARE_REQUIRED, 미만 NORMAL)
                    if (riskScore >= 75.0) {
                        dealer.setTier("CARE_REQUIRED");
                    } else {
                        dealer.setTier("NORMAL");
                    }
                    dealerRepository.save(dealer);
                    log.info("딜러 {} (ID: {})의 이탈 위험도 업데이트 완료: {}점, 등급: {}",
                            dealer.getName(), dealer.getDealerId(), riskScore, dealer.getTier());
                }
            } catch (Exception e) {
                log.error("딜러 {}의 이탈 위험도 예측 중 오류 발생: {}", dealer.getDealerId(), e.getMessage());
            }
        }

        // 2. 상사 이탈 예측 및 업데이트
        for (Company company : companies) {
            try {
                // 상사 소속 딜러 조회
                List<Dealer> companyDealers = dealerRepository.findByCompanyCompanyId(company.getCompanyId());
                if (companyDealers.isEmpty()) {
                    continue;
                }

                // 상사 활동 특징 가공
                AiClient.CompanyFeatures features = calculateCompanyFeatures(company, companyDealers);

                // FastAPI 호출
                AiClient.ChurnPredictionResponse response = aiClient.predictCompanyChurn(features);
                if (response != null && "success".equalsIgnoreCase(response.getStatus())) {
                    double riskScore = response.getChurnProbability() * 100.0;
                    company.setRiskScore(riskScore);

                    // 위험 등급 반영 (70점 이상 CARE_REQUIRED, 미만 NORMAL)
                    if (riskScore >= 70.0) {
                        company.setTier("CARE_REQUIRED");
                    } else {
                        company.setTier("NORMAL");
                    }
                    companyRepository.save(company);
                    log.info("상사 {} (ID: {})의 이탈 위험도 업데이트 완료: {}점, 등급: {}",
                            company.getName(), company.getCompanyId(), riskScore, company.getTier());
                }
            } catch (Exception e) {
                log.error("상사 {}의 이탈 위험도 예측 중 오류 발생: {}", company.getCompanyId(), e.getMessage());
            }
        }

        // 3. 쿠폰 발급 및 골든 뱃지 업데이트 배치 연쇄 호출
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

        log.info("자정 이탈 위험도 예측 배치 완료.");
    }

    /**
     * 특정 딜러의 활동 요약 정보(특징량)를 계산합니다.
     */
    private AiClient.DealerFeatures calculateDealerFeatures(Dealer dealer) {
        Long dealerId = dealer.getDealerId();

        // 1) 거래 내역 조회 (판매자 혹은 구매자가 본인인 경우)
        List<Transaction> sellTx = transactionRepository.findBySellerTypeAndSellerId("DEALER", dealerId);
        List<Transaction> buyTx = transactionRepository.findByBuyerTypeAndBuyerId("DEALER", dealerId);

        List<Transaction> allTx = new ArrayList<>();
        allTx.addAll(sellTx);
        allTx.addAll(buyTx);

        // 2) 최근 60일 거래수 & 이전 거래수 계산
        LocalDateTime sixtyDaysAgo = LocalDateTime.now().minusDays(60);
        int recent60dTradeCount = 0;
        int previousTradeCount = 0;
        double totalPrice = 0.0;

        for (Transaction tx : allTx) {
            if (tx.getCreatedAt() != null) {
                if (tx.getCreatedAt().isAfter(sixtyDaysAgo)) {
                    recent60dTradeCount++;
                } else {
                    previousTradeCount++;
                }
            }
            totalPrice += tx.getDealPrice();
        }

        double avgSellingPrice = allTx.isEmpty() ? 13000000.0 : totalPrice / allTx.size();

        // 3) 사이트 이용률 계산 (딜러의 입찰수 / 전체 경매수)
        List<Bid> bids = bidRepository.findByDealerDealerId(dealerId);
        long bidsCount = bids.size();
        long auctionsCount = auctionRepository.count();
        double siteUsageRate = auctionsCount > 0 ? (double) bidsCount / auctionsCount : 0.5;
        siteUsageRate = Math.min(1.0, Math.max(0.0, siteUsageRate));

        // 4) 마지막 활동 경과일 계산 (입찰 또는 거래의 가장 최근 시각 기준)
        LocalDateTime latestActivity = null;
        for (Bid bid : bids) {
            if (bid.getCreatedAt() != null) {
                if (latestActivity == null || bid.getCreatedAt().isAfter(latestActivity)) {
                    latestActivity = bid.getCreatedAt();
                }
            }
        }
        for (Transaction tx : allTx) {
            if (tx.getCreatedAt() != null) {
                if (latestActivity == null || tx.getCreatedAt().isAfter(latestActivity)) {
                    latestActivity = tx.getCreatedAt();
                }
            }
        }

        int lastActivityDays = 180; // 활동 기록 없으면 180일로 지정
        if (latestActivity != null) {
            long days = ChronoUnit.DAYS.between(latestActivity, LocalDateTime.now());
            lastActivityDays = (int) Math.max(0, days);
        }

        return AiClient.DealerFeatures.builder()
                .lastActivityDays(lastActivityDays)
                .recent60dTradeCount(recent60dTradeCount)
                .previousTradeCount(previousTradeCount)
                .siteUsageRate(siteUsageRate)
                .avgSellingPrice(avgSellingPrice)
                .build();
    }

    /**
     * 특정 상사의 소속 딜러들의 활동 정보 요약(상사 특징량)을 계산합니다.
     */
    private AiClient.CompanyFeatures calculateCompanyFeatures(Company company, List<Dealer> companyDealers) {
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
            AiClient.DealerFeatures df = calculateDealerFeatures(d);
            totalRecentTrade += df.getRecent60dTradeCount();
            totalPreviousTrade += df.getPreviousTradeCount();
            sumSiteUsageRate += df.getSiteUsageRate();
            sumAvgSellingPrice += df.getAvgSellingPrice();
        }

        double siteUsageRateAvg = dealerCount > 0 ? sumSiteUsageRate / dealerCount : 0.5;
        double avgSellingPriceAvg = dealerCount > 0 ? sumAvgSellingPrice / dealerCount : 13000000.0;

        return AiClient.CompanyFeatures.builder()
                .dealerCount(dealerCount)
                .activeDealerRatio(activeDealerRatio)
                .recentTradeCount(totalRecentTrade)
                .previousTradeCount(totalPreviousTrade)
                .siteUsageRateAvg(siteUsageRateAvg)
                .avgSellingPriceAvg(avgSellingPriceAvg)
                .build();
    }

    /**
     * Car 엔티티를 CarDto.Response DTO 객체로 안전하게 매핑합니다.
     */
    private CarDto.Response mapToCarResponse(Car car) {
        Object owner = car.getOwner();
        Long ownerId = null;
        String ownerName = null;
        if (owner instanceof Member) {
            ownerId = ((Member) owner).getMemberId();
            ownerName = ((Member) owner).getName();
        } else if (owner instanceof Dealer) {
            ownerId = ((Dealer) owner).getDealerId();
            ownerName = ((Dealer) owner).getName();
        }

        List<CarDto.ImageDto> imageDtos = car.getImages().stream()
                .map(img -> CarDto.ImageDto.builder()
                        .imageUrl(img.getImageUrl())
                        .isMain(img.getIsMain())
                        .build())
                .collect(Collectors.toList());

        // 골든 뱃지 혜택 적용을 위한 상사 골든 뱃지 상태 매핑
        boolean goldenBadgeStatus = false;
        if (car.getDealer() != null) {
            goldenBadgeStatus = car.getDealer().getCompany().getGoldenBadgeStatus();
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
                .status(car.getStatus())
                .ownerType(car.getOwnerType())
                .ownerId(ownerId)
                .ownerName(ownerName)
                .images(imageDtos)
                .goldenBadgeStatus(goldenBadgeStatus)
                .build();
    }
}
