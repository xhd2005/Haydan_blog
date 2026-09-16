package com.hayden.blog.ai.controller;

import com.hayden.blog.ai.dto.*;
import com.hayden.blog.ai.service.AiModelManager;
import com.hayden.blog.ai.service.AiRateLimiterService;
import com.hayden.blog.ai.service.AiService;
import com.hayden.blog.common.Result;
import com.hayden.blog.exception.BusinessException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiService aiService;
    private final AiModelManager aiModelManager;
    private final AiRateLimiterService aiRateLimiterService;

    @GetMapping("/status")
    public Result<Map<String, Object>> getStatus() {
        return Result.success(aiService.getAiStatus());
    }

    @GetMapping("/quota")
    public Result<AiRateLimiterService.AiQuotaResult> getQuota(HttpServletRequest request) {
        String clientIp = getClientIp(request);
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return Result.success(aiRateLimiterService.peekQuota(clientIp, auth));
    }

    @PostMapping(value = {"/chat", "/chat/stream"}, produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter chat(@RequestBody AiChatRequest request,
                           HttpServletRequest httpRequest,
                           HttpServletResponse httpResponse) {
        String clientIp = getClientIp(httpRequest);
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return aiService.streamChat(request, clientIp, auth, httpResponse);
    }

    @PostMapping("/test-connection")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public Result<AiProviderTestResponse> testConnection(@RequestBody AiProviderTestRequest request) {
        return Result.success(aiModelManager.testConnectivity(request));
    }

    @GetMapping("/knowledge-graph")
    public Result<KnowledgeGraphVO> getKnowledgeGraph() {
        return Result.success(aiService.getKnowledgeGraph());
    }

    @PostMapping("/code-lens")
    public Result<AiCodeLensResponse> explainCode(@RequestBody AiCodeLensRequest request,
                                                  HttpServletRequest httpRequest,
                                                  HttpServletResponse httpResponse) {
        checkQuotaAndAcquireInFlight(httpRequest, httpResponse);
        try {
            return Result.success(aiService.explainCodeSnippet(request));
        } finally {
            aiRateLimiterService.releaseInFlight();
        }
    }

    @PostMapping("/inline-lens")
    public Result<AiInlineLensResponse> explainInline(@RequestBody AiInlineLensRequest request,
                                                      HttpServletRequest httpRequest,
                                                      HttpServletResponse httpResponse) {
        checkQuotaAndAcquireInFlight(httpRequest, httpResponse);
        try {
            return Result.success(aiService.explainSelectionInSitu(request));
        } finally {
            aiRateLimiterService.releaseInFlight();
        }
    }

    @PostMapping("/reading-path")
    public Result<AiCuratedPathVO> generateReadingPath(@RequestBody AiCuratedPathRequest request,
                                                       HttpServletRequest httpRequest,
                                                       HttpServletResponse httpResponse) {
        checkQuotaAndAcquireInFlight(httpRequest, httpResponse);
        try {
            return Result.success(aiService.generateCuratedReadingPath(request));
        } finally {
            aiRateLimiterService.releaseInFlight();
        }
    }

    @PostMapping("/extract-radar")
    public Result<AiRadarInsight> extractRadar(@RequestBody AiExtractRadarRequest request,
                                               HttpServletRequest httpRequest,
                                               HttpServletResponse httpResponse) {
        checkQuotaAndAcquireInFlight(httpRequest, httpResponse);
        try {
            return Result.success(aiService.extractArticleRadar(request));
        } finally {
            aiRateLimiterService.releaseInFlight();
        }
    }

    @PostMapping(value = "/stream-translate", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public SseEmitter streamTranslate(@RequestBody AiStreamTranslateRequest request) {
        return aiService.streamTranslatePost(request);
    }

    @GetMapping("/backlinks/{postId}")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public Result<AiBacklinkSuggestionVO> getBacklinks(@PathVariable Long postId) {
        return Result.success(aiService.suggestBacklinks(postId));
    }

    @PostMapping("/editor-assist")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public Result<AiEditorAssistResponse> editorAssist(@RequestBody AiEditorAssistRequest request) {
        return Result.success(aiService.editorAssist(request));
    }

    private void checkQuotaAndAcquireInFlight(HttpServletRequest httpRequest, HttpServletResponse httpResponse) {
        String clientIp = getClientIp(httpRequest);
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        AiRateLimiterService.AiQuotaResult quota = aiRateLimiterService.checkAndConsumeQuota(clientIp, auth);

        if (httpResponse != null) {
            httpResponse.setHeader("X-Ai-Quota-Minute-Remaining", String.valueOf(quota.minuteRemaining()));
            httpResponse.setHeader("X-Ai-Quota-Day-Remaining", String.valueOf(quota.dayRemaining()));
            httpResponse.setHeader("X-Ai-Quota-Max-Tokens", String.valueOf(quota.maxTokens()));
            httpResponse.setHeader("X-Ai-Client-Type", quota.clientType());
        }

        if (!quota.allowed()) {
            throw new BusinessException(429, quota.reason());
        }

        if (!aiRateLimiterService.tryAcquireInFlight()) {
            throw new BusinessException(429, "当前 AI 推理任务并发已达上限，请稍候再试");
        }
    }

    private String getClientIp(HttpServletRequest request) {
        if (request == null) {
            return "127.0.0.1";
        }
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("X-Real-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        return ip != null ? ip : "127.0.0.1";
    }
}

