package com.hayden.blog.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LikeBatchStatusRequest {

    @NotBlank(message = "目标类型不能为空")
    private String targetType;

    @NotEmpty(message = "目标ID列表不能为空")
    private List<Long> targetIds;
}
