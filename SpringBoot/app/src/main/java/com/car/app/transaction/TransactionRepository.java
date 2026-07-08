package com.car.app.transaction;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    List<Transaction> findByCarCarId(Long carId);
    List<Transaction> findBySellerTypeAndSellerId(String sellerType, Long sellerId);
    List<Transaction> findByBuyerTypeAndBuyerId(String buyerType, Long buyerId);
}
