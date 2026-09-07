package com.howard.blog.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.howard.blog.common.PageResult;
import com.howard.blog.dto.PostCreateUpdateRequest;
import com.howard.blog.entity.Post;
import com.howard.blog.vo.PostDetailVO;
import com.howard.blog.vo.PostListVO;

import java.util.List;

public interface PostService extends IService<Post> {

    PageResult<PostListVO> getPublishedPosts(Long page, Long pageSize, String categorySlug, String tagSlug, String keyword, String lang);

    PageResult<PostListVO> getAdminPosts(Long page, Long pageSize, String status, String keyword);

    PageResult<PostListVO> getAdminPosts(Long page, Long pageSize, String status, String keyword, String lang);

    PostDetailVO deriveTranslation(Long id);

    PostDetailVO getPostBySlug(String slug);

    Post getPostById(Long id);

    List<PostListVO> getFeaturedPosts(int limit);

    List<PostListVO> getLatestPosts(int limit);

    Long createPost(PostCreateUpdateRequest request);

    void updatePost(Long id, PostCreateUpdateRequest request);

    void deletePost(Long id);

    void updateStatus(Long id, String status);

    void updateFeatured(Long id, Integer featured);

    void likePost(Long id);
}
