package com.car.app.mypage.controller;

import com.car.app.global.response.ApiResponse;
import com.car.app.mypage.dto.MyPageDto;
import com.car.app.mypage.service.MyPageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users/me")
@RequiredArgsConstructor
public class MyPageController {

    private final MyPageService myPageService;

    /**
     * 로그인한 계정의 상세 프로필 및
     * 연관 활동 데이터를 반환합니다.
     */
    @GetMapping("/profile")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<MyPageDto.Response>> getProfile() {

        try {
            Authentication authentication = SecurityContextHolder
                    .getContext()
                    .getAuthentication();

            String loginId = authentication.getName();

            MyPageDto.Response response = myPageService.getProfile(
                    loginId,
                    authentication.getAuthorities());

            return ResponseEntity.ok(
                    ApiResponse.success(
                            response,
                            "마이페이지 조회가 완료되었습니다."));
        } catch (SecurityException e) {
            return ResponseEntity
                    .status(403)
                    .body(
                            ApiResponse.fail(
                                    "ERR_UNAUTHORIZED",
                                    e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity
                    .badRequest()
                    .body(
                            ApiResponse.fail(
                                    "ERR_INVALID_REQUEST",
                                    e.getMessage()));
        }
    }

    /**
     * 일반회원의 회원정보 및
     * 자차 보유 정보를 수정합니다.
     */
    @PutMapping("/member-profile")
    @PreAuthorize("hasRole('MEMBER')")
    public ResponseEntity<ApiResponse<MyPageDto.ProfileInfo>> updateMemberProfile(
            @RequestBody MyPageDto.MemberProfileUpdateRequest request) {

        try {
            Authentication authentication = SecurityContextHolder
                    .getContext()
                    .getAuthentication();

            String loginId = authentication.getName();

            MyPageDto.ProfileInfo response = myPageService.updateMemberProfile(
                    loginId,
                    request);

            return ResponseEntity.ok(
                    ApiResponse.success(
                            response,
                            "회원정보가 수정되었습니다."));
        } catch (SecurityException e) {
            return ResponseEntity
                    .status(403)
                    .body(
                            ApiResponse.fail(
                                    "ERR_UNAUTHORIZED",
                                    e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity
                    .badRequest()
                    .body(
                            ApiResponse.fail(
                                    "ERR_INVALID_REQUEST",
                                    e.getMessage()));
        }
    }
}