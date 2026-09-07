package com.howard.blog.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.howard.blog.dto.NowUpdateRequest;
import com.howard.blog.entity.NowRecord;
import com.howard.blog.mapper.NowRecordMapper;
import com.howard.blog.service.NowService;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class NowServiceImpl extends ServiceImpl<NowRecordMapper, NowRecord> implements NowService {

    @Override
    public NowRecord getNow() {
        NowRecord record = getById(1L);
        if (record == null) {
            record = NowRecord.builder()
                    .id(1L)
                    .learning("正在深入探索新技术...")
                    .building("正在开发个人数字化空间...")
                    .exploring("正在探索现实与虚拟边界...")
                    .thinking("持续思考成长与代码的长期价值...")
                    .updatedAt(LocalDateTime.now())
                    .build();
            save(record);
        }
        return record;
    }

    @Override
    public void updateNow(NowUpdateRequest request) {
        NowRecord record = getById(1L);
        if (record == null) {
            record = new NowRecord();
            record.setId(1L);
        }
        if (request.getLearning() != null) record.setLearning(request.getLearning());
        if (request.getBuilding() != null) record.setBuilding(request.getBuilding());
        if (request.getExploring() != null) record.setExploring(request.getExploring());
        if (request.getThinking() != null) record.setThinking(request.getThinking());
        record.setUpdatedAt(LocalDateTime.now());

        saveOrUpdate(record);
    }
}
