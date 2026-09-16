package com.hayden.blog.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.hayden.blog.dto.NowUpdateRequest;
import com.hayden.blog.entity.NowRecord;

public interface NowService extends IService<NowRecord> {

    NowRecord getNow();

    void updateNow(NowUpdateRequest request);
}
