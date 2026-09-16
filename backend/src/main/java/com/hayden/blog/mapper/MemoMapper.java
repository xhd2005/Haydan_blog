package com.hayden.blog.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.hayden.blog.entity.Memo;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Update;

@Mapper
public interface MemoMapper extends BaseMapper<Memo> {

    @Update("UPDATE memos SET like_count = like_count + 1 WHERE id = #{id}")
    void incrementLikeCount(Long id);
}
