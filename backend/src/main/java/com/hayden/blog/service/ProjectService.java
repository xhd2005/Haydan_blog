package com.hayden.blog.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.hayden.blog.common.PageResult;
import com.hayden.blog.dto.ProjectCreateUpdateRequest;
import com.hayden.blog.entity.Project;

import java.util.List;

public interface ProjectService extends IService<Project> {

    List<Project> getPublishedProjects();

    List<Project> getFeaturedProjects();

    Project getBySlug(String slug);

    PageResult<Project> getAdminProjects(Long page, Long pageSize, String status, String keyword);

    Long createProject(ProjectCreateUpdateRequest request);

    void updateProject(Long id, ProjectCreateUpdateRequest request);

    void deleteProject(Long id);
}
