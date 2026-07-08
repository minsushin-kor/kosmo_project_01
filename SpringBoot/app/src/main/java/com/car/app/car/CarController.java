package com.car.app.car;

import com.car.app.dealer.Dealer;
import com.car.app.member.Member;
import com.car.app.security.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 중고차 매물 등록과 관련된 HTTP 요청을 수신하는 REST 컨트롤러입니다.
 */
@RestController
@RequestMapping("/api/cars")
@RequiredArgsConstructor
public class CarController {

    private final CarService carService;

    /**
     * 일반 회원 혹은 딜러 권한을 확인하여 새로운 중고차 매물을 등록합니다.
     * 일반 회원이 등록할 경우 내부적으로 3시간 경매 세션이 자동 생성됩니다.
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('MEMBER', 'DEALER')")
    public ResponseEntity<ApiResponse<CarDto.Response>> registerCar(@RequestBody CarDto.CreateRequest request) {
        try {
            // 현재 로그인된 사용자의 인증 정보 획득
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String username = authentication.getName();
            
            // 차량 등록 비즈니스 로직 수행
            Car car = carService.registerCar(username, authentication.getAuthorities(), request);

            // 소유주 정보 추출 (일반 회원 또는 딜러 다형성 처리)
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

            // 이미지 엔티티 목록을 응답용 DTO로 매핑
            List<CarDto.ImageDto> imageDtos = car.getImages().stream()
                    .map(img -> CarDto.ImageDto.builder()
                            .imageUrl(img.getImageUrl())
                            .isMain(img.getIsMain())
                            .build())
                    .collect(Collectors.toList());

            // 최종 API 응답 포맷 조립
            CarDto.Response response = CarDto.Response.builder()
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
                    .build();

            return ResponseEntity.ok(ApiResponse.success(response, "중고차 매물이 성공적으로 등록되었습니다."));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(ApiResponse.fail("ERR_UNAUTHORIZED", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.fail("ERR_INVALID_REQUEST", e.getMessage()));
        }
    }

    /**
     * 다중 필터 검색 및 페이징이 포함된 차량 목록을 조회합니다.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<CarDto.Response>>> getCars(
            @RequestParam(required = false) String make,
            @RequestParam(required = false) String model,
            @RequestParam(required = false) String transmission,
            @RequestParam(required = false) String state,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long minPrice,
            @RequestParam(required = false) Long maxPrice,
            @RequestParam(required = false) Integer minYear,
            @RequestParam(required = false) Integer maxYear,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {

        Sort sort = direction.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<Car> carPage = carService.searchCars(make, model, transmission, state, status, minPrice, maxPrice, minYear, maxYear, pageable);

        Page<CarDto.Response> responsePage = carPage.map(car -> {
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
                    .build();
        });

        return ResponseEntity.ok(ApiResponse.success(responsePage, "차량 목록 검색 및 조회가 완료되었습니다."));
    }
}
