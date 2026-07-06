package com.car.app.car;

import com.car.app.dealer.Dealer;
import com.car.app.dealer.DealerRepository;
import com.car.app.member.Member;
import com.car.app.member.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CarService {

    private final CarRepository carRepository;
    private final CarImageRepository carImageRepository;
    private final MemberRepository memberRepository;
    private final DealerRepository dealerRepository;

    @Transactional
    public Car registerCar(String username, Collection<? extends GrantedAuthority> authorities, CarDto.CreateRequest request) {
        Member memberOwner = null;
        Dealer dealerOwner = null;

        boolean isMember = authorities.stream().anyMatch(a -> a.getAuthority().equals("ROLE_MEMBER"));
        boolean isDealer = authorities.stream().anyMatch(a -> a.getAuthority().equals("ROLE_DEALER"));

        if (isMember) {
            memberOwner = memberRepository.findByEmail(username)
                    .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 회원 계정입니다."));
        } else if (isDealer) {
            dealerOwner = dealerRepository.findByLoginId(username)
                    .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 딜러 계정입니다."));
        } else {
            throw new SecurityException("차량을 등록할 권한이 없습니다. 일반 회원 또는 딜러만 등록이 가능합니다.");
        }

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
                .status("REGISTERED")
                .images(new ArrayList<>())
                .build();

        Car savedCar = carRepository.save(car);

        List<CarDto.ImageDto> requestImages = request.getImages();
        if (requestImages != null && !requestImages.isEmpty()) {
            boolean hasMain = requestImages.stream().anyMatch(img -> img.getIsMain() != null && img.getIsMain());
            
            for (int i = 0; i < requestImages.size(); i++) {
                CarDto.ImageDto imgDto = requestImages.get(i);
                boolean isMain = imgDto.getIsMain() != null && imgDto.getIsMain();
                
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

        return savedCar;
    }
}
