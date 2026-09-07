package com.howard.blog.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.howard.blog.common.PageResult;
import com.howard.blog.entity.AuditLog;

public interface AuditLogService extends IService<AuditLog> {

    void recordLog(String username, String clientIp, String module, String operation,
                   String method, String params, Integer status, String errorMsg, Long durationMs);

    PageResult<AuditLog> getAuditLogs(Long page, Long pageSize, String module, String keyword);
}
