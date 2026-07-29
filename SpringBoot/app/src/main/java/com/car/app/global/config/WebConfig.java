package com.car.app.global.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.util.Arrays;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${app.cors.allowed-origins:"
            + "http://localhost:3000,"
            + "http://localhost:5173,"
            + "http://localhost:8080}")
    private String allowedOrigins;

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @Override
    public void addCorsMappings(
            CorsRegistry registry) {
        String[] origins = Arrays.stream(
                allowedOrigins.split(","))
                .map(String::trim)
                .toArray(String[]::new);

        registry
                .addMapping("/**")
                .allowedOriginPatterns(origins)
                .allowedMethods(
                        "GET",
                        "POST",
                        "PUT",
                        "DELETE",
                        "PATCH",
                        "OPTIONS")
                .allowedHeaders("*")
                .exposedHeaders(
                        "Authorization")
                .allowCredentials(true);
    }

    @Override
    public void addResourceHandlers(
            ResourceHandlerRegistry registry) {
        String location = Path.of(uploadDir)
                .toAbsolutePath()
                .normalize()
                .toUri()
                .toString();

        registry
                .addResourceHandler(
                        "/uploads/**")
                .addResourceLocations(
                        location);
    }
}