package com.hayden.blog.interceptor;

import com.hayden.blog.common.IpUtils;
import com.hayden.blog.service.AnalyticsService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Slf4j
@Component
@RequiredArgsConstructor
public class VisitRecordInterceptor implements HandlerInterceptor {

    private final AnalyticsService analyticsService;

    private static final String START_TIME_KEY = "HAYDEN_VISIT_START_TIME";

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        request.setAttribute(START_TIME_KEY, System.currentTimeMillis());
        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
        try {
            String method = request.getMethod();
            if ("OPTIONS".equalsIgnoreCase(method)) {
                return;
            }

            String uri = request.getRequestURI();
            if (uri == null) {
                return;
            }

            // 过滤静态资源文件后缀
            String lowerUri = uri.toLowerCase();
            if (lowerUri.endsWith(".png") || lowerUri.endsWith(".jpg") || lowerUri.endsWith(".jpeg")
                    || lowerUri.endsWith(".webp") || lowerUri.endsWith(".gif") || lowerUri.endsWith(".svg")
                    || lowerUri.endsWith(".ico") || lowerUri.endsWith(".css") || lowerUri.endsWith(".js")
                    || lowerUri.endsWith(".map") || lowerUri.endsWith(".woff2") || lowerUri.endsWith(".woff")) {
                return;
            }

            // 过滤后台高频看板自刷新接口，避免管理人员看报表时产生自环污染
            if (lowerUri.contains("/api/v1/admin/analytics") || lowerUri.contains("/api/v1/admin/audit-logs")
                    || lowerUri.contains("/api/v1/admin/health")) {
                return;
            }

            Long startTime = (Long) request.getAttribute(START_TIME_KEY);
            long duration = startTime != null ? (System.currentTimeMillis() - startTime) : 0L;

            String clientIp = IpUtils.getClientIp(request);
            String userAgent = request.getHeader("User-Agent");
            String referer = request.getHeader("Referer");

            // 异步写入 visit_records 数据库表 (由 @Async 保障非阻塞高性能)
            analyticsService.recordVisit(clientIp, uri, method, userAgent, referer, duration);
        } catch (Exception e) {
            log.warn("访问流水拦截记录异常: {}", e.getMessage());
        }
    }
}
