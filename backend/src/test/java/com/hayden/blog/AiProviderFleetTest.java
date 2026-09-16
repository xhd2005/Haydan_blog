package com.hayden.blog;

import com.hayden.blog.ai.dto.AiProviderConfig;
import com.hayden.blog.ai.dto.AiProviderTestRequest;
import com.hayden.blog.ai.dto.AiProviderTestResponse;
import com.hayden.blog.ai.service.AiModelManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class AiProviderFleetTest {

    @Autowired
    private AiModelManager aiModelManager;

    @Test
    public void testDeepSeekOfficialConnectivity() {
        System.out.println("=== 正在测试 DeepSeek 官方 API 连通性与模型探测 ===");

        AiProviderTestRequest request = AiProviderTestRequest.builder()
                .provider("DEEPSEEK")
                .baseUrl("https://api.deepseek.com")
                .apiKey("sk-093756b2a2e345a4bd34571cc816b0b9")
                .build();

        AiProviderTestResponse response = aiModelManager.testConnectivity(request);
        System.out.println(">>> 连通性测试结果: success=" + response.isSuccess()
                + ", latency=" + response.getLatencyMs() + "ms"
                + ", message=" + response.getMessage());

        assertTrue(response.isSuccess(), "DeepSeek 官方 API 应连通成功");
        assertTrue(response.getLatencyMs() > 0, "应有网络响应耗时统计");
        assertNotNull(response.getAvailableModels(), "应返回可用模型列表");
        System.out.println(">>> 探测到的可用模型: " + response.getAvailableModels());
        assertTrue(response.getAvailableModels().contains("deepseek-flash"), "应包含 deepseek-flash 模型");
    }

    @Test
    public void testModelResolution() {
        System.out.println("=== 测试 DeepSeek 官方模型描述符解析 ===");
        AiModelManager.ModelDescriptor flashDesc = aiModelManager.resolveDescriptor("deepseek-flash");
        assertNotNull(flashDesc);
        assertEquals("deepseek-flash", flashDesc.modelId());
        assertEquals("https://api.deepseek.com", flashDesc.defaultBaseUrl());

        AiModelManager.ModelDescriptor proDesc = aiModelManager.resolveDescriptor("deepseek-v4-pro");
        assertNotNull(proDesc);
        assertEquals(8192, proDesc.maxTokens());
    }
}
