package com.howard.blog.ai.controller;

import com.howard.blog.ai.dto.AiChatRequest;
import com.howard.blog.ai.service.AiService;
import com.howard.blog.common.Result;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiService aiService;

    @GetMapping("/status")
    public Result<Map<String, Object>> getStatus() {
        return Result.success(aiService.getAiStatus());
    }

    @PostMapping(value = "/chat", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter chat(@RequestBody AiChatRequest request) {
        return aiService.streamChat(request);
    }
}
