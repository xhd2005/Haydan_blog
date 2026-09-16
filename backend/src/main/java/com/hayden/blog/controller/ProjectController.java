package com.hayden.blog.controller;

import com.hayden.blog.common.PageResult;
import com.hayden.blog.common.Result;
import com.hayden.blog.dto.ProjectCreateUpdateRequest;
import com.hayden.blog.entity.Project;
import com.hayden.blog.service.ProjectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    @GetMapping
    public Result<List<Project>> getPublishedProjects() {
        return Result.success(projectService.getPublishedProjects());
    }

    @GetMapping("/featured")
    public Result<List<Project>> getFeaturedProjects() {
        return Result.success(projectService.getFeaturedProjects());
    }

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<PageResult<Project>> getAdminProjects(
            @RequestParam(defaultValue = "1") Long page,
            @RequestParam(defaultValue = "10") Long pageSize,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String keyword) {
        return Result.success(projectService.getAdminProjects(page, pageSize, status, keyword));
    }

    @GetMapping("/{slug}")
    public Result<Project> getBySlug(@PathVariable String slug) {
        return Result.success(projectService.getBySlug(slug));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Long> createProject(@Valid @RequestBody ProjectCreateUpdateRequest request) {
        return Result.success(projectService.createProject(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Void> updateProject(@PathVariable Long id, @Valid @RequestBody ProjectCreateUpdateRequest request) {
        projectService.updateProject(id, request);
        return Result.success();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Void> deleteProject(@PathVariable Long id) {
        projectService.deleteProject(id);
        return Result.success();
    }
}
