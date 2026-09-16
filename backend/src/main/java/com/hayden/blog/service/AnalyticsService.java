package com.hayden.blog.service;

import java.util.List;
import java.util.Map;

public interface AnalyticsService {

    Map<String, Object> getOverview();

    List<Map<String, Object>> getTrend7Days();

    List<Map<String, Object>> getTopPosts();

    List<Map<String, Object>> getSources();

    void recordVisit(String ip, String url, String method, String userAgent, String referer, Long durationMs);
}
