package com.car.app.security;

import com.car.app.company.Company;
import com.car.app.member.Member;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/signup/member")
    public ResponseEntity<ApiResponse<Long>> signupMember(@RequestBody AuthDto.MemberSignupRequest request) {
        try {
            Member member = authService.signupMember(request);
            return ResponseEntity.ok(ApiResponse.success(member.getMemberId(), "회원가입이 성공적으로 완료되었습니다."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.fail("ERR_DUPLICATE_EMAIL", e.getMessage()));
        }
    }

    @PostMapping("/signup/company")
    public ResponseEntity<ApiResponse<Long>> signupCompany(@RequestBody AuthDto.CompanySignupRequest request) {
        try {
            Company company = authService.signupCompany(request);
            return ResponseEntity.ok(ApiResponse.success(company.getCompanyId(), "상사 회원가입이 성공적으로 완료되었습니다."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.fail("ERR_DUPLICATE_COMPANY", e.getMessage()));
        }
    }

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
