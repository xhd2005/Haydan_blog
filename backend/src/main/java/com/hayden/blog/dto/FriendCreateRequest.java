package com.hayden.blog.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class FriendCreateRequest {

    @NotBlank(message = "站点名称不能为空")
    private String name;

    @NotBlank(message = "站点链接不能为空")
    private String url;

    private String avatar;

    private String description;

    private String category; // Blog, Tech, Tools

    private Integer sortOrder;

    private String status; // ACTIVE, HIDDEN
}
