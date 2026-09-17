package com.hayden.blog.ai.service;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.hayden.blog.exception.BusinessException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.Collections;
import java.util.List;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.Semaphore;
import java.util.concurrent.TimeUnit;

/**
 * AI 智能体配额与网关防护服务
 *
 * 核心特性：
 * 1. 双轨制滑动窗口限频 (Redis + Lua 脚本，无 Redis 时优雅降级为 Caffeine 本地缓存)；
 *    - 访客 (IP 标识)：2 次/分钟，5 次/天，单次推理最大 max_tokens = 500
 *    - 登录读者 (User 标识)：10 次/分钟，50 次/天，单次推理最大 max_tokens = 2000
 *    - 超管 (ADMIN)：不限频，max_tokens = 8192
 * 2. 全局在途并发控制 (In-Flight Concurrency Semaphore)；
 * 3. 透传配额与限额数据给响应头与 SSE 首包。
 */
@Slf4j
@Service
public class AiRateLimiterService {

    @Autowired(required = false)
    private StringRedisTemplate redisTemplate;

    // 全局在途并发信号量 (控制同时在跑的推理任务数，防止算力/连接耗尽)
    private final Semaphore inFlightSemaphore = new Semaphore(10);

    // Caffeine 内存降级双轨滑动窗口缓存 (Key -> 纳秒/毫秒时间戳队列)
    private final Cache<String, ConcurrentLinkedQueue<Long>> localSlidingWindowCache = Caffeine.newBuilder()
            .expireAfterAccess(25, TimeUnit.HOURS)
            .maximumSize(50000)
            .build();

    // Redis 滑动窗口 Lua 脚本
    private static final String SLIDING_WINDOW_LUA = """
            local key = KEYS[1]
            local now = tonumber(ARGV[1])
            local window = tonumber(ARGV[2])
            local limit = tonumber(ARGV[3])
            local expire = tonumber(ARGV[4])
            
            local clearBefore = now - window
            redis.call('ZREMRANGEBYSCORE', key, 0, clearBefore)
            local currentCount = redis.call('ZCARD', key)
            
            if currentCount < limit then
                redis.call('ZADD', key, now, now)
                redis.call('EXPIRE', key, expire)
                return {1, limit - currentCount - 1}
            else
                return {0, 0}
            end
            """;

    private final DefaultRedisScript<List> redisScript = new DefaultRedisScript<>(SLIDING_WINDOW_LUA, List.class);

    /**
     * 配额消费与状态记录
     */
    public record AiQuotaResult(
            boolean allowed,
            long minuteRemaining,
            long dayRemaining,
            int maxTokens,
            String clientType,
            String reason
    ) {}

    @Autowired(required = false)
    private com.hayden.blog.service.SiteSettingService siteSettingService;

    /**
     * 获取读者每日配额上限 (动态优先读取后台站点设置，默认 15 次/天)
     */
    public int getReaderDailyQuota() {
        if (siteSettingService != null) {
            try {
                com.hayden.blog.entity.SiteSetting setting = siteSettingService.getSettings();
                if (setting != null && setting.getReaderDailyAiQuota() != null && setting.getReaderDailyAiQuota() > 0) {
                    return setting.getReaderDailyAiQuota();
                }
            } catch (Exception e) {
                log.debug("获取全站 AI 读者配额设置异常，使用默认值 15: {}", e.getMessage());
            }
        }
        return 15;
    }

    /**
     * 校验并消费 AI 额度 (双轨制滑动窗口：分钟窗口 + 天级窗口)
     */
    public AiQuotaResult checkAndConsumeQuota(String clientIp, Authentication auth) {
        if (clientIp == null && auth == null) {
            // 系统内部调用或自动化测试环境豁免限制
            return new AiQuotaResult(true, 9999, 99999, 8192, "SYSTEM", "系统调用豁免限制");
        }

        boolean isAdmin = auth != null && auth.isAuthenticated() && auth.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equalsIgnoreCase(a.getAuthority()) || "ADMIN".equalsIgnoreCase(a.getAuthority()));

        if (isAdmin) {
            // 超管全免限流
            return new AiQuotaResult(true, 9999, 99999, 8192, "ADMIN", "管理员豁免限制");
        }

