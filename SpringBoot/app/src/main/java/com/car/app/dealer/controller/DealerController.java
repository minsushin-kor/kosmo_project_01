package com.car.app.dealer.controller;

import com.car.app.dealer.dto.DealerDto;
import com.car.app.dealer.entity.Dealer;
import com.car.app.dealer.service.DealerService;
import com.car.app.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

/**
 * 상사 소속 딜러들의 계정 관리(등록, 정지)를 담당하는 REST 컨트롤러입니다.
 * 이 컨트롤러의 모든 경로는 SecurityConfig에 의해 ROLE_COMPANY_MASTER 권한을 요구합니다.
 */
@RestController
@RequestMapping("/api/company/dealers")
@RequiredArgsConstructor
public class DealerController {

    private final DealerService dealerService;

    /**
     * 상사 마스터 전용: 새 소속 딜러 계정을 등록합니다.
     */
    @PostMapping
    public ResponseEntity<ApiResponse<DealerDto.Response>> createDealer(@RequestBody DealerDto.CreateRequest request) {
        try {
            // 현재 인증된 세션에서 상사 마스터의 로그인 아이디 추출
            String masterLoginId = SecurityContextHolder.getContext().getAuthentication().getName();
            
            Dealer dealer = dealerService.createDealer(masterLoginId, request);
            
            DealerDto.Response response = DealerDto.Response.builder()
                    .dealerId(dealer.getDealerId())
                    .loginId(dealer.getLoginId())
                    .name(dealer.getName())
                    .phone(dealer.getPhone())
                    .status(dealer.getStatus())
                    .tier(dealer.getTier())
                    .riskScore(dealer.getRiskScore())
                    .profileImageUrl(dealer.getProfileImageUrl())
                    .build();

            return ResponseEntity.ok(ApiResponse.success(response, "딜러 계정이 성공적으로 등록되었습니다."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.fail("ERR_DUPLICATE_LOGIN_ID", e.getMessage()));
        }
    }

    /**
     * 상사 마스터 전용: 특정 소속 딜러를 정지(활동 제외) 처리합니다.
     */
    @DeleteMapping("/{dealerId}")
    public ResponseEntity<ApiResponse<Void>> withdrawDealer(@PathVariable Long dealerId) {
        try {
            // 현재 인증된 세션에서 상사 마스터의 로그인 아이디 추출
            String masterLoginId = SecurityContextHolder.getContext().getAuthentication().getName();
            
            dealerService.withdrawDealer(masterLoginId, dealerId);
            
            return ResponseEntity.ok(ApiResponse.success(null, "해당 딜러가 상사 명단에서 제외(비활성화)되었습니다."));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(ApiResponse.fail("ERR_UNAUTHORIZED", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.fail("ERR_INVALID_DEALER", e.getMessage()));
        }
    }

    /**
     * 상사 마스터 전용: 특정 소속 딜러 상세 정보를 조회합니다.
     */
    @GetMapping("/{dealerId}")
    public ResponseEntity<ApiResponse<DealerDto.Response>> getDealerDetail(@PathVariable Long dealerId) {
        try {
            String masterLoginId = SecurityContextHolder.getContext().getAuthentication().getName();
            Dealer dealer = dealerService.getDealerDetail(masterLoginId, dealerId);
            DealerDto.Response response = DealerDto.Response.builder()
                    .dealerId(dealer.getDealerId())
                    .loginId(dealer.getLoginId())
                    .name(dealer.getName())
                    .phone(dealer.getPhone())
                    .status(dealer.getStatus())
                    .tier(dealer.getTier())
                    .riskScore(dealer.getRiskScore())
                    .profileImageUrl(dealer.getProfileImageUrl())
                    .build();
            return ResponseEntity.ok(ApiResponse.success(response, "소속 딜러 상세 정보 조회가 완료되었습니다."));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(ApiResponse.fail("ERR_UNAUTHORIZED", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.fail("ERR_INVALID_DEALER", e.getMessage()));
        }
    }

    /**
     * 상사 마스터 전용: 특정 소속 딜러 정보를 수정합니다.
     */
    @PutMapping("/{dealerId}")
    public ResponseEntity<ApiResponse<DealerDto.Response>> updateDealer(@PathVariable Long dealerId, @RequestBody DealerDto.CreateRequest request) {
        try {
            String masterLoginId = SecurityContextHolder.getContext().getAuthentication().getName();
            Dealer dealer = dealerService.updateDealer(masterLoginId, dealerId, request);
            DealerDto.Response response = DealerDto.Response.builder()
                    .dealerId(dealer.getDealerId())
                    .loginId(dealer.getLoginId())
                    .name(dealer.getName())
                    .phone(dealer.getPhone())
                    .status(dealer.getStatus())
                    .tier(dealer.getTier())
                    .riskScore(dealer.getRiskScore())
                    .profileImageUrl(dealer.getProfileImageUrl())
                    .build();
            return ResponseEntity.ok(ApiResponse.success(response, "소속 딜러 정보가 성공적으로 수정되었습니다."));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(ApiResponse.fail("ERR_UNAUTHORIZED", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.fail("ERR_INVALID_DEALER", e.getMessage()));
        }
    }
}
