package com.car.app.company;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CompanyRepository extends JpaRepository<Company, Long> {
    Optional<Company> findByMasterEmail(String masterEmail);
    Optional<Company> findByBusinessNumber(String businessNumber);
}
