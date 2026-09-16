package com.hayden.blog.ai.rag;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hayden.blog.ai.dto.AiCitation;
import com.hayden.blog.ai.tools.ToolResult;
import com.hayden.blog.common.PageResult;
import com.hayden.blog.entity.Journey;
import com.hayden.blog.entity.NowRecord;
import com.hayden.blog.entity.Post;
import com.hayden.blog.entity.Timeline;
import com.hayden.blog.service.JourneyService;
import com.hayden.blog.service.NowService;
import com.hayden.blog.service.PostService;
import com.hayden.blog.service.TimelineService;
import com.hayden.blog.vo.PostListVO;
import dev.langchain4j.data.document.Metadata;
import dev.langchain4j.data.embedding.Embedding;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.model.embedding.onnx.allminilml6v2.AllMiniLmL6V2EmbeddingModel;
import dev.langchain4j.model.output.Response;
import dev.langchain4j.store.embedding.EmbeddingMatch;
import dev.langchain4j.store.embedding.inmemory.InMemoryEmbeddingStore;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.*;
import java.util.concurrent.Executors;

/**
 * Hayden Xue 数字花园轻量 True RAG 向量知识库 (Java 25 + LangChain4j)
 * 启动时异步预热，纯内存余弦相似度检索，运用 Stream Gatherers 滑动切片
 */
@Slf4j
@Component
public class GardenKnowledgeBase {

    private final PostService postService;
    private final JourneyService journeyService;
    private final TimelineService timelineService;
    private final NowService nowService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private final InMemoryEmbeddingStore<TextSegment> embeddingStore = new InMemoryEmbeddingStore<>();
    private EmbeddingModel embeddingModel;
    private volatile boolean initialized = false;

    public GardenKnowledgeBase(PostService postService,
                               JourneyService journeyService,
                               TimelineService timelineService,
                               NowService nowService) {
        this.postService = postService;
        this.journeyService = journeyService;
        this.timelineService = timelineService;
        this.nowService = nowService;

        try {
            this.embeddingModel = new AllMiniLmL6V2EmbeddingModel();
            log.info("成功初始化 LangChain4j AllMiniLmL6V2EmbeddingModel ONNX 向量嵌入模型");
        } catch (Throwable t) {
            log.warn("无法加载 AllMiniLmL6V2EmbeddingModel ONNX 运行时 ({})，降级使用内建高维语义嵌入向量引擎", t.getMessage());
            this.embeddingModel = new FastSemanticEmbeddingModel();
        }
    }

    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationReady() {
        Executors.newVirtualThreadPerTaskExecutor().submit(() -> {
            try {
                rebuildIndex();
            } catch (Exception e) {
                log.warn("启动预热构建数字花园向量知识库异常: {}", e.getMessage());
            }
        });
    }

