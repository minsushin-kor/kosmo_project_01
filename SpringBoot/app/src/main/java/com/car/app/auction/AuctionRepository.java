package com.car.app.auction;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface AuctionRepository extends JpaRepository<Auction, Long> {
    Optional<Auction> findByCarCarId(Long carId);
    List<Auction> findByStatusAndEndTimeBefore(String status, LocalDateTime endTime);
}
