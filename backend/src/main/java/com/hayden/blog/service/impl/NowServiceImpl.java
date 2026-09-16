package com.hayden.blog.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.hayden.blog.dto.NowUpdateRequest;
import com.hayden.blog.entity.NowRecord;
import com.hayden.blog.mapper.NowRecordMapper;
import com.hayden.blog.service.NowService;
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
                    .learning("正在深入探索 Java 21 虚拟线程与现代 Spring Boot 3 企业级架构...")
                    .building("正在研发 Hayden Xue 个人博客与数字花园系统 V2.0...")
                    .exploring("正在探索现实物理旅行足迹与 3D WebGL 交互的融合边界...")
                    .thinking("持续思考知识如何长效沉淀，以及在大模型时代工程师的心智模型迁移...")
                    .focusTopicsJson("[{\"title\":\"Project Loom 虚拟线程并发实战\",\"progress\":90,\"badge\":\"核心演进\",\"tags\":[\"Java 21\",\"Concurrency\"]},{\"title\":\"Next.js 14 现代响应式空间美学\",\"progress\":95,\"badge\":\"前端重构\",\"tags\":[\"Next.js\",\"Three.js\"]},{\"title\":\"商汤日日新 / DeepSeek AI 智能体体系\",\"progress\":80,\"badge\":\"智能伴读\",\"tags\":[\"Agent\",\"LLM\"]}]")
                    .readingNotesJson("[{\"title\":\"Designing Data-Intensive Applications\",\"author\":\"Martin Kleppmann\",\"cover\":\"/cover-placeholder.svg\",\"quote\":\"可靠性、可扩展性与可维护性是支撑数字系统的三大基石。\",\"note\":\"精读第5章分布式复制与一致性模型\"},{\"title\":\"Building Microservices (2nd Edition)\",\"author\":\"Sam Newman\",\"cover\":\"/cover-placeholder.svg\",\"quote\":\"服务解耦与自治性决定了分布式架构的演进上限。\",\"note\":\"研读微服务拆分与演进模式\"}]")
                    .currentCity("杭州 · 滨江")
                    .microLogsJson("[{\"date\":\"2026-09-08\",\"content\":\"完成 MinIO 云存储与虚拟线程架构升级，博客数字花园性能大幅跃升。\"},{\"date\":\"2026-09-06\",\"content\":\"重构 Now 页面，引入生活心智流与经典书摘。\"}]")
                    .moodStatus("⚡ 深度心流 85%")
                    .musicTrackJson("{\"title\":\"Cornfield Chase\",\"artist\":\"Hans Zimmer · Interstellar OST\",\"albumCover\":\"https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=600&auto=format&fit=crop\",\"audioUrl\":\"\",\"platformUrl\":\"https://music.163.com\",\"note\":\"星际穿越原声，在时空视界与引力波中构建数字花园。\"}")
                    .updatedAt(LocalDateTime.now())
                    .build();
            save(record);
        } else {
            // 确保旧版数据也具备心智流缺省值
            boolean updated = false;
            if (record.getFocusTopicsJson() == null) {
                record.setFocusTopicsJson("[{\"title\":\"Project Loom 虚拟线程并发实战\",\"progress\":90,\"badge\":\"核心演进\",\"tags\":[\"Java 21\",\"Concurrency\"]},{\"title\":\"Next.js 14 现代响应式空间美学\",\"progress\":95,\"badge\":\"前端重构\",\"tags\":[\"Next.js\",\"Three.js\"]},{\"title\":\"商汤日日新 / DeepSeek AI 智能体体系\",\"progress\":80,\"badge\":\"智能伴读\",\"tags\":[\"Agent\",\"LLM\"]}]");
                updated = true;
            }
            if (record.getReadingNotesJson() == null) {
                record.setReadingNotesJson("[{\"title\":\"Designing Data-Intensive Applications\",\"author\":\"Martin Kleppmann\",\"cover\":\"/cover-placeholder.svg\",\"quote\":\"可靠性、可扩展性与可维护性是支撑数字系统的三大基石。\",\"note\":\"精读第5章分布式复制与一致性模型\"},{\"title\":\"Building Microservices (2nd Edition)\",\"author\":\"Sam Newman\",\"cover\":\"/cover-placeholder.svg\",\"quote\":\"服务解耦与自治性决定了分布式架构的演进上限。\",\"note\":\"研读微服务拆分与演进模式\"}]");
                updated = true;
            }
            if (record.getCurrentCity() == null) {
                record.setCurrentCity("杭州 · 滨江");
                updated = true;
            }
            if (record.getMicroLogsJson() == null) {
                record.setMicroLogsJson("[{\"date\":\"2026-09-08\",\"content\":\"完成 MinIO 云存储与虚拟线程架构升级，博客数字花园性能大幅跃升。\"},{\"date\":\"2026-09-06\",\"content\":\"重构 Now 页面，引入生活心智流与经典书摘。\"}]");
                updated = true;
            }
            if (record.getMoodStatus() == null) {
                record.setMoodStatus("⚡ 深度心流 85%");
                updated = true;
            }
            if (record.getMusicTrackJson() == null) {
                record.setMusicTrackJson("{\"title\":\"Cornfield Chase\",\"artist\":\"Hans Zimmer · Interstellar OST\",\"albumCover\":\"https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=600&auto=format&fit=crop\",\"audioUrl\":\"\",\"platformUrl\":\"https://music.163.com\",\"note\":\"星际穿越原声，在时空视界与引力波中构建数字花园。\"}");
                updated = true;
            }
            if (record.getMoviesJson() == null) {
                record.setMoviesJson("[{\"id\":\"movie-1\",\"title\":\"星际穿越 (Interstellar)\",\"director\":\"Christopher Nolan\",\"year\":\"2014\",\"cover\":\"https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=800&auto=format&fit=crop\",\"rating\":9.5,\"badge\":\"科幻经典\",\"quote\":\"爱不是人类发明的东西，它一直存在，且超越时空维度。\",\"note\":\"重温克里斯托弗·诺兰神作，沉浸于高维引力与爱穿透五维时空的震撼。\"},{\"id\":\"movie-2\",\"title\":\"奥本海默 (Oppenheimer)\",\"director\":\"Christopher Nolan\",\"year\":\"2023\",\"cover\":\"https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=800&auto=format&fit=crop\",\"rating\":9.2,\"badge\":\"人物传记\",\"quote\":\"我现在成了死神，世界的毁灭者。\",\"note\":\"关于技术理性的边界、科学家的道德困境与链式反应的深度反思。\"}]");
                updated = true;
            }
            if (updated) {
                updateById(record);
            }
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

        if (request.getFocusTopicsJson() != null) record.setFocusTopicsJson(request.getFocusTopicsJson());
        if (request.getReadingNotesJson() != null) record.setReadingNotesJson(request.getReadingNotesJson());
        if (request.getCurrentCity() != null) record.setCurrentCity(request.getCurrentCity());
        if (request.getMicroLogsJson() != null) record.setMicroLogsJson(request.getMicroLogsJson());
        if (request.getMusicTrackJson() != null) record.setMusicTrackJson(request.getMusicTrackJson());
        if (request.getMoodStatus() != null) record.setMoodStatus(request.getMoodStatus());
        if (request.getMoviesJson() != null) record.setMoviesJson(request.getMoviesJson());

        record.setUpdatedAt(LocalDateTime.now());
        saveOrUpdate(record);
    }
}
