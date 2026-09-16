package com.hayden.blog.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.hayden.blog.entity.Journey;
import com.hayden.blog.entity.Post;
import com.hayden.blog.entity.Project;
import com.hayden.blog.mapper.JourneyMapper;
import com.hayden.blog.mapper.PostMapper;
import com.hayden.blog.mapper.ProjectMapper;
import com.hayden.blog.service.DashboardService;
import com.hayden.blog.vo.DashboardStatsVO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {

    private final PostMapper postMapper;
    private final ProjectMapper projectMapper;
    private final JourneyMapper journeyMapper;

    @Override
    public DashboardStatsVO getStats() {
        Long totalPosts = postMapper.selectCount(null);
        Long publishedPosts = postMapper.selectCount(new LambdaQueryWrapper<Post>().eq(Post::getStatus, "PUBLISHED"));
        Long draftPosts = postMapper.selectCount(new LambdaQueryWrapper<Post>().eq(Post::getStatus, "DRAFT"));

        Long totalProjects = projectMapper.selectCount(null);
        Long totalJourneys = journeyMapper.selectCount(null);

        // 统计总阅读量
        List<Post> allPosts = postMapper.selectList(new LambdaQueryWrapper<Post>().select(Post::getViewCount));
        long totalViews = allPosts.stream().mapToLong(p -> p.getViewCount() != null ? p.getViewCount() : 0L).sum();

        // 最近 5 篇文章
        List<Post> recentPosts = postMapper.selectList(new LambdaQueryWrapper<Post>()
                .orderByDesc(Post::getCreatedAt)
                .last("LIMIT 5"));

        return DashboardStatsVO.builder()
                .totalPosts(totalPosts)
                .publishedPosts(publishedPosts)
                .draftPosts(draftPosts)
                .totalProjects(totalProjects)
                .totalJourneys(totalJourneys)
                .totalViews(totalViews)
                .recentPosts(recentPosts)
                .build();
    }
}
