package com.car.app.security;

import com.car.app.company.Company;
import com.car.app.company.CompanyRepository;
import com.car.app.dealer.Dealer;
import com.car.app.dealer.DealerRepository;
import com.car.app.member.Member;
import com.car.app.member.MemberRepository;
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

    private final MemberRepository memberRepository;
    private final CompanyRepository companyRepository;
    private final DealerRepository dealerRepository;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {

        // 1단계: 상사 마스터 (loginId 우선, masterEmail 보조)
        Optional<Company> companyOpt = companyRepository.findByLoginId(username)
                .or(() -> companyRepository.findByMasterEmail(username));
        if (companyOpt.isPresent()) {
            Company company = companyOpt.get();
            return new CustomUserDetails(
                    company.getLoginId() != null ? company.getLoginId() : company.getMasterEmail(),
                    company.getPassword(),
                    "ROLE_COMPANY_MASTER",
                    company.getName()
            );
        }

        // 2단계: 일반 회원 및 관리자 (loginId 우선, email 보조)
        Optional<Member> memberOpt = memberRepository.findByLoginId(username)
                .or(() -> memberRepository.findByEmail(username));
        if (memberOpt.isPresent()) {
            Member member = memberOpt.get();
            String role = "ROLE_" + member.getRole().toUpperCase();
            return new CustomUserDetails(
                    member.getLoginId() != null ? member.getLoginId() : member.getEmail(),
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