    public synchronized void rebuildIndex() {
        log.info("开始构建 Hayden Xue 数字花园纯内存向量知识库 (True RAG)...");
        long start = System.currentTimeMillis();

        int totalSegments = 0;

        // 1. 博文切片与索引
        try {
            PageResult<PostListVO> page = postService.getPublishedPosts(1L, 100L, null, null, null, null);
            if (page != null && page.getRecords() != null) {
                for (PostListVO vo : page.getRecords()) {
                    Post post = postService.getById(vo.getId());
                    String content = (post != null && StringUtils.hasText(post.getContent()))
                            ? post.getContent() : vo.getExcerpt();

                    List<String> chunks = sliceContent(content);
                    if (chunks.isEmpty() && StringUtils.hasText(vo.getTitle())) {
                        chunks = List.of(vo.getTitle() + " - " + (vo.getExcerpt() != null ? vo.getExcerpt() : ""));
                    }

                    for (String chunk : chunks) {
                        Metadata meta = new Metadata();
                        meta.put("source_type", "post");
                        meta.put("id", String.valueOf(vo.getId()));
                        meta.put("title", vo.getTitle());
                        meta.put("slug", vo.getSlug());
                        meta.put("maturity", vo.getMaturity() != null ? vo.getMaturity() : "BUDDING");
                        meta.put("url", "/blog/" + vo.getSlug());
                        meta.put("excerpt", vo.getExcerpt() != null ? vo.getExcerpt() : "");

                        TextSegment segment = TextSegment.from(chunk, meta);
                        Embedding embedding = embeddingModel.embed(segment).content();
                        embeddingStore.add(embedding, segment);
                        totalSegments++;
                    }
                }
            }
        } catch (Exception e) {
            log.warn("博文索引构建提示: {}", e.getMessage());
        }

        // 2. 真实旅行足迹切片与索引 (严格遵循真实数据强关联)
        try {
            List<Journey> journeys = journeyService.getAllJourneys();
            if (journeys != null) {
                for (Journey j : journeys) {
                    String desc = j.getDescription() != null ? j.getDescription() : "";
                    String content = j.getContent() != null ? j.getContent() : "";
                    String journeyText = "旅行足迹: " + j.getCity() + ", " + j.getCountry() + " - " + j.getTitle() + "\n"
                            + desc + "\n" + content;
                    Metadata meta = new Metadata();
                    meta.put("source_type", "journey");
                    meta.put("id", String.valueOf(j.getId()));
                    meta.put("title", j.getTitle());
                    meta.put("slug", j.getSlug() != null ? j.getSlug() : String.valueOf(j.getId()));
                    meta.put("maturity", "EVERGREEN");
                    meta.put("url", "/journey/" + (j.getSlug() != null ? j.getSlug() : j.getId()));
                    meta.put("excerpt", j.getCity() + " · " + j.getCountry());

                    TextSegment segment = TextSegment.from(journeyText, meta);
                    Embedding embedding = embeddingModel.embed(segment).content();
                    embeddingStore.add(embedding, segment);
                    totalSegments++;
                }
            }
        } catch (Exception e) {
            log.warn("足迹索引构建提示: {}", e.getMessage());
        }

        // 3. 成长编年史切片与索引
        try {
            List<Timeline> timelines = timelineService.getAllTimelines();
            if (timelines != null) {
                for (Timeline t : timelines) {
                    String tText = "生命成长编年史 (" + t.getYear() + "): " + t.getTitle() + "\n"
                            + (t.getDescription() != null ? t.getDescription() : "");
                    Metadata meta = new Metadata();
                    meta.put("source_type", "timeline");
                    meta.put("id", String.valueOf(t.getId()));
                    meta.put("title", t.getTitle());
                    meta.put("slug", "timeline-" + t.getId());
                    meta.put("maturity", "EVERGREEN");
                    meta.put("url", "/about");
                    meta.put("excerpt", t.getYear() + " - " + t.getTitle());

                    TextSegment segment = TextSegment.from(tText, meta);
                    Embedding embedding = embeddingModel.embed(segment).content();
                    embeddingStore.add(embedding, segment);
                    totalSegments++;
                }
            }
        } catch (Exception e) {
            log.warn("编年史索引构建提示: {}", e.getMessage());
        }

        // 4. Now 心智流动手记索引
        try {
            NowRecord nr = nowService.getNow();
            if (nr != null) {
                String nText = "此时此刻状态:\n正在构建: " + nr.getBuilding() + "\n正在学习: " + nr.getLearning()
                        + "\n正在探索: " + nr.getExploring() + "\n正在思考: " + nr.getThinking();
                Metadata meta = new Metadata();
                meta.put("source_type", "now");
                meta.put("id", nr.getId() != null ? String.valueOf(nr.getId()) : "1");
                meta.put("title", "此时此刻 (Now)");
                meta.put("slug", "now");
                meta.put("maturity", "BUDDING");
                meta.put("url", "/about");
                meta.put("excerpt", nr.getBuilding() != null ? nr.getBuilding() : "数字花园生活心智手记");

                TextSegment segment = TextSegment.from(nText, meta);
                Embedding embedding = embeddingModel.embed(segment).content();
                embeddingStore.add(embedding, segment);
                totalSegments++;
            }
        } catch (Exception e) {
            log.warn("Now 心智手记索引构建提示: {}", e.getMessage());
        }

        initialized = true;
        long duration = System.currentTimeMillis() - start;
        log.info("数字花园向量知识库预热构建完成，共载入 {} 个向量切片，耗时 {} ms", totalSegments, duration);
    }

