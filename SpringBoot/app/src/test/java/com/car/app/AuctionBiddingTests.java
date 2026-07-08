package com.car.app;

import com.car.app.auction.*;
import com.car.app.car.Car;
import com.car.app.car.CarDto;
import com.car.app.car.CarService;
import com.car.app.company.Company;
import com.car.app.company.CompanyRepository;
import com.car.app.dealer.Dealer;
import com.car.app.dealer.DealerRepository;
import com.car.app.member.Member;
import com.car.app.member.MemberRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@Transactional
class AuctionBiddingTests {

    @Autowired private CarService carService;
    @Autowired private AuctionService auctionService;
    @Autowired private MemberRepository memberRepository;
    @Autowired private CompanyRepository companyRepository;
    @Autowired private DealerRepository dealerRepository;
    @Autowired private AuctionRepository auctionRepository;
    @Autowired private BidRepository bidRepository;
    @Autowired private com.car.app.transaction.TransactionRepository transactionRepository;
    @Autowired private com.car.app.car.CarRepository carRepository;

    @Test
    void testAutoAuctionCreationWhenMemberRegistersCar() {
        // 1. Create a general member
        Member member = Member.builder()
                .email("seller@test.com")
                .password("password123")
                .name("차주")
                .phone("010-1234-5678")
                .role("MEMBER")
                .build();
        memberRepository.save(member);

        // 2. Prepare car creation request
        CarDto.CreateRequest request = CarDto.CreateRequest.builder()
                .year(2026)
                .make("Kia")
                .model("Sorento")
                .option("LX")
                .body("SUV")
                .transmission("automatic")
                .state("Seoul")
                .condition(4.5)
                .odometer(12000.0)
                .color("white")
                .interior("black")
                .sellingPrice(21500000L)
                .images(Collections.singletonList(
                        CarDto.ImageDto.builder().imageUrl("https://test.com/img.jpg").isMain(true).build()
                ))
                .build();

        // 3. Register car under ROLE_MEMBER
        Car car = carService.registerCar(
                "seller@test.com",
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_MEMBER")),
                request
        );

        // 4. Verify that an auction session is automatically created
        Optional<Auction> auctionOpt = auctionRepository.findByCarCarId(car.getCarId());
        assertThat(auctionOpt).isPresent();
        
        Auction auction = auctionOpt.get();
        assertThat(auction.getStatus()).isEqualTo("ACTIVE");
        assertThat(auction.getEndTime()).isAfter(auction.getStartTime());
        // Verify duration is exactly 3 hours
        assertThat(auction.getEndTime()).isEqualTo(auction.getStartTime().plusHours(3));
    }

    @Test
    void testPlaceBidSuccessAndConstraintFailures() {
        // 1. Setup company and dealer
        Company company = Company.builder()
                .businessNumber("123-45-67890")
                .name("상사A")
                .masterEmail("master@company.com")
                .password("password123")
                .membershipStatus(true)
                .build();
        companyRepository.save(company);

        Dealer dealer = Dealer.builder()
                .company(company)
                .loginId("dealer01")
                .password("password123")
                .name("딜러")
                .phone("010-2222-3333")
                .status("ACTIVE")
                .tier("NORMAL")
                .build();
        dealerRepository.save(dealer);

        // 2. Setup member and car
        Member member = Member.builder()
                .email("seller@test.com")
                .password("password123")
                .name("차주")
                .phone("010-1234-5678")
                .role("MEMBER")
                .build();
        memberRepository.save(member);

        CarDto.CreateRequest request = CarDto.CreateRequest.builder()
                .year(2026)
                .make("Kia")
                .model("Sorento")
                .sellingPrice(21500000L)
                .build();

        Car car = carService.registerCar(
                "seller@test.com",
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_MEMBER")),
                request
        );

        Auction auction = auctionRepository.findByCarCarId(car.getCarId())
                .orElseThrow();

        // 3. Place a bid (first attempt) -> Should succeed
        Bid bid = auctionService.placeBid(auction.getAuctionId(), "dealer01", 21000000L);
        assertThat(bid.getBidId()).isNotNull();
        assertThat(bid.getBidAmount()).isEqualTo(21000000L);

        // 4. Place a bid again (second attempt) -> Should fail due to double-bidding check
        assertThatThrownBy(() -> {
            auctionService.placeBid(auction.getAuctionId(), "dealer01", 22000000L);
        }).isInstanceOf(IllegalArgumentException.class)
          .hasMessageContaining("이미 입찰 완료한 경매입니다");

        // 5. Test getBidsForSeller access control
        // Owner checks -> Success
        List<AuctionDto.BidResponse> sellerBids = auctionService.getBidsForSeller(car.getCarId(), "seller@test.com");
        assertThat(sellerBids).hasSize(1);
        assertThat(sellerBids.get(0).getBidAmount()).isEqualTo(21000000L);

        // Strangers check -> Fails
        assertThatThrownBy(() -> {
            auctionService.getBidsForSeller(car.getCarId(), "unauthorized@test.com");
        }).isInstanceOf(SecurityException.class)
          .hasMessageContaining("본인이 등록한 차량의 입찰 내역만 조회할 수 있습니다");
    }

