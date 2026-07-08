package com.car.app.dealer;

import lombok.*;

public class DealerDto {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateRequest {
        private String loginId;
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
    public static class Response {
        private Long dealerId;
        private String loginId;
        private String name;
        private String phone;
        private String status;
        private String tier;
        private Double riskScore;
        private String profileImageUrl;
    }
}
