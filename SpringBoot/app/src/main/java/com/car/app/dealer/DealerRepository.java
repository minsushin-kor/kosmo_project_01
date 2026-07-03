package com.car.app.dealer;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DealerRepository extends JpaRepository<Dealer, Long> {
    Optional<Dealer> findByLoginId(String loginId);
    List<Dealer> findByCompanyCompanyId(Long companyId);
}
