package com.howard.blog.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDate;

@Data
public class ProjectCreateUpdateRequest {

    @NotBlank(message = "项目名称不能为空")
    private String name;

    private String slug;

    private String description;

    private String content;

    private String cover;

    private String technologies;

    private String githubUrl;

    private String demoUrl;

    private Integer featured;

    private String status; // PLANNING, DEVELOPING, COMPLETED, ARCHIVED

    private LocalDate startDate;

    private LocalDate endDate;
}
