package com.car.app.transaction;

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

@RestController
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionRepository transactionRepository;

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StatusUpdateRequest {
        private String status; // PENDING_PAYMENT, PAID, COMPLETED, CANCELLED
    }

    /**
     * 관리자 전체 거래 목록 조회
     */
    @GetMapping("/api/admin/transactions")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<Transaction>>> getAllTransactions() {
        List<Transaction> transactions = transactionRepository.findAll();
        return ResponseEntity.ok(ApiResponse.success(transactions, "전체 거래 목록 조회가 완료되었습니다."));
    }

    /**
     * 거래 상세 조회
     */
    @GetMapping("/api/transactions/{transactionId}")
    public ResponseEntity<ApiResponse<Transaction>> getTransactionDetail(@PathVariable Long transactionId) {
        Transaction transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 거래 내역입니다."));
        return ResponseEntity.ok(ApiResponse.success(transaction, "거래 상세 조회가 완료되었습니다."));
    }

    /**
     * 거래 상태 및 결제 단계 변경 (결제완료/거래완료/거래취소)
     */
    @PatchMapping("/api/transactions/{transactionId}/status")
    public ResponseEntity<ApiResponse<Transaction>> updateTransactionStatus(
            @PathVariable Long transactionId,
            @RequestBody StatusUpdateRequest request) {

        Transaction transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 거래 내역입니다."));

        String newStatus = request.getStatus();
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
        return ResponseEntity.ok(ApiResponse.success(updated, "거래 상태가 성공적으로 변경되었습니다."));
    }

    /**
     * 로그인한 본인의 전체 거래 내역 목록 조회
     */
    @GetMapping("/api/users/me/transactions")
    public ResponseEntity<ApiResponse<List<Transaction>>> getMyTransactions() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        List<Transaction> transactions = transactionRepository.findAll();
        return ResponseEntity.ok(ApiResponse.success(transactions, "내 거래 내역 조회가 완료되었습니다."));
    }
}
