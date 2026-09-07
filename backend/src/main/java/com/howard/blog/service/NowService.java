package com.howard.blog.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.howard.blog.dto.NowUpdateRequest;
import com.howard.blog.entity.NowRecord;

public interface NowService extends IService<NowRecord> {

    NowRecord getNow();

    void updateNow(NowUpdateRequest request);
}
