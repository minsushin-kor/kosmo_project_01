package com.car.app.image.controller;

import com.car.app.global.response.ApiResponse;
import com.car.app.image.dto.ImageUploadDto;
import com.car.app.image.service.ImageStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/images")
@RequiredArgsConstructor
public class ImageUploadController {

    private final ImageStorageService imageStorageService;

    @PostMapping("/upload")
    public ResponseEntity<ApiResponse<ImageUploadDto.Response>> uploadImage(
            @RequestParam("file") MultipartFile file,

            @RequestParam(value = "category", defaultValue = "common") String category) {
        ImageUploadDto.Response response = imageStorageService.store(
                file,
                category);

        return ResponseEntity.ok(
                ApiResponse.success(
                        response,
                        "이미지가 업로드되었습니다."));
    }
}