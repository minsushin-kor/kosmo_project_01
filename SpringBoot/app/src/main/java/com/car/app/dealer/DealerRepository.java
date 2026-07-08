package com.car.app.dealer;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DealerRepository extends JpaRepository<Dealer, Long> {
    Optional<Dealer> findByLoginId(String loginId);
    List<Dealer> findByCompanyCompanyId(Long companyId);
}
