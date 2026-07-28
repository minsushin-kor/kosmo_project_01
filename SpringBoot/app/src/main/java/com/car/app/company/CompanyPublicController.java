package com.car.app.company;

import com.car.app.car.Car;
import com.car.app.car.CarRepository;
import com.car.app.dealer.Dealer;
import com.car.app.dealer.DealerRepository;
import com.car.app.security.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class CompanyPublicController {

    private final CompanyRepository companyRepository;
    private final DealerRepository dealerRepository;
    private final CarRepository carRepository;

    /**
     * 공개 상사 목록 조회
     */
    @GetMapping("/api/companies")
    public ResponseEntity<ApiResponse<List<Company>>> getPublicCompanies() {
        List<Company> companies = companyRepository.findAll();
        return ResponseEntity.ok(ApiResponse.success(companies, "상사 목록 조회가 완료되었습니다."));
    }

    /**
     * 공개 상사 상세 정보 조회
     */
    @GetMapping("/api/companies/{companyId}")
    public ResponseEntity<ApiResponse<Company>> getPublicCompanyDetail(@PathVariable Long companyId) {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 상사입니다."));
        return ResponseEntity.ok(ApiResponse.success(company, "상사 상세 조회가 완료되었습니다."));
    }

    /**
     * 특정 상사 소속 딜러 목록 조회
     */
    @GetMapping("/api/companies/{companyId}/dealers")
    public ResponseEntity<ApiResponse<List<Dealer>>> getCompanyDealers(@PathVariable Long companyId) {
        List<Dealer> dealers = dealerRepository.findByCompanyCompanyId(companyId);
        return ResponseEntity.ok(ApiResponse.success(dealers, "상사 소속 딜러 목록 조회가 완료되었습니다."));
    }

    /**
     * 공개 딜러 프로필 상세 조회
     */
    @GetMapping("/api/dealers/{dealerId}")
    public ResponseEntity<ApiResponse<Dealer>> getPublicDealerDetail(@PathVariable Long dealerId) {
        Dealer dealer = dealerRepository.findById(dealerId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 딜러입니다."));
        return ResponseEntity.ok(ApiResponse.success(dealer, "딜러 상세 프로필 조회가 완료되었습니다."));
    }

    /**
     * 특정 딜러가 판매 중인 차량 목록 조회
     */
    @GetMapping("/api/dealers/{dealerId}/cars")
    public ResponseEntity<ApiResponse<List<Car>>> getDealerCars(@PathVariable Long dealerId) {
        List<Car> cars = carRepository.findByDealerDealerId(dealerId);
        return ResponseEntity.ok(ApiResponse.success(cars, "딜러 소유 차량 목록 조회가 완료되었습니다."));
    }
}
