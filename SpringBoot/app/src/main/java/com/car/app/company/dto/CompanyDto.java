package com.car.app.company.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

public class CompanyDto {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PublicResponse {

        private Long companyId;

        private String name;

        private String loginId;

        private String masterEmail;

        private String phone;

        private String businessNumber;

        private String address;

        private String profileImageUrl;

        private Boolean membershipStatus;

        private String tier;

        private Boolean goldenBadgeStatus;
    }
}