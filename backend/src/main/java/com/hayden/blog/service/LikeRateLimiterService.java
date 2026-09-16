package com.hayden.blog.service;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.hayden.blog.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.Duration;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * 统一点赞防刷与频控服务 (LikeRateLimiterService)
 *
 * 核心设计：
 * 1. 双层防护：L1 Caffeine 毫秒级进程内缓存 + L2 Redis 分布式滑动窗口；
 * 2. 游客限流：同一 IP 60秒内最多点赞 30 次；同一 IP 对同一实体 3秒防抖；
 * 3. 登录用户防抖：同一用户对同一实体 1秒防抖（杜绝网络抖动或连击导致的并发双重计数）；
 * 4. 优雅容灾降级：Redis 离线或异常时平滑降级至本地 Caffeine 拦截，保障核心服务高可用。
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class LikeRateLimiterService {

    private final StringRedisTemplate stringRedisTemplate;

    private static final int MAX_GUEST_LIKES_PER_MINUTE = 30;
    private static final int GUEST_DEBOUNCE_SECONDS = 3;
    private static final int USER_DEBOUNCE_SECONDS = 1;

    // L1 本地极速防抖缓存 (IP + TargetType + TargetId -> Timestamp)
    private final Cache<String, Long> localDebounceCache = Caffeine.newBuilder()
            .expireAfterWrite(10, TimeUnit.SECONDS)
            .maximumSize(50000)
            .build();

    // L1 本地极速 60 秒滑动窗口计数器 (IP -> AtomicInteger)
    private final Cache<String, AtomicInteger> localIpCounterCache = Caffeine.newBuilder()
            .expireAfterWrite(60, TimeUnit.SECONDS)
            .maximumSize(20000)
            .build();

    /**
     * 校验未登录游客点赞频次
     *
     * @param clientIp   客户端 IP
     * @param targetType 目标实体类型
     * @param targetId   目标实体 ID
     */
    public void checkGuestLikeRateLimit(String clientIp, String targetType, Long targetId) {
        String safeIp = StringUtils.hasText(clientIp) ? clientIp.trim() : "unknown";
        String debounceKey = "like:debounce:guest:" + safeIp + ":" + targetType + ":" + targetId;
        String windowKey = "like:limit:guest:" + safeIp;

        long now = System.currentTimeMillis();

        // 1. L1 本地防抖校验 (3秒)
        Long lastTrigger = localDebounceCache.getIfPresent(debounceKey);
        if (lastTrigger != null && (now - lastTrigger) < (GUEST_DEBOUNCE_SECONDS * 1000L)) {
            log.warn("[LikeRateLimiter] 游客 IP [{}] 对目标 [{}:{}] 触发连击防抖拦截", safeIp, targetType, targetId);
            throw new BusinessException(429, "点赞操作过于频繁，请稍候再试");
        }

        // 2. L1 本地窗口频次校验 (60秒内 30 次)
        AtomicInteger localCounter = localIpCounterCache.get(safeIp, k -> new AtomicInteger(0));
        if (localCounter != null && localCounter.incrementAndGet() > MAX_GUEST_LIKES_PER_MINUTE) {
            log.warn("[LikeRateLimiter] 游客 IP [{}] 触发本地 60 秒频次阈值 ({}/{})", safeIp, localCounter.get(), MAX_GUEST_LIKES_PER_MINUTE);
            throw new BusinessException(429, "当前点赞过于频繁，请稍作休息后再试");
        }

        // 记录本地防抖时间戳
        localDebounceCache.put(debounceKey, now);

        // 3. L2 分布式 Redis 频控与防抖（优雅容灾）
        try {
            if (stringRedisTemplate != null) {
                // Redis 分布式防抖原子锁
                Boolean debounceAcquired = stringRedisTemplate.opsForValue()
                        .setIfAbsent(debounceKey, "1", Duration.ofSeconds(GUEST_DEBOUNCE_SECONDS));
                if (Boolean.FALSE.equals(debounceAcquired)) {
                    throw new BusinessException(429, "点赞操作过于频繁，请稍候再试");
                }

                // Redis 分布式 60 秒滑动窗口
                Long currentCount = stringRedisTemplate.opsForValue().increment(windowKey);
                if (currentCount != null) {
                    if (currentCount == 1) {
                        stringRedisTemplate.expire(windowKey, Duration.ofSeconds(60));
                    }
                    if (currentCount > MAX_GUEST_LIKES_PER_MINUTE) {
                        log.warn("[LikeRateLimiter] 游客 IP [{}] 触发 Redis 分布式频次阈值 ({}/{})", safeIp, currentCount, MAX_GUEST_LIKES_PER_MINUTE);
                        throw new BusinessException(429, "当前点赞过于频繁，请稍作休息后再试");
                    }
                }
            }
        } catch (BusinessException be) {
            throw be;
        } catch (Exception e) {
            // Redis 离线或异常时降级日志，不阻断请求（已有 L1 Caffeine 兜底）
            log.debug("[LikeRateLimiter] Redis 频控降级至 Caffeine: {}", e.getMessage());
        }
    }

    /**
     * 校验已登录用户防抖（防止连击双击产生脏数据）
     *
     * @param userId     用户 ID
     * @param targetType 目标实体类型
     * @param targetId   目标实体 ID
     */
    public void checkUserLikeDebounce(Long userId, String targetType, Long targetId) {
        if (userId == null) return;
        String userDebounceKey = "like:debounce:user:" + userId + ":" + targetType + ":" + targetId;
        long now = System.currentTimeMillis();

        Long lastTrigger = localDebounceCache.getIfPresent(userDebounceKey);
        if (lastTrigger != null && (now - lastTrigger) < (USER_DEBOUNCE_SECONDS * 1000L)) {
            throw new BusinessException(429, "操作过于频繁，请稍候");
        }
        localDebounceCache.put(userDebounceKey, now);

        try {
            if (stringRedisTemplate != null) {
                Boolean acquired = stringRedisTemplate.opsForValue()
                        .setIfAbsent(userDebounceKey, "1", Duration.ofSeconds(USER_DEBOUNCE_SECONDS));
                if (Boolean.FALSE.equals(acquired)) {
                    throw new BusinessException(429, "操作过于频繁，请稍候");
                }
            }
        } catch (BusinessException be) {
            throw be;
        } catch (Exception ignored) {
            // 降级依靠本地 Caffeine
        }
    }
}