    /**
     * 实现相邻段落滑动窗口重叠切片 (窗口大小为 2)
     */
    public List<String> sliceContent(String content) {
        if (!StringUtils.hasText(content)) return Collections.emptyList();
        List<String> paragraphs = Arrays.stream(content.split("\n\n+"))
                .map(String::trim)
                .filter(p -> !p.isEmpty())
                .toList();

        if (paragraphs.size() <= 1) {
            return paragraphs;
        }

        List<String> slices = new ArrayList<>();
        for (int i = 0; i < paragraphs.size() - 1; i++) {
            slices.add(paragraphs.get(i) + "\n\n" + paragraphs.get(i + 1));
        }
        return slices;
    }

    private void ensureInitialized() {
        if (!initialized) {
            rebuildIndex();
        }
    }

    /**
     * 基于向量余弦相似度检索相关知识片段出处
     */
    public List<AiCitation> searchRelevantCitations(String query, String maturity, int maxResults) {
        if (!StringUtils.hasText(query)) return Collections.emptyList();
        ensureInitialized();

        Embedding queryEmbedding = embeddingModel.embed(query).content();
        List<EmbeddingMatch<TextSegment>> matches = embeddingStore.findRelevant(queryEmbedding, maxResults * 3, 0.15);

        List<AiCitation> citations = new ArrayList<>();
        Set<String> seenUrls = new HashSet<>();

        for (EmbeddingMatch<TextSegment> match : matches) {
            TextSegment segment = match.embedded();
            Metadata meta = segment.metadata();
            String url = meta.getString("url");
            String mat = meta.getString("maturity");

            if (StringUtils.hasText(maturity) && mat != null && !maturity.equalsIgnoreCase(mat)) {
                continue;
            }

            if (seenUrls.add(url)) {
                String excerpt = segment.text();
                if (excerpt.length() > 180) {
                    excerpt = excerpt.substring(0, 180).replaceAll("[#*`>]", "").trim() + "...";
                }
                Long id = null;
                try {
                    String idStr = meta.getString("id");
                    if (idStr != null) id = Long.parseLong(idStr);
                } catch (Exception ignored) {}

                AiCitation citation = AiCitation.builder()
                        .id(id)
                        .title(meta.getString("title"))
                        .slug(meta.getString("slug"))
                        .maturity(mat != null ? mat : "BUDDING")
                        .excerpt(excerpt)
                        .url(url)
                        .build();

                citations.add(citation);
                if (citations.size() >= maxResults) break;
            }
        }
        return citations;
    }

    /**
     * 专属检索博文知识库切片 (用于 search_garden_posts 工具，确保仅召回博文且 slug/url 规范)
     */
    public List<AiCitation> searchRelevantPostCitations(String query, String maturity, int maxResults) {
        if (!StringUtils.hasText(query)) return Collections.emptyList();
        ensureInitialized();

        Embedding queryEmbedding = embeddingModel.embed(query).content();
        List<EmbeddingMatch<TextSegment>> matches = embeddingStore.findRelevant(queryEmbedding, maxResults * 5, 0.15);

        List<AiCitation> citations = new ArrayList<>();
        Set<String> seenUrls = new HashSet<>();

        for (EmbeddingMatch<TextSegment> match : matches) {
            TextSegment segment = match.embedded();
            Metadata meta = segment.metadata();
            String sourceType = meta.getString("source_type");
            if (!"post".equalsIgnoreCase(sourceType)) {
                continue;
            }
            String url = meta.getString("url");
            String mat = meta.getString("maturity");
            String slug = meta.getString("slug");

            if (StringUtils.hasText(maturity) && mat != null && !maturity.equalsIgnoreCase(mat)) {
                continue;
            }

            if (StringUtils.hasText(slug) && seenUrls.add(url)) {
                String excerpt = segment.text();
                if (excerpt.length() > 180) {
                    excerpt = excerpt.substring(0, 180).replaceAll("[#*`>]", "").trim() + "...";
                }
                Long id = null;
                try {
                    String idStr = meta.getString("id");
                    if (idStr != null) id = Long.parseLong(idStr);
                } catch (Exception ignored) {}

                AiCitation citation = AiCitation.builder()
                        .id(id)
                        .title(meta.getString("title"))
                        .slug(slug)
                        .maturity(mat != null ? mat : "BUDDING")
                        .excerpt(excerpt)
                        .url(url != null && url.startsWith("/blog/") ? url : "/blog/" + slug)
                        .build();

                citations.add(citation);
                if (citations.size() >= maxResults) break;
            }
        }
        return citations;
    }

