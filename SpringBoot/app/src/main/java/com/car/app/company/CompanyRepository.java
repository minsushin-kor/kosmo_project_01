package com.car.app.company;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CompanyRepository extends JpaRepository<Company, Long> {
    Optional<Company> findByMasterEmail(String masterEmail);
    Optional<Company> findByBusinessNumber(String businessNumber);
}
