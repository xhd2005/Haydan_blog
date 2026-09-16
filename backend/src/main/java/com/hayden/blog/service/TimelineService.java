package com.hayden.blog.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.hayden.blog.entity.Timeline;

import java.util.List;

public interface TimelineService extends IService<Timeline> {

    List<Timeline> getAllTimelines();

    void createTimeline(Timeline timeline);

    void updateTimeline(Long id, Timeline timeline);

    void deleteTimeline(Long id);

    record TimelineSpan(Timeline earliest, Timeline latest, int totalCount) {}

    TimelineSpan getTimelineSpan();
}
