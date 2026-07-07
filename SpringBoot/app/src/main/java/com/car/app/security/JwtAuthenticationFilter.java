package com.car.app.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * 모든 API 요청마다 헤더에서 JWT 토큰을 추출하고 검증하여
 * 스프링 시큐리티 컨텍스트에 인증 정보(Authentication)를 탑재하는 핵심 필터 클래스입니다.
 */
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtProvider jwtProvider;
    private final CustomUserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        // 1단계: HTTP 요청 헤더에서 Bearer 토큰 추출
        String token = parseBearerToken(request);

        // 2단계: 토큰이 존재하고 서명 및 유효기간이 검증 완료되었는지 확인
        if (token != null && jwtProvider.validateToken(token)) {
            // 토큰 내부 클레임에서 사용자 아이디(username) 추출
            String username = jwtProvider.getUsername(token);
            
            // 3단계: 다중 로그인 검증 전용 CustomUserDetailsService를 호출해 DB 실원 대조
            UserDetails userDetails = userDetailsService.loadUserByUsername(username);
            
            // 4단계: 스프링 시큐리티에서 활용할 인증 주체(Token) 객체 빌드
            UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                    userDetails, null, userDetails.getAuthorities()
            );
            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            
            // 5단계: 현재 요청 스레드의 시큐리티 인증 세션에 인증 객체 등록 (권한 인가 처리 완료)
            SecurityContextHolder.getContext().setAuthentication(authentication);
        }

        // 6단계: 다음 필터 체인(CORS, URL 차단 등)으로 요청 전달
        filterChain.doFilter(request, response);
    }

    /**
     * HTTP Request의 'Authorization' 헤더에서 'Bearer '로 시작하는 순수 JWT 문자열을 파싱합니다.
     */
    private String parseBearerToken(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