        boolean isUser = auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal());
        if (!isUser) {
            log.warn("未登录用户尝试使用 AI 推理功能，已拦截: ip={}", clientIp);
            return new AiQuotaResult(false, 0, 0, 0, "VISITOR", "未登录或登录已过期，请登录后再使用 AI 助手");
        }

        String clientType = "READER";
        String identityKey = "user:" + auth.getName();
        int limitDay = getReaderDailyQuota();
        int limitMinute = Math.max(2, Math.min(10, limitDay / 2));
        int maxTokens = 2000;

        long now = System.currentTimeMillis();

        // 1. 检查分钟窗口 (60秒)
        String minKey = "ai:quota:min:" + identityKey;
        RateCheck minCheck = recordAndCheck(minKey, now, 60_000L, limitMinute, 120);
        if (!minCheck.allowed()) {
            log.warn("AI 触发每分钟限频: identity={}, type={}, limit={}", identityKey, clientType, limitMinute);
            return new AiQuotaResult(false, 0, 0, maxTokens, clientType, "AI 请求过于频繁，请稍候片刻再试");
        }

        // 2. 检查天级窗口 (24小时 = 86,400,000毫秒)
        String dayKey = "ai:quota:day:" + identityKey;
        RateCheck dayCheck = recordAndCheck(dayKey, now, 86_400_000L, limitDay, 86400);
        if (!dayCheck.allowed()) {
            log.warn("AI 触发每日额度耗尽: identity={}, type={}, limit={}", identityKey, clientType, limitDay);
            return new AiQuotaResult(false, minCheck.remaining(), 0, maxTokens, clientType,
                    "今日 AI 伴读配额 (" + limitDay + " 次/天) 已用尽，欢迎明天继续探索！");
        }

        return new AiQuotaResult(true, minCheck.remaining(), dayCheck.remaining(), maxTokens, clientType, "放行");
    }

    /**
     * 获取当前配额状态 (不递增计数)
     */
    public AiQuotaResult peekQuota(String clientIp, Authentication auth) {
        if (clientIp == null && auth == null) {
            return new AiQuotaResult(true, 9999, 99999, 8192, "SYSTEM", "系统调用豁免限制");
        }
        boolean isAdmin = auth != null && auth.isAuthenticated() && auth.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equalsIgnoreCase(a.getAuthority()) || "ADMIN".equalsIgnoreCase(a.getAuthority()));
        if (isAdmin) {
            return new AiQuotaResult(true, 9999, 99999, 8192, "ADMIN", "管理员豁免限制");
        }
        boolean isUser = auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal());
        if (!isUser) {
            int dailyQuota = getReaderDailyQuota();
            return new AiQuotaResult(false, 0, 0, 0, "VISITOR", "未登录或登录已过期，登录后每日可享 " + dailyQuota + " 次 AI 伴读");
        }

        int maxTokens = 2000;
        int limitDay = getReaderDailyQuota();
        int limitMinute = Math.max(2, Math.min(10, limitDay / 2));
        String clientType = "READER";
        String identityKey = "user:" + auth.getName();

        long now = System.currentTimeMillis();
        long minUsed = getUsedCount("ai:quota:min:" + identityKey, now, 60_000L);
        long dayUsed = getUsedCount("ai:quota:day:" + identityKey, now, 86_400_000L);

        long minRemaining = Math.max(0, limitMinute - minUsed);
        long dayRemaining = Math.max(0, limitDay - dayUsed);

        return new AiQuotaResult(dayRemaining > 0 && minRemaining > 0, minRemaining, dayRemaining, maxTokens, clientType, "查询成功");
    }

    /**
     * 获取在途并发信号量
     */
    public boolean tryAcquireInFlight() {
        return inFlightSemaphore.tryAcquire();
    }

    /**
     * 释放在途并发信号量
     */
    public void releaseInFlight() {
        inFlightSemaphore.release();
    }

    private record RateCheck(boolean allowed, long remaining) {}

    private RateCheck recordAndCheck(String key, long now, long windowMs, int limit, int expireSec) {
        if (redisTemplate != null) {
            try {
                List result = redisTemplate.execute(
                        redisScript,
                        Collections.singletonList(key),
                        String.valueOf(now),
                        String.valueOf(windowMs),
                        String.valueOf(limit),
                        String.valueOf(expireSec)
                );
                if (result != null && result.size() >= 2) {
                    Number allowedNum = (Number) result.get(0);
                    Number remNum = (Number) result.get(1);
                    return new RateCheck(allowedNum.intValue() == 1, remNum.longValue());
                }
            } catch (Exception e) {
                log.debug("Redis 限频脚本执行异常，自动降级至 Caffeine 本地缓存: {}", e.getMessage());
            }
        }

        // 本地 Caffeine 滑动窗口降级实现
        ConcurrentLinkedQueue<Long> queue = localSlidingWindowCache.get(key, k -> new ConcurrentLinkedQueue<>());
        synchronized (queue) {
            long clearBefore = now - windowMs;
            while (!queue.isEmpty() && queue.peek() < clearBefore) {
                queue.poll();
            }
            if (queue.size() < limit) {
                queue.add(now);
                return new RateCheck(true, limit - queue.size());
            } else {
                return new RateCheck(false, 0);
            }
        }
    }

    private long getUsedCount(String key, long now, long windowMs) {
        if (redisTemplate != null) {
            try {
                Long count = redisTemplate.opsForZSet().count(key, now - windowMs, now);
                if (count != null) {
                    return count;
                }
            } catch (Exception ignored) {}
        }
        ConcurrentLinkedQueue<Long> queue = localSlidingWindowCache.getIfPresent(key);
        if (queue == null) return 0;
        synchronized (queue) {
            long clearBefore = now - windowMs;
            return queue.stream().filter(t -> t >= clearBefore).count();
        }
    }

    /**
     * 重置限额 (供测试套件还原状态)
     */
    public void resetQuota(String identity) {
        if (redisTemplate != null) {
            try {
                redisTemplate.delete("ai:quota:min:" + identity);
                redisTemplate.delete("ai:quota:day:" + identity);
            } catch (Exception ignored) {}
        }
        localSlidingWindowCache.invalidate("ai:quota:min:" + identity);
        localSlidingWindowCache.invalidate("ai:quota:day:" + identity);
    }
}
