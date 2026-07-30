package com.car.app.car.repository;

import com.car.app.car.entity.Car;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;

public interface CarRepository
        extends JpaRepository<Car, Long>,
        JpaSpecificationExecutor<Car> {

    List<Car> findByMemberMemberId(
            Long memberId);

    List<Car> findByDealerDealerId(
            Long dealerId);

    List<Car> findByDealerCompanyCompanyIdOrderByCreatedAtDesc(
            Long companyId);

    /**
     * 관리자 대시보드 최근 등록 매물 조회
     *
     * 차량 등록일 내림차순으로 최근 5건을 조회하고,
     * 화면에 필요한 회원·딜러·딜러 소속 회사 정보도 함께 조회합니다.
     */
    @EntityGraph(attributePaths = {
            "member",
            "dealer",
            "dealer.company"
    })
    List<Car> findTop5ByOrderByCreatedAtDesc();

    List<Car> findByDealerIsNotNullAndMemberIsNullAndStatusOrderByCreatedAtDesc(
            String status);

    List<Car> findByMemberIsNotNullAndDealerIsNullAndStatusOrderByCreatedAtDesc(
            String status);

    List<Car> findAllByMemberLoginIdOrderByCreatedAtDesc(
            String loginId);

    List<Car> findAllByDealerLoginIdOrderByCreatedAtDesc(
            String loginId);

    List<Car> findByMemberMemberIdAndStatusNotOrderByCreatedAtDesc(
            Long memberId,
            String status);
}