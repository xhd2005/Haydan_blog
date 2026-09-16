package com.hayden.blog.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.hayden.blog.entity.Tag;

import java.util.List;

public interface TagService extends IService<Tag> {
    List<Tag> getAllTags();
    void createTag(Tag tag);
    void updateTag(Long id, Tag tag);
    void deleteTag(Long id);
}
