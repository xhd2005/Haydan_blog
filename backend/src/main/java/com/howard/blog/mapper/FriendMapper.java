package com.howard.blog.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.howard.blog.entity.Friend;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface FriendMapper extends BaseMapper<Friend> {
}
