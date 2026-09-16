package com.hayden.blog.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.hayden.blog.common.BaseEntity;
import lombok.*;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@TableName("projects")
public class Project extends BaseEntity {

    private String name;
    private String slug;
    private String description;
    private String content;
    private String cover;
    private String technologies;
    private String githubUrl;
    private String demoUrl;
    private Integer featured;
    private Integer likeCount;
    private String status; // PLANNING, DEVELOPING, COMPLETED, ARCHIVED
    private LocalDate startDate;
    private LocalDate endDate;
}
