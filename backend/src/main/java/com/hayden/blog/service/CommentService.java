package com.hayden.blog.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.hayden.blog.common.PageResult;
import com.hayden.blog.dto.CommentCreateRequest;
import com.hayden.blog.entity.Comment;
import com.hayden.blog.vo.CommentVO;

import java.util.List;

public interface CommentService extends IService<Comment> {

    List<CommentVO> getCommentTree(String targetType, Long targetId);

    PageResult<CommentVO> getAdminComments(Long page, Long pageSize, String status);

    Long createComment(CommentCreateRequest request, Long userId);

    void updateStatus(Long id, String status);

    void deleteComment(Long id);
}
