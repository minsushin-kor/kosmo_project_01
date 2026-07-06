package com.car.app.car;

import com.car.app.dealer.Dealer;
import com.car.app.member.Member;
import com.car.app.security.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/cars")
@RequiredArgsConstructor
public class CarController {

    private final CarService carService;

    @PostMapping
    @PreAuthorize("hasAnyRole('MEMBER', 'DEALER')")
    public ResponseEntity<ApiResponse<CarDto.Response>> registerCar(@RequestBody CarDto.CreateRequest request) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String username = authentication.getName();
            
            Car car = carService.registerCar(username, authentication.getAuthorities(), request);

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
}
