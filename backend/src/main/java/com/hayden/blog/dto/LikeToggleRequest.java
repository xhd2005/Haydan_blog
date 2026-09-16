package com.hayden.blog.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LikeToggleRequest {

    @NotBlank(message = "点赞目标类型不能为空")
    private String targetType; // POST, MEMO, COMMENT, JOURNEY, PROJECT

    @NotNull(message = "点赞目标ID不能为空")
    private Long targetId;
}
