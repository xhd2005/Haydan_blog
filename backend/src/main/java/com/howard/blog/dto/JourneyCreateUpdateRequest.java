package com.howard.blog.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
public class JourneyCreateUpdateRequest {

    @NotBlank(message = "旅行标题不能为空")
    private String title;

    private String slug;

    @NotBlank(message = "国家不能为空")
    private String country;

    @NotBlank(message = "城市不能为空")
    private String city;

    private String description;

    private String content;

    private String cover;

    private BigDecimal latitude;

    private BigDecimal longitude;

    private LocalDate startDate;

    private LocalDate endDate;

    private List<JourneyImageDTO> images;

    @Data
    public static class JourneyImageDTO {
        private String imageUrl;
        private String caption;
        private Integer sortOrder;
    }
}
