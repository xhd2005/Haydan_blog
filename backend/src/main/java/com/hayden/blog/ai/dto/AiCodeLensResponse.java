package com.hayden.blog.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiCodeLensResponse {
    /**
     * 底层机制剖析 (Under the Hood)
     */
    private String mechanism;

    /**
     * 并发、性能与设计避坑指南 (Performance & Pitfalls)
     */
    private String pitfalls;

    /**
     * 全栈知识图谱关联概念
     */
    private List<String> relatedConcepts;

    /**
     * 架构启示或优化评级
     */
    private String advice;
}
