package com.hayden.blog.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.hayden.blog.common.PageResult;
import com.hayden.blog.dto.MemoCreateRequest;
import com.hayden.blog.entity.Memo;

import java.util.List;

public interface MemoService extends IService<Memo> {

    PageResult<Memo> getMemos(Long page, Long pageSize);

    Long createMemo(MemoCreateRequest request);

    void deleteMemo(Long id);

    void likeMemo(Long id);

    void togglePin(Long id);
}
