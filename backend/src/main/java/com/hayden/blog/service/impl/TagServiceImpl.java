package com.hayden.blog.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.hayden.blog.entity.Tag;
import com.hayden.blog.exception.BusinessException;
import com.hayden.blog.mapper.TagMapper;
import com.hayden.blog.service.TagService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TagServiceImpl extends ServiceImpl<TagMapper, Tag> implements TagService {

    @Override
    public List<Tag> getAllTags() {
        return list(new LambdaQueryWrapper<Tag>().orderByAsc(Tag::getName));
    }

    @Override
    public void createTag(Tag tag) {
        long count = count(new LambdaQueryWrapper<Tag>().eq(Tag::getSlug, tag.getSlug()));
        if (count > 0) {
            throw new BusinessException(409, "标签 Slug 已存在: " + tag.getSlug());
        }
        save(tag);
    }

    @Override
    public void updateTag(Long id, Tag tag) {
        Tag existing = getById(id);
        if (existing == null) {
            throw new BusinessException(404, "标签不存在");
        }
        if (tag.getSlug() != null && !tag.getSlug().equals(existing.getSlug())) {
            long count = count(new LambdaQueryWrapper<Tag>()
                    .eq(Tag::getSlug, tag.getSlug())
                    .ne(Tag::getId, id));
            if (count > 0) {
                throw new BusinessException(409, "标签 Slug 已存在: " + tag.getSlug());
            }
            existing.setSlug(tag.getSlug());
        }
        if (tag.getName() != null) existing.setName(tag.getName());
        updateById(existing);
    }

    @Override
    public void deleteTag(Long id) {
        removeById(id);
    }
}
