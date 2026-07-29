package com.car.app.mypage.service;

import com.car.app.auction.dto.AuctionDto;
import com.car.app.auction.repository.BidRepository;
import com.car.app.car.dto.CarDto;
import com.car.app.car.entity.Car;
import com.car.app.car.repository.CarRepository;
import com.car.app.company.entity.Company;
import com.car.app.company.repository.CompanyRepository;
import com.car.app.dealer.dto.DealerDto;
import com.car.app.dealer.entity.Dealer;
import com.car.app.dealer.repository.DealerRepository;
import com.car.app.member.entity.Member;
import com.car.app.member.repository.MemberRepository;
import com.car.app.mypage.dto.MyPageDto;
import com.car.app.transaction.entity.Transaction;
import com.car.app.transaction.repository.TransactionRepository;
import com.car.app.wishlist.repository.WishlistRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.car.app.user.entity.User;
import com.car.app.user.repository.UserRepository;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MyPageService {

        private final MemberRepository memberRepository;
        private final UserRepository userRepository;
        private final CompanyRepository companyRepository;
        private final DealerRepository dealerRepository;
        private final CarRepository carRepository;
        private final BidRepository bidRepository;
        private final WishlistRepository wishlistRepository;
        private final TransactionRepository transactionRepository;

        /**
         * 현재 로그인한 계정의 권한에 따라
         * 프로필과 관련 활동 내역을 조회합니다.
         */
        @Transactional(readOnly = true)
        public MyPageDto.Response getProfile(
                        String loginId,
                        Collection<? extends GrantedAuthority> authorities) {
                boolean isCompanyMaster = authorities.stream()
                                .anyMatch(authority -> "ROLE_COMPANY_MASTER".equals(
                                                authority.getAuthority()));

                boolean isDealer = authorities.stream()
                                .anyMatch(authority -> "ROLE_DEALER".equals(
                                                authority.getAuthority()));

                boolean isMember = authorities.stream()
                                .anyMatch(authority -> "ROLE_MEMBER".equals(
                                                authority.getAuthority())
                                                || "ROLE_ADMIN".equals(
                                                                authority.getAuthority()));

                if (isCompanyMaster) {
                        return getCompanyProfile(loginId);
                }

                if (isDealer) {
                        return getDealerProfile(loginId);
                }

                if (isMember) {
                        return getMemberProfile(loginId);
                }

                throw new SecurityException(
                                "지원되지 않는 계정 권한입니다.");
        }

        /**
         * 일반회원의 회원정보와 보유 차량 정보를 수정합니다.
         */
        @Transactional
        public MyPageDto.ProfileInfo updateMemberProfile(
                        String loginId,
                        MyPageDto.MemberProfileUpdateRequest request) {

                Member member = memberRepository
                                .findByLoginId(loginId)
                                .orElseThrow(
                                                () -> new IllegalArgumentException(
                                                                "존재하지 않는 회원 계정입니다."));

                validateMemberProfileUpdate(
                                member,
                                request);

                String name = request.getName().trim();

                String email = request.getEmail().trim();

                String phone = request.getPhone().trim();

                boolean hasCar = Boolean.TRUE.equals(
                                request.getHasCar());

                member.setName(name);
                member.setEmail(email);
                member.setPhone(phone);
                member.setHasCar(hasCar);

                if (hasCar) {
                        member.setOwnedCarImageUrl(
                                        trimToNull(
                                                        request.getOwnedCarImageUrl()));

                        member.setOwnedCarMake(
                                        trimToNull(
                                                        request.getOwnedCarMake()));

                        member.setOwnedCarModel(
                                        trimToNull(
                                                        request.getOwnedCarModel()));

                        member.setOwnedCarOdometer(
                                        request.getOwnedCarOdometer());

                        member.setOwnedCarYear(
                                        request.getOwnedCarYear());
                } else {
                        /*
                         * 자차 없음으로 변경하면
                         * 기존 보유 차량 정보를 모두 초기화합니다.
                         */
                        member.setOwnedCarImageUrl(null);
                        member.setOwnedCarMake(null);
                        member.setOwnedCarModel(null);
                        member.setOwnedCarOdometer(null);
                        member.setOwnedCarYear(null);
                }

                User user = member.getUser();

                if (user != null) {
                        user.setName(name);
                        user.setEmail(email);
                        user.setPhone(phone);

                        userRepository.save(user);
                }

                Member savedMember = memberRepository.save(member);

                return mapToMemberProfileInfo(
                                savedMember);
        }

        private void validateMemberProfileUpdate(
                        Member member,
                        MyPageDto.MemberProfileUpdateRequest request) {

                if (request == null) {
                        throw new IllegalArgumentException(
                                        "수정할 회원정보가 없습니다.");
                }

                if (request.getName() == null ||
                                request.getName().trim().isEmpty()) {
                        throw new IllegalArgumentException(
                                        "이름을 입력해주세요.");
                }

                if (request.getEmail() == null ||
                                request.getEmail().trim().isEmpty()) {
                        throw new IllegalArgumentException(
                                        "이메일을 입력해주세요.");
                }

                if (request.getPhone() == null ||
                                request.getPhone().trim().isEmpty()) {
                        throw new IllegalArgumentException(
                                        "연락처를 입력해주세요.");
                }

                String email = request.getEmail().trim();

                if (memberRepository
                                .existsByEmailAndMemberIdNot(
                                                email,
                                                member.getMemberId())) {
                        throw new IllegalArgumentException(
                                        "이미 사용 중인 이메일입니다.");
                }

                User user = member.getUser();

                if (user != null &&
                                userRepository
                                                .existsByEmailAndUserIdNot(
                                                                email,
                                                                user.getUserId())) {
                        throw new IllegalArgumentException(
                                        "이미 사용 중인 이메일입니다.");
                }

                if (Boolean.TRUE.equals(
                                request.getHasCar())) {
                        if (request.getOwnedCarMake() == null ||
                                        request.getOwnedCarMake().trim().isEmpty()) {
                                throw new IllegalArgumentException(
                                                "자차 제조사를 입력해주세요.");
                        }

                        if (request.getOwnedCarModel() == null ||
                                        request.getOwnedCarModel().trim().isEmpty()) {
                                throw new IllegalArgumentException(
                                                "자차 모델을 입력해주세요.");
                        }

                        Integer ownedCarYear = request.getOwnedCarYear();

                        int currentYear = java.time.LocalDate.now()
                                        .getYear();

                        if (ownedCarYear != null &&
                                        (ownedCarYear < 1900 ||
                                                        ownedCarYear > currentYear + 1)) {
                                throw new IllegalArgumentException(
                                                "자차 연식을 확인해주세요.");
                        }

                        Double odometer = request.getOwnedCarOdometer();

                        if (odometer != null &&
                                        odometer < 0) {
                                throw new IllegalArgumentException(
                                                "주행거리는 0 이상이어야 합니다.");
                        }
                }
        }

        private MyPageDto.ProfileInfo mapToMemberProfileInfo(
                        Member member) {

                return MyPageDto.ProfileInfo
                                .builder()
                                .userId(
                                                member.getUser() != null
                                                                ? member.getUser().getUserId()
                                                                : null)
                                .memberId(
                                                member.getMemberId())
                                .companyId(null)
                                .dealerId(null)
                                .loginId(
                                                member.getLoginId())
                                .email(
                                                member.getEmail())
                                .name(
                                                member.getName())
                                .phone(
                                                member.getPhone())
                                .profileImageUrl(
                                                member.getProfileImageUrl())
                                .role(
                                                member.getRole())
                                .hasCar(
                                                Boolean.TRUE.equals(
                                                                member.getHasCar()))
                                .ownedCarImageUrl(
                                                member.getOwnedCarImageUrl())
                                .ownedCarMake(
                                                member.getOwnedCarMake())
                                .ownedCarModel(
                                                member.getOwnedCarModel())
                                .ownedCarOdometer(
                                                member.getOwnedCarOdometer())
                                .ownedCarYear(
                                                member.getOwnedCarYear())
                                .build();
        }

        private String trimToNull(
                        String value) {

                if (value == null) {
                        return null;
                }

                String trimmed = value.trim();

                return trimmed.isEmpty()
                                ? null
                                : trimmed;
        }

        private MyPageDto.Response getCompanyProfile(
                        String loginId) {
                Company company = companyRepository.findByLoginId(loginId)
                                .orElseThrow(() -> new IllegalArgumentException(
                                                "존재하지 않는 회사 계정입니다."));

                MyPageDto.ProfileInfo profile = MyPageDto.ProfileInfo.builder()
                                .userId(
                                                company.getUser() != null
                                                                ? company.getUser().getUserId()
                                                                : null)
                                .memberId(null)
                                .companyId(
                                                company.getCompanyId())
                                .dealerId(null)
                                .loginId(
                                                company.getLoginId())
                                .email(
                                                company.getMasterEmail())
                                .name(
                                                company.getName())
                                .phone(
                                                company.getPhone())
                                .profileImageUrl(
                                                company.getProfileImageUrl())
                                .role("COMPANY_MASTER")
                                .tier(
                                                company.getTier())
                                .membershipStatus(
                                                company.getMembershipStatus())
                                .goldenBadgeStatus(
                                                Boolean.TRUE.equals(
                                                                company.getGoldenBadgeStatus()))
                                .address(
                                                company.getAddress())
                                .businessNumber(
                                                company.getBusinessNumber())
                                .build();

                List<Dealer> dealers = dealerRepository.findByCompanyCompanyId(
                                company.getCompanyId());

                List<DealerDto.Response> dealerDtos = dealers.stream()
                                .map(dealer -> DealerDto.Response.builder()
                                                .dealerId(
                                                                dealer.getDealerId())
                                                .loginId(
                                                                dealer.getLoginId())
                                                .name(dealer.getName())
                                                .phone(dealer.getPhone())
                                                .status(
                                                                dealer.getStatus())
                                                .tier(dealer.getTier())
                                                .riskScore(
                                                                dealer.getRiskScore())
                                                .profileImageUrl(
                                                                dealer.getProfileImageUrl())
                                                .build())
                                .collect(Collectors.toList());

                List<CarDto.Response> registeredCars = new ArrayList<>();

                List<MyPageDto.TransactionResponse> transactions = new ArrayList<>();

                for (Dealer dealer : dealers) {
                        List<Car> cars = carRepository.findByDealerDealerId(
                                        dealer.getDealerId());

                        for (Car car : cars) {
                                registeredCars.add(
                                                mapToCarResponse(car));
                        }

                        List<Transaction> dealerTransactions = transactionRepository
                                        .findByBuyerTypeAndBuyerId(
                                                        "DEALER",
                                                        dealer.getDealerId());

                        for (Transaction transaction : dealerTransactions) {
                                transactions.add(
                                                mapToTransactionResponse(
                                                                transaction));
                        }
                }

                return MyPageDto.Response.builder()
                                .userType("COMPANY_MASTER")
                                .profile(profile)
                                .dealers(dealerDtos)
                                .registeredCars(registeredCars)
                                .transactions(transactions)
                                .build();
        }

        private MyPageDto.Response getDealerProfile(
                        String loginId) {
                Dealer dealer = dealerRepository.findByLoginId(loginId)
                                .orElseThrow(() -> new IllegalArgumentException(
                                                "존재하지 않는 딜러 계정입니다."));

                Company company = dealer.getCompany();

                MyPageDto.ProfileInfo profile = MyPageDto.ProfileInfo.builder()
                                .userId(
                                                dealer.getUser() != null
                                                                ? dealer.getUser().getUserId()
                                                                : null)
                                .memberId(null)
                                .companyId(
                                                company != null
                                                                ? company.getCompanyId()
                                                                : null)
                                .dealerId(dealer.getDealerId())
                                .loginId(dealer.getLoginId())
                                .email(dealer.getEmail())
                                .name(dealer.getName())
                                .phone(dealer.getPhone())
                                .profileImageUrl(
                                                dealer.getProfileImageUrl())
                                .role("DEALER")
                                .tier(dealer.getTier())
                                .riskScore(dealer.getRiskScore())
                                .companyName(
                                                company != null
                                                                ? company.getName()
                                                                : "")
                                .goldenBadgeStatus(
                                                company != null
                                                                && Boolean.TRUE.equals(
                                                                                company.getGoldenBadgeStatus()))
                                .build();

                List<CarDto.Response> registeredCars = carRepository
                                .findByDealerDealerId(
                                                dealer.getDealerId())
                                .stream()
                                .map(this::mapToCarResponse)
                                .collect(Collectors.toList());

                List<CarDto.Response> wishlistedCars = wishlistRepository
                                .findByDealerDealerId(
                                                dealer.getDealerId())
                                .stream()
                                .map(wishlist -> mapToCarResponse(
                                                wishlist.getCar()))
                                .collect(Collectors.toList());

                List<AuctionDto.BidResponse> bids = bidRepository
                                .findByDealerDealerId(
                                                dealer.getDealerId())
                                .stream()
                                .map(bid -> AuctionDto.BidResponse.builder()
                                                .bidId(bid.getBidId())
                                                .auctionId(
                                                                bid.getAuction()
                                                                                .getAuctionId())
                                                .dealerId(
                                                                dealer.getDealerId())
                                                .dealerName(
                                                                dealer.getName())
                                                .bidAmount(
                                                                bid.getBidAmount())
                                                .createdAt(
                                                                bid.getCreatedAt())
                                                .build())
                                .collect(Collectors.toList());

                List<MyPageDto.TransactionResponse> transactions = transactionRepository
                                .findByBuyerTypeAndBuyerId(
                                                "DEALER",
                                                dealer.getDealerId())
                                .stream()
                                .map(this::mapToTransactionResponse)
                                .collect(Collectors.toList());

                return MyPageDto.Response.builder()
                                .userType("DEALER")
                                .profile(profile)
                                .registeredCars(registeredCars)
                                .wishlistedCars(wishlistedCars)
                                .bids(bids)
                                .transactions(transactions)
                                .build();
        }

        private MyPageDto.Response getMemberProfile(
                        String loginId) {
                Member member = memberRepository.findByLoginId(loginId)
                                .orElseThrow(() -> new IllegalArgumentException(
                                                "존재하지 않는 회원 계정입니다."));

                MyPageDto.ProfileInfo profile = MyPageDto.ProfileInfo.builder()
                                .userId(
                                                member.getUser() != null
                                                                ? member.getUser().getUserId()
                                                                : null)
                                .memberId(member.getMemberId())
                                .companyId(null)
                                .dealerId(null)
                                .loginId(member.getLoginId())
                                .email(member.getEmail())
                                .name(member.getName())
                                .phone(member.getPhone())
                                .profileImageUrl(
                                                member.getProfileImageUrl())
                                .role(member.getRole())
                                .hasCar(member.getHasCar())
                                .ownedCarImageUrl(
                                                member.getOwnedCarImageUrl())
                                .ownedCarMake(
                                                member.getOwnedCarMake())
                                .ownedCarModel(
                                                member.getOwnedCarModel())
                                .ownedCarOdometer(
                                                member.getOwnedCarOdometer())
                                .ownedCarYear(
                                                member.getOwnedCarYear())
                                .build();

                List<CarDto.Response> registeredCars = carRepository
                                .findByMemberMemberId(
                                                member.getMemberId())
                                .stream()
                                .map(this::mapToCarResponse)
                                .collect(Collectors.toList());

                List<CarDto.Response> wishlistedCars = wishlistRepository
                                .findByMemberMemberId(
                                                member.getMemberId())
                                .stream()
                                .map(wishlist -> mapToCarResponse(
                                                wishlist.getCar()))
                                .collect(Collectors.toList());

                List<MyPageDto.TransactionResponse> transactions = transactionRepository
                                .findBySellerTypeAndSellerId(
                                                "MEMBER",
                                                member.getMemberId())
                                .stream()
                                .map(this::mapToTransactionResponse)
                                .collect(Collectors.toList());

                return MyPageDto.Response.builder()
                                .userType("MEMBER")
                                .profile(profile)
                                .registeredCars(registeredCars)
                                .wishlistedCars(wishlistedCars)
                                .transactions(transactions)
                                .build();
        }

        private CarDto.Response mapToCarResponse(
                        Car car) {
                Object owner = car.getOwner();

                Long ownerId = null;
                String ownerName = null;
                String saleType = null;
                String sellerType = null;

                if (owner instanceof Member member) {
                        ownerId = member.getMemberId();
                        ownerName = member.getName();
                        saleType = "AUCTION";
                        sellerType = "일반회원";
                } else if (owner instanceof Dealer dealer) {
                        ownerId = dealer.getDealerId();
                        ownerName = dealer.getName();
                        saleType = "NORMAL";
                        sellerType = "회사딜러";
                }

                List<CarDto.ImageDto> imageDtos = car.getImages()
                                .stream()
                                .map(image -> CarDto.ImageDto.builder()
                                                .imageUrl(
                                                                image.getImageUrl())
                                                .isMain(
                                                                image.getIsMain())
                                                .build())
                                .collect(Collectors.toList());

                boolean goldenBadgeStatus = false;

                if (car.getDealer() != null
                                && car.getDealer().getCompany() != null) {
                        goldenBadgeStatus = Boolean.TRUE.equals(
                                        car.getDealer()
                                                        .getCompany()
                                                        .getGoldenBadgeStatus());
                }

                return CarDto.Response.builder()
                                .carId(car.getCarId())
                                .year(car.getYear())
                                .make(car.getMake())
                                .model(car.getModel())
                                .option(car.getOption())
                                .body(car.getBody())
                                .transmission(
                                                car.getTransmission())
                                .state(car.getState())
                                .condition(car.getCondition())
                                .odometer(car.getOdometer())
                                .color(car.getColor())
                                .interior(car.getInterior())
                                .sellingPrice(
                                                car.getSellingPrice())
                                .mmr(car.getMmr())
                                .status(car.getStatus())
                                .createdAt(car.getCreatedAt())
                                .ownerType(car.getOwnerType())
                                .ownerId(ownerId)
                                .ownerName(ownerName)
                                .saleType(saleType)
                                .sellerType(sellerType)
                                .images(imageDtos)
                                .goldenBadgeStatus(
                                                goldenBadgeStatus)
                                .build();
        }

        private MyPageDto.TransactionResponse mapToTransactionResponse(
                        Transaction transaction) {
                String buyerName = "";

                if ("DEALER".equalsIgnoreCase(
                                transaction.getBuyerType())) {
                        buyerName = dealerRepository
                                        .findById(
                                                        transaction.getBuyerId())
                                        .map(Dealer::getName)
                                        .orElse(
                                                        "알 수 없는 딜러");
                } else if ("MEMBER".equalsIgnoreCase(
                                transaction.getBuyerType())) {
                        buyerName = memberRepository
                                        .findById(
                                                        transaction.getBuyerId())
                                        .map(Member::getName)
                                        .orElse(
                                                        "알 수 없는 회원");
                }

                String sellerName = "";

                if ("MEMBER".equalsIgnoreCase(
                                transaction.getSellerType())) {
                        sellerName = memberRepository
                                        .findById(
                                                        transaction.getSellerId())
                                        .map(Member::getName)
                                        .orElse(
                                                        "알 수 없는 회원");
                } else if ("DEALER".equalsIgnoreCase(
                                transaction.getSellerType())) {
                        sellerName = dealerRepository
                                        .findById(
                                                        transaction.getSellerId())
                                        .map(Dealer::getName)
                                        .orElse(
                                                        "알 수 없는 딜러");
                }

                return MyPageDto.TransactionResponse.builder()
                                .transactionId(
                                                transaction.getTransactionId())
                                .carId(
                                                transaction.getCar().getCarId())
                                .carMake(
                                                transaction.getCar().getMake())
                                .carModel(
                                                transaction.getCar().getModel())
                                .buyerType(
                                                transaction.getBuyerType())
                                .buyerId(
                                                transaction.getBuyerId())
                                .buyerName(buyerName)
                                .sellerType(
                                                transaction.getSellerType())
                                .sellerId(
                                                transaction.getSellerId())
                                .sellerName(sellerName)
                                .dealPrice(
                                                transaction.getDealPrice())
                                .commissionAmount(
                                                transaction.getCommissionAmount())
                                .createdAt(
                                                transaction.getCreatedAt())
                                .build();
        }
}