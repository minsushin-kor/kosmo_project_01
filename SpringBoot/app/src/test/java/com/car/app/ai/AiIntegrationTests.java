package com.car.app.ai;

import com.car.app.car.Car;
import com.car.app.car.CarDto;
import com.car.app.car.CarRepository;
import com.car.app.company.Company;
import com.car.app.company.CompanyChurn;
import com.car.app.company.CompanyChurnRepository;
import com.car.app.company.CompanyRepository;
import com.car.app.dealer.Dealer;
import com.car.app.dealer.DealerChurn;
import com.car.app.dealer.DealerChurnRepository;
import com.car.app.dealer.DealerRepository;
import com.car.app.member.Member;
import com.car.app.member.MemberRepository;
import com.car.app.coupon.CouponService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@SpringBootTest
@Transactional
public class AiIntegrationTests {

    @Autowired
    private AiService aiService;

    @Autowired
    private CarRepository carRepository;

    @Autowired
    private MemberRepository memberRepository;

    @Autowired
    private CompanyRepository companyRepository;

    @Autowired
    private DealerRepository dealerRepository;

    @Autowired
    private DealerChurnRepository dealerChurnRepository;

    @Autowired
    private CompanyChurnRepository companyChurnRepository;

    @MockBean
    private AiClient aiClient;

    @MockBean
    private CouponService couponService;

    private Company testCompany;
    private Dealer testDealer;

    @BeforeEach
    void setUp() {
        String randomSuffix = UUID.randomUUID().toString().substring(0, 8);
        testCompany = Company.builder()
                .loginId("company_" + randomSuffix)
                .businessNumber("123-45-" + randomSuffix)
                .name("테스트상사_" + randomSuffix)
                .masterEmail("company_" + randomSuffix + "@test.com")
                .password("password123")
                .tier("NORMAL")
                .riskScore(0.0)
                .build();
        testCompany = companyRepository.save(testCompany);

        testDealer = Dealer.builder()
                .company(testCompany)
                .loginId("dealer_" + randomSuffix)
                .password("password123")
                .name("테스트딜러")
                .phone("010-1234-5678")
                .tier("NORMAL")
                .riskScore(0.0)
                .build();
        testDealer = dealerRepository.save(testDealer);
    }

    @Test
    @DisplayName("계약검증 1: 과거 스냅샷이 존재해도 항상 최신 집계값으로 FastAPI 요청 객체(DealerBatchItem)가 생성되는지 확인")
    void testLatestMetricsUsedIgnoringPastSnapshot() {
        // 1. 과거 이탈 스냅샷 데이터 저장 (더미 스냅샷)
        dealerChurnRepository.save(DealerChurn.builder()
                .dealer(testDealer)
                .lastActivityDays(999L)
                .recent60dTradeCount(999L)
                .previousTradeCount(999L)
                .siteUsageRate(0.999)
                .riskGrade("CARE_REQUIRED")
                .calculatedAt(LocalDateTime.now().minusDays(10))
                .build());

        // 2. Mock FastAPI 성공 응답 설정
        AiClient.BatchChurnResponse mockResponse = new AiClient.BatchChurnResponse();
        mockResponse.setStatus("success");
        mockResponse.setDealerPredictions(List.of(
                new AiClient.DealerPredictionResult(testDealer.getDealerId(), 0.85, "High", "Critical", List.of("활동부족"), "케어필요")
        ));
        mockResponse.setCompanyPredictions(List.of());

        when(aiClient.predictBatchChurn(any())).thenReturn(mockResponse);

        // 3. 자정 뱃치 실행
        aiService.runChurnPredictionBatch();

        // 4. FastAPI로 전달된 뱃치 요청 객체 검증
        ArgumentCaptor<AiClient.BatchChurnRequest> captor = ArgumentCaptor.forClass(AiClient.BatchChurnRequest.class);
        verify(aiClient).predictBatchChurn(captor.capture());

        AiClient.BatchChurnRequest request = captor.getValue();
        assertThat(request.getDealers()).isNotEmpty();

        AiClient.DealerBatchItem dealerItem = request.getDealers().stream()
                .filter(d -> d.getDealerId().equals(testDealer.getDealerId()))
                .findFirst()
                .orElse(null);

        assertThat(dealerItem).isNotNull();
        // 과거 스냅샷값(999) 대신 최신 집계값(거래 없는 딜러 = 0)이 바디에 들어가야 함
        assertThat(dealerItem.getRecent60dTradeCount()).isEqualTo(0);
        assertThat(dealerItem.getPreviousTradeCount()).isEqualTo(0);
    }

    @Test
    @DisplayName("계약검증 2: FastAPI의 소수점 MMR 응답(Double)이 차량 mmr에 정상 저장되는지 확인")
    void testDoubleMmrDeserializationAndSaving() {
        Car car = Car.builder()
                .make("Hyundai")
                .model("Grandeur")
                .year(2022)
                .odometer(15000.0)
                .transmission("Automatic")
                .status("REGISTERED")
                .build();
        car = carRepository.save(car);

        // FastAPI 소수점 MMR 응답 설정 (13,111,445.77)
        AiClient.VehiclePredictionResult result = new AiClient.VehiclePredictionResult(car.getCarId(), 4.8, 13111445.77);
        AiClient.VehiclePredictionBatchResponse mockBatchResponse = new AiClient.VehiclePredictionBatchResponse("success", 1, List.of(result));

        when(aiClient.predictVehicleConditionAndMmr(any())).thenReturn(mockBatchResponse);

        // Condition/MMR 예측 구동
        aiService.predictVehicleConditionAndMmrForCars(List.of(car));

        Car updatedCar = carRepository.findById(car.getCarId()).orElseThrow();
        assertThat(updatedCar.getCondition()).isEqualTo(4.8);
        assertThat(updatedCar.getMmr()).isEqualTo(13111445.77);
    }

