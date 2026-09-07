package com.howard.blog.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.howard.blog.entity.AuditLog;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface AuditLogMapper extends BaseMapper<AuditLog> {
}
