package com.car.app.member.controller;

import com.car.app.car.dto.CarDto;
import com.car.app.car.service.CarService;
import com.car.app.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 일반회원의 공개 차량 정보를 조회하는 REST 컨트롤러입니다.
 *
 * 회원이 등록한 경매 차량 목록은 로그인하지 않은 사용자도
 * 조회할 수 있습니다.
 */
@RestController
@RequestMapping("/api/members")
@RequiredArgsConstructor
public class MemberPublicController {

    private final CarService carService;

    /**
     * 특정 일반회원이 등록한 공개 경매 차량 목록을 조회합니다.
     */
    @GetMapping("/{memberId}/cars")
    public ResponseEntity<ApiResponse<List<CarDto.Response>>> getPublicMemberCars(
            @PathVariable Long memberId) {

        try {
            List<CarDto.Response> cars = carService.getPublicMemberCars(
                    memberId);

            return ResponseEntity.ok(
                    ApiResponse.success(
                            cars,
                            "일반회원 등록 차량 목록 조회가 완료되었습니다."));
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