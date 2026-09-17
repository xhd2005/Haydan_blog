package com.hayden.blog.controller;

import com.hayden.blog.annotation.AuditLog;
import com.hayden.blog.common.Result;
import com.hayden.blog.entity.Tag;
import com.hayden.blog.service.TagService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tags")
@RequiredArgsConstructor
public class TagController {

    private final TagService tagService;

    @GetMapping
    public Result<List<Tag>> getAllTags() {
        return Result.success(tagService.getAllTags());
    }

    @AuditLog(module = "知识标签", operation = "创建标签")
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Void> createTag(@Valid @RequestBody Tag tag) {
        tagService.createTag(tag);
        return Result.success();
    }

    @AuditLog(module = "知识标签", operation = "修改标签")
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Void> updateTag(@PathVariable Long id, @Valid @RequestBody Tag tag) {
        tagService.updateTag(id, tag);
        return Result.success();
    }

    @AuditLog(module = "知识标签", operation = "删除标签")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Void> deleteTag(@PathVariable Long id) {
        tagService.deleteTag(id);
        return Result.success();
    }
}
