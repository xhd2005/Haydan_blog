package com.howard.blog.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.howard.blog.common.PageResult;
import com.howard.blog.dto.JourneyCreateUpdateRequest;
import com.howard.blog.entity.Journey;
import com.howard.blog.entity.JourneyImage;
import com.howard.blog.exception.BusinessException;
import com.howard.blog.mapper.JourneyImageMapper;
import com.howard.blog.mapper.JourneyMapper;
import com.howard.blog.service.JourneyService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;

@Service
@RequiredArgsConstructor
public class JourneyServiceImpl extends ServiceImpl<JourneyMapper, Journey> implements JourneyService {

    private final JourneyImageMapper journeyImageMapper;

    @Override
    public List<Journey> getAllJourneys() {
        return list(new LambdaQueryWrapper<Journey>()
                .orderByDesc(Journey::getStartDate)
                .orderByDesc(Journey::getCreatedAt));
    }

    @Override
    public List<Journey> getLatestJourneys(int limit) {
        return list(new LambdaQueryWrapper<Journey>()
                .orderByDesc(Journey::getStartDate)
                .last("LIMIT " + limit));
    }

    @Override
    public Journey getBySlug(String slug) {
        Journey journey = getOne(new LambdaQueryWrapper<Journey>().eq(Journey::getSlug, slug));
        if (journey == null) {
            throw new BusinessException(404, "旅行记录不存在: " + slug);
        }
        return journey;
    }

    @Override
    public List<JourneyImage> getJourneyImages(Long journeyId) {
        return journeyImageMapper.selectList(new LambdaQueryWrapper<JourneyImage>()
                .eq(JourneyImage::getJourneyId, journeyId)
                .orderByAsc(JourneyImage::getSortOrder));
    }

    @Override
    public PageResult<Journey> getAdminJourneys(Long page, Long pageSize, String keyword) {
        LambdaQueryWrapper<Journey> wrapper = new LambdaQueryWrapper<>();
        if (StringUtils.hasText(keyword)) {
            wrapper.and(w -> w.like(Journey::getTitle, keyword)
                    .or().like(Journey::getCity, keyword)
                    .or().like(Journey::getCountry, keyword));
        }
        wrapper.orderByDesc(Journey::getCreatedAt);

        Page<Journey> p = page(new Page<>(page, pageSize), wrapper);
        return PageResult.of(p.getRecords(), p.getTotal(), page, pageSize);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long createJourney(JourneyCreateUpdateRequest request) {
        String slug = StringUtils.hasText(request.getSlug())
                ? request.getSlug().trim()
                : (request.getCountry() + "-" + request.getCity()).toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("^-|-$", "");

        long count = count(new LambdaQueryWrapper<Journey>().eq(Journey::getSlug, slug));
        if (count > 0) {
            slug = slug + "-" + (System.currentTimeMillis() % 10000);
        }

        Journey journey = Journey.builder()
                .title(request.getTitle())
                .slug(slug)
                .country(request.getCountry())
                .city(request.getCity())
                .description(request.getDescription())
                .content(request.getContent())
                .cover(request.getCover())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .build();

        save(journey);

        // 保存相册附图
        if (request.getImages() != null && !request.getImages().isEmpty()) {
            for (int i = 0; i < request.getImages().size(); i++) {
                JourneyCreateUpdateRequest.JourneyImageDTO img = request.getImages().get(i);
                journeyImageMapper.insert(JourneyImage.builder()
                        .journeyId(journey.getId())
                        .imageUrl(img.getImageUrl())
                        .caption(img.getCaption())
                        .sortOrder(img.getSortOrder() != null ? img.getSortOrder() : i)
                        .build());
            }
        }

        return journey.getId();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateJourney(Long id, JourneyCreateUpdateRequest request) {
        Journey existing = getById(id);
        if (existing == null) {
            throw new BusinessException(404, "旅行记录不存在");
        }

        if (StringUtils.hasText(request.getSlug()) && !request.getSlug().equals(existing.getSlug())) {
            long count = count(new LambdaQueryWrapper<Journey>()
                    .eq(Journey::getSlug, request.getSlug())
                    .ne(Journey::getId, id));
            if (count > 0) {
                throw new BusinessException(409, "旅行记录 Slug 已被占用: " + request.getSlug());
            }
            existing.setSlug(request.getSlug());
        }

        if (request.getTitle() != null) existing.setTitle(request.getTitle());
        if (request.getCountry() != null) existing.setCountry(request.getCountry());
        if (request.getCity() != null) existing.setCity(request.getCity());
        if (request.getDescription() != null) existing.setDescription(request.getDescription());
        if (request.getContent() != null) existing.setContent(request.getContent());
        if (request.getCover() != null) existing.setCover(request.getCover());
        if (request.getLatitude() != null) existing.setLatitude(request.getLatitude());
        if (request.getLongitude() != null) existing.setLongitude(request.getLongitude());
        if (request.getStartDate() != null) existing.setStartDate(request.getStartDate());
        if (request.getEndDate() != null) existing.setEndDate(request.getEndDate());

        updateById(existing);

        if (request.getImages() != null) {
            journeyImageMapper.delete(new LambdaQueryWrapper<JourneyImage>().eq(JourneyImage::getJourneyId, id));
            for (int i = 0; i < request.getImages().size(); i++) {
                JourneyCreateUpdateRequest.JourneyImageDTO img = request.getImages().get(i);
                journeyImageMapper.insert(JourneyImage.builder()
                        .journeyId(id)
                        .imageUrl(img.getImageUrl())
                        .caption(img.getCaption())
                        .sortOrder(img.getSortOrder() != null ? img.getSortOrder() : i)
                        .build());
            }
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteJourney(Long id) {
        journeyImageMapper.delete(new LambdaQueryWrapper<JourneyImage>().eq(JourneyImage::getJourneyId, id));
        removeById(id);
    }
}
