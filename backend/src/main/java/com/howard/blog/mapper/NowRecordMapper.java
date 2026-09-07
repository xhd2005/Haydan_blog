package com.howard.blog.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.howard.blog.entity.NowRecord;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface NowRecordMapper extends BaseMapper<NowRecord> {
}
