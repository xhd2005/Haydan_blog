package com.hayden.blog.controller;

import com.hayden.blog.common.PageResult;
import com.hayden.blog.common.Result;
import com.hayden.blog.dto.PostCreateUpdateRequest;
import com.hayden.blog.entity.Post;
import com.hayden.blog.service.PostService;
import com.hayden.blog.vo.PostDetailVO;
import com.hayden.blog.vo.PostListVO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;

    @GetMapping
    public Result<PageResult<PostListVO>> getPublishedPosts(
            @RequestParam(defaultValue = "1") Long page,
            @RequestParam(defaultValue = "10") Long pageSize,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String tag,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String lang,
            @RequestParam(required = false) String maturity) {
        return Result.success(postService.getPublishedPosts(page, pageSize, category, tag, keyword, lang, maturity));
    }

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<PageResult<PostListVO>> getAdminPosts(
            @RequestParam(defaultValue = "1") Long page,
            @RequestParam(defaultValue = "10") Long pageSize,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String lang) {
        return Result.success(postService.getAdminPosts(page, pageSize, status, keyword, lang));
    }

    @PostMapping("/{id}/derive-translation")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<PostDetailVO> deriveTranslation(@PathVariable Long id) {
        return Result.success(postService.deriveTranslation(id));
    }

    @GetMapping("/featured")
    public Result<List<PostListVO>> getFeaturedPosts(@RequestParam(defaultValue = "3") int limit) {
        return Result.success(postService.getFeaturedPosts(limit));
    }

    @GetMapping("/latest")
    public Result<List<PostListVO>> getLatestPosts(@RequestParam(defaultValue = "3") int limit) {
        return Result.success(postService.getLatestPosts(limit));
    }

    @GetMapping("/{slug}")
    public Result<PostDetailVO> getPostBySlug(@PathVariable String slug) {
        return Result.success(postService.getPostBySlug(slug));
    }

    @GetMapping("/id/{id}")
    public Result<Post> getPostById(@PathVariable Long id) {
        return Result.success(postService.getPostById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Long> createPost(@Valid @RequestBody PostCreateUpdateRequest request) {
        return Result.success(postService.createPost(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Void> updatePost(@PathVariable Long id, @Valid @RequestBody PostCreateUpdateRequest request) {
        postService.updatePost(id, request);
        return Result.success();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Void> deletePost(@PathVariable Long id) {
        postService.deletePost(id);
        return Result.success();
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Void> updateStatus(@PathVariable Long id, @RequestParam String status) {
        postService.updateStatus(id, status);
        return Result.success();
    }

    @PatchMapping("/{id}/featured")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Void> updateFeatured(@PathVariable Long id, @RequestParam Integer featured) {
        postService.updateFeatured(id, featured);
        return Result.success();
    }

    @PostMapping("/{id}/like")
    public Result<Void> likePost(@PathVariable Long id) {
        postService.likePost(id);
        return Result.success();
    }
}
