package com.hayden.blog.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.hayden.blog.common.PageResult;
import com.hayden.blog.dto.JourneyCreateUpdateRequest;
import com.hayden.blog.entity.Journey;
import com.hayden.blog.entity.JourneyImage;

import java.util.List;

public interface JourneyService extends IService<Journey> {

    List<Journey> getAllJourneys();

    List<Journey> getLatestJourneys(int limit);

    Journey getBySlug(String slug);

    List<JourneyImage> getJourneyImages(Long journeyId);

    PageResult<Journey> getAdminJourneys(Long page, Long pageSize, String keyword);

    Long createJourney(JourneyCreateUpdateRequest request);

    void updateJourney(Long id, JourneyCreateUpdateRequest request);

    void deleteJourney(Long id);
}
