package com.hayden.blog.dto;

import java.io.InputStream;

public record MediaStreamResponse(
        InputStream inputStream,
        String contentType,
        long contentLength,
        String eTag
) {}
