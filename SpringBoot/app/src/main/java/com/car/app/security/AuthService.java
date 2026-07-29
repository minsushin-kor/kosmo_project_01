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

/**
 * 일반 회원가입, 상사 마스터 가입 및 통합 로그인 인증 업무를 처리하는 서비스 클래스입니다.
 */
@Service
@RequiredArgsConstructor
public class AuthService {

    private final MemberRepository memberRepository;
    private final CompanyRepository companyRepository;
    private final DealerRepository dealerRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtProvider jwtProvider;

    /**
     * 일반 회원의 회원가입을 처리합니다.
     */
    @Transactional
    public Member signupMember(AuthDto.MemberSignupRequest request) {
        String loginId = (request.getLoginId() != null && !request.getLoginId().isBlank())
                ? request.getLoginId() : request.getEmail();

        if (memberRepository.findByLoginId(loginId).isPresent()) {
            throw new IllegalArgumentException("이미 사용 중인 로그인 아이디입니다.");
        }

        Member member = Member.builder()
                .loginId(loginId)
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .name(request.getName())
                .phone(request.getPhone())
                .profileImageUrl(request.getProfileImageUrl())
                .hasCar(request.getHasCar())
                .ownedCarImageUrl(request.getOwnedCarImageUrl())
                .ownedCarMake(request.getOwnedCarMake())
                .ownedCarModel(request.getOwnedCarModel())
                .ownedCarOdometer(request.getOwnedCarOdometer())
                .ownedCarYear(request.getOwnedCarYear())
                .role("MEMBER")
                .status("ACTIVE")
                .build();

        return memberRepository.save(member);
    }

    /**
     * 상사 마스터 계정 및 상사 등록 가입을 처리합니다.
     */
    @Transactional
    public Company signupCompany(AuthDto.CompanySignupRequest request) {
        String loginId = (request.getLoginId() != null && !request.getLoginId().isBlank())
                ? request.getLoginId() : request.getMasterEmail();

        if (companyRepository.findByLoginId(loginId).isPresent()) {
            throw new IllegalArgumentException("이미 사용 중인 로그인 아이디입니다.");
        }
        if (companyRepository.findByBusinessNumber(request.getBusinessNumber()).isPresent()) {
            throw new IllegalArgumentException("이미 사용 중인 사업자 번호입니다.");
        }

        Company company = Company.builder()
                .loginId(loginId)
                .businessNumber(request.getBusinessNumber())
                .name(request.getName())
                .masterEmail(request.getMasterEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .address(request.getAddress())
                .phone(request.getPhone())
                .profileImageUrl(request.getProfileImageUrl())
                .membershipStatus(false)
                .build();

        return companyRepository.save(company);
    }

    /**
     * 일반 회원, 관리자, 상사 마스터, 딜러 계정에 대한 통합 로그인을 수행하고 JWT 토큰을 발행합니다.
     * (loginId 우선 조회)
     */
    @Transactional(readOnly = true)
    public AuthDto.LoginResponse login(AuthDto.LoginRequest request) {
        String username = request.getUsername();
        String password = request.getPassword();
        String roleType = request.getRoleType();

        String dbPassword = null;
        String role = null;
        String name = null;

        if ("COMPANY_MASTER".equalsIgnoreCase(roleType)) {
            Company company = companyRepository.findByLoginId(username)
                    .or(() -> companyRepository.findByMasterEmail(username))
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
            Member member = memberRepository.findByLoginId(username)
                    .or(() -> memberRepository.findByEmail(username))
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
                .role("ROLE_" + role)
                .name(name)
                .username(username)
                .build();
    }
}
