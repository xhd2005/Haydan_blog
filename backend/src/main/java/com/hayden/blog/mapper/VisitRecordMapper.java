package com.hayden.blog.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.hayden.blog.entity.VisitRecord;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.util.List;
import java.util.Map;

@Mapper
public interface VisitRecordMapper extends BaseMapper<VisitRecord> {

    @Select("SELECT COUNT(*) as totalPv, COUNT(DISTINCT ip) as totalUv FROM visit_records")
    Map<String, Object> selectTotalOverview();

    @Select("SELECT COUNT(*) as todayPv, COUNT(DISTINCT ip) as todayUv FROM visit_records WHERE DATE(created_at) = CURRENT_DATE")
    Map<String, Object> selectTodayOverview();

    @Select("SELECT DATE(created_at) as visit_date, COUNT(*) as pv, COUNT(DISTINCT ip) as uv " +
            "FROM visit_records " +
            "WHERE created_at >= DATE_SUB(CURRENT_DATE, INTERVAL 6 DAY) " +
            "GROUP BY DATE(created_at) " +
            "ORDER BY visit_date ASC")
    List<Map<String, Object>> selectTrend7Days();

    @Select("SELECT CASE " +
            "WHEN referer IS NULL OR referer = '' THEN '直接访问 (Direct)' " +
            "WHEN referer LIKE '%google%' THEN 'Google' " +
            "WHEN referer LIKE '%bing%' THEN 'Bing' " +
            "WHEN referer LIKE '%baidu%' THEN '百度 (Baidu)' " +
            "WHEN referer LIKE '%github%' THEN 'GitHub' " +
            "WHEN referer LIKE '%twitter%' OR referer LIKE '%x.com%' THEN 'Twitter / X' " +
            "WHEN referer LIKE '%zhihu%' THEN '知乎 (Zhihu)' " +
            "WHEN referer LIKE '%juejin%' THEN '稀土掘金' " +
            "WHEN referer LIKE '%v2ex%' THEN 'V2EX' " +
            "WHEN referer LIKE '%weixin%' OR referer LIKE '%wechat%' THEN '微信生态' " +
            "ELSE '其他外部引流' END as source, COUNT(*) as count " +
            "FROM visit_records " +
            "GROUP BY source ORDER BY count DESC LIMIT 8")
    List<Map<String, Object>> selectTopSources();
}
