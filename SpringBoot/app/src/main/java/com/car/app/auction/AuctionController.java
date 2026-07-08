package com.car.app.auction;

import com.car.app.security.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 경매 입찰 참여 및 입찰 내역 모니터링 조회를 제공하는 REST 컨트롤러입니다.
 */
@RestController
@RequiredArgsConstructor
public class AuctionController {

    private final AuctionService auctionService;

    /**
     * 딜러 권한 전용: 특정 경매 세션에 입찰 가격을 등록합니다.
     * 동일 경매에 중복 입찰 시 400 에러를 반환합니다.
     */
    @PostMapping("/api/auctions/{auctionId}/bids")
    @PreAuthorize("hasRole('DEALER')")
    public ResponseEntity<ApiResponse<AuctionDto.BidResponse>> placeBid(
            @PathVariable Long auctionId,
            @RequestBody AuctionDto.BidRequest request) {
        try {
            // 현재 로그인한 딜러의 로그인 ID 획득
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String dealerLoginId = authentication.getName();

            Bid bid = auctionService.placeBid(auctionId, dealerLoginId, request.getBidAmount());

            // 응답 DTO 조립
            AuctionDto.BidResponse response = AuctionDto.BidResponse.builder()
                    .bidId(bid.getBidId())
                    .auctionId(bid.getAuction().getAuctionId())
                    .dealerId(bid.getDealer().getDealerId())
                    .dealerName(bid.getDealer().getName())
                    .bidAmount(bid.getBidAmount())
                    .createdAt(bid.getCreatedAt())
                    .build();

            return ResponseEntity.ok(ApiResponse.success(response, "입찰이 성공적으로 완료되었습니다."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.fail("ERR_INVALID_BID", e.getMessage()));
        }
    }

    /**
     * 차주(일반 회원) 권한 전용: 본인이 등록한 차량에 들어온 실시간 입찰 목록 전체를 조회합니다.
     * 본인 차량이 아닐 경우 403 권한 거부 에러를 반환합니다.
     */
    @GetMapping("/api/cars/{carId}/bids")
    @PreAuthorize("hasRole('MEMBER')")
    public ResponseEntity<ApiResponse<List<AuctionDto.BidResponse>>> getBidsForSeller(
            @PathVariable Long carId) {
        try {
            // 현재 로그인한 일반 회원의 이메일 획득
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String memberEmail = authentication.getName();

            List<AuctionDto.BidResponse> response = auctionService.getBidsForSeller(carId, memberEmail);

            return ResponseEntity.ok(ApiResponse.success(response, "입찰 내역 조회가 성공적으로 완료되었습니다."));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(ApiResponse.fail("ERR_UNAUTHORIZED", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.fail("ERR_INVALID_REQUEST", e.getMessage()));
        }
    }

    /**
     * 차주(일반 회원) 혹은 관리자 전용: 특정 진행 중인 경매를 마감하고 최고 낙찰자를 결정합니다.
     * 낙찰 성공 시 거래 내역(Transaction) 생성 및 차량 상태가 SOLD로 변경됩니다.
     */
    @PostMapping("/api/auctions/{auctionId}/close")
    @PreAuthorize("hasAnyRole('MEMBER', 'ADMIN')")
    public ResponseEntity<ApiResponse<AuctionDto.CloseResponse>> closeAuction(
            @PathVariable Long auctionId) {
        try {
            // 현재 로그인한 사용자 정보 및 권한 획득
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String username = authentication.getName();
            boolean isAdmin = authentication.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
            
            // 관리자 계정인 경우 판매자 검증을 패스하기 위해 null 전달, 일반 회원은 본인 이메일 전달
            String sellerEmail = isAdmin ? null : username;

            // 경매 마감 서비스 로직 수행
            Auction auction = auctionService.closeAuction(auctionId, sellerEmail);

            // 낙찰 내역이 존재하면 응답용 DTO 빌드
            AuctionDto.BidResponse winningBidDto = null;
            if (auction.getWinningBid() != null) {
                Bid winningBid = auction.getWinningBid();
                winningBidDto = AuctionDto.BidResponse.builder()
                        .bidId(winningBid.getBidId())
                        .auctionId(auction.getAuctionId())
                        .dealerId(winningBid.getDealer().getDealerId())
                        .dealerName(winningBid.getDealer().getName())
                        .bidAmount(winningBid.getBidAmount())
                        .createdAt(winningBid.getCreatedAt())
                        .build();
            }

            AuctionDto.CloseResponse response = AuctionDto.CloseResponse.builder()
                    .auctionId(auction.getAuctionId())
                    .status(auction.getStatus())
                    .endTime(auction.getEndTime())
                    .winningBid(winningBidDto)
                    .build();

            return ResponseEntity.ok(ApiResponse.success(response, "경매가 성공적으로 마감되었습니다."));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(ApiResponse.fail("ERR_UNAUTHORIZED", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.fail("ERR_INVALID_REQUEST", e.getMessage()));
        }
    }
}
