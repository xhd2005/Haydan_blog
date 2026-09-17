package com.hayden.blog.controller;

import com.hayden.blog.annotation.AuditLog;
import com.hayden.blog.common.Result;
import com.hayden.blog.dto.FriendActivity;
import com.hayden.blog.dto.FriendApplyRequest;
import com.hayden.blog.dto.FriendCreateRequest;
import com.hayden.blog.dto.FriendInspectResult;
import com.hayden.blog.dto.FriendStatusUpdateRequest;
import com.hayden.blog.entity.Friend;
import com.hayden.blog.service.FriendService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/friends")
@RequiredArgsConstructor
public class FriendController {

    private final FriendService friendService;

    @GetMapping
    public Result<List<Friend>> getActiveFriends() {
        return Result.success(friendService.getActiveFriends());
    }

    @GetMapping("/stream")
    public Result<List<FriendActivity>> getFriendStream() {
        return Result.success(friendService.getFriendStream());
    }

    @GetMapping("/inspect")
    public Result<FriendInspectResult> inspectFriendSite(@RequestParam("url") String url) {
        return Result.success(friendService.inspectFriendSite(url));
    }

    @AuditLog(module = "友链生态", operation = "申请友链")
    @PostMapping("/apply")
    public Result<Friend> applyFriend(@Valid @RequestBody FriendApplyRequest request) {
        return Result.success(friendService.applyFriend(request));
    }

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<List<Friend>> getAllFriends() {
        return Result.success(friendService.getAllFriends());
    }

    @AuditLog(module = "友链生态", operation = "添加友链")
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Long> createFriend(@Valid @RequestBody FriendCreateRequest request) {
        return Result.success(friendService.createFriend(request));
    }

    @AuditLog(module = "友链生态", operation = "修改友链")
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Void> updateFriend(@PathVariable Long id, @Valid @RequestBody FriendCreateRequest request) {
        friendService.updateFriend(id, request);
        return Result.success();
    }

    @AuditLog(module = "友链生态", operation = "审核友链状态")
    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Void> updateFriendStatus(@PathVariable Long id, @Valid @RequestBody FriendStatusUpdateRequest request) {
        friendService.updateFriendStatus(id, request.getStatus());
        return Result.success();
    }

    @AuditLog(module = "友链生态", operation = "探测友链健康度")
    @PostMapping("/{id}/ping")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Friend> pingFriend(@PathVariable Long id) {
        return Result.success(friendService.pingFriend(id));
    }

    @AuditLog(module = "友链生态", operation = "全量探测友链健康度")
    @PostMapping("/ping-all")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<List<Friend>> pingAllFriends() {
        return Result.success(friendService.pingAllFriends());
    }

    @AuditLog(module = "友链生态", operation = "删除友链")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Void> deleteFriend(@PathVariable Long id) {
        friendService.deleteFriend(id);
        return Result.success();
    }
}
