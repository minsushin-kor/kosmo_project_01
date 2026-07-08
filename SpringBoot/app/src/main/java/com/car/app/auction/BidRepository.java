package com.car.app.auction;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BidRepository extends JpaRepository<Bid, Long> {
    List<Bid> findByAuctionAuctionId(Long auctionId);
    Optional<Bid> findByAuctionAuctionIdAndDealerDealerId(Long auctionId, Long dealerId);
    List<Bid> findByDealerDealerId(Long dealerId);
}
