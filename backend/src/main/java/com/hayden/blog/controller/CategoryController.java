package com.hayden.blog.controller;

import com.hayden.blog.annotation.AuditLog;
import com.hayden.blog.common.Result;
import com.hayden.blog.entity.Category;
import com.hayden.blog.service.CategoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping
    public Result<List<Category>> getAllCategories() {
        return Result.success(categoryService.getAllCategories());
    }

    @GetMapping("/{slug}")
    public Result<Category> getBySlug(@PathVariable String slug) {
        return Result.success(categoryService.getBySlug(slug));
    }

    @AuditLog(module = "知识分类", operation = "创建分类")
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Void> createCategory(@Valid @RequestBody Category category) {
        categoryService.createCategory(category);
        return Result.success();
    }

    @AuditLog(module = "知识分类", operation = "修改分类")
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Void> updateCategory(@PathVariable Long id, @Valid @RequestBody Category category) {
        categoryService.updateCategory(id, category);
        return Result.success();
    }

    @AuditLog(module = "知识分类", operation = "删除分类")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Void> deleteCategory(@PathVariable Long id) {
        categoryService.deleteCategory(id);
        return Result.success();
    }
}
