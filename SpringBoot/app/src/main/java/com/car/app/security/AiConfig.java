package com.car.app.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

/**
 * FastAPI 서버와의 연동에 필요한 RestTemplate 설정을 담당하는 클래스입니다.
 */
@Configuration
public class AiConfig {

    @Bean
    public RestTemplate restTemplate() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5000); // 5초 연결 타임아웃
        factory.setReadTimeout(5000);    // 5초 읽기 타임아웃
        return new RestTemplate(factory);
    }
}
