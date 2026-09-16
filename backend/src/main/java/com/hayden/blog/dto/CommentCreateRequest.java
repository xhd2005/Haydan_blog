package com.hayden.blog.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CommentCreateRequest {

    @NotBlank(message = "目标类型不能为空")
    private String targetType; // POST, JOURNEY, MEMO

    @NotNull(message = "目标ID不能为空")
    private Long targetId;

    private Long parentId;

    @NotBlank(message = "评论内容不能为空")
    private String content;
}
