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
     *
     * @param request 일반 회원 가입 정보 DTO
     * @return 저장 완료된 Member 엔티티
     */
    @Transactional
    public Member signupMember(AuthDto.MemberSignupRequest request) {
        // 1단계: 가입하려는 이메일의 중복 여부 확인
        if (memberRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new IllegalArgumentException("이미 사용 중인 이메일입니다.");
        }
        
        // 2단계: 패스워드 BCrypt 해싱 및 회원 엔티티 빌드
        Member member = Member.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .name(request.getName())
                .phone(request.getPhone())
                .profileImageUrl(request.getProfileImageUrl())
                .role("MEMBER") // 기본 권한 지정
                .build();
                
        return memberRepository.save(member);
    }

    /**
     * 상사 마스터 계정 및 상사 등록 가입을 처리합니다.
     *
     * @param request 상사 가입 정보 DTO
     * @return 저장 완료된 Company 엔티티
     */
    @Transactional
    public Company signupCompany(AuthDto.CompanySignupRequest request) {
        // 1단계: 마스터 이메일 중복 체크
        if (companyRepository.findByMasterEmail(request.getMasterEmail()).isPresent()) {
            throw new IllegalArgumentException("이미 사용 중인 마스터 이메일입니다.");
        }
        // 2단계: 사업자 번호 중복 체크
        if (companyRepository.findByBusinessNumber(request.getBusinessNumber()).isPresent()) {
            throw new IllegalArgumentException("이미 사용 중인 사업자 번호입니다.");
        }

        // 3단계: 상사 마스터 가입 및 패스워드 BCrypt 암호화 저장
        Company company = Company.builder()
                .businessNumber(request.getBusinessNumber())
                .name(request.getName())
                .masterEmail(request.getMasterEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .address(request.getAddress())
                .phone(request.getPhone())
                .profileImageUrl(request.getProfileImageUrl())
                .membershipStatus(false) // 최초 가입 시 비활성화 상태
                .build();

        return companyRepository.save(company);
    }

    /**
     * 일반 회원, 관리자, 상사 마스터, 딜러 계정에 대한 통합 로그인을 수행하고 JWT 토큰을 발행합니다.
     *
     * @param request 로그인 요청 정보 (username, password, roleType)
     * @return 생성된 JWT 토큰 및 계정 기본 정보 DTO
     */
    @Transactional(readOnly = true)
    public AuthDto.LoginResponse login(AuthDto.LoginRequest request) {
        String username = request.getUsername();
        String password = request.getPassword();
        String roleType = request.getRoleType(); // 'MEMBER', 'COMPANY_MASTER', 'DEALER', 'ADMIN'

        String dbPassword = null;
        String role = null;
        String name = null;

        // 1단계: 지정한 로그인 역할군(RoleType)에 따라 테이블 개별 조회 분기 실행
        if ("COMPANY_MASTER".equalsIgnoreCase(roleType)) {
            // 상사 마스터 테이블 조회
            Company company = companyRepository.findByMasterEmail(username)
                    .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 상사 마스터 계정입니다."));
            dbPassword = company.getPassword();
            role = "COMPANY_MASTER";
            name = company.getName();
        } else if ("DEALER".equalsIgnoreCase(roleType)) {
            // 딜러 테이블 조회
            Dealer dealer = dealerRepository.findByLoginId(username)
                    .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 딜러 계정입니다."));
            // 딜러 비활성화 상태 여부 확인
            if ("WITHDRAWN".equalsIgnoreCase(dealer.getStatus())) {
                throw new IllegalArgumentException("활동이 정지되거나 제외된 딜러 계정입니다.");
            }
            dbPassword = dealer.getPassword();
            role = "DEALER";
            name = dealer.getName();
        } else if ("MEMBER".equalsIgnoreCase(roleType) || "ADMIN".equalsIgnoreCase(roleType)) {
            // 일반 회원 및 관리자 테이블 조회
            Member member = memberRepository.findByEmail(username)
                    .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 회원 계정입니다."));
            dbPassword = member.getPassword();
            role = member.getRole().toUpperCase(); // MEMBER 또는 ADMIN
            name = member.getName();
            
            // 관리자 로그인 요청 시 실제 DB 권한 대조
            if ("ADMIN".equalsIgnoreCase(roleType) && !"ADMIN".equalsIgnoreCase(role)) {
                throw new IllegalArgumentException("관리자 권한이 없는 계정입니다.");
            }
        } else {
            throw new IllegalArgumentException("올바르지 않은 역할(Role) 타입입니다.");
        }

        // 2단계: 날것의 비밀번호와 DB 속 암호화 비밀번호를 BCrypt 대조 검증
        if (!passwordEncoder.matches(password, dbPassword)) {
            throw new IllegalArgumentException("비밀번호가 일치하지 않습니다.");
        }

        // 3단계: 검증 통과 시 JWT 토큰 생성
        String token = jwtProvider.createToken(username, "ROLE_" + role, name);

        return AuthDto.LoginResponse.builder()
                .token(token)
                .role(role)
                .name(name)
                .build();
    }
}
