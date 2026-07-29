package com.car.app.company.controller;

import com.car.app.car.dto.CarDto;
import com.car.app.car.repository.CarRepository;
import com.car.app.car.service.CarService;
import com.car.app.company.dto.CompanyDto;
import com.car.app.company.entity.Company;
import com.car.app.company.repository.CompanyRepository;
import com.car.app.dealer.dto.DealerDto;
import com.car.app.dealer.entity.Dealer;
import com.car.app.dealer.repository.DealerRepository;
import com.car.app.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

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
         * 공개 회사 목록 조회
         */
        @GetMapping("/api/companies")
        public ResponseEntity<ApiResponse<List<CompanyDto.PublicResponse>>> getPublicCompanies() {

                List<CompanyDto.PublicResponse> companies = companyRepository
                                .findAll()
                                .stream()
                                .map(this::mapToPublicResponse)
                                .collect(Collectors.toList());

                return ResponseEntity.ok(
                                ApiResponse.success(
                                                companies,
                                                "회사 목록 조회가 완료되었습니다."));
        }

        /**
         * 공개 회사 상세 정보 조회
         */
        @GetMapping("/api/companies/{companyId}")
        public ResponseEntity<ApiResponse<CompanyDto.PublicResponse>> getPublicCompanyDetail(
                        @PathVariable Long companyId) {

                Company company = companyRepository
                                .findById(companyId)
                                .orElseThrow(
                                                () -> new IllegalArgumentException(
                                                                "존재하지 않는 회사입니다."));

                CompanyDto.PublicResponse response = mapToPublicResponse(company);

                return ResponseEntity.ok(
                                ApiResponse.success(
                                                response,
                                                "회사 상세 조회가 완료되었습니다."));
        }

        /**
         * 특정 회사 소속 딜러 목록 조회
         */
        @GetMapping("/api/companies/{companyId}/dealers")
        public ResponseEntity<ApiResponse<List<DealerDto.Response>>> getCompanyDealers(
                        @PathVariable Long companyId) {

                if (!companyRepository.existsById(companyId)) {
                        throw new IllegalArgumentException(
                                        "존재하지 않는 회사입니다.");
                }

                List<DealerDto.Response> dealers = dealerRepository
                                .findByCompanyCompanyId(companyId)
                                .stream()
                                .map(this::mapToDealerResponse)
                                .collect(Collectors.toList());

                return ResponseEntity.ok(
                                ApiResponse.success(
                                                dealers,
                                                "회사 소속 딜러 목록 조회가 완료되었습니다."));
        }

        /**
         * 공개 딜러 프로필 상세 조회
         */
        @GetMapping("/api/dealers/{dealerId}")
        public ResponseEntity<ApiResponse<DealerDto.Response>> getPublicDealerDetail(
                        @PathVariable Long dealerId) {

                Dealer dealer = dealerRepository
                                .findById(dealerId)
                                .orElseThrow(
                                                () -> new IllegalArgumentException(
                                                                "존재하지 않는 딜러입니다."));

                DealerDto.Response response = mapToDealerResponse(dealer);

                return ResponseEntity.ok(
                                ApiResponse.success(
                                                response,
                                                "딜러 상세 프로필 조회가 완료되었습니다."));
        }

        /**
         * 특정 딜러가 등록한 차량 목록 조회
         */
        @GetMapping("/api/dealers/{dealerId}/cars")
        public ResponseEntity<ApiResponse<List<CarDto.Response>>> getDealerCars(
                        @PathVariable Long dealerId) {

                if (!dealerRepository.existsById(dealerId)) {
                        throw new IllegalArgumentException(
                                        "존재하지 않는 딜러입니다.");
                }

                List<CarDto.Response> cars = carRepository
                                .findByDealerDealerId(dealerId)
                                .stream()
                                .map(carService::mapToResponse)
                                .collect(Collectors.toList());

                return ResponseEntity.ok(
                                ApiResponse.success(
                                                cars,
                                                "딜러 등록 차량 목록 조회가 완료되었습니다."));
        }

        private CompanyDto.PublicResponse mapToPublicResponse(
                        Company company) {

                return CompanyDto.PublicResponse
                                .builder()
                                .companyId(
                                                company.getCompanyId())
                                .name(
                                                company.getName())
                                .loginId(
                                                company.getLoginId())
                                .masterEmail(
                                                company.getMasterEmail())
                                .phone(
                                                company.getPhone())
                                .businessNumber(
                                                company.getBusinessNumber())
                                .address(
                                                company.getAddress())
                                .profileImageUrl(
                                                company.getProfileImageUrl())
                                .tier(
                                                company.getTier())
                                .membershipStatus(
                                                company.getMembershipStatus())
                                .goldenBadgeStatus(
                                                company.getGoldenBadgeStatus())
                                .build();
        }

        private DealerDto.Response mapToDealerResponse(
                        Dealer dealer) {

                return DealerDto.Response
                                .builder()
                                .dealerId(
                                                dealer.getDealerId())
                                .loginId(
                                                dealer.getLoginId())
                                .name(
                                                dealer.getName())
                                .phone(
                                                dealer.getPhone())
                                .status(
                                                dealer.getStatus())
                                .tier(
                                                dealer.getTier())
                                .riskScore(
                                                dealer.getRiskScore())
                                .profileImageUrl(
                                                dealer.getProfileImageUrl())
                                .build();
        }
}