package com.car.app.security;

import com.car.app.company.Company;
import com.car.app.company.CompanyRepository;
import com.car.app.dealer.Dealer;
import com.car.app.dealer.DealerRepository;
import com.car.app.member.Member;
import com.car.app.member.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final MemberRepository memberRepository;
    private final CompanyRepository companyRepository;
    private final DealerRepository dealerRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtProvider jwtProvider;

    @Transactional
    public Member signupMember(AuthDto.MemberSignupRequest request) {
        if (memberRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new IllegalArgumentException("이미 사용 중인 이메일입니다.");
        }
        
        Member member = Member.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .name(request.getName())
                .phone(request.getPhone())
                .role("MEMBER")
                .build();
                
        return memberRepository.save(member);
    }

    @Transactional
    public Company signupCompany(AuthDto.CompanySignupRequest request) {
        if (companyRepository.findByMasterEmail(request.getMasterEmail()).isPresent()) {
            throw new IllegalArgumentException("이미 사용 중인 마스터 이메일입니다.");
        }
        if (companyRepository.findByBusinessNumber(request.getBusinessNumber()).isPresent()) {
            throw new IllegalArgumentException("이미 사용 중인 사업자 번호입니다.");
        }

        Company company = Company.builder()
                .businessNumber(request.getBusinessNumber())
                .name(request.getName())
                .masterEmail(request.getMasterEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .address(request.getAddress())
                .phone(request.getPhone())
                .membershipStatus(false)
                .build();

        return companyRepository.save(company);
    }

    @Transactional(readOnly = true)
    public AuthDto.LoginResponse login(AuthDto.LoginRequest request) {
        String username = request.getUsername();
        String password = request.getPassword();
        String roleType = request.getRoleType();

        String dbPassword = null;
        String role = null;
        String name = null;

        if ("COMPANY_MASTER".equalsIgnoreCase(roleType)) {
            Company company = companyRepository.findByMasterEmail(username)
                    .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 상사 마스터 계정입니다."));
            dbPassword = company.getPassword();
            role = "COMPANY_MASTER";
            name = company.getName();
        } else if ("DEALER".equalsIgnoreCase(roleType)) {
            Dealer dealer = dealerRepository.findByLoginId(username)
                    .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 딜러 계정입니다."));
            if ("WITHDRAWN".equalsIgnoreCase(dealer.getStatus())) {
                throw new IllegalArgumentException("활동이 정지되거나 제외된 딜러 계정입니다.");
            }
            dbPassword = dealer.getPassword();
            role = "DEALER";
            name = dealer.getName();
        } else if ("MEMBER".equalsIgnoreCase(roleType) || "ADMIN".equalsIgnoreCase(roleType)) {
            Member member = memberRepository.findByEmail(username)
                    .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 회원 계정입니다."));
            dbPassword = member.getPassword();
            role = member.getRole().toUpperCase();
            name = member.getName();
            
            if ("ADMIN".equalsIgnoreCase(roleType) && !"ADMIN".equalsIgnoreCase(role)) {
                throw new IllegalArgumentException("관리자 권한이 없는 계정입니다.");
            }
        } else {
            throw new IllegalArgumentException("올바르지 않은 역할(Role) 타입입니다.");
        }

        if (!passwordEncoder.matches(password, dbPassword)) {
            throw new IllegalArgumentException("비밀번호가 일치하지 않습니다.");
        }

        String token = jwtProvider.createToken(username, "ROLE_" + role, name);

        return AuthDto.LoginResponse.builder()
                .token(token)
                .role(role)
                .name(name)
                .build();
    }
}
