package com.car.app;

import com.car.app.auction.*;
import com.car.app.car.*;
import com.car.app.company.*;
import com.car.app.dealer.*;
import com.car.app.member.*;
import com.car.app.transaction.*;
import com.car.app.wishlist.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Transactional
class MappingTests {

    @Autowired private MemberRepository memberRepository;
    @Autowired private CompanyRepository companyRepository;
    @Autowired private DealerRepository dealerRepository;
    @Autowired private CarRepository carRepository;
    @Autowired private CarImageRepository carImageRepository;
    @Autowired private AuctionRepository auctionRepository;
    @Autowired private BidRepository bidRepository;
    @Autowired private TransactionRepository transactionRepository;
    @Autowired private MembershipHistoryRepository membershipHistoryRepository;
    @Autowired private WishlistRepository wishlistRepository;

    @Test
    void testEntityMappingAndCrud() {
        // 1. Member
        Member member = Member.builder()
                .email("test-member@car.com")
                .password("securePass123!")
                .name("홍길동")
                .phone("010-1111-2222")
                .build();
        member = memberRepository.save(member);
        assertThat(member.getMemberId()).isNotNull();

        Optional<Member> foundMember = memberRepository.findById(member.getMemberId());
        assertThat(foundMember).isPresent();
        assertThat(foundMember.get().getName()).isEqualTo("홍길동");

        // 2. Company
        Company company = Company.builder()
                .businessNumber("111-22-33333")
                .name("테스트상사")
                .masterEmail("master@testcompany.com")
                .password("masterPass123!")
                .address("서울시 강남구")
                .phone("02-123-4567")
                .build();
        company = companyRepository.save(company);
        assertThat(company.getCompanyId()).isNotNull();

        // 3. Dealer
        Dealer dealer = Dealer.builder()
                .company(company)
                .loginId("test-dealer-id")
                .password("dealerPass123!")
                .name("이순신")
                .phone("010-3333-4444")
                .build();
        dealer = dealerRepository.save(dealer);
        assertThat(dealer.getDealerId()).isNotNull();

        // 4. Car (owned by Member)
        Car car = Car.builder()
                .member(member) // owner
                .year(2023)
                .make("Hyundai")
                .model("Grandeur")
                .option("Exclusive")
                .body("Sedan")
                .transmission("automatic")
                .state("서울")
                .condition(4.5)
                .odometer(32000.0)
                .color("black")
                .interior("brown")
                .mmr(35000000.0)
                .sellingPrice(37000000L)
                .status("REGISTERED")
                .build();
        car = carRepository.save(car);
        assertThat(car.getCarId()).isNotNull();

        // 5. CarImage
        CarImage carImage = CarImage.builder()
                .car(car)
                .imageUrl("https://example.com/images/grandeur.jpg")
                .isMain(true)
                .build();
        carImage = carImageRepository.save(carImage);
        assertThat(carImage.getCarImageId()).isNotNull();

        // 6. Auction
        Auction auction = Auction.builder()
                .car(car)
                .startTime(LocalDateTime.now())
                .endTime(LocalDateTime.now().plusDays(1))
                .status("ACTIVE")
                .build();
        auction = auctionRepository.save(auction);
        assertThat(auction.getAuctionId()).isNotNull();

        // 7. Bid
        Bid bid = Bid.builder()
                .auction(auction)
                .dealer(dealer)
                .bidAmount(36500000L)
                .build();
        bid = bidRepository.save(bid);
        assertThat(bid.getBidId()).isNotNull();

        // 8. Transaction
        Transaction transaction = Transaction.builder()
                .car(car)
                .buyerType("DEALER")
                .buyerId(dealer.getDealerId())
                .sellerType("MEMBER")
                .sellerId(member.getMemberId())
                .dealPrice(36500000L)
                .commissionAmount(109500L) // 36500000 * 0.003
                .build();
        transaction = transactionRepository.save(transaction);
        assertThat(transaction.getTransactionId()).isNotNull();

        // 9. MembershipHistory
        MembershipHistory membershipHistory = MembershipHistory.builder()
                .company(company)
                .paymentAmount(500000L)
                .startDate(LocalDateTime.now())
                .endDate(LocalDateTime.now().plusMonths(1))
                .status("ACTIVE")
                .build();
        membershipHistory = membershipHistoryRepository.save(membershipHistory);
        assertThat(membershipHistory.getMembershipId()).isNotNull();

        // 10. Wishlist
        Wishlist wishlist = Wishlist.builder()
                .member(member)
                .car(car)
                .build();
        wishlist = wishlistRepository.save(wishlist);
        assertThat(wishlist.getWishlistId()).isNotNull();

        // Verification of associations
        Optional<Car> foundCar = carRepository.findById(car.getCarId());
        assertThat(foundCar).isPresent();
        assertThat(foundCar.get().getOwner()).isInstanceOf(Member.class);
        assertThat(foundCar.get().getOwnerType()).isEqualTo("MEMBER");
    }
}
