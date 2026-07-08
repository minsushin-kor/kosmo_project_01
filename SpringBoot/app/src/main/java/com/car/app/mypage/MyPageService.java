package com.car.app.mypage;

import com.car.app.auction.AuctionDto;
import com.car.app.auction.BidRepository;
import com.car.app.car.Car;
import com.car.app.car.CarDto;
import com.car.app.car.CarRepository;
import com.car.app.company.Company;
import com.car.app.company.CompanyRepository;
import com.car.app.dealer.Dealer;
import com.car.app.dealer.DealerDto;
import com.car.app.dealer.DealerRepository;
import com.car.app.member.Member;
import com.car.app.member.MemberRepository;
import com.car.app.transaction.Transaction;
import com.car.app.transaction.TransactionRepository;
import com.car.app.wishlist.WishlistRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MyPageService {

    private final MemberRepository memberRepository;
    private final CompanyRepository companyRepository;
    private final DealerRepository dealerRepository;
    private final CarRepository carRepository;
    private final BidRepository bidRepository;
    private final WishlistRepository wishlistRepository;
    private final TransactionRepository transactionRepository;

    /**
     * 현재 로그인한 계정의 권한에 의거하여 마이페이지 프로필과 연관 활동 이력을 조회합니다.
     */
    @Transactional(readOnly = true)
    public MyPageDto.Response getProfile(String username, Collection<? extends GrantedAuthority> authorities) {
        boolean isCompanyMaster = authorities.stream().anyMatch(a -> a.getAuthority().equals("ROLE_COMPANY_MASTER"));
        boolean isDealer = authorities.stream().anyMatch(a -> a.getAuthority().equals("ROLE_DEALER"));
        boolean isMember = authorities.stream().anyMatch(a -> a.getAuthority().equals("ROLE_MEMBER") || a.getAuthority().equals("ROLE_ADMIN"));

        if (isCompanyMaster) {
            Company company = companyRepository.findByMasterEmail(username)
                    .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 상사 마스터 계정입니다."));

            MyPageDto.ProfileInfo profile = MyPageDto.ProfileInfo.builder()
                    .username(company.getMasterEmail())
                    .name(company.getName())
                    .phone(company.getPhone())
                    .profileImageUrl(company.getProfileImageUrl())
                    .role("COMPANY_MASTER")
                    .businessNumber(company.getBusinessNumber())
                    .address(company.getAddress())
                    .membershipStatus(company.getMembershipStatus())
                    .build();

            // 소속 딜러 목록 조회
            List<Dealer> dealers = dealerRepository.findByCompanyCompanyId(company.getCompanyId());
            List<DealerDto.Response> dealerDtos = dealers.stream()
                    .map(d -> DealerDto.Response.builder()
                            .dealerId(d.getDealerId())
                            .loginId(d.getLoginId())
                            .name(d.getName())
                            .phone(d.getPhone())
                            .status(d.getStatus())
                            .tier(d.getTier())
                            .riskScore(d.getRiskScore())
                            .profileImageUrl(d.getProfileImageUrl())
                            .build())
                    .collect(Collectors.toList());

            // 소속 딜러들이 등록한 차량 매물 및 거래 성사 실적 취합
            List<CarDto.Response> registeredCars = new ArrayList<>();
            List<MyPageDto.TransactionResponse> transactions = new ArrayList<>();
            for (Dealer d : dealers) {
                // 차량 매물
                List<Car> cars = carRepository.findByDealerDealerId(d.getDealerId());
                for (Car car : cars) {
                    registeredCars.add(mapToCarResponse(car));
                }
                // 성사 거래
                List<Transaction> txs = transactionRepository.findByBuyerTypeAndBuyerId("DEALER", d.getDealerId());
                for (Transaction tx : txs) {
                    transactions.add(mapToTransactionResponse(tx));
                }
            }

            return MyPageDto.Response.builder()
                    .userType("COMPANY_MASTER")
                    .profile(profile)
                    .dealers(dealerDtos)
                    .registeredCars(registeredCars)
                    .transactions(transactions)
                    .build();

        } else if (isDealer) {
            Dealer dealer = dealerRepository.findByLoginId(username)
                    .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 딜러 계정입니다."));

            MyPageDto.ProfileInfo profile = MyPageDto.ProfileInfo.builder()
                    .username(dealer.getLoginId())
                    .name(dealer.getName())
                    .phone(dealer.getPhone())
                    .profileImageUrl(dealer.getProfileImageUrl())
                    .role("DEALER")
                    .tier(dealer.getTier())
                    .riskScore(dealer.getRiskScore())
                    .companyName(dealer.getCompany().getName())
                    .build();

            // 본인이 등록한 차량 매물 조회
            List<CarDto.Response> registeredCars = carRepository.findByDealerDealerId(dealer.getDealerId()).stream()
                    .map(this::mapToCarResponse)
                    .collect(Collectors.toList());

            // 관심 등록(찜) 차량 목록 조회
            List<CarDto.Response> wishlistedCars = wishlistRepository.findByDealerDealerId(dealer.getDealerId()).stream()
                    .map(wish -> mapToCarResponse(wish.getCar()))
                    .collect(Collectors.toList());

            // 본인의 입찰 참여 내역 조회
            List<AuctionDto.BidResponse> bids = bidRepository.findByDealerDealerId(dealer.getDealerId()).stream()
                    .map(bid -> AuctionDto.BidResponse.builder()
                            .bidId(bid.getBidId())
                            .auctionId(bid.getAuction().getAuctionId())
                            .dealerId(dealer.getDealerId())
                            .dealerName(dealer.getName())
                            .bidAmount(bid.getBidAmount())
                            .createdAt(bid.getCreatedAt())
                            .build())
                    .collect(Collectors.toList());

            // 본인이 매입(Buyer)한 성사 거래 내역 조회
            List<MyPageDto.TransactionResponse> transactions = transactionRepository.findByBuyerTypeAndBuyerId("DEALER", dealer.getDealerId()).stream()
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

        } else if (isMember) {
            Member member = memberRepository.findByEmail(username)
                    .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 회원 계정입니다."));

            MyPageDto.ProfileInfo profile = MyPageDto.ProfileInfo.builder()
                    .username(member.getEmail())
                    .name(member.getName())
                    .phone(member.getPhone())
                    .profileImageUrl(member.getProfileImageUrl())
                    .role(member.getRole())
                    .build();

            // 본인이 등록한 차량 매물 조회
            List<CarDto.Response> registeredCars = carRepository.findByMemberMemberId(member.getMemberId()).stream()
                    .map(this::mapToCarResponse)
                    .collect(Collectors.toList());

            // 관심 등록(찜) 차량 목록 조회
            List<CarDto.Response> wishlistedCars = wishlistRepository.findByMemberMemberId(member.getMemberId()).stream()
                    .map(wish -> mapToCarResponse(wish.getCar()))
                    .collect(Collectors.toList());

            // 본인이 판매(Seller)한 성사 거래 내역 조회
            List<MyPageDto.TransactionResponse> transactions = transactionRepository.findBySellerTypeAndSellerId("MEMBER", member.getMemberId()).stream()
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

        throw new SecurityException("지원되지 않는 계정 권한입니다.");
    }

    private CarDto.Response mapToCarResponse(Car car) {
        Object owner = car.getOwner();
        Long ownerId = null;
        String ownerName = null;
        if (owner instanceof Member) {
            ownerId = ((Member) owner).getMemberId();
            ownerName = ((Member) owner).getName();
        } else if (owner instanceof Dealer) {
            ownerId = ((Dealer) owner).getDealerId();
            ownerName = ((Dealer) owner).getName();
        }

        List<CarDto.ImageDto> imageDtos = car.getImages().stream()
                .map(img -> CarDto.ImageDto.builder()
                        .imageUrl(img.getImageUrl())
                        .isMain(img.getIsMain())
                        .build())
                .collect(Collectors.toList());

        return CarDto.Response.builder()
                .carId(car.getCarId())
                .year(car.getYear())
                .make(car.getMake())
                .model(car.getModel())
                .option(car.getOption())
                .body(car.getBody())
                .transmission(car.getTransmission())
                .state(car.getState())
                .condition(car.getCondition())
                .odometer(car.getOdometer())
                .color(car.getColor())
                .interior(car.getInterior())
                .sellingPrice(car.getSellingPrice())
                .status(car.getStatus())
                .ownerType(car.getOwnerType())
                .ownerId(ownerId)
                .ownerName(ownerName)
                .images(imageDtos)
                .build();
    }

    private MyPageDto.TransactionResponse mapToTransactionResponse(Transaction tx) {
        String buyerName = "";
        if ("DEALER".equalsIgnoreCase(tx.getBuyerType())) {
            buyerName = dealerRepository.findById(tx.getBuyerId())
                    .map(Dealer::getName).orElse("알 수 없는 딜러");
        } else if ("MEMBER".equalsIgnoreCase(tx.getBuyerType())) {
            buyerName = memberRepository.findById(tx.getBuyerId())
                    .map(Member::getName).orElse("알 수 없는 회원");
        }

        String sellerName = "";
        if ("MEMBER".equalsIgnoreCase(tx.getSellerType())) {
            sellerName = memberRepository.findById(tx.getSellerId())
                    .map(Member::getName).orElse("알 수 없는 회원");
        } else if ("DEALER".equalsIgnoreCase(tx.getSellerType())) {
            sellerName = dealerRepository.findById(tx.getSellerId())
                    .map(Dealer::getName).orElse("알 수 없는 딜러");
        }

        return MyPageDto.TransactionResponse.builder()
                .transactionId(tx.getTransactionId())
                .carId(tx.getCar().getCarId())
                .carMake(tx.getCar().getMake())
                .carModel(tx.getCar().getModel())
                .buyerType(tx.getBuyerType())
                .buyerId(tx.getBuyerId())
                .buyerName(buyerName)
                .sellerType(tx.getSellerType())
                .sellerId(tx.getSellerId())
                .sellerName(sellerName)
                .dealPrice(tx.getDealPrice())
                .commissionAmount(tx.getCommissionAmount())
                .createdAt(tx.getCreatedAt())
                .build();
    }
}
