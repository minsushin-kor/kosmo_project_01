package com.car.app.security;

import lombok.*;

public class AuthDto {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MemberSignupRequest {
        private String email;
        private String password;
        private String name;
        private String phone;
        private String profileImageUrl;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CompanySignupRequest {
        private String businessNumber;
        private String name;
        private String masterEmail;
        private String password;
        private String address;
        private String phone;
        private String profileImageUrl;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class LoginRequest {
        private String username;
        private String password;
        private String roleType; // 'MEMBER', 'COMPANY_MASTER', 'DEALER', 'ADMIN'
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class LoginResponse {
        private String token;
        private String role;
        private String name;
    }
}
