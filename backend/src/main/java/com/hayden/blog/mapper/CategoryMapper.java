package com.hayden.blog.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.hayden.blog.entity.Category;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface CategoryMapper extends BaseMapper<Category> {
}
