package com.car.app.coupon;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CouponRepository extends JpaRepository<Coupon, Long> {
    List<Coupon> findByDealerDealerId(Long dealerId);
    List<Coupon> findByCompanyCompanyId(Long companyId);
}
