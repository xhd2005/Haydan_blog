package com.howard.blog.controller;

import com.howard.blog.common.Result;
import com.howard.blog.entity.Timeline;
import com.howard.blog.service.TimelineService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/timeline")
@RequiredArgsConstructor
public class TimelineController {

    private final TimelineService timelineService;

    @GetMapping
    public Result<List<Timeline>> getAllTimelines() {
        return Result.success(timelineService.getAllTimelines());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Void> createTimeline(@Valid @RequestBody Timeline timeline) {
        timelineService.createTimeline(timeline);
        return Result.success();
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Void> updateTimeline(@PathVariable Long id, @Valid @RequestBody Timeline timeline) {
        timelineService.updateTimeline(id, timeline);
        return Result.success();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Void> deleteTimeline(@PathVariable Long id) {
        timelineService.deleteTimeline(id);
        return Result.success();
    }
}
