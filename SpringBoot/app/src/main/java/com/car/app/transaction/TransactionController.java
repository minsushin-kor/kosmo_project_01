package com.car.app.transaction;

import com.car.app.dealer.Dealer;
import com.car.app.dealer.DealerRepository;
import com.car.app.member.Member;
import com.car.app.member.MemberRepository;
import com.car.app.security.ApiResponse;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionRepository transactionRepository;
    private final MemberRepository memberRepository;
    private final DealerRepository dealerRepository;

    private static final Set<String> ALLOWED_STATUSES = Set.of("PENDING_PAYMENT", "PAID", "COMPLETED", "CANCELLED");

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StatusUpdateRequest {
        private String status; // PENDING_PAYMENT, PAID, COMPLETED, CANCELLED
    }

    /**
     * 관리자 전체 거래 목록 조회 (DTO 변환 반환)
     */
    @GetMapping("/api/admin/transactions")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<TransactionDto.Response>>> getAllTransactions() {
        List<TransactionDto.Response> transactions = transactionRepository.findAll().stream()
                .map(TransactionDto.Response::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(transactions, "전체 거래 목록 조회가 완료되었습니다."));
    }

    /**
     * 거래 상세 조회 (당사자 또는 ADMIN 접근 검증)
     */
    @GetMapping("/api/transactions/{transactionId}")
    public ResponseEntity<ApiResponse<TransactionDto.Response>> getTransactionDetail(@PathVariable Long transactionId) {
        Transaction transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 거래 내역입니다."));

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        verifyTransactionOwnershipOrAdmin(auth, transaction);

        return ResponseEntity.ok(ApiResponse.success(TransactionDto.Response.fromEntity(transaction), "거래 상세 조회가 완료되었습니다."));
    }

    /**
     * 거래 상태 및 결제 단계 변경 (허용된 상태값 검증 및 당사자/ADMIN 권한 확인)
     */
    @PatchMapping("/api/transactions/{transactionId}/status")
    public ResponseEntity<ApiResponse<TransactionDto.Response>> updateTransactionStatus(
            @PathVariable Long transactionId,
            @RequestBody StatusUpdateRequest request) {

        Transaction transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 거래 내역입니다."));

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        verifyTransactionOwnershipOrAdmin(auth, transaction);

        String newStatus = request.getStatus() != null ? request.getStatus().toUpperCase() : "";
        if (!ALLOWED_STATUSES.contains(newStatus)) {
            throw new IllegalArgumentException("허용되지 않는 거래 상태값입니다: " + request.getStatus());
        }

        transaction.setStatus(newStatus);
        LocalDateTime now = LocalDateTime.now();

        if ("PAID".equalsIgnoreCase(newStatus)) {
            transaction.setPaidAt(now);
        } else if ("COMPLETED".equalsIgnoreCase(newStatus)) {
            transaction.setCompletedAt(now);
            if (transaction.getCar() != null) {
                transaction.getCar().setStatus("SOLD");
            }
        } else if ("CANCELLED".equalsIgnoreCase(newStatus)) {
            transaction.setCancelledAt(now);
            if (transaction.getCar() != null) {
                transaction.getCar().setStatus("REGISTERED");
            }
        }

        Transaction updated = transactionRepository.save(transaction);
        return ResponseEntity.ok(ApiResponse.success(TransactionDto.Response.fromEntity(updated), "거래 상태가 성공적으로 변경되었습니다."));
    }

    /**
     * 로그인한 본인의 거래 내역 목록만 필터링하여 조회
     */
    @GetMapping("/api/users/me/transactions")
    public ResponseEntity<ApiResponse<List<TransactionDto.Response>>> getMyTransactions() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();

        Optional<Member> memberOpt = memberRepository.findByLoginId(username);
        Optional<Dealer> dealerOpt = dealerRepository.findByLoginId(username);

        List<Transaction> myTransactions;
        if (memberOpt.isPresent()) {
            Long memberId = memberOpt.get().getMemberId();
            myTransactions = transactionRepository.findByBuyerTypeAndBuyerIdOrSellerTypeAndSellerId("MEMBER", memberId, "MEMBER", memberId);
        } else if (dealerOpt.isPresent()) {
            Long dealerId = dealerOpt.get().getDealerId();
            myTransactions = transactionRepository.findByBuyerTypeAndBuyerIdOrSellerTypeAndSellerId("DEALER", dealerId, "DEALER", dealerId);
        } else {
            myTransactions = List.of();
        }

        List<TransactionDto.Response> responses = myTransactions.stream()
                .map(TransactionDto.Response::fromEntity)
                .collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.success(responses, "내 거래 내역 조회가 완료되었습니다."));
    }

    private void verifyTransactionOwnershipOrAdmin(Authentication auth, Transaction transaction) {
        if (auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            return;
        }

        String username = auth.getName();
        Optional<Member> memberOpt = memberRepository.findByLoginId(username);
        Optional<Dealer> dealerOpt = dealerRepository.findByLoginId(username);

        boolean isBuyer = (memberOpt.isPresent() && "MEMBER".equalsIgnoreCase(transaction.getBuyerType()) && transaction.getBuyerId().equals(memberOpt.get().getMemberId())) ||
                          (dealerOpt.isPresent() && "DEALER".equalsIgnoreCase(transaction.getBuyerType()) && transaction.getBuyerId().equals(dealerOpt.get().getDealerId()));

        boolean isSeller = (memberOpt.isPresent() && "MEMBER".equalsIgnoreCase(transaction.getSellerType()) && transaction.getSellerId().equals(memberOpt.get().getMemberId())) ||
                           (dealerOpt.isPresent() && "DEALER".equalsIgnoreCase(transaction.getSellerType()) && transaction.getSellerId().equals(dealerOpt.get().getDealerId()));

        if (!isBuyer && !isSeller) {
            throw new SecurityException("해당 거래 건에 접근할 권한이 없습니다.");
        }
    }
}
