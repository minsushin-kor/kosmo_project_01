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
    public UserDetails loadUserByUsername(String username)
            throws UsernameNotFoundException {

        /*
         * users 테이블은 통합 인증 계정이고, 실제 최종 권한은 역할별 상세
         * 테이블에 저장될 수 있습니다. 특히 관리자 계정은 members.role이
         * ADMIN인데 users.roleType이 MEMBER로 남아 있을 수 있으므로,
         * MEMBER/ADMIN 계정은 members.role을 우선하여 권한을 확정합니다.
         */
        Optional<User> userOpt = userRepository.findByLoginId(username);

        if (userOpt.isPresent()) {
            User user = userOpt.get();
            String userRoleType = normalizeRole(user.getRoleType());

            if ("MEMBER".equals(userRoleType)
                    || "ADMIN".equals(userRoleType)) {
                Optional<Member> memberOpt = memberRepository.findByLoginId(username);

                if (memberOpt.isPresent()) {
                    Member member = memberOpt.get();

                    return new CustomUserDetails(
                            user.getLoginId(),
                            user.getPassword(),
                            toAuthority(member.getRole()),
                            user.getName());
                }
            }

            return new CustomUserDetails(
                    user.getLoginId(),
                    user.getPassword(),
                    toAuthority(userRoleType),
                    user.getName());
        }

        Optional<Company> companyOpt = companyRepository.findByLoginId(username);

        if (companyOpt.isPresent()) {
            Company company = companyOpt.get();

            return new CustomUserDetails(
                    company.getLoginId(),
                    company.getPassword(),
                    "ROLE_COMPANY_MASTER",
                    company.getName());
        }

        Optional<Member> memberOpt = memberRepository.findByLoginId(username);

        if (memberOpt.isPresent()) {
            Member member = memberOpt.get();

            return new CustomUserDetails(
                    member.getLoginId(),
                    member.getPassword(),
                    toAuthority(member.getRole()),
                    member.getName());
        }

        Optional<Dealer> dealerOpt = dealerRepository.findByLoginId(username);

        if (dealerOpt.isPresent()) {
            Dealer dealer = dealerOpt.get();

            return new CustomUserDetails(
                    dealer.getLoginId(),
                    dealer.getPassword(),
                    "ROLE_DEALER",
                    dealer.getName());
        }

        throw new UsernameNotFoundException(
                "해당 로그인 아이디를 가진 계정을 찾을 수 없습니다: " + username);
    }

    private String normalizeRole(String role) {
        return String.valueOf(role)
                .trim()
                .toUpperCase()
                .replaceFirst("^ROLE_", "");
    }

    private String toAuthority(String role) {
        return "ROLE_" + normalizeRole(role);
    }
}
