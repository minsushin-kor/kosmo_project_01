package com.car.app.notice.controller;

import com.car.app.notice.entity.Notice;
import com.car.app.notice.repository.NoticeRepository;
import com.car.app.global.response.ApiResponse;
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
public class NoticeController {

    private final NoticeRepository noticeRepository;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class NoticeCreateRequest {
        private String title;
        private String content;
        private String category;
        private Boolean isImportant;
    }

    /**
     * 공개 공지사항 목록 조회 (중요 공지 상단 정렬)
     */
    @GetMapping("/api/notices")
    public ResponseEntity<ApiResponse<List<Notice>>> getNotices() {
        List<Notice> notices = noticeRepository.findAllByOrderByIsImportantDescCreatedAtDesc();
        return ResponseEntity.ok(ApiResponse.success(notices, "공지사항 목록 조회가 완료되었습니다."));
    }

    /**
     * 공지사항 상세 조회
     */
    @GetMapping("/api/notices/{noticeId}")
    public ResponseEntity<ApiResponse<Notice>> getNoticeDetail(@PathVariable Long noticeId) {
        Notice notice = noticeRepository.findById(noticeId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 공지사항입니다."));
        return ResponseEntity.ok(ApiResponse.success(notice, "공지사항 상세 조회가 완료되었습니다."));
    }

    /**
     * 관리자 공지사항 신규 등록
     */
    @PostMapping("/api/admin/notices")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Notice>> createNotice(@RequestBody NoticeCreateRequest request) {
        Notice notice = Notice.builder()
                .title(request.getTitle())
                .content(request.getContent())
                .category(request.getCategory() != null ? request.getCategory() : "GENERAL")
                .isImportant(request.getIsImportant() != null ? request.getIsImportant() : false)
                .author("관리자")
                .build();
        Notice saved = noticeRepository.save(notice);
        return ResponseEntity.ok(ApiResponse.success(saved, "공지사항이 성공적으로 등록되었습니다."));
    }

    /**
     * 관리자 공지사항 수정
     */
    @PutMapping("/api/admin/notices/{noticeId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Notice>> updateNotice(@PathVariable Long noticeId, @RequestBody NoticeCreateRequest request) {
        Notice notice = noticeRepository.findById(noticeId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 공지사항입니다."));

        if (request.getTitle() != null) notice.setTitle(request.getTitle());
        if (request.getContent() != null) notice.setContent(request.getContent());
        if (request.getCategory() != null) notice.setCategory(request.getCategory());
        if (request.getIsImportant() != null) notice.setIsImportant(request.getIsImportant());

        Notice updated = noticeRepository.save(notice);
        return ResponseEntity.ok(ApiResponse.success(updated, "공지사항이 성공적으로 수정되었습니다."));
    }

    /**
     * 관리자 공지사항 삭제
     */
    @DeleteMapping("/api/admin/notices/{noticeId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<String>> deleteNotice(@PathVariable Long noticeId) {
        noticeRepository.deleteById(noticeId);
        return ResponseEntity.ok(ApiResponse.success("SUCCESS", "공지사항이 성공적으로 삭제되었습니다."));
    }
}
