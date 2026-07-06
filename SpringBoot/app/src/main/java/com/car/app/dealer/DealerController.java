package com.car.app.dealer;

import com.car.app.security.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/company/dealers")
@RequiredArgsConstructor
public class DealerController {

    private final DealerService dealerService;

    @PostMapping
    public ResponseEntity<ApiResponse<DealerDto.Response>> createDealer(@RequestBody DealerDto.CreateRequest request) {
        try {
            String masterEmail = SecurityContextHolder.getContext().getAuthentication().getName();
            
            Dealer dealer = dealerService.createDealer(masterEmail, request);
            
            DealerDto.Response response = DealerDto.Response.builder()
                    .dealerId(dealer.getDealerId())
                    .loginId(dealer.getLoginId())
                    .name(dealer.getName())
                    .phone(dealer.getPhone())
                    .status(dealer.getStatus())
                    .tier(dealer.getTier())
                    .riskScore(dealer.getRiskScore())
                    .build();

            return ResponseEntity.ok(ApiResponse.success(response, "딜러 계정이 성공적으로 등록되었습니다."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.fail("ERR_DUPLICATE_LOGIN_ID", e.getMessage()));
        }
    }

    @DeleteMapping("/{dealerId}")
    public ResponseEntity<ApiResponse<Void>> withdrawDealer(@PathVariable Long dealerId) {
        try {
            String masterEmail = SecurityContextHolder.getContext().getAuthentication().getName();
            
            dealerService.withdrawDealer(masterEmail, dealerId);
            
            return ResponseEntity.ok(ApiResponse.success(null, "해당 딜러가 상사 명단에서 제외(비활성화)되었습니다."));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(ApiResponse.fail("ERR_UNAUTHORIZED", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.fail("ERR_INVALID_DEALER", e.getMessage()));
        }
    }
}
