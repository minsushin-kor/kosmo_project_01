package com.car.app.mypage;

import com.car.app.car.CarDto;
import com.car.app.auction.AuctionDto;
import com.car.app.dealer.DealerDto;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

public class MyPageDto {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Response {
        private String userType; // "MEMBER", "DEALER", "COMPANY_MASTER"
        private ProfileInfo profile;
        private List<CarDto.Response> registeredCars;
        private List<CarDto.Response> wishlistedCars;
        private List<AuctionDto.BidResponse> bids;
        private List<TransactionResponse> transactions;
        private List<DealerDto.Response> dealers; // 상사 마스터인 경우 소속 딜러 목록
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ProfileInfo {
        private String username; // 이메일 또는 로그인 ID
        private String name;
        private String phone;
        private String profileImageUrl;
        private String role;
        
        // 상사 마스터 전용 정보
        private String businessNumber;
        private String address;
        private Boolean membershipStatus;
        
        // 딜러 전용 정보
        private String tier;
        private Double riskScore;
        private String companyName;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TransactionResponse {
        private Long transactionId;
        private Long carId;
        private String carMake;
        private String carModel;
        private String buyerType;
        private Long buyerId;
        private String buyerName;
        private String sellerType;
        private Long sellerId;
        private String sellerName;
        private Long dealPrice;
        private Long commissionAmount;
        private LocalDateTime createdAt;
    }
}
