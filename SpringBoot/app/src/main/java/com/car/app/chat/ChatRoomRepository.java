package com.car.app.chat;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ChatRoomRepository extends JpaRepository<ChatRoom, Long> {
    List<ChatRoom> findByMemberMemberId(Long memberId);
    List<ChatRoom> findByDealerDealerId(Long dealerId);
    Optional<ChatRoom> findByCarCarIdAndMemberMemberIdAndDealerDealerId(Long carId, Long memberId, Long dealerId);
}
