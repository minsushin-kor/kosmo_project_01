package com.car.app.dealer.repository;

import com.car.app.dealer.entity.Dealer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DealerRepository extends JpaRepository<Dealer, Long> {
    Optional<Dealer> findByLoginId(String loginId);
    Optional<Dealer> findByEmail(String email);
    boolean existsByEmail(String email);
    List<Dealer> findByCompanyCompanyId(Long companyId);
}
