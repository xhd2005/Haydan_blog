package com.hayden.blog.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * 数字花园星空引力知识图谱 VO 模型
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KnowledgeGraphVO {

    private List<GraphNode> nodes;
    private List<GraphEdge> edges;
    private Map<String, Object> stats;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GraphNode {
        private String id;
        private String label;
        private String type; // "post", "concept", "journey"
        private String maturity; // "SEEDLING", "BUDDING", "EVERGREEN"
        private String slug;
        private String url;
        private String excerpt;
        private Integer val;
        private String category;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GraphEdge {
        private String source;
        private String target;
        private String relation; // "TAG", "TRANSLATION", "SEMANTIC", "FOOTPRINT"
        private Double weight;
    }
}
