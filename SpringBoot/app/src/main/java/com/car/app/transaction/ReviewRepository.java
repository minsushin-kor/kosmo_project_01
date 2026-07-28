package com.car.app.transaction;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    boolean existsByTransactionTransactionId(Long transactionId);
    java.util.Optional<Review> findByTransactionTransactionId(Long transactionId);
    java.util.List<Review> findByTransactionCarDealerDealerIdOrderByCreatedAtDesc(Long dealerId);
}
