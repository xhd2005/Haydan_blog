package com.howard.blog.controller;

import com.howard.blog.common.Result;
import com.howard.blog.dto.NowUpdateRequest;
import com.howard.blog.entity.NowRecord;
import com.howard.blog.service.NowService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/now")
@RequiredArgsConstructor
public class NowController {

    private final NowService nowService;

    @GetMapping
    public Result<NowRecord> getNow() {
        return Result.success(nowService.getNow());
    }

    @PutMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Void> updateNow(@RequestBody NowUpdateRequest request) {
        nowService.updateNow(request);
        return Result.success();
    }
}
