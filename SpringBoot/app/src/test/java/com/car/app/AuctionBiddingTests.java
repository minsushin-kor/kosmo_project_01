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
}
