package com.hayden.blog.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.hayden.blog.dto.FriendCreateRequest;
import com.hayden.blog.entity.Friend;

import java.util.List;

public interface FriendService extends IService<Friend> {

    List<Friend> getActiveFriends();

    List<Friend> getAllFriends();

    Long createFriend(FriendCreateRequest request);

    void updateFriend(Long id, FriendCreateRequest request);

    void deleteFriend(Long id);

    Friend applyFriend(com.hayden.blog.dto.FriendApplyRequest request);

    void updateFriendStatus(Long id, String status);

    List<com.hayden.blog.dto.FriendActivity> getFriendStream();

    Friend pingFriend(Long id);

    List<Friend> pingAllFriends();

    com.hayden.blog.dto.FriendInspectResult inspectFriendSite(String url);
}
