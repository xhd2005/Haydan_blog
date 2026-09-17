package com.hayden.blog.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.hayden.blog.entity.Post;
import com.hayden.blog.entity.VisitRecord;
import com.hayden.blog.mapper.CommentMapper;
import com.hayden.blog.mapper.PostMapper;
import com.hayden.blog.mapper.VisitRecordMapper;
import com.hayden.blog.service.AnalyticsService;
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

        res.put("totalPv", totalPv);
        res.put("totalUv", totalUv);
        res.put("todayPv", todayPv);
        res.put("todayUv", todayUv);
        res.put("totalPosts", totalPosts != null ? totalPosts : 0);
        res.put("totalComments", totalComments != null ? totalComments : 0);

        return res;
    }

    @Override
    public List<Map<String, Object>> getTrend7Days() {
        List<Map<String, Object>> list = visitRecordMapper.selectTrend7Days();
        Map<String, Map<String, Object>> dateMap = new HashMap<>();
        if (list != null) {
            for (Map<String, Object> item : list) {
                Object d = item.get("visit_date");
                if (d != null) {
                    dateMap.put(d.toString(), item);
                }
            }
        }

        // 真实连续 7 天时间轴平滑对齐 (无访问的日期真实归 0，严禁注入 Math.random 假数据)
        List<Map<String, Object>> result = new ArrayList<>();
        java.time.LocalDate today = java.time.LocalDate.now();
        for (int i = 6; i >= 0; i--) {
            String dateStr = today.minusDays(i).toString();
            Map<String, Object> record = dateMap.get(dateStr);
            if (record != null) {
                result.add(record);
            } else {
                Map<String, Object> emptyDay = new HashMap<>();
                emptyDay.put("visit_date", dateStr);
                emptyDay.put("pv", 0);
                emptyDay.put("uv", 0);
                result.add(emptyDay);
            }
        }
        return result;
    }

    @Override
    public List<Map<String, Object>> getTopPosts() {
        List<Post> posts = postMapper.selectList(new LambdaQueryWrapper<Post>()
                .eq(Post::getStatus, "PUBLISHED")
                .orderByDesc(Post::getViewCount)
                .last("LIMIT 10"));

        List<Map<String, Object>> result = new ArrayList<>();
        for (Post post : posts) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", post.getId());
            map.put("title", post.getTitle());
            map.put("slug", post.getSlug());
            map.put("viewCount", post.getViewCount() != null ? post.getViewCount() : 0);
            map.put("likeCount", post.getLikeCount() != null ? post.getLikeCount() : 0);
            result.add(map);
        }
        return result;
    }

    @Override
    public List<Map<String, Object>> getSources() {
        // 遵循真实数据驱动铁律：直接返回数据库聚合来源；无数据时返回空集合，严禁硬编码伪造访客渠道
        List<Map<String, Object>> sources = visitRecordMapper.selectTopSources();
        return sources != null ? sources : Collections.emptyList();
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
