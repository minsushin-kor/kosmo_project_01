package com.car.app.company;

import lombok.*;

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
        private String tier;
        private Boolean goldenBadgeStatus;
    }
}
