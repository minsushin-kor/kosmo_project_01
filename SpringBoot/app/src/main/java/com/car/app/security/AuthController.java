package com.car.app.security;

import com.car.app.company.Company;
import com.car.app.member.Member;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * 일반 회원가입, 상사 마스터 가입 및 통합 로그인을 제공하는 인증 컨트롤러입니다.
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /**
     * 일반 회원의 회원가입 요청을 처리합니다.
     * 이메일 중복 시 400 에러와 함께 에러 코드를 반환합니다.
     */
    @PostMapping("/signup/member")
    public ResponseEntity<ApiResponse<Long>> signupMember(@RequestBody AuthDto.MemberSignupRequest request) {
        try {
            Member member = authService.signupMember(request);
            return ResponseEntity.ok(ApiResponse.success(member.getMemberId(), "회원가입이 성공적으로 완료되었습니다."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.fail("ERR_DUPLICATE_EMAIL", e.getMessage()));
        }
    }

    /**
     * 상사 마스터 계정의 가입 및 상사 등록 요청을 처리합니다.
     * 사업자 번호 혹은 이메일 중복 시 400 에러와 함께 에러 코드를 반환합니다.
     */
    @PostMapping("/signup/company")
    public ResponseEntity<ApiResponse<Long>> signupCompany(@RequestBody AuthDto.CompanySignupRequest request) {
        try {
            Company company = authService.signupCompany(request);
            return ResponseEntity.ok(ApiResponse.success(company.getCompanyId(), "상사 회원가입이 성공적으로 완료되었습니다."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.fail("ERR_DUPLICATE_COMPANY", e.getMessage()));
        }
    }

    /**
     * 통합 로그인 요청을 처리합니다.
     * 사용자 유형에 맞춰 조회 후 검증하여 성공 시 JWT 토큰을 발급합니다.
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthDto.LoginResponse>> login(@RequestBody AuthDto.LoginRequest request) {
        try {
            AuthDto.LoginResponse response = authService.login(request);
            return ResponseEntity.ok(ApiResponse.success(response, "로그인에 성공하였습니다."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.fail("ERR_AUTHENTICATION_FAILED", e.getMessage()));
        }
    }
}
