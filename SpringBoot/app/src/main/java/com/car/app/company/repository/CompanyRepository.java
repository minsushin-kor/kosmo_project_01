package com.car.app.company.repository;

import com.car.app.company.entity.Company;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CompanyRepository extends JpaRepository<Company, Long> {
    Optional<Company> findByMasterEmail(String masterEmail);
    Optional<Company> findByBusinessNumber(String businessNumber);
    Optional<Company> findByLoginId(String loginId);
    boolean existsByLoginId(String loginId);
    boolean existsByMasterEmail(String masterEmail);
}
