package com.hayden.blog.controller;

import com.hayden.blog.annotation.AuditLog;
import com.hayden.blog.common.PageResult;
import com.hayden.blog.common.Result;
import com.hayden.blog.dto.MemoCreateRequest;
import com.hayden.blog.entity.Memo;
import com.hayden.blog.service.MemoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/memos")
@RequiredArgsConstructor
public class MemoController {

    private final MemoService memoService;

    @GetMapping
    public Result<PageResult<Memo>> getMemos(
            @RequestParam(defaultValue = "1") Long page,
            @RequestParam(defaultValue = "15") Long pageSize) {
        return Result.success(memoService.getMemos(page, pageSize));
    }

    @AuditLog(module = "随记闪念", operation = "发布随记")
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Long> createMemo(@Valid @RequestBody MemoCreateRequest request) {
        return Result.success(memoService.createMemo(request));
    }

    @AuditLog(module = "随记闪念", operation = "删除随记")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Void> deleteMemo(@PathVariable Long id) {
        memoService.deleteMemo(id);
        return Result.success();
    }

    @AuditLog(module = "随记闪念", operation = "点赞随记")
    @PostMapping("/{id}/like")
    public Result<Void> likeMemo(@PathVariable Long id) {
        memoService.likeMemo(id);
        return Result.success();
    }

    @AuditLog(module = "随记闪念", operation = "切换置顶状态")
    @PatchMapping("/{id}/pin")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Void> togglePin(@PathVariable Long id) {
        memoService.togglePin(id);
        return Result.success();
    }
}
