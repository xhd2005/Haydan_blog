package com.howard.blog.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.howard.blog.common.PageResult;
import com.howard.blog.dto.MemoCreateRequest;
import com.howard.blog.entity.Memo;

import java.util.List;

public interface MemoService extends IService<Memo> {

    PageResult<Memo> getMemos(Long page, Long pageSize);

    Long createMemo(MemoCreateRequest request);

    void deleteMemo(Long id);

    void likeMemo(Long id);

    void togglePin(Long id);
}
