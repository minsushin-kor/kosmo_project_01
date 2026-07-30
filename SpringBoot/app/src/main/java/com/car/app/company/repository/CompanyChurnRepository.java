package com.car.app.company.repository;

import com.car.app.company.entity.CompanyChurn;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface CompanyChurnRepository extends JpaRepository<CompanyChurn, Long> {
    Optional<CompanyChurn> findFirstByCompanyCompanyIdOrderByCalculatedAtDesc(Long companyId);

    @EntityGraph(attributePaths = "company")
    List<CompanyChurn> findAllByOrderByCalculatedAtDesc();
}
