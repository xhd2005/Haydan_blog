package com.howard.blog.vo;

import com.howard.blog.entity.Post;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsVO {

    private Long totalPosts;
    private Long publishedPosts;
    private Long draftPosts;
    private Long totalProjects;
    private Long totalJourneys;
    private Long totalViews;
    private List<Post> recentPosts;
}
