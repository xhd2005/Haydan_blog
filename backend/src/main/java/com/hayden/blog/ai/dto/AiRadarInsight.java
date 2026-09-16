package com.hayden.blog.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 文章 AI 全息概念雷达与执行摘要 DTO 模型
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiRadarInsight {

    /**
     * 30 秒核心论点与价值 TL;DR
     */
    private String summary;

    /**
     * 核心技术概念芯片列表
     */
    private List<ConceptChip> concepts;

    /**
     * 阅读前置知识要求与建议
     */
    private String prerequisites;

    /**
     * 技术难度评估 (BEGINNER, INTERMEDIATE, ADVANCED)
     */
    private String difficulty;

    /**
     * 知识演进与成熟度判定依据
     */
    private String maturityReason;

    /**
     * 推荐的站内标签建议
     */
    private List<String> suggestedTags;

    /**
     * 概念芯片模型
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ConceptChip {
        private String name;
        private String essence;
        private String tag;
    }
}
