package com.car.app.dealer;

import com.car.app.company.Company;
import com.car.app.company.CompanyRepository;
import com.car.app.user.User;
import com.car.app.user.UserRepository;
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

    private final UserRepository userRepository;
    private final DealerRepository dealerRepository;
    private final CompanyRepository companyRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * 상사 마스터 권한 하에 소속 딜러 계정을 신규 개설합니다.
     */
    @Transactional
    public Dealer createDealer(String masterEmail, DealerDto.CreateRequest request) {
        // 1단계: 상사 마스터 이메일 검증 및 상사 식별
        Company company = companyRepository.findByLoginId(masterEmail)
                .or(() -> companyRepository.findByMasterEmail(masterEmail))
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 상사 마스터 계정입니다."));

        // 2단계: 신규 딜러의 로그인 ID 중복 여부 확인
        if (userRepository.existsByLoginId(request.getLoginId()) || dealerRepository.findByLoginId(request.getLoginId()).isPresent()) {
            throw new IllegalArgumentException("이미 존재하는 딜러 아이디입니다.");
        }

        // 3단계: 통합 계정 User 생성 및 딜러 배속
        User user = User.builder()
                .loginId(request.getLoginId())
                .password(passwordEncoder.encode(request.getPassword()))
                .name(request.getName())
                .phone(request.getPhone())
                .email(request.getEmail())
                .profileImageUrl(request.getProfileImageUrl())
                .roleType("DEALER")
                .status("ACTIVE")
                .build();
        user = userRepository.save(user);

        Dealer dealer = Dealer.builder()
                .user(user)
                .company(company)
                .loginId(request.getLoginId())
                .password(user.getPassword())
                .name(request.getName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .profileImageUrl(request.getProfileImageUrl())
                .status("ACTIVE")
                .tier("NORMAL")
                .riskScore(0.0)
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
        Company company = companyRepository.findByLoginId(masterEmail)
                .or(() -> companyRepository.findByMasterEmail(masterEmail))
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 상사 마스터 계정입니다."));

        Dealer dealer = dealerRepository.findById(dealerId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 딜러입니다."));

        if (!dealer.getCompany().getCompanyId().equals(company.getCompanyId())) {
            throw new SecurityException("본인 상사 소속의 딜러만 제외할 권한이 있습니다.");
        }

        dealer.setStatus("SUSPENDED");
        dealerRepository.save(dealer);
    }

    @Transactional(readOnly = true)
    public Dealer getDealerDetail(String masterEmail, Long dealerId) {
        Company company = companyRepository.findByLoginId(masterEmail)
                .or(() -> companyRepository.findByMasterEmail(masterEmail))
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 상사 마스터 계정입니다."));

        Dealer dealer = dealerRepository.findById(dealerId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 딜러 계정입니다."));

        if (!dealer.getCompany().getCompanyId().equals(company.getCompanyId())) {
            throw new SecurityException("본인 상사 소속 딜러만 조회할 수 있습니다.");
        }

        return dealer;
    }

    @Transactional
    public Dealer updateDealer(String masterEmail, Long dealerId, DealerDto.CreateRequest request) {
        Company company = companyRepository.findByLoginId(masterEmail)
                .or(() -> companyRepository.findByMasterEmail(masterEmail))
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 상사 마스터 계정입니다."));

        Dealer dealer = dealerRepository.findById(dealerId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 딜러 계정입니다."));

        if (!dealer.getCompany().getCompanyId().equals(company.getCompanyId())) {
            throw new SecurityException("본인 상사 소속 딜러만 수정할 수 있습니다.");
        }

        if (request.getName() != null) dealer.setName(request.getName());
        if (request.getPhone() != null) dealer.setPhone(request.getPhone());
        if (request.getProfileImageUrl() != null) dealer.setProfileImageUrl(request.getProfileImageUrl());
        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            dealer.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        return dealerRepository.save(dealer);
    }
}
