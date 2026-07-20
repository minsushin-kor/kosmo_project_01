package com.car.app.security;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.BindingResult;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.stream.Collectors;

/**
 * 프론트엔드가 일관성 있는 오류 포맷을 수신할 수 있도록
 * 애플리케이션 내 예외를 가로채어 공통 ApiResponse로 변환하는 컨트롤러 어드바이스 클래스입니다.
 */
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    /**
     * 비즈니스 로직 및 파라미터 무결성 검증 실패(IllegalArgumentException) 예외 처리
     */
    @ExceptionHandler({IllegalArgumentException.class, IllegalStateException.class})
    public ResponseEntity<ApiResponse<Void>> handleIllegalArgumentException(RuntimeException ex) {
        log.warn("비즈니스 제약 검증 실패: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.fail("ERR_INVALID_REQUEST", ex.getMessage()));
    }

    /**
     * 권한 제한 및 시큐리티 인가 실패(AccessDeniedException) 예외 처리
     */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<Void>> handleAccessDeniedException(AccessDeniedException ex) {
        log.warn("API 인가 실패: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.fail("ERR_ACCESS_DENIED", "요청하신 리소스에 대한 접근 권한이 없습니다."));
    }

    /**
     * DTO @Valid 입력 값 유효성 체크 실패 예외 처리
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidationException(MethodArgumentNotValidException ex) {
        BindingResult bindingResult = ex.getBindingResult();
        String errorMessage = bindingResult.getFieldErrors().stream()
                .map(error -> String.format("[%s] %s", error.getField(), error.getDefaultMessage()))
                .collect(Collectors.joining(", "));

        log.warn("입력 유효성 검증 실패: {}", errorMessage);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.fail("ERR_VALIDATION_FAILED", errorMessage));
    }

    /**
     * 지원하지 않는 HTTP Method 호출 예외 처리
     */
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ApiResponse<Void>> handleMethodNotSupportedException(HttpRequestMethodNotSupportedException ex) {
        log.warn("지원하지 않는 HTTP Method 호출: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED)
                .body(ApiResponse.fail("ERR_METHOD_NOT_SUPPORTED", String.format("지원하지 않는 HTTP Method입니다. (요청한 Method: %s)", ex.getMethod())));
    }

    /**
     * 시스템 내부 오류 (서버 에러) 전체 예외 처리
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleException(Exception ex) {
        log.error("서버 내부 시스템 에러 발생: ", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.fail("ERR_INTERNAL_SERVER_ERROR", "서버 내부 처리 중 예기치 못한 시스템 오류가 발생했습니다."));
    }
}
