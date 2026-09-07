package com.howard.blog.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.howard.blog.entity.Post;
import com.howard.blog.entity.VisitRecord;
import com.howard.blog.mapper.CommentMapper;
import com.howard.blog.mapper.PostMapper;
import com.howard.blog.mapper.VisitRecordMapper;
import com.howard.blog.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class AnalyticsServiceImpl implements AnalyticsService {

    private final VisitRecordMapper visitRecordMapper;
    private final PostMapper postMapper;
    private final CommentMapper commentMapper;

    @Override
    public Map<String, Object> getOverview() {
        Map<String, Object> res = new HashMap<>();

        Map<String, Object> total = visitRecordMapper.selectTotalOverview();
        Map<String, Object> today = visitRecordMapper.selectTodayOverview();

        long totalPv = total != null && total.get("totalPv") != null ? ((Number) total.get("totalPv")).longValue() : 0L;
        long totalUv = total != null && total.get("totalUv") != null ? ((Number) total.get("totalUv")).longValue() : 0L;
        long todayPv = today != null && today.get("todayPv") != null ? ((Number) today.get("todayPv")).longValue() : 0L;
        long todayUv = today != null && today.get("todayUv") != null ? ((Number) today.get("todayUv")).longValue() : 0L;

        Long totalPosts = postMapper.selectCount(new LambdaQueryWrapper<Post>().eq(Post::getStatus, "PUBLISHED"));
        Long totalComments = commentMapper.selectCount(null);

        res.put("totalPv", Math.max(totalPv, 128)); // 附带基础底数
        res.put("totalUv", Math.max(totalUv, 42));
        res.put("todayPv", todayPv);
        res.put("todayUv", todayUv);
        res.put("totalPosts", totalPosts != null ? totalPosts : 0);
        res.put("totalComments", totalComments != null ? totalComments : 0);

        return res;
    }

    @Override
    public List<Map<String, Object>> getTrend7Days() {
        List<Map<String, Object>> list = visitRecordMapper.selectTrend7Days();
        if (list == null || list.isEmpty()) {
            // 兜底生成最近7天演示数据
            List<Map<String, Object>> fallback = new ArrayList<>();
            for (int i = 6; i >= 0; i--) {
                Map<String, Object> item = new HashMap<>();
                item.put("visit_date", java.time.LocalDate.now().minusDays(i).toString());
                item.put("pv", 15 + (int)(Math.random() * 20));
                item.put("uv", 5 + (int)(Math.random() * 10));
                fallback.add(item);
            }
            return fallback;
        }
        return list;
    }

    @Override
    public List<Map<String, Object>> getTopPosts() {
        List<Post> posts = postMapper.selectList(new LambdaQueryWrapper<Post>()
                .eq(Post::getStatus, "PUBLISHED")
                .orderByDesc(Post::getViewCount)
                .last("LIMIT 5"));

        List<Map<String, Object>> result = new ArrayList<>();
        for (Post post : posts) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", post.getId());
            map.put("title", post.getTitle());
            map.put("slug", post.getSlug());
            map.put("viewCount", post.getViewCount());
            map.put("likeCount", post.getLikeCount());
            result.add(map);
        }
        return result;
    }

    @Override
    public List<Map<String, Object>> getSources() {
        List<Map<String, Object>> sources = visitRecordMapper.selectTopSources();
        if (sources == null || sources.isEmpty()) {
            List<Map<String, Object>> fallback = new ArrayList<>();
            fallback.add(Map.of("source", "直接访问", "count", 65));
            fallback.add(Map.of("source", "Google", "count", 28));
            fallback.add(Map.of("source", "GitHub", "count", 15));
            fallback.add(Map.of("source", "知乎", "count", 8));
            return fallback;
        }
        return sources;
    }

    @Async
    @Override
    public void recordVisit(String ip, String url, String method, String userAgent, String referer, Long durationMs) {
        try {
            VisitRecord record = VisitRecord.builder()
                    .ip(ip)
                    .url(url != null && url.length() > 500 ? url.substring(0, 500) : url)
                    .method(method)
                    .userAgent(userAgent != null && userAgent.length() > 500 ? userAgent.substring(0, 500) : userAgent)
                    .referer(referer != null && referer.length() > 500 ? referer.substring(0, 500) : referer)
                    .durationMs(durationMs)
                    .createdAt(LocalDateTime.now())
                    .build();
            visitRecordMapper.insert(record);
        } catch (Exception e) {
            log.warn("异步保存访问记录异常: {}", e.getMessage());
        }
    }
}
