package com.car.app.ai;

import com.car.app.car.Car;
import com.car.app.car.CarDto;
import com.car.app.car.CarRepository;
import com.car.app.dealer.Dealer;
import com.car.app.dealer.DealerRepository;
import com.car.app.member.Member;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
            log.info("Recommended cars empty or not found in DB. Falling back to latest 5 cars.");
            recommendedCars = carRepository.findTop5ByOrderByCreatedAtDesc();
        }

        // 4. 조회된 차량 리스트를 CarDto.Response 포맷으로 매핑하여 반환합니다.
        return recommendedCars.stream()
                .map(this::mapToCarResponse)
                .collect(Collectors.toList());
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
