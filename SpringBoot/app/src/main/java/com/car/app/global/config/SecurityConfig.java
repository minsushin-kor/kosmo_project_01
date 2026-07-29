package com.car.app.global.config;

import com.car.app.global.security.JwtAuthenticationFilter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Value("${app.cors.allowed-origins:"
            + "http://localhost:3000,"
            + "http://localhost:5173,"
            + "http://localhost:8080}")
    private String allowedOrigins;

    public SecurityConfig(
            JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http) throws Exception {

        http
                .cors(cors -> cors.configurationSource(
                        corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(
                        SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth

                        /*
                         * 회원가입, 로그인 API
                         */
                        .requestMatchers(
                                "/api/auth/**")
                        .permitAll()

                        /*
                         * 회원가입 전에 프로필 이미지를
                         * 업로드할 수 있어야 하므로 공개 처리
                         */
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/images/upload")
                        .permitAll()

                        /*
                         * 저장된 이미지 파일 조회
                         */
                        .requestMatchers(
                                HttpMethod.GET,
                                "/uploads/**")
                        .permitAll()

                        /*
                         * 브라우저의 CORS 사전 요청
                         */
                        .requestMatchers(
                                HttpMethod.OPTIONS,
                                "/**")
                        .permitAll()

                        /*
                         * 웹소켓
                         */
                        .requestMatchers(
                                "/ws-chat/**")
                        .permitAll()

                        /*
                         * Swagger
                         */
                        .requestMatchers(
                                "/v3/api-docs/**",
                                "/swagger-ui/**",
                                "/swagger-ui.html")
                        .permitAll()

                        /*
                         * 공개 조회 API
                         */
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/cars/**")
                        .permitAll()

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/notices/**")
                        .permitAll()

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/companies/**")
                        .permitAll()

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/dealers/**")
                        .permitAll()

                        /*
                         * 관리자 API
                         */
                        .requestMatchers(
                                "/api/admin/**")
                        .hasRole("ADMIN")

                        /*
                         * 회사 마스터의 딜러 관리 API
                         */
                        .requestMatchers(
                                "/api/company/dealers/**")
                        .hasRole("COMPANY_MASTER")

                        /*
                         * 알림 API
                         */
                        .requestMatchers(
                                "/api/notifications/**")
                        .hasAnyRole(
                                "MEMBER",
                                "DEALER",
                                "ADMIN",
                                "COMPANY_MASTER")

                        /*
                         * 나머지 API는 로그인 필요
                         */
                        .anyRequest()
                        .authenticated())
                .addFilterBefore(
                        jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        List<String> origins = Arrays.stream(
                allowedOrigins.split(","))
                .map(String::trim)
                .filter(origin -> !origin.isBlank())
                .collect(
                        Collectors.toList());

        configuration.setAllowedOriginPatterns(
                origins);

        configuration.setAllowedMethods(
                Arrays.asList(
                        "GET",
                        "POST",
                        "PUT",
                        "DELETE",
                        "PATCH",
                        "OPTIONS"));

        configuration.setAllowedHeaders(
                Arrays.asList(
                        "Authorization",
                        "Content-Type",
                        "Cache-Control",
                        "Accept",
                        "Origin",
                        "X-Requested-With"));

        configuration.setExposedHeaders(
                List.of(
                        "Authorization"));

        configuration.setAllowCredentials(
                true);

        configuration.setMaxAge(
                3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration(
                "/**",
                configuration);

        return source;
    }
}