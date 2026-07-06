package com.car.app.dealer;

import com.car.app.company.Company;
import com.car.app.company.CompanyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class DealerService {

    private final DealerRepository dealerRepository;
    private final CompanyRepository companyRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public Dealer createDealer(String masterEmail, DealerDto.CreateRequest request) {
        Company company = companyRepository.findByMasterEmail(masterEmail)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 상사 마스터 계정입니다."));

        if (dealerRepository.findByLoginId(request.getLoginId()).isPresent()) {
            throw new IllegalArgumentException("이미 존재하는 딜러 아이디입니다.");
        }

        Dealer dealer = Dealer.builder()
                .company(company)
                .loginId(request.getLoginId())
                .password(passwordEncoder.encode(request.getPassword()))
                .name(request.getName())
                .phone(request.getPhone())
                .status("ACTIVE")
                .tier("NORMAL")
                .riskScore(0.0)
                .build();

        return dealerRepository.save(dealer);
    }

    @Transactional
    public void withdrawDealer(String masterEmail, Long dealerId) {
        Company company = companyRepository.findByMasterEmail(masterEmail)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 상사 마스터 계정입니다."));

        Dealer dealer = dealerRepository.findById(dealerId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 딜러입니다."));

        if (!dealer.getCompany().getCompanyId().equals(company.getCompanyId())) {
            throw new SecurityException("본인 상사 소속의 딜러만 제외할 권한이 있습니다.");
        }

        dealer.setStatus("WITHDRAWN");
        dealerRepository.save(dealer);
    }
}