    @Test
    @DisplayName("계약검증 3: 딜러 추천 결과가 Condition 내림차순 -> MMR 내림차순 순서를 정확히 유지하는지 확인")
    void testDealerRecommendationOrderingByConditionAndMmr() {
        Member member = Member.builder()
                .email("member_" + UUID.randomUUID().toString().substring(0, 8) + "@test.com")
                .password("password123")
                .name("회원")
                .phone("010-9999-8888")
                .build();
        member = memberRepository.save(member);

        // 차량 A: Condition 4.5, MMR 25000000.0
        Car carA = carRepository.save(Car.builder()
                .member(member)
                .make("BMW")
                .model("5 Series")
                .year(2021)
                .odometer(30000.0)
                .transmission("Automatic")
                .status("REGISTERED")
                .condition(4.5)
                .mmr(25000000.0)
                .build());

        // 차량 B: Condition 4.8, MMR 20000000.0
        Car carB = carRepository.save(Car.builder()
                .member(member)
                .make("Benz")
                .model("E-Class")
                .year(2022)
                .odometer(10000.0)
                .transmission("Automatic")
                .status("REGISTERED")
                .condition(4.8)
                .mmr(20000000.0)
                .build());

        // 차량 C: Condition 4.8, MMR 30000000.0 (Condition 최고 + MMR 최고)
        Car carC = carRepository.save(Car.builder()
                .member(member)
                .make("Audi")
                .model("A6")
                .year(2023)
                .odometer(5000.0)
                .transmission("Automatic")
                .status("REGISTERED")
                .condition(4.8)
                .mmr(30000000.0)
                .build());

        List<CarDto.Response> recommendations = aiService.getRecommendedCarsForDealer(testDealer.getLoginId());

        assertThat(recommendations).isNotEmpty();
        // 정렬순서 1위: Car C (Condition 4.8, MMR 30,000,000)
        assertThat(recommendations.get(0).getCarId()).isEqualTo(carC.getCarId());
        // 정렬순서 2위: Car B (Condition 4.8, MMR 20,000,000)
        assertThat(recommendations.get(1).getCarId()).isEqualTo(carB.getCarId());
        // 정렬순서 3위: Car A (Condition 4.5, MMR 25,000,000)
        assertThat(recommendations.get(2).getCarId()).isEqualTo(carA.getCarId());
    }

    @Test
    @DisplayName("계약검증 4: FastAPI 성공(status=='success') 시에만 후속 쿠폰/뱃지 처리가 구동되는지 확인")
    void testFollowupExecutedOnlyOnFastApiSuccess() {
        // Case A: FastAPI 응답이 실패("fail")인 경우
        AiClient.BatchChurnResponse failResponse = new AiClient.BatchChurnResponse();
        failResponse.setStatus("fail");
        when(aiClient.predictBatchChurn(any())).thenReturn(failResponse);

        aiService.runChurnPredictionBatch();

        // 실패 시 후속 쿠폰/뱃지 메소드가 호출되면 안 됨
        verify(couponService, never()).issueRiskCoupons();
        verify(couponService, never()).updateCompanyTiersAndBadges();

        // Case B: FastAPI 응답이 성공("success")인 경우
        AiClient.BatchChurnResponse successResponse = new AiClient.BatchChurnResponse();
        successResponse.setStatus("success");
        when(aiClient.predictBatchChurn(any())).thenReturn(successResponse);

        aiService.runChurnPredictionBatch();

        // 성공 시 후속 쿠폰/뱃지 메소드가 정확히 1회 호출되어야 함
        verify(couponService, times(1)).issueRiskCoupons();
        verify(couponService, times(1)).updateCompanyTiersAndBadges();
    }

    @Test
    @DisplayName("계약검증 5: TOP_5 상사가 이탈 위험도 70점 이상인 상태에서 이탈 예측 시 CARE_REQUIRED 등급으로 갱신되는지 확인")
    void testCompanyLosingTop5TierMaintainsCareRequiredStatus() {
        // 1. 기존 상사의 tier를 TOP_5로 설정
        testCompany.setTier("TOP_5");
        companyRepository.save(testCompany);

        // 2. FastAPI 이탈 예측 결과: 해당 상사 이탈 확률 80% (riskScore = 80.0 -> CARE_REQUIRED 대상)
        AiClient.BatchChurnResponse mockResponse = new AiClient.BatchChurnResponse();
        mockResponse.setStatus("success");
        mockResponse.setDealerPredictions(List.of());
        mockResponse.setCompanyPredictions(List.of(
                new AiClient.CompanyPredictionResult(testCompany.getCompanyId(), 0.80, "High", "Critical", List.of("거래감소"), "관리필요")
        ));
        when(aiClient.predictBatchChurn(any())).thenReturn(mockResponse);

        // 3. 이탈 뱃치 실행
        aiService.runChurnPredictionBatch();

        // 4. 상사의 tier가 CARE_REQUIRED로 지정되었는지 확인 (더이상 무조건 TOP_5로 묶이지 않고 위험도 반영)
        Company updatedCompany = companyRepository.findById(testCompany.getCompanyId()).orElseThrow();
        assertThat(updatedCompany.getTier()).isEqualTo("CARE_REQUIRED");
        assertThat(updatedCompany.getRiskGrade()).isEqualTo("Critical");
    }
}
