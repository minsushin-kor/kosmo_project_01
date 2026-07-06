package com.car.app.car;

import lombok.*;

import java.util.List;

public class CarDto {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateRequest {
        private Integer year;
        private String make;
        private String model;
        private String option;
        private String body;
        private String transmission;
        private String state;
        private Double condition;
        private Double odometer;
        private String color;
        private String interior;
        private Long sellingPrice;
        private List<ImageDto> images;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ImageDto {
        private String imageUrl;
        private Boolean isMain;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Response {
        private Long carId;
        private Integer year;
        private String make;
        private String model;
        private String option;
        private String body;
        private String transmission;
        private String state;
        private Double condition;
        private Double odometer;
        private String color;
        private String interior;
        private Long sellingPrice;
        private String status;
        private String ownerType;
        private Long ownerId;
        private String ownerName;
        private List<ImageDto> images;
    }
}
