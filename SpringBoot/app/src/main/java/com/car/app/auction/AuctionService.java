package com.car.app.auction;

import com.car.app.car.Car;
import com.car.app.car.CarRepository;
import com.car.app.dealer.Dealer;
import com.car.app.dealer.DealerRepository;
import com.car.app.transaction.Transaction;
import com.car.app.transaction.TransactionRepository;
import com.car.app.notification.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 블라인드 경매 및 입찰 관련 비즈니스 로직을 처리하는 서비스 클래스입니다.
 */
@Service
@RequiredArgsConstructor
public class AuctionService {

    private final AuctionRepository auctionRepository;
    private final BidRepository bidRepository;
    private final DealerRepository dealerRepository;
    private final CarRepository carRepository;
    private final TransactionRepository transactionRepository;
    private final NotificationService notificationService;

    /**
     * 특정 경매 세션에 딜러가 입찰을 등록하는 메서드입니다.
     *
     * @param auctionId     입찰할 경매 ID
     * @param dealerLoginId 입찰을 시도하는 딜러의 로그인 ID (JWT 토큰에서 추출)
     * @param bidAmount     입찰 희망 금액
     * @return 저장 완료된 입찰(Bid) 객체
     */
    @Transactional
    public Bid placeBid(Long auctionId, String dealerLoginId, Long bidAmount) {
        // 1단계: 경매 세션이 실제로 존재하는지 DB 조회
        Auction auction = auctionRepository.findById(auctionId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 경매입니다."));

        // 2단계: 경매가 현재 진행 중(ACTIVE 상태)이고 마감 시각 이전인지 검증
        if (!"ACTIVE".equalsIgnoreCase(auction.getStatus()) || LocalDateTime.now().isAfter(auction.getEndTime())) {
            throw new IllegalArgumentException("진행 중인 경매가 아니므로 입찰이 불가능합니다.");
        }

        // 경매 시작 시간 이전의 입찰 차단 검증
        if (LocalDateTime.now().isBefore(auction.getStartTime())) {
            throw new IllegalArgumentException("아직 시작하지 않은 예약 대기 상태의 경매 세션입니다.");
        }

        // 3단계: 입찰을 시도하는 딜러 정보 조회
        Dealer dealer = dealerRepository.findByLoginId(dealerLoginId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 딜러 계정입니다."));

        // 4단계: 상사에서 제외(탈퇴)되거나 정지된 딜러인지 검증
        if ("WITHDRAWN".equalsIgnoreCase(dealer.getStatus())) {
            throw new IllegalArgumentException("활동이 정지되거나 제외된 딜러 계정입니다.");
        }

        // 5단계 [입찰 제약 검증]: 블라인드 경매 특성상 딜러당 딱 1회만 참여 가능하므로 기존 입찰 내역 여부 검사
        if (bidRepository.findByAuctionAuctionIdAndDealerDealerId(auctionId, dealer.getDealerId()).isPresent()) {
            throw new IllegalArgumentException("이미 입찰 완료한 경매입니다. 블라인드 경매는 딜러당 1회만 입찰할 수 있습니다.");
        }

        // 6단계: 신규 입찰 객체 빌드 및 저장
        Bid bid = Bid.builder()
                .auction(auction)
                .dealer(dealer)
                .bidAmount(bidAmount)
                .build();

        return bidRepository.save(bid);
    }

    /**
     * 차주(일반 회원)가 등록한 본인 매물의 경매 입찰 현황 리스트를 실시간 조회하는 메서드입니다.
     *
     * @param carId       조회할 차량 ID
     * @param memberEmail 로그인한 일반 회원의 이메일 (JWT 토큰에서 추출)
     * @return 경매에 들어온 입찰 DTO 리스트
     */
    @Transactional(readOnly = true)
    public List<AuctionDto.BidResponse> getBidsForSeller(Long carId, String memberEmail) {
        // 1단계: 차량 매물 존재 여부 검증
        Car car = carRepository.findById(carId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 차량 매물입니다."));

        // 2단계 [소유권 및 보안 검증]: 차를 등록한 본인이 아니면 입찰 가격을 볼 수 없도록 차단
        if (car.getMember() == null || !car.getMember().getEmail().equalsIgnoreCase(memberEmail)) {
            throw new SecurityException("본인이 등록한 차량의 입찰 내역만 조회할 수 있습니다.");
        }

        // 3단계: 차량에 연결된 경매 세션 조회
        Auction auction = auctionRepository.findByCarCarId(carId)
                .orElse(null);

        // 만약 등록만 하고 경매 세션이 없는 차량인 경우 빈 리스트 반환
        if (auction == null) {
            return Collections.emptyList();
        }

        // 4단계: 경매 세션에 누적된 입찰 목록 전체를 가져와 응답 DTO로 매핑하여 반환
        return bidRepository.findByAuctionAuctionId(auction.getAuctionId()).stream()
                .map(bid -> AuctionDto.BidResponse.builder()
                        .bidId(bid.getBidId())
                        .auctionId(auction.getAuctionId())
                        .dealerId(bid.getDealer().getDealerId())
                        .dealerName(bid.getDealer().getName())
                        .bidAmount(bid.getBidAmount())
                        .createdAt(bid.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
    }

    /**
     * 특정 경매를 수동으로 마감 처리하고 낙찰자를 결정합니다. (판매자 또는 관리자 요청 시)
     *
     * @param auctionId   경매 ID
     * @param sellerEmail 요청자의 이메일 (null인 경우 권한 검증 패스)
     * @return 마감 및 낙찰 처리된 경매 엔티티
     */
    @Transactional
    public Auction closeAuction(Long auctionId, String sellerEmail) {
        Auction auction = auctionRepository.findById(auctionId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 경매입니다."));
        
        // 판매자 본인 소유의 차량인지 검증
        if (sellerEmail != null && (auction.getCar().getMember() == null || 
            !auction.getCar().getMember().getEmail().equalsIgnoreCase(sellerEmail))) {
            throw new SecurityException("본인이 등록한 차량의 경매만 종료할 수 있습니다.");
        }

        return closeAuctionInternal(auction);
    }

    /**
     * 기한이 만료된 모든 진행 중인 경매를 마감 및 낙찰 처리합니다. (스케줄러 호출용)
     */
    @Transactional
    public void closeExpiredAuctions() {
        List<Auction> expiredAuctions = auctionRepository.findByStatusAndEndTimeBefore("ACTIVE", LocalDateTime.now());
        for (Auction auction : expiredAuctions) {
            try {
                closeAuctionInternal(auction);
            } catch (Exception e) {
                // 특정 경매의 마감 실패 시 다른 경매 진행에 영향이 없도록 로깅 후 계속 진행
                System.err.println("자동 경매 종료 실패 [ID: " + auction.getAuctionId() + "]: " + e.getMessage());
            }
        }
    }

    /**
     * 경매 종료 및 낙찰 로직을 수행하는 내부 공통 메소드
     */
    private Auction closeAuctionInternal(Auction auction) {
        if (!"ACTIVE".equalsIgnoreCase(auction.getStatus())) {
            throw new IllegalArgumentException("이미 마감되었거나 활성 상태가 아닌 경매입니다.");
        }

        // 경매에 들어온 모든 입찰 내역 조회
        List<Bid> bids = bidRepository.findByAuctionAuctionId(auction.getAuctionId());
        Bid winningBid = null;

        if (bids != null && !bids.isEmpty()) {
            // 최고 입찰 금액을 제시한 입찰을 선택 (입찰 금액이 같으면 ID가 작아 먼저 등록된 입찰자 우선)
            winningBid = bids.stream()
                    .max((b1, b2) -> {
                        int amtCompare = b1.getBidAmount().compareTo(b2.getBidAmount());
                        if (amtCompare != 0) {
                            return amtCompare;
                        }
                        return b2.getBidId().compareTo(b1.getBidId());
                    })
                    .orElse(null);
        }

        // 경매 상태를 COMPLETED로 변경 및 낙찰 정보 기록
        auction.setStatus("COMPLETED");
        auction.setWinningBid(winningBid);
        
        // 예정된 마감 시간 전 조기 종료 시 종료 시간을 현재 시간으로 갱신
        if (LocalDateTime.now().isBefore(auction.getEndTime())) {
            auction.setEndTime(LocalDateTime.now());
        }

        Auction savedAuction = auctionRepository.save(auction);

        // 낙찰자(winningBid)가 존재하는 경우 거래내역(Transaction) 생성 및 차량 상태 SOLD 변경
        Car car = auction.getCar();
        if (winningBid != null) {
            car.setStatus("SOLD");
            carRepository.save(car);

            // 기본 수수료율 0.3% (0.0030) 적용. (4단계에서 Churn Risk 딜러 여부에 따른 요율 할인 고도화 예정)
            BigDecimal commissionRate = new BigDecimal("0.0030");
            long dealPrice = winningBid.getBidAmount();
            long commissionAmount = (long) (dealPrice * commissionRate.doubleValue());

            Transaction transaction = Transaction.builder()
                    .car(car)
                    .buyerType("DEALER")
                    .buyerId(winningBid.getDealer().getDealerId())
                    .sellerType("MEMBER")
                    .sellerId(car.getMember().getMemberId())
                    .dealPrice(dealPrice)
                    .commissionRate(commissionRate)
                    .commissionAmount(commissionAmount)
                    .build();

            transactionRepository.save(transaction);

            // [알림 1] 차주(일반 회원)에게 경매 낙찰 성공 알림 생성 및 푸시
            if (car.getMember() != null) {
                String memberMsg = String.format("등록하신 %d년식 %s %s 매물 경매가 %,d원에 최종 낙찰되었습니다. (낙찰 딜러: %s)",
                        car.getYear(), car.getMake(), car.getModel(), dealPrice, winningBid.getDealer().getName());
                notificationService.sendNotification("MEMBER", car.getMember().getMemberId(), "AUCTION_WON", memberMsg, car.getCarId());
            }

            // [알림 2] 낙찰 딜러에게 최종 낙찰 축하 알림 생성 및 푸시
            String dealerMsg = String.format("입찰에 참여하신 %d년식 %s %s 매물 경매가 %,d원에 최종 낙찰되었습니다.",
                    car.getYear(), car.getMake(), car.getModel(), dealPrice);
            notificationService.sendNotification("DEALER", winningBid.getDealer().getDealerId(), "BID_WIN", dealerMsg, car.getCarId());

        } else {
            // 입찰자가 없어 유찰된 경우 차량 상태를 다시 REGISTERED로 세팅하여 재경매 가능하도록 처리
            car.setStatus("REGISTERED");
            carRepository.save(car);

            // [알림 3] 차주(일반 회원)에게 경매 유찰 알림 생성 및 푸시
            if (car.getMember() != null) {
                String failedMsg = String.format("등록하신 %d년식 %s %s 매물 경매가 입찰자 없이 유찰되었습니다.",
                        car.getYear(), car.getMake(), car.getModel());
                notificationService.sendNotification("MEMBER", car.getMember().getMemberId(), "AUCTION_FAILED", failedMsg, car.getCarId());
            }
        }

        return savedAuction;
    }
}
