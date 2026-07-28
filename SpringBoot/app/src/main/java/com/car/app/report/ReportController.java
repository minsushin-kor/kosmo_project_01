package com.car.app.report;

import com.car.app.security.ApiResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.Setter;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class ReportController {

    private final ReportRepository reportRepository;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ReportCreateRequest {
        private String reporterType;
        private Long reporterId;
        private String targetType; // 'CAR', 'DEALER', 'MEMBER'
        private Long targetId;
        private String reason;
        private String description;
    }

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StatusUpdateRequest {
        private String status; // PENDING, REVIEWING, COMPLETED, REJECTED
    }

    /**
     * 회원/딜러 신고 접수
     */
    @PostMapping("/api/reports")
    public ResponseEntity<ApiResponse<Report>> createReport(@RequestBody ReportCreateRequest request) {
        Report report = Report.builder()
                .reporterType(request.getReporterType() != null ? request.getReporterType() : "MEMBER")
                .reporterId(request.getReporterId())
                .targetType(request.getTargetType())
                .targetId(request.getTargetId())
                .reason(request.getReason())
                .description(request.getDescription())
                .status("PENDING")
                .build();

        Report saved = reportRepository.save(report);
        return ResponseEntity.ok(ApiResponse.success(saved, "신고가 성공적으로 접수되었습니다."));
    }

    /**
     * 관리자 신고 목록 조회
     */
    @GetMapping("/api/admin/reports")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<Report>>> getReports() {
        List<Report> reports = reportRepository.findAllByOrderByCreatedAtDesc();
        return ResponseEntity.ok(ApiResponse.success(reports, "신고 목록 조회가 완료되었습니다."));
    }

    /**
     * 관리자 신고 상세 조회
     */
    @GetMapping("/api/admin/reports/{reportId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Report>> getReportDetail(@PathVariable Long reportId) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 신고 내역입니다."));
        return ResponseEntity.ok(ApiResponse.success(report, "신고 상세 조회가 완료되었습니다."));
    }

    /**
     * 관리자 신고 처리 상태 변경
     */
    @PatchMapping("/api/admin/reports/{reportId}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Report>> updateReportStatus(@PathVariable Long reportId, @RequestBody StatusUpdateRequest request) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 신고 내역입니다."));
        report.setStatus(request.getStatus());
        Report updated = reportRepository.save(report);
        return ResponseEntity.ok(ApiResponse.success(updated, "신고 처리 상태가 성공적으로 변경되었습니다."));
    }
}
