package com.howard.blog.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class MemoCreateRequest {

    @NotBlank(message = "随记内容不能为空")
    private String content;

    private String images; // JSON array string or comma separated

    private Integer isPinned;
}
