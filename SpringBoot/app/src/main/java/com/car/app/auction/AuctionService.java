package com.car.app.auction;

import com.car.app.car.Car;
import com.car.app.car.CarRepository;
import com.car.app.dealer.Dealer;
import com.car.app.dealer.DealerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
}
