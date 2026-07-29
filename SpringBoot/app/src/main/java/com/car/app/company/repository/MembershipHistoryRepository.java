package com.car.app.company.repository;

import com.car.app.company.entity.MembershipHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MembershipHistoryRepository extends JpaRepository<MembershipHistory, Long> {
    List<MembershipHistory> findByCompanyCompanyId(Long companyId);
}
