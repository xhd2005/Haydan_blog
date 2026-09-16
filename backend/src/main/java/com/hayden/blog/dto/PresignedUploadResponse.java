package com.hayden.blog.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PresignedUploadResponse {

    private String uploadUrl;
    private String objectKey;
    private String publicUrl;
    private String storageType;
    private Long mediaId;
}
