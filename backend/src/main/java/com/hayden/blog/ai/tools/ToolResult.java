package com.hayden.blog.ai.tools;

import com.hayden.blog.ai.dto.AiCitation;
import lombok.Builder;

import java.util.List;
import java.util.Map;

/**
 * AI Function Calling 工具执行结果封装 (Java 25 Record)
 */
@Builder
public record ToolResult(
        String toolName,
        String resultJson,
        List<AiCitation> citations,
        Map<String, Object> action,
        String statusMessage
) {
    public String getToolName() { return toolName; }
    public String getResultJson() { return resultJson; }
    public List<AiCitation> getCitations() { return citations; }
    public Map<String, Object> getAction() { return action; }
    public String getStatusMessage() { return statusMessage; }
}
