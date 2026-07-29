package com.car.app.global.security;

import com.car.app.company.entity.Company;
import com.car.app.company.repository.CompanyRepository;
import com.car.app.dealer.entity.Dealer;
import com.car.app.dealer.repository.DealerRepository;
import com.car.app.member.entity.Member;
import com.car.app.member.repository.MemberRepository;
import com.car.app.user.entity.User;
import com.car.app.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;
    private final MemberRepository memberRepository;
    private final CompanyRepository companyRepository;
    private final DealerRepository dealerRepository;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {

        // 0단계: 통합 UserRepository에서 조회
        Optional<User> userOpt = userRepository.findByLoginId(username);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            String role = "ROLE_" + user.getRoleType().toUpperCase();
            return new CustomUserDetails(
                    user.getLoginId(),
                    user.getPassword(),
                    role,
                    user.getName()
            );
        }

        // 1단계: 상사 마스터 (loginId 기준)
        Optional<Company> companyOpt = companyRepository.findByLoginId(username);
        if (companyOpt.isPresent()) {
            Company company = companyOpt.get();
            return new CustomUserDetails(
                    company.getLoginId(),
                    company.getPassword(),
                    "ROLE_COMPANY_MASTER",
                    company.getName()
            );
        }

        // 2단계: 일반 회원 및 관리자 (loginId 기준)
        Optional<Member> memberOpt = memberRepository.findByLoginId(username);
        if (memberOpt.isPresent()) {
            Member member = memberOpt.get();
            String role = "ROLE_" + member.getRole().toUpperCase();
            return new CustomUserDetails(
                    member.getLoginId(),
                    member.getPassword(),
                    role,
                    member.getName()
            );
        }

        // 3단계: 딜러 (loginId 기준)
        Optional<Dealer> dealerOpt = dealerRepository.findByLoginId(username);
        if (dealerOpt.isPresent()) {
            Dealer dealer = dealerOpt.get();
            return new CustomUserDetails(
                    dealer.getLoginId(),
                    dealer.getPassword(),
                    "ROLE_DEALER",
                    dealer.getName()
            );
        }

        throw new UsernameNotFoundException("해당 로그인 아이디를 가진 계정을 찾을 수 없습니다: " + username);
    }
}
