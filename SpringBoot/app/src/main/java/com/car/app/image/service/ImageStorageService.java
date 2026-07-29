package com.car.app.image.service;

import com.car.app.image.dto.ImageUploadDto;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
public class ImageStorageService {

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
            "jpg",
            "jpeg",
            "png",
            "gif",
            "webp");

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/jpeg",
            "image/png",
            "image/gif",
            "image/webp");

    private final Path uploadRoot;

    private final long maxFileSize;

    public ImageStorageService(
            @Value("${app.upload.dir:uploads}") String uploadDir,

            @Value("${app.upload.max-file-size:10485760}") long maxFileSize) {
        this.uploadRoot = Path.of(uploadDir)
                .toAbsolutePath()
                .normalize();

        this.maxFileSize = maxFileSize;

        try {
            Files.createDirectories(
                    this.uploadRoot);
        } catch (IOException e) {
            throw new IllegalStateException(
                    "이미지 저장 폴더를 생성할 수 없습니다.",
                    e);
        }
    }

    public ImageUploadDto.Response store(
            MultipartFile file,
            String category) {
        validateFile(file);

        String safeCategory = normalizeCategory(category);

        String originalFileName = StringUtils.cleanPath(
                file.getOriginalFilename() == null
                        ? "image"
                        : file.getOriginalFilename());

        String extension = extractExtension(
                originalFileName);

        String storedFileName = UUID.randomUUID()
                + "."
                + extension;

        Path categoryDirectory = uploadRoot
                .resolve(safeCategory)
                .normalize();

        Path targetPath = categoryDirectory
                .resolve(storedFileName)
                .normalize();

        if (!targetPath.startsWith(uploadRoot)) {
            throw new IllegalArgumentException(
                    "올바르지 않은 이미지 저장 경로입니다.");
        }

        try {
            Files.createDirectories(
                    categoryDirectory);

            try (
                    InputStream inputStream = file.getInputStream()) {
                Files.copy(
                        inputStream,
                        targetPath,
                        StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (IOException e) {
            throw new IllegalStateException(
                    "이미지 파일 저장에 실패했습니다.",
                    e);
        }

        String imageUrl = ServletUriComponentsBuilder
                .fromCurrentContextPath()
                .path("/uploads/")
                .path(safeCategory)
                .path("/")
                .path(storedFileName)
                .toUriString();

        return ImageUploadDto.Response
                .builder()
                .imageUrl(imageUrl)
                .originalFileName(
                        originalFileName)
                .storedFileName(
                        storedFileName)
                .size(file.getSize())
                .build();
    }

    private void validateFile(
            MultipartFile file) {
        if (file == null ||
                file.isEmpty()) {
            throw new IllegalArgumentException(
                    "업로드할 이미지 파일이 없습니다.");
        }

        if (file.getSize() > maxFileSize) {
            throw new IllegalArgumentException(
                    "이미지는 10MB 이하만 업로드할 수 있습니다.");
        }

        String contentType = file.getContentType();

        if (contentType == null ||
                !ALLOWED_CONTENT_TYPES.contains(
                        contentType.toLowerCase(
                                Locale.ROOT))) {
            throw new IllegalArgumentException(
                    "JPG, PNG, GIF, WEBP 이미지만 업로드할 수 있습니다.");
        }

        String originalFileName = file.getOriginalFilename();

        String extension = extractExtension(
                originalFileName == null
                        ? ""
                        : originalFileName);

        if (!ALLOWED_EXTENSIONS.contains(
                extension)) {
            throw new IllegalArgumentException(
                    "허용되지 않은 이미지 확장자입니다.");
        }
    }

    private String normalizeCategory(
            String category) {
        String value = category == null
                ? "common"
                : category
                        .trim()
                        .toLowerCase(
                                Locale.ROOT);

        return switch (value) {
            case "profile",
                    "company",
                    "dealer",
                    "member",
                    "car" ->
                value;

            default -> "common";
        };
    }

    private String extractExtension(
            String fileName) {
        int dotIndex = fileName.lastIndexOf('.');

        if (dotIndex < 0 ||
                dotIndex == fileName.length() - 1) {
            throw new IllegalArgumentException(
                    "이미지 파일 확장자를 확인해주세요.");
        }

        return fileName
                .substring(dotIndex + 1)
                .toLowerCase(Locale.ROOT);
    }
}