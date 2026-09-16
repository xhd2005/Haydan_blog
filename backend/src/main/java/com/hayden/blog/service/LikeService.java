package com.hayden.blog.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.hayden.blog.dto.LikeToggleRequest;
import com.hayden.blog.entity.UserLike;
import com.hayden.blog.vo.LikeToggleVO;

import java.util.List;
import java.util.Map;

public interface LikeService extends IService<UserLike> {

    LikeToggleVO toggleLike(LikeToggleRequest request, Long userId);

    Map<Long, Boolean> getBatchStatus(String targetType, List<Long> targetIds, Long userId);

    boolean isLiked(String targetType, Long targetId, Long userId);
}
