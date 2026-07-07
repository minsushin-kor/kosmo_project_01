package com.car.app.auction;

import com.car.app.security.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class AuctionController {

    private final AuctionService auctionService;

    @PostMapping("/api/auctions/{auctionId}/bids")
    @PreAuthorize("hasRole('DEALER')")
    public ResponseEntity<ApiResponse<AuctionDto.BidResponse>> placeBid(
            @PathVariable Long auctionId,
            @RequestBody AuctionDto.BidRequest request) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String dealerLoginId = authentication.getName();

            Bid bid = auctionService.placeBid(auctionId, dealerLoginId, request.getBidAmount());

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

    @GetMapping("/api/cars/{carId}/bids")
    @PreAuthorize("hasRole('MEMBER')")
    public ResponseEntity<ApiResponse<List<AuctionDto.BidResponse>>> getBidsForSeller(
            @PathVariable Long carId) {
        try {
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
}