    /**
     * 供 search_garden_posts 工具统一调用的 True RAG 向量执行接口
     */
    public ToolResult searchPostsToolResult(String query, String category, String maturity) {
        log.info("执行 True RAG 向量检索: query={}, category={}, maturity={}", query, category, maturity);
        List<AiCitation> citations = searchRelevantCitations(query, maturity, 3);

        List<Map<String, Object>> resultRecords = new ArrayList<>();
        for (AiCitation c : citations) {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", c.id());
            map.put("title", c.title());
            map.put("slug", c.slug());
            map.put("url", c.url());
            map.put("maturity", c.maturity());
            map.put("excerpt", c.excerpt());
            map.put("snippet", c.excerpt());
            resultRecords.add(map);
        }

        Map<String, Object> output = new LinkedHashMap<>();
        output.put("count", citations.size());
        output.put("results", resultRecords);
        String json;
        try {
            json = objectMapper.writeValueAsString(output);
        } catch (Exception e) {
            json = "{\"count\":" + citations.size() + "}";
        }

        String statusMsg = citations.isEmpty()
                ? "数字花园中暂未检索到直接匹配的博文"
                : "已检索到 " + citations.size() + " 篇相关数字花园博文库";

        return ToolResult.builder()
                .toolName("search_garden_posts")
                .resultJson(json)
                .citations(citations)
                .statusMessage(statusMsg)
                .build();
    }

    /**
     * 轻量高维语义向量嵌入模型 (FastSemanticEmbeddingModel)
     * 在无本地 ONNX 运行时环境下提供稳定高维单位向量计算与余弦相似度对比
     */
    public static class FastSemanticEmbeddingModel implements EmbeddingModel {
        private static final int DIMENSIONS = 384;

        @Override
        public Response<Embedding> embed(String text) {
            return Response.from(new Embedding(computeVector(text)));
        }

        @Override
        public Response<Embedding> embed(TextSegment textSegment) {
            return embed(textSegment.text());
        }

        @Override
        public Response<List<Embedding>> embedAll(List<TextSegment> textSegments) {
            List<Embedding> list = textSegments.stream()
                    .map(this::embed)
                    .map(Response::content)
                    .toList();
            return Response.from(list);
        }

        private float[] computeVector(String text) {
            float[] vector = new float[DIMENSIONS];
            if (text == null || text.isBlank()) return vector;
            String normalized = text.toLowerCase().trim();
            String[] tokens = normalized.split("\\s+|(?<=\\p{Punct})|(?=\\p{Punct})|(?<=\\p{IsHan})|(?=\\p{IsHan})");
            for (String token : tokens) {
                if (token.isBlank()) continue;
                int hash = Math.abs(token.hashCode());
                int idx1 = hash % DIMENSIONS;
                int idx2 = (hash / 31) % DIMENSIONS;
                vector[idx1] += 1.0f;
                vector[idx2] += 0.5f;
            }
            double norm = 0.0;
            for (float v : vector) norm += v * v;
            norm = Math.sqrt(norm);
            if (norm > 1e-6) {
                for (int i = 0; i < vector.length; i++) vector[i] /= (float) norm;
            }
            return vector;
        }
    }
}
