package com.hayden.blog.ai.tools;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.hayden.blog.ai.dto.AiCitation;
import com.hayden.blog.common.PageResult;
import com.hayden.blog.entity.Journey;
import com.hayden.blog.entity.NowRecord;
import com.hayden.blog.entity.Post;
import com.hayden.blog.service.JourneyService;
import com.hayden.blog.service.NowService;
import com.hayden.blog.service.PostService;
import com.hayden.blog.vo.PostListVO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.*;

/**
 * Hayden AI 四大标准 Tools / Function Calling 注册中心与执行引擎
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class GardenToolRegistry {

    private final PostService postService;
    private final NowService nowService;
    private final JourneyService journeyService;
    private final com.hayden.blog.ai.rag.GardenKnowledgeBase gardenKnowledgeBase;
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Java 25 封闭阶层与模式匹配解构 (Record Patterns)
     */
    public ToolResult execute(GardenTool tool) {
        if (tool == null) {
            return ToolResult.builder()
                    .toolName("unknown")
                    .resultJson("{\"error\":\"Tool cannot be null\"}")
                    .statusMessage("工具指令为空")
                    .build();
        }
        return switch (tool) {
            case GardenTool.SearchGardenPostsTool(var query, var category, var maturity) ->
                executeSearchGardenPosts(query, category, maturity);
            case GardenTool.GetHaydenStatusTool() ->
                executeGetHaydenStatus();
            case GardenTool.NavigateSiteTool(var path, var reason) ->
                executeNavigateSite(path, reason);
            case GardenTool.SwitchThemeTool(var theme) ->
                executeSwitchTheme(theme);
        };
    }

    /**
     * 生成符合 OpenAI 规范的 tools JSON 声明列表
     */
    public ArrayNode getOpenAiToolsSchema() {
        ArrayNode tools = objectMapper.createArrayNode();

        // 1. search_garden_posts
        ObjectNode toolSearch = tools.addObject();
        toolSearch.put("type", "function");
        ObjectNode fnSearch = toolSearch.putObject("function");
        fnSearch.put("name", "search_garden_posts");
        fnSearch.put("description", "搜索站长 Hayden Xue 数字花园中的博文知识库。当读者询问专业技术方案（如 Java 21、虚拟线程、Spring Boot 3、Next.js 14、Three.js、WebGL 等）、系统架构原理、博文内容或数字花园理念时，调用此工具获取博文段落切片与出处。");
        ObjectNode paramSearch = fnSearch.putObject("parameters");
        paramSearch.put("type", "object");
        ObjectNode propsSearch = paramSearch.putObject("properties");
        ObjectNode queryProp = propsSearch.putObject("query");
        queryProp.put("type", "string");
        queryProp.put("description", "检索关键词，如 '虚拟线程'、'Three.js'、'Spring Boot'、'数字花园'");
        ObjectNode categoryProp = propsSearch.putObject("category");
        categoryProp.put("type", "string");
        categoryProp.put("description", "可选的分类 Slug 或分类名称");
        ObjectNode maturityProp = propsSearch.putObject("maturity");
        maturityProp.put("type", "string");
        maturityProp.put("description", "可选的思想成熟度：SEEDLING(萌芽🌱), BUDDING(生长🌿), EVERGREEN(常青🌲)");
        ArrayNode maturityEnum = maturityProp.putArray("enum");
        maturityEnum.add("SEEDLING").add("BUDDING").add("EVERGREEN");
        ArrayNode reqSearch = paramSearch.putArray("required");
        reqSearch.add("query");

        // 2. get_hayden_status
        ObjectNode toolStatus = tools.addObject();
        toolStatus.put("type", "function");
        ObjectNode fnStatus = toolStatus.putObject("function");
        fnStatus.put("name", "get_hayden_status");
        fnStatus.put("description", "获取站长 Hayden Xue 此时此刻 (Now) 的实时心跳状态（正在构建、正在学习、正在探索、正在思考）以及近期旅行足迹 (Journeys) 与城市坐标。");
        ObjectNode paramStatus = fnStatus.putObject("parameters");
        paramStatus.put("type", "object");
        paramStatus.putObject("properties");

        // 3. navigate_site
        ObjectNode toolNav = tools.addObject();
        toolNav.put("type", "function");
        ObjectNode fnNav = toolNav.putObject("function");
        fnNav.put("name", "navigate_site");
        fnNav.put("description", "当读者明确表达想要访问站点的特定页面、模块或博文时，引导读者前端页面跳转。");
        ObjectNode paramNav = fnNav.putObject("parameters");
        paramNav.put("type", "object");
        ObjectNode propsNav = paramNav.putObject("properties");
        ObjectNode pathProp = propsNav.putObject("path");
        pathProp.put("type", "string");
        pathProp.put("description", "目标路由，如 '/' (首页), '/blog' (博文库), '/projects' (项目), '/journey' (旅行足迹), '/now' (此时此刻), '/about' (关于), '/links' (友链), '/memos' (随记)");
        ObjectNode reasonProp = propsNav.putObject("reason");
        reasonProp.put("type", "string");
        reasonProp.put("description", "跳转推荐理由");
        ArrayNode reqNav = paramNav.putArray("required");
        reqNav.add("path");

        // 4. switch_theme
        ObjectNode toolTheme = tools.addObject();
        toolTheme.put("type", "function");
        ObjectNode fnTheme = toolTheme.putObject("function");
        fnTheme.put("name", "switch_theme");
        fnTheme.put("description", "当读者提出切换网站明暗视觉模式（深色曜石模式、浅色高定白瓷模式）时调用此工具。");
        ObjectNode paramTheme = fnTheme.putObject("parameters");
        paramTheme.put("type", "object");
        ObjectNode propsTheme = paramTheme.putObject("properties");
        ObjectNode themeProp = propsTheme.putObject("theme");
        themeProp.put("type", "string");
        themeProp.put("description", "目标视觉主题：dark (深曜石暗黑), light (高定白瓷明亮), system (跟随系统)");
        ArrayNode themeEnum = themeProp.putArray("enum");
        themeEnum.add("dark").add("light").add("system");
        ArrayNode reqTheme = paramTheme.putArray("required");
        reqTheme.add("theme");

        return tools;
    }

    /**
     * 统一工具执行入口
     */
    public ToolResult executeTool(String toolName, String argumentsJson) {
        try {
            JsonNode args = StringUtils.hasText(argumentsJson) ? objectMapper.readTree(argumentsJson) : objectMapper.createObjectNode();
            return switch (toolName) {
                case "search_garden_posts" -> {
                    String query = args.hasNonNull("query") ? args.get("query").asText() :
                            (args.hasNonNull("keyword") ? args.get("keyword").asText() : "");
                    String category = args.hasNonNull("category") ? args.get("category").asText() : null;
                    String maturity = args.hasNonNull("maturity") ? args.get("maturity").asText() : null;
                    yield executeSearchGardenPosts(query, category, maturity);
                }
                case "get_hayden_status" -> executeGetHaydenStatus();
                case "navigate_site" -> {
                    String path = args.hasNonNull("path") ? args.get("path").asText() :
                            (args.hasNonNull("route") ? args.get("route").asText() : "/");
                    String reason = args.hasNonNull("reason") ? args.get("reason").asText() : "根据您的需要导航至此页面";
                    yield executeNavigateSite(path, reason);
                }
                case "switch_theme" -> {
                    String theme = args.hasNonNull("theme") ? args.get("theme").asText() :
                            (args.hasNonNull("mode") ? args.get("mode").asText() : "system");
                    yield executeSwitchTheme(theme);
                }
                default -> ToolResult.builder()
                        .toolName(toolName)
                        .resultJson("{\"error\":\"Unknown tool name: " + toolName + "\"}")
                        .statusMessage("未知工具: " + toolName)
                        .build();
            };
        } catch (Exception e) {
            log.error("执行工具 {} 发生异常", toolName, e);
            return ToolResult.builder()
                    .toolName(toolName)
                    .resultJson("{\"error\":\"" + e.getMessage() + "\"}")
                    .statusMessage("工具执行异常: " + e.getMessage())
                    .build();
        }
    }

    /**
     * 工具 1：search_garden_posts 全站数字花园博文全文语义检索
     */
    public ToolResult executeSearchGardenPosts(String query, String category, String maturity) {
        log.info("执行 search_garden_posts 检索: query={}, category={}, maturity={}", query, category, maturity);
        List<AiCitation> citations = new ArrayList<>();
        List<Map<String, Object>> resultRecords = new ArrayList<>();

        // 优先使用 LangChain4j 内存向量知识库进行 True RAG 语义相似度召回
        try {
            if (gardenKnowledgeBase != null && StringUtils.hasText(query)) {
                List<AiCitation> ragCitations = gardenKnowledgeBase.searchRelevantPostCitations(query, maturity, 3);
                if (ragCitations != null && !ragCitations.isEmpty()) {
                    citations.addAll(ragCitations);
                    for (AiCitation c : ragCitations) {
                        Map<String, Object> rm = new LinkedHashMap<>();
                        rm.put("id", c.id());
                        rm.put("title", c.title());
                        rm.put("slug", c.slug());
                        rm.put("url", c.url());
                        rm.put("maturity", c.maturity());
                        rm.put("excerpt", c.excerpt());
                        rm.put("snippet", c.excerpt());
                        resultRecords.add(rm);
                    }
                }
            }
        } catch (Exception e) {
            log.warn("向量知识库 RAG 语义检索异常，平滑降级到数据库检索: {}", e.getMessage());
        }

        if (citations.isEmpty()) {
            try {
                PageResult<PostListVO> pageResult = postService.getPublishedPosts(1L, 10L, category, null, query, null);
                List<PostListVO> records = pageResult.getRecords();

                // 若带关键词没搜出内容，做一次宽松检索取最新的几篇博文，以便始终具备上下文
                if (records == null || records.isEmpty()) {
                    pageResult = postService.getPublishedPosts(1L, 5L, null, null, null, null);
                    records = pageResult.getRecords();
                }

                if (records != null) {
                    for (PostListVO vo : records) {
                        // 成熟度过滤（如果指定了 maturity）
                        if (StringUtils.hasText(maturity) && !maturity.equalsIgnoreCase(vo.getMaturity())) {
                            continue;
                        }

                        // 检索段落正文提取 snippet
                        String snippet = vo.getExcerpt();
                        try {
                            Post fullPost = postService.getById(vo.getId());
                            if (fullPost != null && StringUtils.hasText(fullPost.getContent())) {
                                String content = fullPost.getContent();
                                if (StringUtils.hasText(query) && content.toLowerCase().contains(query.toLowerCase())) {
                                    int idx = content.toLowerCase().indexOf(query.toLowerCase());
                                    int start = Math.max(0, idx - 60);
                                    int end = Math.min(content.length(), idx + 180);
                                    snippet = (start > 0 ? "... " : "") + content.substring(start, end).replaceAll("[#*`>]", "").trim() + (end < content.length() ? " ..." : "");
                                }
                            }
                        } catch (Exception ignored) {}

                        AiCitation citation = AiCitation.builder()
                                .id(vo.getId())
                                .title(vo.getTitle())
                                .slug(vo.getSlug())
                                .maturity(vo.getMaturity())
                                .excerpt(snippet)
                                .url("/blog/" + vo.getSlug())
                                .build();

                        citations.add(citation);

                        Map<String, Object> recordMap = new LinkedHashMap<>();
                        recordMap.put("id", vo.getId());
                        recordMap.put("title", vo.getTitle());
                        recordMap.put("slug", vo.getSlug());
                        recordMap.put("url", "/blog/" + vo.getSlug());
                        recordMap.put("maturity", vo.getMaturity());
                        recordMap.put("excerpt", vo.getExcerpt());
                        recordMap.put("snippet", snippet);
                        resultRecords.add(recordMap);

                        if (citations.size() >= 3) {
                            break;
                        }
                    }
                }
            } catch (Exception e) {
                log.warn("检索博文知识库失败: {}", e.getMessage());
            }
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
     * 工具 2：get_hayden_status 聚合站长此时此刻 (Now) 状态与足迹
     */
    public ToolResult executeGetHaydenStatus() {
        log.info("执行 get_hayden_status 状态获取");
        Map<String, Object> data = new LinkedHashMap<>();

        NowRecord now = null;
        try {
            now = nowService.getNow();
        } catch (Exception e) {
            log.warn("获取 Now 记录失败: {}", e.getMessage());
        }

        List<Journey> journeys = Collections.emptyList();
        try {
            journeys = journeyService.getLatestJourneys(3);
        } catch (Exception e) {
            log.warn("获取最新足迹失败: {}", e.getMessage());
        }

        Map<String, Object> nowMap = new LinkedHashMap<>();
        nowMap.put("building", now != null && StringUtils.hasText(now.getBuilding()) ? now.getBuilding() : "个人博客与数字花园系统 3.0 (Java 21 + Next.js 14 + WebGL)");
        nowMap.put("learning", now != null && StringUtils.hasText(now.getLearning()) ? now.getLearning() : "深入研究 Java 21 虚拟线程 (Project Loom) 调度原理与高并发性能调优");
        nowMap.put("exploring", now != null && StringUtils.hasText(now.getExploring()) ? now.getExploring() : "Three.js 3D 空间交互设计与流体粒子引力拓扑星系");
        nowMap.put("thinking", now != null && StringUtils.hasText(now.getThinking()) ? now.getThinking() : "数字花园如何成为抵御信息熵增的长期心智复利外脑");
        nowMap.put("updatedAt", now != null && now.getUpdatedAt() != null ? now.getUpdatedAt().toString() : "近期");

        List<Map<String, Object>> journeyList = new ArrayList<>();
        if (journeys != null) {
            for (Journey j : journeys) {
                Map<String, Object> jm = new LinkedHashMap<>();
                jm.put("city", j.getCity());
                jm.put("country", j.getCountry());
                jm.put("title", j.getTitle());
                jm.put("description", j.getDescription());
                jm.put("latitude", j.getLatitude());
                jm.put("longitude", j.getLongitude());
                journeyList.add(jm);
            }
        }

        data.put("motto", "From the East, toward the unknown.");
        data.put("now", nowMap);
        data.put("recentJourneys", journeyList);
        data.put("currentLocation", !journeyList.isEmpty() ? journeyList.get(0).get("city") : "上海 / 中国");

        String json;
        try {
            json = objectMapper.writeValueAsString(data);
        } catch (Exception e) {
            json = "{}";
        }

        return ToolResult.builder()
                .toolName("get_hayden_status")
                .resultJson(json)
                .statusMessage("已成功同步 Hayden 此时此刻状态与最新足迹")
                .build();
    }

    /**
     * 工具 3：navigate_site 引导读者直达指定前台路由
     */
    public ToolResult executeNavigateSite(String path, String reason) {
        log.info("执行 navigate_site: path={}, reason={}", path, reason);
        String targetRoute = StringUtils.hasText(path) ? path.trim() : "/";
        if (!targetRoute.startsWith("/")) {
            targetRoute = "/" + targetRoute;
        }

        Map<String, Object> action = new LinkedHashMap<>();
        action.put("action", "navigate_site");
        action.put("route", targetRoute);
        action.put("reason", StringUtils.hasText(reason) ? reason : "前往页面");

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("success", true);
        result.put("route", targetRoute);
        result.put("reason", action.get("reason"));

        String json;
        try {
            json = objectMapper.writeValueAsString(result);
        } catch (Exception e) {
            json = "{\"route\":\"" + targetRoute + "\"}";
        }

        return ToolResult.builder()
                .toolName("navigate_site")
                .resultJson(json)
                .action(action)
                .statusMessage("已生成前往 " + targetRoute + " 的导航指令")
                .build();
    }

    /**
     * 工具 4：switch_theme 切换站点明暗主题
     */
    public ToolResult executeSwitchTheme(String theme) {
        log.info("执行 switch_theme: theme={}", theme);
        String targetTheme = "system";
        if (StringUtils.hasText(theme)) {
            String lower = theme.trim().toLowerCase();
            if (lower.contains("dark") || lower.contains("深") || lower.contains("暗") || lower.contains("黑")) {
                targetTheme = "dark";
            } else if (lower.contains("light") || lower.contains("浅") || lower.contains("白") || lower.contains("明")) {
                targetTheme = "light";
            }
        }

        Map<String, Object> action = new LinkedHashMap<>();
        action.put("action", "switch_theme");
        action.put("theme", targetTheme);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("success", true);
        result.put("theme", targetTheme);

        String json;
        try {
            json = objectMapper.writeValueAsString(result);
        } catch (Exception e) {
            json = "{\"theme\":\"" + targetTheme + "\"}";
        }

        String modeName = "dark".equals(targetTheme) ? "深曜石暗黑" : ("light".equals(targetTheme) ? "高定白瓷明亮" : "跟随系统");

        return ToolResult.builder()
                .toolName("switch_theme")
                .resultJson(json)
                .action(action)
                .statusMessage("已成功切换为 " + modeName + " 模式")
                .build();
    }
}
