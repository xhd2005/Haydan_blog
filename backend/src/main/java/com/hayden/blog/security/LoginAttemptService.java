package com.hayden.blog.security;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.hayden.blog.exception.BusinessException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.util.StringUtils;

@Slf4j
@Service
public class LoginAttemptService {

    public static final int MAX_ATTEMPTS = 5;
    public static final int CAPTCHA_THRESHOLD = 3;
    public static final long LOCK_DURATION_MS = 15 * 60 * 1000L; // 15分钟

    @Autowired(required = false)
    @Lazy
    private com.hayden.blog.mapper.UserMapper userMapper;

    /**
     * 判断指定账号是否为超级管理员
     */
    public boolean isSuperAdmin(String username) {
        if (!StringUtils.hasText(username)) {
            return false;
        }
        String clean = username.trim();
        if ("admin".equalsIgnoreCase(clean)) {
            return true;
        }
        if (userMapper != null) {
            try {
                com.hayden.blog.entity.User user = userMapper.selectOne(
                        new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<com.hayden.blog.entity.User>()
                                .eq(com.hayden.blog.entity.User::getUsername, clean)
                );
                return user != null && "ADMIN".equalsIgnoreCase(user.getRole());
            } catch (Exception e) {
                log.debug("查询管理员角色判断超管异常: {}", e.getMessage());
            }
        }
        return false;
    }

    public static class AttemptRecord {
        private final AtomicInteger attempts = new AtomicInteger(0);
        private volatile long lockUntil = 0L;

        public int incrementAndGet() {
            return attempts.incrementAndGet();
        }

        public int getAttempts() {
            return attempts.get();
        }

        public long getLockUntil() {
            return lockUntil;
        }

        public void lock(long durationMs) {
            this.lockUntil = System.currentTimeMillis() + durationMs;
        }

        public boolean isLocked() {
            if (lockUntil == 0L) {
                return false;
            }
            if (System.currentTimeMillis() < lockUntil) {
                return true;
            }
            // 锁定已过期，重置
            lockUntil = 0L;
            attempts.set(0);
            return false;
        }

        public long getRemainingSeconds() {
            if (!isLocked()) {
                return 0L;
            }
            return Math.max(1, (lockUntil - System.currentTimeMillis()) / 1000);
        }
    }

    // 缓存 IP 维度失败记录
    private final Cache<String, AttemptRecord> ipCache = Caffeine.newBuilder()
            .expireAfterWrite(30, TimeUnit.MINUTES)
            .maximumSize(50000)
            .build();

    // 缓存用户名维度失败记录
    private final Cache<String, AttemptRecord> userCache = Caffeine.newBuilder()
            .expireAfterWrite(30, TimeUnit.MINUTES)
            .maximumSize(50000)
            .build();

    private AttemptRecord getOrCreateRecord(Cache<String, AttemptRecord> cache, String key) {
        return cache.get(key, k -> new AttemptRecord());
    }

    /**
     * 检查当前 IP 或账号是否已被锁定
     * 若锁定则抛出 BusinessException(429, ...)
     */
    public void checkLocked(String ip, String username) {
        if (ip != null) {
            AttemptRecord ipRecord = ipCache.getIfPresent(ip);
            if (ipRecord != null && ipRecord.isLocked()) {
                long remaining = ipRecord.getRemainingSeconds();
                log.warn("IP [{}] 登录失败过多已被锁定，剩余冷却时间: {} 秒", ip, remaining);
                throw new BusinessException(429, "当前IP密码错误次数过多，已被锁定15分钟，剩余冷却时间：" + remaining + "秒");
            }
        }

        if (username != null && !isSuperAdmin(username)) {
            AttemptRecord userRecord = userCache.getIfPresent(username);
            if (userRecord != null && userRecord.isLocked()) {
                long remaining = userRecord.getRemainingSeconds();
                log.warn("账号 [{}] 登录失败过多已被锁定，剩余冷却时间: {} 秒", username, remaining);
                throw new BusinessException(429, "密码错误次数过多，账号已锁定15分钟，剩余冷却时间：" + remaining + "秒");
            }
        }
    }

    /**
     * 登录失败调用，递增计数，达到阈值时触发 15 分钟锁定
     */
    public void loginFailed(String ip, String username) {
        int ipAttempts = 0;
        int userAttempts = 0;

        if (ip != null) {
            AttemptRecord ipRecord = getOrCreateRecord(ipCache, ip);
            ipAttempts = ipRecord.incrementAndGet();
            if (ipAttempts >= MAX_ATTEMPTS) {
                ipRecord.lock(LOCK_DURATION_MS);
                log.warn("IP [{}] 连续登录失败 {} 次，触发 15 分钟锁定惩罚", ip, ipAttempts);
            }
        }

        if (username != null) {
            AttemptRecord userRecord = getOrCreateRecord(userCache, username);
            userAttempts = userRecord.incrementAndGet();
            if (isSuperAdmin(username)) {
                // 超管账户防 DoS 死锁保护：绝不全账号锁定，转为人机验证阶梯挑战
                log.warn("超管账号 [{}] 密码错误 (累积 {} 次)，触发阶梯式人机验证挑战，防 DoS 豁免整账号锁定", username, userAttempts);
            } else {
                if (userAttempts >= MAX_ATTEMPTS) {
                    userRecord.lock(LOCK_DURATION_MS);
                    log.warn("账号 [{}] 连续登录失败 {} 次，触发 15 分钟锁定惩罚", username, userAttempts);
                }
            }
        }
    }

    /**
     * 登录成功调用，清除失败记录与锁定
     */
    public void loginSucceeded(String ip, String username) {
        if (ip != null) {
            ipCache.invalidate(ip);
        }
        if (username != null) {
            userCache.invalidate(username);
        }
        log.info("登录成功，清除 IP [{}] 与账号 [{}] 的失败计数", ip, username);
    }

    /**
     * 是否需要验证码（连续失败达到 3 次以上触发防刷）
     */
    public boolean isCaptchaRequired(String ip, String username) {
        if (ip != null) {
            AttemptRecord ipRecord = ipCache.getIfPresent(ip);
            if (ipRecord != null && ipRecord.getAttempts() >= CAPTCHA_THRESHOLD) {
                return true;
            }
        }
        if (username != null) {
            AttemptRecord userRecord = userCache.getIfPresent(username);
            if (userRecord != null && userRecord.getAttempts() >= CAPTCHA_THRESHOLD) {
                return true;
            }
        }
        return false;
    }

    /**
     * 获取指定 IP 或账号的失败次数
     */
    public int getFailedAttempts(String ip, String username) {
        int ipAttempts = 0;
        int userAttempts = 0;
        if (ip != null) {
            AttemptRecord r = ipCache.getIfPresent(ip);
            if (r != null) ipAttempts = r.getAttempts();
        }
        if (username != null) {
            AttemptRecord r = userCache.getIfPresent(username);
            if (r != null) userAttempts = r.getAttempts();
        }
        return Math.max(ipAttempts, userAttempts);
    }

    /**
     * 重置清除指定 IP 和账号的计数（供单元测试及管理员解锁使用）
     */
    public void reset(String ip, String username) {
        if (ip != null) ipCache.invalidate(ip);
        if (username != null) userCache.invalidate(username);
    }
}
