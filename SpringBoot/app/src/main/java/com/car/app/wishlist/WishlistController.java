package com.car.app.wishlist;

import com.car.app.security.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/wishlists")
@RequiredArgsConstructor
public class WishlistController {

    private final WishlistService wishlistService;

    /**
     * 관심 차량 등록 및 등록 해제를 토글 처리하는 API 엔드포인트입니다.
     */
    @PostMapping("/{carId}")
    @PreAuthorize("hasAnyRole('MEMBER', 'DEALER')")
    public ResponseEntity<ApiResponse<WishlistDto.ToggleResponse>> toggleWishlist(@PathVariable Long carId) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String username = authentication.getName();

            WishlistDto.ToggleResponse response = wishlistService.toggleWishlist(
                    username,
                    authentication.getAuthorities(),
                    carId
            );

            return ResponseEntity.ok(ApiResponse.success(response, response.getMessage()));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(ApiResponse.fail("ERR_UNAUTHORIZED", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.fail("ERR_INVALID_REQUEST", e.getMessage()));
        }
    }

}
