package com.hayden.blog.ai.tools;

import dev.langchain4j.agent.tool.P;
import dev.langchain4j.agent.tool.Tool;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * Hayden AI LangChain4j 声明式工具注册 (@Tool)
 * 适配四大标准工具，桥接 GardenToolRegistry 与 Java 25 模式匹配分发
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class GardenTools {

    private final GardenToolRegistry registry;

    @Tool("搜索站长 Hayden Xue 数字花园中的博文知识库。当读者询问专业技术方案（如 Java 25、虚拟线程、Spring Boot 3、Next.js 14、Three.js、WebGL 等）、系统架构原理、博文内容或数字花园理念时，调用此工具获取博文段落切片与出处。")
    public String searchGardenPosts(
            @P("检索关键词，如 '虚拟线程'、'Three.js'、'Spring Boot'、'数字花园'") String query,
            @P("可选的分类 Slug 或分类名称") String category,
            @P("可选的思想成熟度：SEEDLING(萌芽🌱), BUDDING(生长🌿), EVERGREEN(常青🌲)") String maturity
    ) {
        log.info("LangChain4j @Tool 调用: searchGardenPosts(query={}, category={}, maturity={})", query, category, maturity);
        ToolResult result = registry.execute(new GardenTool.SearchGardenPostsTool(query, category, maturity));
        return result.getResultJson();
    }

    @Tool("获取站长 Hayden Xue 此时此刻 (Now) 的实时心跳状态（正在构建、正在学习、正在探索、正在思考）以及近期旅行足迹 (Journeys) 与城市坐标。")
    public String getHaydenStatus() {
        log.info("LangChain4j @Tool 调用: getHaydenStatus()");
        ToolResult result = registry.execute(new GardenTool.GetHaydenStatusTool());
        return result.getResultJson();
    }

    @Tool("当读者明确表达想要访问站点的特定页面、模块或博文时，引导读者前端页面跳转。")
    public String navigateSite(
            @P("目标路由，如 '/' (首页), '/blog' (博文库), '/projects' (项目), '/journey' (旅行足迹), '/now' (此时此刻), '/about' (关于), '/links' (友链)") String path,
            @P("跳转推荐理由") String reason
    ) {
        log.info("LangChain4j @Tool 调用: navigateSite(path={}, reason={})", path, reason);
        ToolResult result = registry.execute(new GardenTool.NavigateSiteTool(path, reason));
        return result.getResultJson();
    }

    @Tool("当读者提出切换网站明暗视觉模式（深色曜石模式、浅色高定白瓷模式）时调用此工具。")
    public String switchTheme(
            @P("目标视觉主题：dark (深曜石暗黑), light (高定白瓷明亮), system (跟随系统)") String theme
    ) {
        log.info("LangChain4j @Tool 调用: switchTheme(theme={})", theme);
        ToolResult result = registry.execute(new GardenTool.SwitchThemeTool(theme));
        return result.getResultJson();
    }
}
