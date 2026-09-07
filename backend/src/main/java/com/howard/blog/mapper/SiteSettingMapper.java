package com.howard.blog.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.howard.blog.entity.SiteSetting;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface SiteSettingMapper extends BaseMapper<SiteSetting> {
}
