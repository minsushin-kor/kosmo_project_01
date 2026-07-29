package com.car.app.member.repository;

import com.car.app.member.entity.Member;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface MemberRepository
        extends JpaRepository<Member, Long> {

    Optional<Member> findByEmail(
            String email);

    Optional<Member> findByLoginId(
            String loginId);

    boolean existsByLoginId(
            String loginId);

    boolean existsByEmail(
            String email);

    boolean existsByEmailAndMemberIdNot(
            String email,
            Long memberId);
}