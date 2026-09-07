package com.howard.blog.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.howard.blog.entity.Timeline;
import com.howard.blog.exception.BusinessException;
import com.howard.blog.mapper.TimelineMapper;
import com.howard.blog.service.TimelineService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TimelineServiceImpl extends ServiceImpl<TimelineMapper, Timeline> implements TimelineService {

    @Override
    public List<Timeline> getAllTimelines() {
        return list(new LambdaQueryWrapper<Timeline>()
                .orderByAsc(Timeline::getSortOrder)
                .orderByDesc(Timeline::getYear));
    }

    @Override
    public void createTimeline(Timeline timeline) {
        save(timeline);
    }

    @Override
    public void updateTimeline(Long id, Timeline timeline) {
        Timeline existing = getById(id);
        if (existing == null) throw new BusinessException(404, "时间线记录不存在");
        if (timeline.getYear() != null) existing.setYear(timeline.getYear());
        if (timeline.getTitle() != null) existing.setTitle(timeline.getTitle());
        if (timeline.getDescription() != null) existing.setDescription(timeline.getDescription());
        if (timeline.getSortOrder() != null) existing.setSortOrder(timeline.getSortOrder());
        updateById(existing);
    }

    @Override
    public void deleteTimeline(Long id) {
        removeById(id);
    }
}
