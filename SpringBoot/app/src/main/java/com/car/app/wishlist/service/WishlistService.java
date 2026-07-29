package com.car.app.wishlist.service;

import com.car.app.car.dto.CarDto;
import com.car.app.car.entity.Car;
import com.car.app.car.repository.CarRepository;
import com.car.app.car.service.CarService;
import com.car.app.dealer.entity.Dealer;
import com.car.app.dealer.repository.DealerRepository;
import com.car.app.member.entity.Member;
import com.car.app.member.repository.MemberRepository;
import com.car.app.wishlist.dto.WishlistDto;
import com.car.app.wishlist.entity.Wishlist;
import com.car.app.wishlist.repository.WishlistRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class WishlistService {

        private final WishlistRepository wishlistRepository;
        private final CarRepository carRepository;
        private final MemberRepository memberRepository;
        private final DealerRepository dealerRepository;
        private final CarService carService;

        /**
         * 로그인 사용자가 찜한 차량 전체 목록을 조회합니다.
         */
        @Transactional(readOnly = true)
        public List<CarDto.Response> getMyWishlists(
                        String username,
                        Collection<? extends GrantedAuthority> authorities) {
                List<Wishlist> wishlists = findUserWishlists(
                                username,
                                authorities);

                /*
                 * Car.images는 지연 로딩 관계이므로
                 * 트랜잭션 안에서 먼저 초기화합니다.
                 */
                wishlists.forEach(
                                wishlist -> wishlist
                                                .getCar()
                                                .getImages()
                                                .size());

                return wishlists
                                .stream()
                                .map(Wishlist::getCar)
                                .map(carService::mapToResponse)
                                .toList();
        }

        /**
         * 로그인 사용자가 찜한 차량 ID 목록을 조회합니다.
         */
        @Transactional(readOnly = true)
        public List<Long> getWishlistCarIds(
                        String username,
                        Collection<? extends GrantedAuthority> authorities) {
                return findUserWishlists(
                                username,
                                authorities)
                                .stream()
                                .map(Wishlist::getCar)
                                .map(Car::getCarId)
                                .toList();
        }

        /**
         * 관심 차량 등록 및 등록 해제를 토글 처리합니다.
         */
        @Transactional
        public WishlistDto.ToggleResponse toggleWishlist(
                        String username,
                        Collection<? extends GrantedAuthority> authorities,
                        Long carId) {
                Car car = carRepository
                                .findById(carId)
                                .orElseThrow(
                                                () -> new IllegalArgumentException(
                                                                "존재하지 않는 차량 매물입니다."));

                boolean isMember = hasAuthority(
                                authorities,
                                "ROLE_MEMBER");

                boolean isDealer = hasAuthority(
                                authorities,
                                "ROLE_DEALER");

                if (isMember) {
                        return toggleMemberWishlist(
                                        username,
                                        car);
                }

                if (isDealer) {
                        return toggleDealerWishlist(
                                        username,
                                        car);
                }

                throw new SecurityException(
                                "관심 차량 등록 권한이 없습니다.");
        }

        /**
         * 권한에 맞는 사용자의 찜 엔티티 목록을 조회합니다.
         */
        private List<Wishlist> findUserWishlists(
                        String username,
                        Collection<? extends GrantedAuthority> authorities) {
                boolean isMember = hasAuthority(
                                authorities,
                                "ROLE_MEMBER");

                boolean isDealer = hasAuthority(
                                authorities,
                                "ROLE_DEALER");

                if (isMember) {
                        Member member = memberRepository
                                        .findByLoginId(username)
                                        .orElseThrow(
                                                        () -> new IllegalArgumentException(
                                                                        "존재하지 않는 회원 계정입니다."));

                        return wishlistRepository
                                        .findByMemberMemberIdOrderByCreatedAtDesc(
                                                        member.getMemberId());
                }

                if (isDealer) {
                        Dealer dealer = dealerRepository
                                        .findByLoginId(username)
                                        .orElseThrow(
                                                        () -> new IllegalArgumentException(
                                                                        "존재하지 않는 딜러 계정입니다."));

                        return wishlistRepository
                                        .findByDealerDealerIdOrderByCreatedAtDesc(
                                                        dealer.getDealerId());
                }

                throw new SecurityException(
                                "관심 차량 조회 권한이 없습니다.");
        }

        private WishlistDto.ToggleResponse toggleMemberWishlist(
                        String username,
                        Car car) {
                Member member = memberRepository
                                .findByLoginId(username)
                                .orElseThrow(
                                                () -> new IllegalArgumentException(
                                                                "존재하지 않는 회원 계정입니다."));

                Long carId = car.getCarId();

                Optional<Wishlist> existingWishlist = wishlistRepository
                                .findByMemberMemberIdAndCarCarId(
                                                member.getMemberId(),
                                                carId);

                if (existingWishlist.isPresent()) {
                        wishlistRepository.delete(
                                        existingWishlist.get());

                        return createToggleResponse(
                                        carId,
                                        false,
                                        "관심 차량 등록이 해제되었습니다.");
                }

                Wishlist wishlist = Wishlist.builder()
                                .member(member)
                                .car(car)
                                .build();

                wishlistRepository.save(
                                wishlist);

                return createToggleResponse(
                                carId,
                                true,
                                "관심 차량으로 등록되었습니다.");
        }

        private WishlistDto.ToggleResponse toggleDealerWishlist(
                        String username,
                        Car car) {
                Dealer dealer = dealerRepository
                                .findByLoginId(username)
                                .orElseThrow(
                                                () -> new IllegalArgumentException(
                                                                "존재하지 않는 딜러 계정입니다."));

                Long carId = car.getCarId();

                Optional<Wishlist> existingWishlist = wishlistRepository
                                .findByDealerDealerIdAndCarCarId(
                                                dealer.getDealerId(),
                                                carId);

                if (existingWishlist.isPresent()) {
                        wishlistRepository.delete(
                                        existingWishlist.get());

                        return createToggleResponse(
                                        carId,
                                        false,
                                        "관심 차량 등록이 해제되었습니다.");
                }

                Wishlist wishlist = Wishlist.builder()
                                .dealer(dealer)
                                .car(car)
                                .build();

                wishlistRepository.save(
                                wishlist);

                return createToggleResponse(
                                carId,
                                true,
                                "관심 차량으로 등록되었습니다.");
        }

        private WishlistDto.ToggleResponse createToggleResponse(
                        Long carId,
                        boolean isWished,
                        String message) {
                return WishlistDto.ToggleResponse
                                .builder()
                                .carId(carId)
                                .isWished(isWished)
                                .message(message)
                                .build();
        }

        private boolean hasAuthority(
                        Collection<? extends GrantedAuthority> authorities,
                        String authority) {
                return authorities
                                .stream()
                                .anyMatch(
                                                item -> authority.equals(
                                                                item.getAuthority()));
        }
}