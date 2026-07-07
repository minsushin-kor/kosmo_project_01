package com.car.app.security;

import com.car.app.company.Company;
import com.car.app.company.CompanyRepository;
import com.car.app.dealer.Dealer;
import com.car.app.dealer.DealerRepository;
import com.car.app.member.Member;
import com.car.app.member.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.Optional;

/**
 * 로그인 아이디를 통해 DB 상사 마스터/회원/딜러 3개 테이블을 넘나들며
 * 계정을 찾고 시큐리티 규격으로 인가 객체를 팩킹하는 서비스 클래스입니다.
 */
@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final MemberRepository memberRepository;
    private final CompanyRepository companyRepository;
    private final DealerRepository dealerRepository;

    /**
     * 입력받은 username(이메일 혹은 로그인 ID)으로 다중 역할 매핑 조회를 수행합니다.
     *
     * @param username 이메일 또는 딜러 로그인 ID
     * @return 스프링 시큐리티에서 활용할 UserDetails 객체 (CustomUserDetails)
     * @throws UsernameNotFoundException 해당 계정이 어느 테이블에도 존재하지 않을 때
     */
    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {

        // 1단계: 상사 마스터 테이블에서 조회 (이메일 기준)
        Optional<Company> companyOpt = companyRepository.findByMasterEmail(username);
        if (companyOpt.isPresent()) {
            Company company = companyOpt.get();
            return new CustomUserDetails(
                    company.getMasterEmail(),
                    company.getPassword(),
                    "ROLE_COMPANY_MASTER",
                    company.getName()
            );
        }

        // 2단계: 일반 회원 및 관리자 테이블에서 조회 (이메일 기준)
        Optional<Member> memberOpt = memberRepository.findByEmail(username);
        if (memberOpt.isPresent()) {
            Member member = memberOpt.get();
            // DB에 지정된 역할(MEMBER 혹은 ADMIN)을 가져와 ROLE_ 접두사 부여
            String role = "ROLE_" + member.getRole().toUpperCase();
            return new CustomUserDetails(
                    member.getEmail(),
                    member.getPassword(),
                    role,
                    member.getName()
            );
        }

        // 3단계: 상사 소속 딜러 테이블에서 조회 (Login ID 기준)
        Optional<Dealer> dealerOpt = dealerRepository.findByLoginId(username);
        if (dealerOpt.isPresent()) {
            Dealer dealer = dealerOpt.get();
            
            // 활동 제외(정지/탈퇴) 상태인 딜러는 로그인을 거부시킴
            if ("WITHDRAWN".equalsIgnoreCase(dealer.getStatus())) {
                throw new UsernameNotFoundException("활동이 제외된 딜러 계정입니다: " + username);
            }
            
            return new CustomUserDetails(
                    dealer.getLoginId(),
                    dealer.getPassword(),
                    "ROLE_DEALER",
                    dealer.getName()
            );
        }

        // 4단계: 어느 테이블에서도 찾지 못한 경우 예외를 내며 인증 거부
        throw new UsernameNotFoundException("사용자를 찾을 수 없습니다: " + username);
    }
}
