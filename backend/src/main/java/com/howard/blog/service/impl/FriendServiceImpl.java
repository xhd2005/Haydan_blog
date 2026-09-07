package com.howard.blog.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.howard.blog.dto.FriendCreateRequest;
import com.howard.blog.entity.Friend;
import com.howard.blog.exception.BusinessException;
import com.howard.blog.mapper.FriendMapper;
import com.howard.blog.service.FriendService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;

@Service
public class FriendServiceImpl extends ServiceImpl<FriendMapper, Friend> implements FriendService {

    @Override
    public List<Friend> getActiveFriends() {
        return list(new LambdaQueryWrapper<Friend>()
                .eq(Friend::getStatus, "ACTIVE")
                .orderByAsc(Friend::getSortOrder)
                .orderByDesc(Friend::getCreatedAt));
    }

    @Override
    public List<Friend> getAllFriends() {
        return list(new LambdaQueryWrapper<Friend>()
                .orderByAsc(Friend::getSortOrder)
                .orderByDesc(Friend::getCreatedAt));
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long createFriend(FriendCreateRequest request) {
        Friend friend = Friend.builder()
                .name(request.getName())
                .url(request.getUrl())
                .avatar(request.getAvatar())
                .description(request.getDescription())
                .category(StringUtils.hasText(request.getCategory()) ? request.getCategory() : "Blog")
                .sortOrder(request.getSortOrder() != null ? request.getSortOrder() : 0)
                .status(StringUtils.hasText(request.getStatus()) ? request.getStatus().toUpperCase() : "ACTIVE")
                .build();
        save(friend);
        return friend.getId();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateFriend(Long id, FriendCreateRequest request) {
        Friend friend = getById(id);
        if (friend == null) {
            throw new BusinessException(404, "友链不存在");
        }
        if (request.getName() != null) friend.setName(request.getName());
        if (request.getUrl() != null) friend.setUrl(request.getUrl());
        if (request.getAvatar() != null) friend.setAvatar(request.getAvatar());
        if (request.getDescription() != null) friend.setDescription(request.getDescription());
        if (request.getCategory() != null) friend.setCategory(request.getCategory());
        if (request.getSortOrder() != null) friend.setSortOrder(request.getSortOrder());
        if (request.getStatus() != null) friend.setStatus(request.getStatus().toUpperCase());
        updateById(friend);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteFriend(Long id) {
        removeById(id);
    }
}
