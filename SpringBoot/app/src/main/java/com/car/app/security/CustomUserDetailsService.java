package com.car.app.security;

import com.car.app.company.Company;
import com.car.app.company.CompanyRepository;
import com.car.app.dealer.Dealer;
import com.car.app.dealer.DealerRepository;
import com.car.app.member.Member;
import com.car.app.member.MemberRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final MemberRepository memberRepository;
    private final CompanyRepository companyRepository;
    private final DealerRepository dealerRepository;

    public CustomUserDetailsService(MemberRepository memberRepository,
                                    CompanyRepository companyRepository,
                                    DealerRepository dealerRepository) {
        this.memberRepository = memberRepository;
        this.companyRepository = companyRepository;
        this.dealerRepository = dealerRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
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

        Optional<Member> memberOpt = memberRepository.findByEmail(username);
        if (memberOpt.isPresent()) {
            Member member = memberOpt.get();
            String role = "ROLE_" + member.getRole().toUpperCase(); // e.g. ROLE_MEMBER, ROLE_ADMIN
            return new CustomUserDetails(
                    member.getEmail(),
                    member.getPassword(),
                    role,
                    member.getName()
            );
        }

        Optional<Dealer> dealerOpt = dealerRepository.findByLoginId(username);
        if (dealerOpt.isPresent()) {
            Dealer dealer = dealerOpt.get();
            if ("WITHDRAWN".equalsIgnoreCase(dealer.getStatus())) {
                throw new UsernameNotFoundException("Withdrawn dealer account: " + username);
            }
            return new CustomUserDetails(
                    dealer.getLoginId(),
                    dealer.getPassword(),
                    "ROLE_DEALER",
                    dealer.getName()
            );
        }

        throw new UsernameNotFoundException("User not found with username: " + username);
    }
}
