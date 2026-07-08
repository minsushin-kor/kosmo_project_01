package com.car.app.dealer;

import com.car.app.company.Company;
import com.car.app.company.CompanyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 상사 소속 딜러 계정의 관리 및 발급, 정지를 처리하는 서비스 클래스입니다.
 */
@Service
@RequiredArgsConstructor
public class DealerService {

    private final DealerRepository dealerRepository;
    private final CompanyRepository companyRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * 상사 마스터 권한 하에 소속 딜러 계정을 신규 개설합니다.
     *
     * @param masterEmail 현재 로그인한 상사 마스터의 이메일
     * @param request     새로 발급할 딜러 계정 스펙 DTO
     * @return 저장 완료된 Dealer 엔티티
     */
    @Transactional
    public Dealer createDealer(String masterEmail, DealerDto.CreateRequest request) {
        // 1단계: 상사 마스터 이메일 검증 및 상사 식별
        Company company = companyRepository.findByMasterEmail(masterEmail)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 상사 마스터 계정입니다."));

        // 2단계: 신규 딜러의 로그인 ID 중복 여부 확인
        if (dealerRepository.findByLoginId(request.getLoginId()).isPresent()) {
            throw new IllegalArgumentException("이미 존재하는 딜러 아이디입니다.");
        }

        // 3단계: 비밀번호를 암호화하여 딜러 계정을 생성하고 해당 상사에 배속시킴
        Dealer dealer = Dealer.builder()
                .company(company)
                .loginId(request.getLoginId())
                .password(passwordEncoder.encode(request.getPassword()))
                .name(request.getName())
                .phone(request.getPhone())
                .profileImageUrl(request.getProfileImageUrl())
                .status("ACTIVE")     // 가입 즉시 활동 가능 활성 상태
                .tier("NORMAL")       // 기본 등급 부여
                .riskScore(0.0)       // 초기 이탈 점수 0점
                .build();

        return dealerRepository.save(dealer);
    }

    /**
     * 상사 소속 딜러를 정지(비활성화) 처리합니다.
     *
     * @param masterEmail 현재 로그인한 상사 마스터의 이메일
     * @param dealerId    제외할 딜러의 고유 ID
     */
    @Transactional
    public void withdrawDealer(String masterEmail, Long dealerId) {
        // 1단계: 상사 마스터 이메일 검증 및 상사 식별
        Company company = companyRepository.findByMasterEmail(masterEmail)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 상사 마스터 계정입니다."));

        // 2단계: 대상 딜러가 존재하는지 검증
        Dealer dealer = dealerRepository.findById(dealerId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 딜러입니다."));

        // 3단계 [보안 정합성 검증]: 마스터 본인이 소유한 상사 소속의 딜러인지 교차 검증 수행
        if (!dealer.getCompany().getCompanyId().equals(company.getCompanyId())) {
            throw new SecurityException("본인 상사 소속의 딜러만 제외할 권한이 있습니다.");
        }

        // 4단계: 딜러 계정의 상태를 WITHDRAWN(비활성 정지)으로 세팅하여 DB 반영
        dealer.setStatus("WITHDRAWN");
        dealerRepository.save(dealer);
    }
}
