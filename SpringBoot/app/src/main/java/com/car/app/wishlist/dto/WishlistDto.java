package com.car.app.wishlist.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import com.car.app.car.dto.CarDto;

import java.util.List;

public class WishlistDto {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ListResponse {
        private List<CarDto.Response> cars;
        private long count;
    }

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
