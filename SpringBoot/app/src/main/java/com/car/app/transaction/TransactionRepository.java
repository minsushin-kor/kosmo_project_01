package com.car.app.transaction;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    List<Transaction> findByCarCarId(Long carId);
    List<Transaction> findBySellerTypeAndSellerId(String sellerType, Long sellerId);
    List<Transaction> findByBuyerTypeAndBuyerId(String buyerType, Long buyerId);

    interface DealerTradeSummary {
        Long getDealerId();
        Long getRecent60dTradeCount();
        Long getPreviousTradeCount();
        Double getTotalDealPrice();
        Double getAvgDealPrice();
        LocalDateTime getLatestTradeTime();
    }

    @Query(value = "SELECT dealer_id AS dealerId, " +
            "SUM(CASE WHEN created_at > :sixtyDaysAgo THEN 1 ELSE 0 END) AS recent60dTradeCount, " +
            "SUM(CASE WHEN created_at <= :sixtyDaysAgo THEN 1 ELSE 0 END) AS previousTradeCount, " +
            "SUM(deal_price) AS totalDealPrice, " +
            "AVG(deal_price) AS avgDealPrice, " +
            "MAX(created_at) AS latestTradeTime " +
            "FROM (" +
            "    SELECT seller_id AS dealer_id, deal_price, created_at FROM transactions WHERE seller_type = 'DEALER' " +
            "    UNION ALL " +
            "    SELECT buyer_id AS dealer_id, deal_price, created_at FROM transactions WHERE buyer_type = 'DEALER' " +
            ") t " +
            "GROUP BY dealer_id", nativeQuery = true)
    List<DealerTradeSummary> getDealerTradeSummaries(@Param("sixtyDaysAgo") LocalDateTime sixtyDaysAgo);
}
