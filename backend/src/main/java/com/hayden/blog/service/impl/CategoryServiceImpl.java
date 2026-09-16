package com.hayden.blog.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.hayden.blog.entity.Category;
import com.hayden.blog.exception.BusinessException;
import com.hayden.blog.mapper.CategoryMapper;
import com.hayden.blog.service.CategoryService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CategoryServiceImpl extends ServiceImpl<CategoryMapper, Category> implements CategoryService {

    @Override
    public List<Category> getAllCategories() {
        return list(new LambdaQueryWrapper<Category>().orderByAsc(Category::getName));
    }

    @Override
    public Category getBySlug(String slug) {
        Category category = getOne(new LambdaQueryWrapper<Category>().eq(Category::getSlug, slug));
        if (category == null) {
            throw new BusinessException(404, "分类不存在: " + slug);
        }
        return category;
    }

    @Override
    public void createCategory(Category category) {
        long count = count(new LambdaQueryWrapper<Category>().eq(Category::getSlug, category.getSlug()));
        if (count > 0) {
            throw new BusinessException(409, "分类 Slug 已存在: " + category.getSlug());
        }
        save(category);
    }

    @Override
    public void updateCategory(Long id, Category category) {
        Category existing = getById(id);
        if (existing == null) {
            throw new BusinessException(404, "分类不存在");
        }
        if (category.getSlug() != null && !category.getSlug().equals(existing.getSlug())) {
            long count = count(new LambdaQueryWrapper<Category>()
                    .eq(Category::getSlug, category.getSlug())
                    .ne(Category::getId, id));
            if (count > 0) {
                throw new BusinessException(409, "分类 Slug 已存在: " + category.getSlug());
            }
            existing.setSlug(category.getSlug());
        }
        if (category.getName() != null) existing.setName(category.getName());
        if (category.getDescription() != null) existing.setDescription(category.getDescription());
        updateById(existing);
    }

    @Override
    public void deleteCategory(Long id) {
        removeById(id);
    }
}