    @Test
    void testCloseAuctionSuccessAndTransactionCreation() {
        // 1. Setup company, dealer, member and car
        Company company = Company.builder()
                .businessNumber("111-22-33333")
                .name("상사B")
                .masterEmail("masterB@company.com")
                .password("password123")
                .membershipStatus(true)
                .build();
        companyRepository.save(company);

        Dealer dealer1 = Dealer.builder()
                .company(company)
                .loginId("dealer02")
                .password("password123")
                .name("딜러1")
                .phone("010-1111-3333")
                .status("ACTIVE")
                .tier("NORMAL")
                .build();
        dealerRepository.save(dealer1);

        Dealer dealer2 = Dealer.builder()
                .company(company)
                .loginId("dealer03")
                .password("password123")
                .name("딜러2")
                .phone("010-1111-4444")
                .status("ACTIVE")
                .tier("NORMAL")
                .build();
        dealerRepository.save(dealer2);

        Member member = Member.builder()
                .email("seller2@test.com")
                .password("password123")
                .name("차주2")
                .phone("010-9999-8888")
                .role("MEMBER")
                .build();
        memberRepository.save(member);

        CarDto.CreateRequest request = CarDto.CreateRequest.builder()
                .year(2026)
                .make("Kia")
                .model("Sorento")
                .sellingPrice(21500000L)
                .build();

        Car car = carService.registerCar(
                "seller2@test.com",
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_MEMBER")),
                request
        );

        Auction auction = auctionRepository.findByCarCarId(car.getCarId()).orElseThrow();

        // 2. Place multiple bids from different dealers
        auctionService.placeBid(auction.getAuctionId(), "dealer02", 21000000L);
        auctionService.placeBid(auction.getAuctionId(), "dealer03", 22000000L); // Highest bid

        // 3. Close the auction as the seller -> Should select highest bid (dealer2, 22M)
        Auction closedAuction = auctionService.closeAuction(auction.getAuctionId(), "seller2@test.com");
        
        assertThat(closedAuction.getStatus()).isEqualTo("COMPLETED");
        assertThat(closedAuction.getWinningBid()).isNotNull();
        assertThat(closedAuction.getWinningBid().getDealer().getLoginId()).isEqualTo("dealer03");
        assertThat(closedAuction.getWinningBid().getBidAmount()).isEqualTo(22000000L);

        // 4. Verify car status changed to SOLD
        Car updatedCar = carRepository.findById(car.getCarId()).orElseThrow();
        assertThat(updatedCar.getStatus()).isEqualTo("SOLD");

        // 5. Verify Transaction was created in the database
        List<com.car.app.transaction.Transaction> transactions = transactionRepository.findByCarCarId(car.getCarId());
        assertThat(transactions).hasSize(1);
        
        com.car.app.transaction.Transaction transaction = transactions.get(0);
        assertThat(transaction.getDealPrice()).isEqualTo(22000000L);
        assertThat(transaction.getBuyerId()).isEqualTo(dealer2.getDealerId());
        assertThat(transaction.getCommissionAmount()).isEqualTo(66000L); // 22M * 0.3%
    }
}
