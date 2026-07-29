package com.car.app.dealer.dto;

import com.car.app.dealer.entity.Dealer;
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
        private String email;
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
        private String email;
        private String phone;
        private String status;
        private String tier;
        private Double riskScore;
        private String profileImageUrl;

        public static Response fromEntity(Dealer dealer) {
            if (dealer == null) return null;
            return Response.builder()
                    .dealerId(dealer.getDealerId())
                    .loginId(dealer.getLoginId())
                    .name(dealer.getName())
                    .email(dealer.getEmail())
                    .phone(dealer.getPhone())
                    .status(dealer.getStatus())
                    .tier(dealer.getTier())
                    .riskScore(dealer.getRiskScore())
                    .profileImageUrl(dealer.getProfileImageUrl())
                    .build();
        }
    }
}
