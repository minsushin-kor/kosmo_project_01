package com.car.app.transaction.repository;

import com.car.app.transaction.entity.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    List<Transaction> findByCarCarId(Long carId);
    List<Transaction> findBySellerTypeAndSellerId(String sellerType, Long sellerId);
    List<Transaction> findByBuyerTypeAndBuyerId(String buyerType, Long buyerId);
    List<Transaction> findByBuyerTypeAndBuyerIdOrSellerTypeAndSellerId(String buyerType, Long buyerId, String sellerType, Long sellerId);
    long countByStatus(String status);

    boolean existsByCarCarIdAndBuyerTypeAndBuyerIdAndStatus(
            Long carId,
            String buyerType,
            Long buyerId,
            String status);

    Optional<Transaction> findTopByCarCarIdAndBuyerTypeAndBuyerIdAndStatusOrderByCreatedAtDesc(
            Long carId,
            String buyerType,
            Long buyerId,
            String status);

    List<Transaction> findBySellerTypeAndSellerIdAndBuyerTypeAndStatusOrderByCreatedAtDesc(
            String sellerType,
            Long sellerId,
            String buyerType,
            String status);

    List<Transaction> findByCarCarIdAndSellerTypeAndSellerIdAndBuyerTypeAndStatusOrderByCreatedAtDesc(
            Long carId,
            String sellerType,
            Long sellerId,
            String buyerType,
            String status);

    List<Transaction> findByCarCarIdAndStatus(
            Long carId,
            String status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select transaction
            from Transaction transaction
            join fetch transaction.car
            where transaction.transactionId = :transactionId
            """)
    Optional<Transaction> findByIdForUpdate(
            @Param("transactionId") Long transactionId);

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
            "    SELECT seller_id AS dealer_id, deal_price, created_at FROM transactions " +
            "    WHERE seller_type = 'DEALER' " +
            "      AND (status IS NULL OR status NOT IN ('PURCHASE_REQUESTED', 'CANCELLED')) " +
            "    UNION ALL " +
            "    SELECT buyer_id AS dealer_id, deal_price, created_at FROM transactions " +
            "    WHERE buyer_type = 'DEALER' " +
            "      AND (status IS NULL OR status NOT IN ('PURCHASE_REQUESTED', 'CANCELLED')) " +
            ") t " +
            "GROUP BY dealer_id", nativeQuery = true)
    List<DealerTradeSummary> getDealerTradeSummaries(@Param("sixtyDaysAgo") LocalDateTime sixtyDaysAgo);
}
