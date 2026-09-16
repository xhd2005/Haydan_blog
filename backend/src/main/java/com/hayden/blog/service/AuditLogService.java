package com.hayden.blog.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.hayden.blog.common.PageResult;
import com.hayden.blog.entity.AuditLog;

public interface AuditLogService extends IService<AuditLog> {

    void recordLog(String username, String clientIp, String module, String operation,
                   String method, String params, Integer status, String errorMsg, Long durationMs);

    PageResult<AuditLog> getAuditLogs(Long page, Long pageSize, String module, String keyword);
}
