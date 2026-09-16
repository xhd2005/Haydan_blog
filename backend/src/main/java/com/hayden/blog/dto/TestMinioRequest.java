package com.hayden.blog.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TestMinioRequest {
    private String endpoint;
    private String bucket;
    private String accessKey;
    private String secretKey;
    private String publicUrl;
}
