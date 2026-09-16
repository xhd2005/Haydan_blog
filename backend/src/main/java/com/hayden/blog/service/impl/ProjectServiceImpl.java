package com.hayden.blog.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.hayden.blog.common.PageResult;
import com.hayden.blog.dto.ProjectCreateUpdateRequest;
import com.hayden.blog.entity.Project;
import com.hayden.blog.exception.BusinessException;
import com.hayden.blog.mapper.ProjectMapper;
import com.hayden.blog.service.ProjectService;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.List;

@Service
public class ProjectServiceImpl extends ServiceImpl<ProjectMapper, Project> implements ProjectService {

    @Override
    public List<Project> getPublishedProjects() {
        return list(new LambdaQueryWrapper<Project>()
                .ne(Project::getStatus, "ARCHIVED")
                .orderByDesc(Project::getFeatured)
                .orderByDesc(Project::getStartDate)
                .orderByDesc(Project::getCreatedAt));
    }

    @Override
    public List<Project> getFeaturedProjects() {
        return list(new LambdaQueryWrapper<Project>()
                .eq(Project::getFeatured, 1)
                .ne(Project::getStatus, "ARCHIVED")
                .orderByDesc(Project::getStartDate)
                .last("LIMIT 4"));
    }

    @Override
    public Project getBySlug(String slug) {
        Project project = getOne(new LambdaQueryWrapper<Project>().eq(Project::getSlug, slug));
        if (project == null) {
            throw new BusinessException(404, "项目不存在: " + slug);
        }
        return project;
    }

    @Override
    public PageResult<Project> getAdminProjects(Long page, Long pageSize, String status, String keyword) {
        LambdaQueryWrapper<Project> wrapper = new LambdaQueryWrapper<>();

        if (StringUtils.hasText(status)) {
            wrapper.eq(Project::getStatus, status.toUpperCase());
        }

        if (StringUtils.hasText(keyword)) {
            wrapper.and(w -> w.like(Project::getName, keyword)
                    .or().like(Project::getDescription, keyword)
                    .or().like(Project::getTechnologies, keyword));
        }

        wrapper.orderByDesc(Project::getCreatedAt);

        Page<Project> projectPage = page(new Page<>(page, pageSize), wrapper);
        return PageResult.of(projectPage.getRecords(), projectPage.getTotal(), page, pageSize);
    }

    @Override
    public Long createProject(ProjectCreateUpdateRequest request) {
        String slug = StringUtils.hasText(request.getSlug())
                ? request.getSlug().trim()
                : request.getName().toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("^-|-$", "");

        long count = count(new LambdaQueryWrapper<Project>().eq(Project::getSlug, slug));
        if (count > 0) {
            slug = slug + "-" + (System.currentTimeMillis() % 10000);
        }

        Project project = Project.builder()
                .name(request.getName())
                .slug(slug)
                .description(request.getDescription())
                .content(request.getContent())
                .cover(request.getCover())
                .technologies(request.getTechnologies())
                .githubUrl(request.getGithubUrl())
                .demoUrl(request.getDemoUrl())
                .featured(request.getFeatured() != null ? request.getFeatured() : 0)
                .status(StringUtils.hasText(request.getStatus()) ? request.getStatus().toUpperCase() : "PLANNING")
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .build();

        save(project);
        return project.getId();
    }

    @Override
    public void updateProject(Long id, ProjectCreateUpdateRequest request) {
        Project existing = getById(id);
        if (existing == null) {
            throw new BusinessException(404, "项目不存在");
        }

        if (StringUtils.hasText(request.getSlug()) && !request.getSlug().equals(existing.getSlug())) {
            long count = count(new LambdaQueryWrapper<Project>()
                    .eq(Project::getSlug, request.getSlug())
                    .ne(Project::getId, id));
            if (count > 0) {
                throw new BusinessException(409, "项目 Slug 已被占用: " + request.getSlug());
            }
            existing.setSlug(request.getSlug());
        }

        if (request.getName() != null) existing.setName(request.getName());
        if (request.getDescription() != null) existing.setDescription(request.getDescription());
        if (request.getContent() != null) existing.setContent(request.getContent());
        if (request.getCover() != null) existing.setCover(request.getCover());
        if (request.getTechnologies() != null) existing.setTechnologies(request.getTechnologies());
        if (request.getGithubUrl() != null) existing.setGithubUrl(request.getGithubUrl());
        if (request.getDemoUrl() != null) existing.setDemoUrl(request.getDemoUrl());
        if (request.getFeatured() != null) existing.setFeatured(request.getFeatured());
        if (request.getStatus() != null) existing.setStatus(request.getStatus().toUpperCase());
        if (request.getStartDate() != null) existing.setStartDate(request.getStartDate());
        if (request.getEndDate() != null) existing.setEndDate(request.getEndDate());

        updateById(existing);
    }

    @Override
    public void deleteProject(Long id) {
        removeById(id);
    }
}
