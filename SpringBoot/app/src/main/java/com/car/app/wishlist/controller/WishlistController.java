package com.car.app.wishlist.controller;

import com.car.app.car.dto.CarDto;
import com.car.app.global.response.ApiResponse;
import com.car.app.wishlist.dto.WishlistDto;
import com.car.app.wishlist.service.WishlistService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/wishlists")
@RequiredArgsConstructor
public class WishlistController {

        private final WishlistService wishlistService;

        /**
         * 로그인 사용자가 찜한 차량 전체 목록을 조회합니다.
         */
        @GetMapping
        @PreAuthorize("hasAnyRole('MEMBER', 'DEALER')")
        public ResponseEntity<ApiResponse<List<CarDto.Response>>> getMyWishlists(
                        Authentication authentication) {
                try {
                        List<CarDto.Response> cars = wishlistService
                                        .getMyWishlists(
                                                        authentication.getName(),
                                                        authentication.getAuthorities());

                        return ResponseEntity.ok(
                                        ApiResponse.success(
                                                        cars,
                                                        "관심 차량 목록을 조회했습니다."));
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
                                                                        "ERR_INVALID_REQUEST",
                                                                        e.getMessage()));
                }
        }

        /**
         * 로그인 사용자가 찜한 차량 ID 목록을 조회합니다.
         */
        @GetMapping("/car-ids")
        @PreAuthorize("hasAnyRole('MEMBER', 'DEALER')")
        public ResponseEntity<ApiResponse<List<Long>>> getWishlistCarIds(
                        Authentication authentication) {
                try {
                        List<Long> carIds = wishlistService
                                        .getWishlistCarIds(
                                                        authentication.getName(),
                                                        authentication.getAuthorities());

                        return ResponseEntity.ok(
                                        ApiResponse.success(
                                                        carIds,
                                                        "관심 차량 ID 목록을 조회했습니다."));
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
                                                                        "ERR_INVALID_REQUEST",
                                                                        e.getMessage()));
                }
        }

        /**
         * 관심 차량 등록 및 해제를 토글 처리합니다.
         */
        @PostMapping("/{carId}")
        @PreAuthorize("hasAnyRole('MEMBER', 'DEALER')")
        public ResponseEntity<ApiResponse<WishlistDto.ToggleResponse>> toggleWishlist(
                        Authentication authentication,
                        @PathVariable Long carId) {
                try {
                        WishlistDto.ToggleResponse response = wishlistService
                                        .toggleWishlist(
                                                        authentication.getName(),
                                                        authentication.getAuthorities(),
                                                        carId);

                        return ResponseEntity.ok(
                                        ApiResponse.success(
                                                        response,
                                                        response.getMessage()));
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
                                                                        "ERR_INVALID_REQUEST",
                                                                        e.getMessage()));
                }
        }
}