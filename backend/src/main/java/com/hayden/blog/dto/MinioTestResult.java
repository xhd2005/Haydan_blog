package com.hayden.blog.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MinioTestResult {
    private boolean success;
    private long latencyMs;
    private String message;
    private String bucket;
}
