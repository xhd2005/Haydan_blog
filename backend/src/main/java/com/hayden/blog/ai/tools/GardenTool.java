package com.hayden.blog.ai.tools;

/**
 * Java 25 Sealed Interface: 封闭的数字花园 AI 工具阶层
 * 支持模式匹配解构与编译器分支穷尽性校验
 */
public sealed interface GardenTool permits
        GardenTool.SearchGardenPostsTool,
        GardenTool.GetHaydenStatusTool,
        GardenTool.NavigateSiteTool,
        GardenTool.SwitchThemeTool {

    record SearchGardenPostsTool(String query, String category, String maturity) implements GardenTool {}

    record GetHaydenStatusTool() implements GardenTool {}

    record NavigateSiteTool(String path, String reason) implements GardenTool {}

    record SwitchThemeTool(String theme) implements GardenTool {}
}
