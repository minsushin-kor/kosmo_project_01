package com.car.app.car.service;

import com.car.app.ai.service.AiService;
import com.car.app.auction.repository.AuctionRepository;
import com.car.app.auction.repository.BidRepository;
import com.car.app.car.dto.CarDto;
import com.car.app.car.entity.Car;
import com.car.app.car.repository.CarImageRepository;
import com.car.app.car.repository.CarRepository;
import com.car.app.dealer.repository.DealerRepository;
import com.car.app.member.entity.Member;
import com.car.app.member.repository.MemberRepository;
import com.car.app.notification.service.NotificationService;
import com.car.app.transaction.repository.TransactionRepository;
import com.car.app.wishlist.repository.WishlistRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CarServiceTest {

    @Mock
    private CarRepository carRepository;

    @Mock
    private CarImageRepository carImageRepository;

    @Mock
    private MemberRepository memberRepository;

    @Mock
    private DealerRepository dealerRepository;

    @Mock
    private AuctionRepository auctionRepository;

    @Mock
    private BidRepository bidRepository;

    @Mock
    private TransactionRepository transactionRepository;

    @Mock
    private NotificationService notificationService;

    @Mock
    private WishlistRepository wishlistRepository;

    @Mock
    private AiService aiService;

    @InjectMocks
    private CarService carService;

    @Test
    void adminCanUpdateCarOwnedByAnotherUser() {
        Car car = memberCar();
        CarDto.CreateRequest request = CarDto.CreateRequest.builder()
                .model("관리자 수정 모델")
                .build();

        when(carRepository.findById(1L)).thenReturn(Optional.of(car));
        when(carRepository.save(car)).thenReturn(car);

        Car updated = carService.updateCar(
                1L,
                "admin",
                List.of(new SimpleGrantedAuthority("ROLE_ADMIN")),
                request);

        assertEquals("관리자 수정 모델", updated.getModel());
        verify(carRepository).save(car);
    }

    @Test
    void nonAdminCannotUpdateCarOwnedByAnotherUser() {
        Car car = memberCar();
        CarDto.CreateRequest request = CarDto.CreateRequest.builder()
                .model("권한 없는 수정")
                .build();

        when(carRepository.findById(1L)).thenReturn(Optional.of(car));

        assertThrows(
                SecurityException.class,
                () -> carService.updateCar(
                        1L,
                        "another-member",
                        List.of(new SimpleGrantedAuthority("ROLE_MEMBER")),
                        request));

        verify(carRepository, never()).save(any(Car.class));
    }

    private Car memberCar() {
        Member owner = Member.builder()
                .memberId(10L)
                .loginId("owner-member")
                .build();

        return Car.builder()
                .carId(1L)
                .member(owner)
                .model("기존 모델")
                .build();
    }
}
