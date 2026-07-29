package com.car.app.wishlist.repository;

import com.car.app.wishlist.entity.Wishlist;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface WishlistRepository
        extends JpaRepository<Wishlist, Long> {

    /*
     * 기존 MyPageService에서 사용하는 메서드입니다.
     * 삭제하면 안 됩니다.
     */
    List<Wishlist> findByMemberMemberId(
            Long memberId);

    List<Wishlist> findByDealerDealerId(
            Long dealerId);

    /*
     * 찜 목록을 최근 등록순으로 조회할 때 사용하는 메서드입니다.
     */
    List<Wishlist> findByMemberMemberIdOrderByCreatedAtDesc(
            Long memberId);

    List<Wishlist> findByDealerDealerIdOrderByCreatedAtDesc(
            Long dealerId);

    /*
     * 특정 차량의 찜 등록 여부 확인 및 토글 처리에 사용합니다.
     */
    Optional<Wishlist> findByMemberMemberIdAndCarCarId(
            Long memberId,
            Long carId);

    Optional<Wishlist> findByDealerDealerIdAndCarCarId(
            Long dealerId,
            Long carId);
}