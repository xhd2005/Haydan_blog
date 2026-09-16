package com.hayden.blog.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.hayden.blog.common.PageResult;
import com.hayden.blog.entity.AuditLog;
import com.hayden.blog.mapper.AuditLogMapper;
import com.hayden.blog.service.AuditLogService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;

@Slf4j
@Service
public class AuditLogServiceImpl extends ServiceImpl<AuditLogMapper, AuditLog> implements AuditLogService {

    @Async
    @Override
    public void recordLog(String username, String clientIp, String module, String operation,
                          String method, String params, Integer status, String errorMsg, Long durationMs) {
        try {
            AuditLog auditLog = AuditLog.builder()
                    .username(StringUtils.hasText(username) ? username : "anonymous")
                    .clientIp(clientIp)
                    .module(module)
                    .operation(operation)
                    .method(method)
                    .params(params != null && params.length() > 500 ? params.substring(0, 500) + "..." : params)
                    .status(status)
                    .errorMsg(errorMsg != null && errorMsg.length() > 500 ? errorMsg.substring(0, 500) : errorMsg)
                    .durationMs(durationMs)
                    .createdAt(LocalDateTime.now())
                    .build();
            save(auditLog);
        } catch (Exception e) {
            log.error("异步落库操作审计日志异常: ", e);
        }
    }

    @Override
    public PageResult<AuditLog> getAuditLogs(Long page, Long pageSize, String module, String keyword) {
        LambdaQueryWrapper<AuditLog> wrapper = new LambdaQueryWrapper<>();
        if (StringUtils.hasText(module)) {
            wrapper.eq(AuditLog::getModule, module);
        }
        if (StringUtils.hasText(keyword)) {
            wrapper.and(w -> w.like(AuditLog::getUsername, keyword)
                    .or().like(AuditLog::getOperation, keyword)
                    .or().like(AuditLog::getClientIp, keyword));
        }
        wrapper.orderByDesc(AuditLog::getCreatedAt);

        Page<AuditLog> resultPage = page(new Page<>(page, pageSize), wrapper);
        return PageResult.of(resultPage.getRecords(), resultPage.getTotal(), page, pageSize);
    }
}
