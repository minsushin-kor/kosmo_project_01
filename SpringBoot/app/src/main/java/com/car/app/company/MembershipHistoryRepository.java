package com.car.app.company;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MembershipHistoryRepository extends JpaRepository<MembershipHistory, Long> {
    List<MembershipHistory> findByCompanyCompanyId(Long companyId);
}
