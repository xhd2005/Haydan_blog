package com.howard.blog.controller.admin;

import com.howard.blog.common.PageResult;
import com.howard.blog.common.Result;
import com.howard.blog.entity.AuditLog;
import com.howard.blog.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/audit-logs")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminAuditLogController {

    private final AuditLogService auditLogService;

    @GetMapping
    public Result<PageResult<AuditLog>> getAuditLogs(
            @RequestParam(defaultValue = "1") Long page,
            @RequestParam(defaultValue = "15") Long pageSize,
            @RequestParam(required = false) String module,
            @RequestParam(required = false) String keyword) {
        return Result.success(auditLogService.getAuditLogs(page, pageSize, module, keyword));
    }
}
