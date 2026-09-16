package com.hayden.blog.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.hayden.blog.common.PageResult;
import com.hayden.blog.dto.MemoCreateRequest;
import com.hayden.blog.entity.Memo;
import com.hayden.blog.exception.BusinessException;
import com.hayden.blog.mapper.MemoMapper;
import com.hayden.blog.service.MemoService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MemoServiceImpl extends ServiceImpl<MemoMapper, Memo> implements MemoService {

    @Override
    public PageResult<Memo> getMemos(Long page, Long pageSize) {
        LambdaQueryWrapper<Memo> wrapper = new LambdaQueryWrapper<Memo>()
                .orderByDesc(Memo::getIsPinned)
                .orderByDesc(Memo::getCreatedAt);

        Page<Memo> memoPage = page(new Page<>(page, pageSize), wrapper);
        return PageResult.of(memoPage.getRecords(), memoPage.getTotal(), page, pageSize);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long createMemo(MemoCreateRequest request) {
        Memo memo = Memo.builder()
                .content(request.getContent())
                .images(request.getImages())
                .location(request.getLocation())
                .mood(request.getMood())
                .weather(request.getWeather())
                .tags(request.getTags())
                .likeCount(0)
                .isPinned(request.getIsPinned() != null ? request.getIsPinned() : 0)
                .build();
        save(memo);
        return memo.getId();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteMemo(Long id) {
        removeById(id);
    }

    @Override
    public void likeMemo(Long id) {
        Memo memo = getById(id);
        if (memo == null) {
            throw new BusinessException(404, "随记不存在");
        }
        baseMapper.incrementLikeCount(id);
    }

    @Override
    public void togglePin(Long id) {
        Memo memo = getById(id);
        if (memo == null) {
            throw new BusinessException(404, "随记不存在");
        }
        memo.setIsPinned(memo.getIsPinned() != null && memo.getIsPinned() == 1 ? 0 : 1);
        updateById(memo);
    }
}
