package com.car.app.wishlist;

import com.car.app.car.Car;
import com.car.app.car.CarRepository;
import com.car.app.dealer.Dealer;
import com.car.app.dealer.DealerRepository;
import com.car.app.member.Member;
import com.car.app.member.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class WishlistService {

    private final WishlistRepository wishlistRepository;
    private final CarRepository carRepository;
    private final MemberRepository memberRepository;
    private final DealerRepository dealerRepository;

    /**
     * 관심 차량 등록 및 등록 해제를 토글(toggle) 방식으로 처리합니다.
     */
    @Transactional
    public WishlistDto.ToggleResponse toggleWishlist(String username, Collection<? extends GrantedAuthority> authorities, Long carId) {
        Car car = carRepository.findById(carId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 차량 매물입니다."));

        boolean isMember = authorities.stream().anyMatch(a -> a.getAuthority().equals("ROLE_MEMBER"));
        boolean isDealer = authorities.stream().anyMatch(a -> a.getAuthority().equals("ROLE_DEALER"));

        if (isMember) {
            Member member = memberRepository.findByEmail(username)
                    .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 회원 계정입니다."));

            Optional<Wishlist> existingWish = wishlistRepository.findByMemberMemberIdAndCarCarId(member.getMemberId(), carId);
            if (existingWish.isPresent()) {
                wishlistRepository.delete(existingWish.get());
                return WishlistDto.ToggleResponse.builder()
                        .carId(carId)
                        .isWished(false)
                        .message("관심 차량 등록이 해제되었습니다.")
                        .build();
            } else {
                Wishlist wishlist = Wishlist.builder()
                        .member(member)
                        .car(car)
                        .build();
                wishlistRepository.save(wishlist);
                return WishlistDto.ToggleResponse.builder()
                        .carId(carId)
                        .isWished(true)
                        .message("관심 차량으로 등록되었습니다.")
                        .build();
            }
        } else if (isDealer) {
            Dealer dealer = dealerRepository.findByLoginId(username)
                    .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 딜러 계정입니다."));

            Optional<Wishlist> existingWish = wishlistRepository.findByDealerDealerIdAndCarCarId(dealer.getDealerId(), carId);
            if (existingWish.isPresent()) {
                wishlistRepository.delete(existingWish.get());
                return WishlistDto.ToggleResponse.builder()
                        .carId(carId)
                        .isWished(false)
                        .message("관심 차량 등록이 해제되었습니다.")
                        .build();
            } else {
                Wishlist wishlist = Wishlist.builder()
                        .dealer(dealer)
                        .car(car)
                        .build();
                wishlistRepository.save(wishlist);
                return WishlistDto.ToggleResponse.builder()
                        .carId(carId)
                        .isWished(true)
                        .message("관심 차량으로 등록되었습니다.")
                        .build();
            }
        } else {
            throw new SecurityException("관심 차량 등록 권한이 없습니다. 일반 회원 또는 딜러만 찜할 수 있습니다.");
        }
    }

}
