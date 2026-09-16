package com.hayden.blog.aop;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.hayden.blog.annotation.AuditLog;
import com.hayden.blog.service.AuditLogService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
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
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.io.OutputStream;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;

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
            params = sanitizeArgs(args);
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

    private String sanitizeArgs(Object[] args) {
        if (args == null || args.length == 0) {
            return "";
        }
        try {
            List<Object> sanitizedList = new ArrayList<>();
            for (Object arg : args) {
                if (arg == null) {
                    continue;
                }
                if (arg instanceof HttpServletRequest || arg instanceof HttpServletResponse
                        || arg instanceof InputStream || arg instanceof OutputStream
                        || arg instanceof MultipartFile || arg instanceof Authentication) {
                    sanitizedList.add(arg.getClass().getSimpleName());
                    continue;
                }
                try {
                    JsonNode node = objectMapper.valueToTree(arg);
                    maskSensitiveNode(node);
                    sanitizedList.add(node);
                } catch (Exception e) {
                    sanitizedList.add(arg.toString());
                }
            }
            return objectMapper.writeValueAsString(sanitizedList);
        } catch (Exception e) {
            log.warn("审计参数脱敏失败: {}", e.getMessage());
            return "[Masking Failed]";
        }
    }

    private void maskSensitiveNode(JsonNode node) {
        if (node == null) {
            return;
        }
        if (node.isObject()) {
            ObjectNode objectNode = (ObjectNode) node;
            Iterator<String> fieldNames = objectNode.fieldNames();
            List<String> namesToMask = new ArrayList<>();
            while (fieldNames.hasNext()) {
                String fieldName = fieldNames.next();
                if (isSensitiveField(fieldName)) {
                    namesToMask.add(fieldName);
                } else {
                    maskSensitiveNode(objectNode.get(fieldName));
                }
            }
            for (String fieldName : namesToMask) {
                objectNode.put(fieldName, "******");
            }
        } else if (node.isArray()) {
            for (JsonNode child : node) {
                maskSensitiveNode(child);
            }
        }
    }

    private boolean isSensitiveField(String fieldName) {
        if (fieldName == null) {
            return false;
        }
        String lower = fieldName.toLowerCase();
        return lower.contains("password")
                || lower.contains("secret")
                || lower.contains("token")
                || lower.contains("credential")
                || lower.contains("apikey")
                || lower.endsWith("key")
                || lower.equals("key");
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
