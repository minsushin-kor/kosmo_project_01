package com.car.app.car.repository;

import com.car.app.car.entity.Car;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;

public interface CarRepository extends JpaRepository<Car, Long>, JpaSpecificationExecutor<Car> {
    List<Car> findByMemberMemberId(Long memberId);

    List<Car> findByDealerDealerId(Long dealerId);

    List<Car> findByDealerCompanyCompanyIdOrderByCreatedAtDesc(Long companyId);

    List<Car> findTop5ByOrderByCreatedAtDesc();

    List<Car> findByDealerIsNotNullAndMemberIsNullAndStatusOrderByCreatedAtDesc(String status);

    List<Car> findByMemberIsNotNullAndDealerIsNullAndStatusOrderByCreatedAtDesc(String status);

    List<Car> findAllByMemberLoginIdOrderByCreatedAtDesc(String loginId);

    List<Car> findAllByDealerLoginIdOrderByCreatedAtDesc(String loginId);

    List<Car> findByMemberMemberIdAndStatusNotOrderByCreatedAtDesc(
            Long memberId,
            String status);
}
