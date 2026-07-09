package com.car.app.coupon;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CouponRepository extends JpaRepository<Coupon, Long> {
    List<Coupon> findByDealerDealerId(Long dealerId);
    List<Coupon> findByCompanyCompanyId(Long companyId);
    boolean existsByUsedTransactionTransactionId(Long transactionId);
    List<Coupon> findByDealerDealerIdAndCouponTypeAndStatus(Long dealerId, String couponType, String status);
    boolean existsByDealerDealerIdAndCouponTypeAndStatus(Long dealerId, String couponType, String status);
    boolean existsByCompanyCompanyIdAndCouponTypeAndStatus(Long companyId, String couponType, String status);
}
