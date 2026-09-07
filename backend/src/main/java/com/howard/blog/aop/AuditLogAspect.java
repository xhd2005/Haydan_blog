package com.howard.blog.aop;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.howard.blog.annotation.AuditLog;
import com.howard.blog.service.AuditLogService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Slf4j
@Aspect
@Component
@RequiredArgsConstructor
public class AuditLogAspect {

    private final AuditLogService auditLogService;
    private final ObjectMapper objectMapper;

    @Around("@annotation(auditLogAnnotation)")
    public Object around(ProceedingJoinPoint joinPoint, AuditLog auditLogAnnotation) throws Throwable {
        long startTime = System.currentTimeMillis();
        String username = "anonymous";
        String clientIp = "127.0.0.1";
        String method = joinPoint.getSignature().toShortString();
        String params = "";

        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated()) {
                username = auth.getName();
            }

            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes != null) {
                HttpServletRequest request = attributes.getRequest();
                clientIp = getClientIp(request);
                method = request.getMethod() + " " + request.getRequestURI();
            }

            Object[] args = joinPoint.getArgs();
            if (args != null && args.length > 0) {
                try {
                    params = objectMapper.writeValueAsString(args);
                } catch (Exception ignored) {}
            }
        } catch (Exception e) {
            log.warn("审计切面提取元数据异常: {}", e.getMessage());
        }

        try {
            Object result = joinPoint.proceed();
            long duration = System.currentTimeMillis() - startTime;
            auditLogService.recordLog(username, clientIp, auditLogAnnotation.module(),
                    auditLogAnnotation.operation(), method, params, 1, null, duration);
            return result;
        } catch (Throwable e) {
            long duration = System.currentTimeMillis() - startTime;
            auditLogService.recordLog(username, clientIp, auditLogAnnotation.module(),
                    auditLogAnnotation.operation(), method, params, 0, e.getMessage(), duration);
            throw e;
        }
    }

    private String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("X-Real-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        return ip != null ? ip : "127.0.0.1";
    }
}
