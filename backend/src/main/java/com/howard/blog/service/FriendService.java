package com.howard.blog.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.howard.blog.dto.FriendCreateRequest;
import com.howard.blog.entity.Friend;

import java.util.List;

public interface FriendService extends IService<Friend> {

    List<Friend> getActiveFriends();

    List<Friend> getAllFriends();

    Long createFriend(FriendCreateRequest request);

    void updateFriend(Long id, FriendCreateRequest request);

    void deleteFriend(Long id);
}
