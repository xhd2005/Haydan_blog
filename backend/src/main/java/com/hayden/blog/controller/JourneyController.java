package com.hayden.blog.controller;

import com.hayden.blog.common.PageResult;
import com.hayden.blog.common.Result;
import com.hayden.blog.dto.JourneyCreateUpdateRequest;
import com.hayden.blog.entity.Journey;
import com.hayden.blog.entity.JourneyImage;
import com.hayden.blog.service.JourneyService;
import jakarta.validation.Valid;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/journey")
@RequiredArgsConstructor
public class JourneyController {

    private final JourneyService journeyService;

    @GetMapping
    public Result<List<Journey>> getAllJourneys() {
        return Result.success(journeyService.getAllJourneys());
    }

    @GetMapping("/latest")
    public Result<List<Journey>> getLatestJourneys(@RequestParam(defaultValue = "3") int limit) {
        return Result.success(journeyService.getLatestJourneys(limit));
    }

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<PageResult<Journey>> getAdminJourneys(
            @RequestParam(defaultValue = "1") Long page,
            @RequestParam(defaultValue = "10") Long pageSize,
            @RequestParam(required = false) String keyword) {
        return Result.success(journeyService.getAdminJourneys(page, pageSize, keyword));
    }

    @GetMapping("/{slug}")
    public Result<JourneyDetailVO> getBySlug(@PathVariable String slug) {
        Journey journey = journeyService.getBySlug(slug);
        List<JourneyImage> images = journeyService.getJourneyImages(journey.getId());
        return Result.success(JourneyDetailVO.builder()
                .journey(journey)
                .images(images)
                .build());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Long> createJourney(@Valid @RequestBody JourneyCreateUpdateRequest request) {
        return Result.success(journeyService.createJourney(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Void> updateJourney(@PathVariable Long id, @Valid @RequestBody JourneyCreateUpdateRequest request) {
        journeyService.updateJourney(id, request);
        return Result.success();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Void> deleteJourney(@PathVariable Long id) {
        journeyService.deleteJourney(id);
        return Result.success();
    }

    @Data
    @Builder
    public static class JourneyDetailVO {
        private Journey journey;
        private List<JourneyImage> images;
    }
}
