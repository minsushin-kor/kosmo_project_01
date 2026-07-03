package com.car.app.auction;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BidRepository extends JpaRepository<Bid, Long> {
    List<Bid> findByAuctionAuctionId(Long auctionId);
    Optional<Bid> findByAuctionAuctionIdAndDealerDealerId(Long auctionId, Long dealerId);
}
