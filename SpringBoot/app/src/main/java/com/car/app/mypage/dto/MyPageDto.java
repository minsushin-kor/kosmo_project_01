package com.car.app.mypage.dto;

import com.car.app.auction.dto.AuctionDto;
import com.car.app.car.dto.CarDto;
import com.car.app.dealer.dto.DealerDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

public class MyPageDto {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Response {

        private String userType;

        private ProfileInfo profile;

        private List<CarDto.Response> registeredCars;

        private List<CarDto.Response> wishlistedCars;

        private List<AuctionDto.BidResponse> bids;

        private List<TransactionResponse> transactions;

        private List<DealerDto.Response> dealers;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ProfileInfo {

        // users 통합 계정 ID
        private Long userId;

        // 역할별 상세 계정 ID
        private Long memberId;
        private Long companyId;
        private Long dealerId;

        private String loginId;
        private String email;
        private String name;
        private String phone;
        private String profileImageUrl;
        private String role;
        private String preferredCar;

        // 일반회원 보유 차량 정보
        private Boolean hasCar;
        private String ownedCarImageUrl;
        private String ownedCarMake;
        private String ownedCarModel;
        private Double ownedCarOdometer;
        private Integer ownedCarYear;

        // 회사 계정 정보
        private String businessNumber;
        private String address;
        private Boolean membershipStatus;

        // 딜러 계정 정보
        private String tier;
        private Double riskScore;
        private String companyName;

        // 회사 및 딜러 공통 정보
        private Boolean goldenBadgeStatus;
    }

    @Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public static class MemberProfileUpdateRequest {

    private String name;

    private String email;

    private String phone;

    private String preferredCar;

    private Boolean hasCar;

    private String ownedCarImageUrl;

    private String ownedCarMake;

    private String ownedCarModel;

    private Double ownedCarOdometer;

    private Integer ownedCarYear;
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
