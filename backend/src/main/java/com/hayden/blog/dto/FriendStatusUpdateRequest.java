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
public class FriendStatusUpdateRequest {

    @NotBlank(message = "审核状态不能为空")
    private String status; // ACTIVE, REJECTED, PENDING
}
