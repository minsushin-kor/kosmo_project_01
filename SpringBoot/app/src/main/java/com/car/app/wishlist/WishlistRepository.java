package com.car.app.wishlist;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WishlistRepository extends JpaRepository<Wishlist, Long> {
    List<Wishlist> findByMemberMemberId(Long memberId);
    List<Wishlist> findByDealerDealerId(Long dealerId);
    Optional<Wishlist> findByMemberMemberIdAndCarCarId(Long memberId, Long carId);
    Optional<Wishlist> findByDealerDealerIdAndCarCarId(Long dealerId, Long carId);
}
