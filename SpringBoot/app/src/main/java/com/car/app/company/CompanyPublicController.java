package com.car.app.company;

import com.car.app.car.Car;
import com.car.app.car.CarDto;
import com.car.app.car.CarRepository;
import com.car.app.car.CarService;
import com.car.app.dealer.Dealer;
import com.car.app.dealer.DealerDto;
import com.car.app.dealer.DealerRepository;
import com.car.app.security.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequiredArgsConstructor
public class CompanyPublicController {

    private final CompanyRepository companyRepository;
    private final DealerRepository dealerRepository;
    private final CarRepository carRepository;
    private final CarService carService;

    /**
     * 공개 상사 목록 조회 (DTO 반환하여 비밀번호 노출 예방)
     */
    @GetMapping("/api/companies")
    public ResponseEntity<ApiResponse<List<CompanyDto.PublicResponse>>> getPublicCompanies() {
        List<CompanyDto.PublicResponse> companies = companyRepository.findAll().stream()
                .map(c -> CompanyDto.PublicResponse.builder()
                        .companyId(c.getCompanyId())
                        .name(c.getName())
                        .loginId(c.getLoginId())
                        .masterEmail(c.getMasterEmail())
                        .phone(c.getPhone())
                        .businessNumber(c.getBusinessNumber())
                        .tier(c.getTier())
                        .goldenBadgeStatus(c.getGoldenBadgeStatus())
                        .build())
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(companies, "상사 목록 조회가 완료되었습니다."));
    }

    /**
     * 공개 상사 상세 정보 조회
     */
    @GetMapping("/api/companies/{companyId}")
    public ResponseEntity<ApiResponse<CompanyDto.PublicResponse>> getPublicCompanyDetail(@PathVariable Long companyId) {
        Company c = companyRepository.findById(companyId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 상사입니다."));
        CompanyDto.PublicResponse response = CompanyDto.PublicResponse.builder()
                .companyId(c.getCompanyId())
                .name(c.getName())
                .loginId(c.getLoginId())
                .masterEmail(c.getMasterEmail())
                .phone(c.getPhone())
                .businessNumber(c.getBusinessNumber())
                .tier(c.getTier())
                .goldenBadgeStatus(c.getGoldenBadgeStatus())
                .build();
        return ResponseEntity.ok(ApiResponse.success(response, "상사 상세 조회가 완료되었습니다."));
    }

    /**
     * 특정 상사 소속 딜러 목록 조회
     */
    @GetMapping("/api/companies/{companyId}/dealers")
    public ResponseEntity<ApiResponse<List<DealerDto.Response>>> getCompanyDealers(@PathVariable Long companyId) {
        List<DealerDto.Response> dealers = dealerRepository.findByCompanyCompanyId(companyId).stream()
                .map(d -> DealerDto.Response.builder()
                        .dealerId(d.getDealerId())
                        .loginId(d.getLoginId())
                        .name(d.getName())
                        .phone(d.getPhone())
                        .status(d.getStatus())
                        .tier(d.getTier())
                        .riskScore(d.getRiskScore())
                        .profileImageUrl(d.getProfileImageUrl())
                        .build())
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(dealers, "상사 소속 딜러 목록 조회가 완료되었습니다."));
    }

    /**
     * 공개 딜러 프로필 상세 조회
     */
    @GetMapping("/api/dealers/{dealerId}")
    public ResponseEntity<ApiResponse<DealerDto.Response>> getPublicDealerDetail(@PathVariable Long dealerId) {
        Dealer d = dealerRepository.findById(dealerId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 딜러입니다."));
        DealerDto.Response response = DealerDto.Response.builder()
                .dealerId(d.getDealerId())
                .loginId(d.getLoginId())
                .name(d.getName())
                .phone(d.getPhone())
                .status(d.getStatus())
                .tier(d.getTier())
                .riskScore(d.getRiskScore())
                .profileImageUrl(d.getProfileImageUrl())
                .build();
        return ResponseEntity.ok(ApiResponse.success(response, "딜러 상세 프로필 조회가 완료되었습니다."));
    }

    /**
     * 특정 딜러가 판매 중인 차량 목록 조회 (CarDto로 변환하여 순환참조 에러 방지)
     */
    @GetMapping("/api/dealers/{dealerId}/cars")
    public ResponseEntity<ApiResponse<List<CarDto.Response>>> getDealerCars(@PathVariable Long dealerId) {
        List<CarDto.Response> cars = carRepository.findByDealerDealerId(dealerId).stream()
                .map(carService::mapToResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(cars, "딜러 소유 차량 목록 조회가 완료되었습니다."));
    }
}
