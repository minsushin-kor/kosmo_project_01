package com.car.app.auction;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface AuctionRepository extends JpaRepository<Auction, Long> {
    Optional<Auction> findByCarCarId(Long carId);
    List<Auction> findByStatusAndEndTimeBefore(String status, LocalDateTime endTime);
}
