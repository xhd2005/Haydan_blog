package com.hayden.blog.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.hayden.blog.entity.Post;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Update;

@Mapper
public interface PostMapper extends BaseMapper<Post> {

    @Update("UPDATE posts SET view_count = COALESCE(view_count, 0) + 1 WHERE id = #{id}")
    void incrementViewCount(Long id);

    @Update("UPDATE posts SET like_count = COALESCE(like_count, 0) + 1 WHERE id = #{id}")
    void incrementLikeCount(Long id);
}
