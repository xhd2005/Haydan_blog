package com.hayden.blog.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FriendApplyRequest {

    @NotBlank(message = "站点名称不能为空")
    private String name;

    @NotBlank(message = "站点链接不能为空")
    private String url;

    private String avatar;

    private String description;

    private String category; // 独立博客, 极客同好, 开源先锋
}
