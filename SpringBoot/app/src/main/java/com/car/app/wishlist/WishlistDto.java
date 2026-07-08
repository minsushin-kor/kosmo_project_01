package com.car.app.wishlist;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

public class WishlistDto {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ToggleResponse {
        private Long carId;
        private boolean isWished; // 찜 여부 (true: 등록 완료, false: 해제 완료)
        private String message;
    }

}
