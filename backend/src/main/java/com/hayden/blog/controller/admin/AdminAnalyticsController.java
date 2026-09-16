package com.hayden.blog.controller.admin;

import com.hayden.blog.common.Result;
import com.hayden.blog.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/analytics")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminAnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/overview")
    public Result<Map<String, Object>> getOverview() {
        return Result.success(analyticsService.getOverview());
    }

    @GetMapping("/trend")
    public Result<List<Map<String, Object>>> getTrend() {
        return Result.success(analyticsService.getTrend7Days());
    }

    @GetMapping("/top-posts")
    public Result<List<Map<String, Object>>> getTopPosts() {
        return Result.success(analyticsService.getTopPosts());
    }

    @GetMapping("/sources")
    public Result<List<Map<String, Object>>> getSources() {
        return Result.success(analyticsService.getSources());
    }
}
