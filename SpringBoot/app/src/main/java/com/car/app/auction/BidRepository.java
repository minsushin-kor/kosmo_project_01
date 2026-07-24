package com.car.app.auction;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface BidRepository extends JpaRepository<Bid, Long> {
    List<Bid> findByAuctionAuctionId(Long auctionId);
    Optional<Bid> findByAuctionAuctionIdAndDealerDealerId(Long auctionId, Long dealerId);
    List<Bid> findByDealerDealerId(Long dealerId);

    interface DealerBidSummary {
        Long getDealerId();
        Long getBidCount();
        LocalDateTime getLatestBidTime();
    }

    @Query("SELECT b.dealer.dealerId AS dealerId, COUNT(b) AS bidCount, MAX(b.createdAt) AS latestBidTime " +
           "FROM Bid b GROUP BY b.dealer.dealerId")
    List<DealerBidSummary> getDealerBidSummaries();
}
