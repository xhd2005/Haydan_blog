package com.howard.blog.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.howard.blog.entity.PostTag;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface PostTagMapper extends BaseMapper<PostTag> {

    @Select("SELECT tag_id FROM post_tags WHERE post_id = #{postId}")
    List<Long> selectTagIdsByPostId(Long postId);

    @Delete("DELETE FROM post_tags WHERE post_id = #{postId}")
    int deleteByPostId(Long postId);
}
