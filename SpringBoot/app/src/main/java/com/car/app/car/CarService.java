package com.car.app.car;

import com.car.app.dealer.Dealer;
import com.car.app.dealer.DealerRepository;
import com.car.app.member.Member;
import com.car.app.member.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

/**
 * 중고차 매물 등록 및 다중 이미지 업로드를 관장하는 서비스 클래스입니다.
 */
@Service
@RequiredArgsConstructor
public class CarService {

    private final CarRepository carRepository;
    private final CarImageRepository carImageRepository;
    private final MemberRepository memberRepository;
    private final DealerRepository dealerRepository;
    private final com.car.app.auction.AuctionRepository auctionRepository;

    /**
     * 중고차 매물 및 차량 이미지들을 등록하는 트랜잭션 메서드입니다.
     * 일반 회원이 등록할 경우 경매 세션이 자동으로 연결되어 개설됩니다.
     *
     * @param username    로그인한 사용자 ID (이메일 혹은 로그인 ID)
     * @param authorities 로그인한 사용자의 보안 역할 권한 목록
     * @param request     차량 스펙 및 이미지 정보가 포함된 DTO
     * @return 저장 및 경매 연계가 완료된 Car 엔티티
     */
    @Transactional
    public Car registerCar(String username, Collection<? extends GrantedAuthority> authorities, CarDto.CreateRequest request) {
        Member memberOwner = null;
        Dealer dealerOwner = null;

        // 1단계: 로그인 세션 정보의 권한을 파싱하여 일반 회원인지 딜러인지 판별
        boolean isMember = authorities.stream().anyMatch(a -> a.getAuthority().equals("ROLE_MEMBER"));
        boolean isDealer = authorities.stream().anyMatch(a -> a.getAuthority().equals("ROLE_DEALER"));

        if (isMember) {
            // 회원인 경우: 이메일로 회원 엔티티 로드
            memberOwner = memberRepository.findByEmail(username)
                    .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 회원 계정입니다."));
        } else if (isDealer) {
            // 딜러인 경우: 로그인 ID로 딜러 엔티티 로드
            dealerOwner = dealerRepository.findByLoginId(username)
                    .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 딜러 계정입니다."));
        } else {
            // 권한 미달인 경우 가로채서 예외 발생
            throw new SecurityException("차량을 등록할 권한이 없습니다. 일반 회원 또는 딜러만 등록이 가능합니다.");
        }

        // 2단계: 식별된 소유주(다형성 외래키) 정보를 바인딩하여 차량 엔티티 빌드
        Car car = Car.builder()
                .member(memberOwner)
                .dealer(dealerOwner)
                .year(request.getYear())
                .make(request.getMake())
                .model(request.getModel())
                .option(request.getOption())
                .body(request.getBody())
                .transmission(request.getTransmission())
                .state(request.getState())
                .condition(request.getCondition())
                .odometer(request.getOdometer())
                .color(request.getColor())
                .interior(request.getInterior())
                .sellingPrice(request.getSellingPrice())
                .status("REGISTERED") // 최초 등록 완료 상태
                .images(new ArrayList<>())
                .build();

        // 3단계: 차량 기본 정보 DB 저장
        Car savedCar = carRepository.save(car);

        // 4단계: 다중 이미지 첨부 및 대표 이미지(isMain) 지정 로직 수행
        List<CarDto.ImageDto> requestImages = request.getImages();
        if (requestImages != null && !requestImages.isEmpty()) {
            // 요청온 사진 중 명시적인 대표(Main) 이미지가 있는지 검사
            boolean hasMain = requestImages.stream().anyMatch(img -> img.getIsMain() != null && img.getIsMain());
            
            for (int i = 0; i < requestImages.size(); i++) {
                CarDto.ImageDto imgDto = requestImages.get(i);
                boolean isMain = imgDto.getIsMain() != null && imgDto.getIsMain();
                
                // 만약 클라이언트가 대표 이미지를 아무것도 선택 안 했다면 첫 번째 이미지를 대표로 자동 설정
                if (!hasMain && i == 0) {
                    isMain = true;
                }

                CarImage carImage = CarImage.builder()
                        .car(savedCar)
                        .imageUrl(imgDto.getImageUrl())
                        .isMain(isMain)
                        .build();

                carImageRepository.save(carImage);
                savedCar.getImages().add(carImage);
            }
        }

        // 5단계: [비즈니스 요건 연계] 차량 소유주가 일반 회원인 경우 경매 세션 개설 및 유효성 검증
        if (memberOwner != null) {
            java.time.LocalDateTime startTime = request.getStartTime();
            java.time.LocalDateTime endTime = request.getEndTime();

            if (startTime == null || endTime == null) {
                throw new IllegalArgumentException("일반 회원이 차량을 등록할 때는 경매 시작 시간과 종료 시간을 반드시 입력해야 합니다.");
            }

            // 시작 시간 검증 (현재 시간 기준 5분 이전이 아닌지 검사하여 서버 지연 시간 등 감안)
            if (startTime.isBefore(java.time.LocalDateTime.now().minusMinutes(5))) {
                throw new IllegalArgumentException("경매 시작 시간은 현재 시간 이전일 수 없습니다.");
            }

            // 종료 시간 검증 (시작 시간 이후인지 확인)
            if (endTime.isBefore(startTime) || endTime.isEqual(startTime)) {
                throw new IllegalArgumentException("경매 종료 시간은 시작 시간 이후여야 합니다.");
            }

            // 경매 기간 검증 (최대 3일 - 72시간 제한)
            long hoursBetween = java.time.Duration.between(startTime, endTime).toHours();
            if (hoursBetween > 72) {
                throw new IllegalArgumentException("경매 기간은 최대 3일(72시간)을 초과할 수 없습니다.");
            }

            com.car.app.auction.Auction auction = com.car.app.auction.Auction.builder()
                    .car(savedCar)
                    .startTime(startTime)
                    .endTime(endTime)
                    .status("ACTIVE")
                    .build();
            auctionRepository.save(auction);
        }

        return savedCar;
    }

    /**
     * 다중 필터와 페이징을 지원하는 차량 목록 검색 메서드입니다.
     */
    @Transactional(readOnly = true)
    public Page<Car> searchCars(String make, String model, String transmission, String state, String status,
                               Long minPrice, Long maxPrice, Integer minYear, Integer maxYear, Pageable pageable) {
        Specification<Car> spec = (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (StringUtils.hasText(make)) {
                predicates.add(criteriaBuilder.equal(root.get("make"), make));
            }
            if (StringUtils.hasText(model)) {
                predicates.add(criteriaBuilder.equal(root.get("model"), model));
            }
            if (StringUtils.hasText(transmission)) {
                predicates.add(criteriaBuilder.equal(root.get("transmission"), transmission));
            }
            if (StringUtils.hasText(state)) {
                predicates.add(criteriaBuilder.equal(root.get("state"), state));
            }
            if (StringUtils.hasText(status)) {
                predicates.add(criteriaBuilder.equal(root.get("status"), status));
            }
            if (minPrice != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("sellingPrice"), minPrice));
            }
            if (maxPrice != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("sellingPrice"), maxPrice));
            }
            if (minYear != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("year"), minYear));
            }
            if (maxYear != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("year"), maxYear));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };

        return carRepository.findAll(spec, pageable);
    }
}
