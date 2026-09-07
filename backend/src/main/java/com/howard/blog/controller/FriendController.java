package com.howard.blog.controller;

import com.howard.blog.common.Result;
import com.howard.blog.dto.FriendCreateRequest;
import com.howard.blog.entity.Friend;
import com.howard.blog.service.FriendService;
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

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Void> deleteFriend(@PathVariable Long id) {
        friendService.deleteFriend(id);
        return Result.success();
    }
}
