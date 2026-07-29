package com.car.app.transaction.repository;

import com.car.app.transaction.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    boolean existsByTransactionTransactionId(Long transactionId);
    Optional<Review> findByTransactionTransactionId(Long transactionId);
    List<Review> findByTransactionCarDealerDealerIdOrderByCreatedAtDesc(Long dealerId);

    @Query("SELECT r FROM Review r WHERE (r.transaction.car.dealer.dealerId = :dealerId OR (r.transaction.buyerType = 'DEALER' AND r.transaction.buyerId = :dealerId)) ORDER BY r.createdAt DESC")
    List<Review> findAllReviewsForDealer(@Param("dealerId") Long dealerId);
}
