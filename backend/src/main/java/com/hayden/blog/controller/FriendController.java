package com.hayden.blog.controller;

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

    @PostMapping("/apply")
    public Result<Friend> applyFriend(@Valid @RequestBody FriendApplyRequest request) {
        return Result.success(friendService.applyFriend(request));
    }

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<List<Friend>> getAllFriends() {
        return Result.success(friendService.getAllFriends());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Long> createFriend(@Valid @RequestBody FriendCreateRequest request) {
        return Result.success(friendService.createFriend(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Void> updateFriend(@PathVariable Long id, @Valid @RequestBody FriendCreateRequest request) {
        friendService.updateFriend(id, request);
        return Result.success();
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Void> updateFriendStatus(@PathVariable Long id, @Valid @RequestBody FriendStatusUpdateRequest request) {
        friendService.updateFriendStatus(id, request.getStatus());
        return Result.success();
    }

    @PostMapping("/{id}/ping")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Friend> pingFriend(@PathVariable Long id) {
        return Result.success(friendService.pingFriend(id));
    }

    @PostMapping("/ping-all")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<List<Friend>> pingAllFriends() {
        return Result.success(friendService.pingAllFriends());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Void> deleteFriend(@PathVariable Long id) {
        friendService.deleteFriend(id);
        return Result.success();
    }
}
