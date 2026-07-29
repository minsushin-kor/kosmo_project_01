package com.car.app.dealer.controller;

import com.car.app.dealer.dto.DealerDto;
import com.car.app.dealer.entity.Dealer;
import com.car.app.dealer.service.DealerService;
import com.car.app.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 상사 소속 딜러들의 계정 관리
 * 등록, 조회, 수정, 정지 기능을 담당하는 REST 컨트롤러입니다.
 *
 * 이 컨트롤러의 모든 경로는 SecurityConfig에 의해
 * 회사 계정 권한을 요구합니다.
 */
@RestController
@RequestMapping("/api/company/dealers")
@RequiredArgsConstructor
public class DealerController {

    private final DealerService dealerService;

    /**
     * 현재 로그인한 회사에 소속된 전체 딜러를 조회합니다.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<DealerDto.Response>>> getCompanyDealers() {

        try {
            String masterLoginId = getAuthenticatedLoginId();

            List<DealerDto.Response> dealers = dealerService
                    .getCompanyDealers(
                            masterLoginId)
                    .stream()
                    .map(
                            DealerDto.Response::fromEntity)
                    .toList();

            return ResponseEntity.ok(
                    ApiResponse.success(
                            dealers,
                            "소속 딜러 목록 조회가 완료되었습니다."));
        } catch (SecurityException e) {
            return ResponseEntity
                    .status(403)
                    .body(
                            ApiResponse.fail(
                                    "ERR_UNAUTHORIZED",
                                    e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity
                    .badRequest()
                    .body(
                            ApiResponse.fail(
                                    "ERR_INVALID_COMPANY",
                                    e.getMessage()));
        }
    }

    /**
     * 새 소속 딜러 계정을 등록합니다.
     */
    @PostMapping
    public ResponseEntity<ApiResponse<DealerDto.Response>> createDealer(
            @RequestBody DealerDto.CreateRequest request) {

        try {
            String masterLoginId = getAuthenticatedLoginId();

            Dealer dealer = dealerService.createDealer(
                    masterLoginId,
                    request);

            DealerDto.Response response = DealerDto.Response.fromEntity(
                    dealer);

            return ResponseEntity.ok(
                    ApiResponse.success(
                            response,
                            "딜러 계정이 성공적으로 등록되었습니다."));
        } catch (SecurityException e) {
            return ResponseEntity
                    .status(403)
                    .body(
                            ApiResponse.fail(
                                    "ERR_UNAUTHORIZED",
                                    e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity
                    .badRequest()
                    .body(
                            ApiResponse.fail(
                                    "ERR_DUPLICATE_LOGIN_ID",
                                    e.getMessage()));
        }
    }

    /**
     * 특정 소속 딜러의 상세 정보를 조회합니다.
     */
    @GetMapping("/{dealerId}")
    public ResponseEntity<ApiResponse<DealerDto.Response>> getDealerDetail(
            @PathVariable Long dealerId) {

        try {
            String masterLoginId = getAuthenticatedLoginId();

            Dealer dealer = dealerService.getDealerDetail(
                    masterLoginId,
                    dealerId);

            DealerDto.Response response = DealerDto.Response.fromEntity(
                    dealer);

            return ResponseEntity.ok(
                    ApiResponse.success(
                            response,
                            "소속 딜러 상세 정보 조회가 완료되었습니다."));
        } catch (SecurityException e) {
            return ResponseEntity
                    .status(403)
                    .body(
                            ApiResponse.fail(
                                    "ERR_UNAUTHORIZED",
                                    e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity
                    .badRequest()
                    .body(
                            ApiResponse.fail(
                                    "ERR_INVALID_DEALER",
                                    e.getMessage()));
        }
    }

    /**
     * 특정 소속 딜러 정보를 수정합니다.
     */
    @PutMapping("/{dealerId}")
    public ResponseEntity<ApiResponse<DealerDto.Response>> updateDealer(
            @PathVariable Long dealerId,
            @RequestBody DealerDto.CreateRequest request) {

        try {
            String masterLoginId = getAuthenticatedLoginId();

            Dealer dealer = dealerService.updateDealer(
                    masterLoginId,
                    dealerId,
                    request);

            DealerDto.Response response = DealerDto.Response.fromEntity(
                    dealer);

            return ResponseEntity.ok(
                    ApiResponse.success(
                            response,
                            "소속 딜러 정보가 성공적으로 수정되었습니다."));
        } catch (SecurityException e) {
            return ResponseEntity
                    .status(403)
                    .body(
                            ApiResponse.fail(
                                    "ERR_UNAUTHORIZED",
                                    e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity
                    .badRequest()
                    .body(
                            ApiResponse.fail(
                                    "ERR_INVALID_DEALER",
                                    e.getMessage()));
        }
    }

    /**
     * 특정 소속 딜러를 정지 처리합니다.
     */
    @DeleteMapping("/{dealerId}")
    public ResponseEntity<ApiResponse<Void>> withdrawDealer(
            @PathVariable Long dealerId) {

        try {
            String masterLoginId = getAuthenticatedLoginId();

            dealerService.withdrawDealer(
                    masterLoginId,
                    dealerId);

            return ResponseEntity.ok(
                    ApiResponse.success(
                            null,
                            "해당 딜러가 정지 처리되었습니다."));
        } catch (SecurityException e) {
            return ResponseEntity
                    .status(403)
                    .body(
                            ApiResponse.fail(
                                    "ERR_UNAUTHORIZED",
                                    e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity
                    .badRequest()
                    .body(
                            ApiResponse.fail(
                                    "ERR_INVALID_DEALER",
                                    e.getMessage()));
        }
    }

    /**
     * 현재 인증된 사용자의 로그인 아이디를 반환합니다.
     */
    private String getAuthenticatedLoginId() {
        return SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getName();
    }
}