package com.hayden.blog.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.Cache;
import org.springframework.cache.annotation.CachingConfigurer;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.interceptor.CacheErrorHandler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

/**
 * Redis 缓存层配置（2026-09-09）
 *
 * - 仅 dev Profile 启用；h2 测试 Profile 通过 spring.cache.type=none 完全旁路；
 * - 分区 TTL：siteSettings 300s / homeFeed 60s / dashboardStats 30s；
 * - 优雅降级：Redis 不可达时缓存读写仅记日志并回退真实数据源，应用零中断。
 */
@Slf4j
@Configuration
@EnableCaching
@Profile("dev")
public class CacheConfig implements CachingConfigurer {

    /** 缓存分区名称常量 */
    public static final String CACHE_SITE_SETTINGS = "siteSettings";
    public static final String CACHE_HOME_FEED = "homeFeed";
    public static final String CACHE_DASHBOARD_STATS = "dashboardStats";

    @Bean
    public RedisCacheManager redisCacheManager(RedisConnectionFactory connectionFactory) {
        com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
        mapper.registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule());
        mapper.disable(com.fasterxml.jackson.databind.SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        mapper.activateDefaultTyping(
                com.fasterxml.jackson.databind.jsontype.impl.LaissezFaireSubTypeValidator.instance,
                com.fasterxml.jackson.databind.ObjectMapper.DefaultTyping.NON_FINAL,
                com.fasterxml.jackson.annotation.JsonTypeInfo.As.PROPERTY
        );
        GenericJackson2JsonRedisSerializer serializer = new GenericJackson2JsonRedisSerializer(mapper);

        RedisCacheConfiguration defaultConfig = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofSeconds(120))
                .serializeValuesWith(
                        RedisSerializationContext.SerializationPair.fromSerializer(serializer))
                .disableCachingNullValues();

        Map<String, RedisCacheConfiguration> ttlPartitions = new HashMap<>();
        ttlPartitions.put(CACHE_SITE_SETTINGS, defaultConfig.entryTtl(Duration.ofSeconds(300)));
        ttlPartitions.put(CACHE_HOME_FEED, defaultConfig.entryTtl(Duration.ofSeconds(60)));
        ttlPartitions.put(CACHE_DASHBOARD_STATS, defaultConfig.entryTtl(Duration.ofSeconds(30)));

        return RedisCacheManager.builder(connectionFactory)
                .cacheDefaults(defaultConfig)
                .withInitialCacheConfigurations(ttlPartitions)
                .build();
    }

    /**
     * 优雅降级错误处理器：Redis 连接/读写异常仅记录日志，
     * 让业务方法直接回退真实数据源，绝不影响请求链路。
     */
    @Override
    public CacheErrorHandler errorHandler() {
        return new CacheErrorHandler() {
            @Override
            public void handleCacheGetError(RuntimeException e, Cache cache, Object key) {
                log.warn("[Cache] Redis GET 降级: cache={}, key={}, reason={}", cache.getName(), key, e.getMessage());
            }

            @Override
            public void handleCachePutError(RuntimeException e, Cache cache, Object key, Object value) {
                log.warn("[Cache] Redis PUT 降级: cache={}, key={}, reason={}", cache.getName(), key, e.getMessage());
            }

            @Override
            public void handleCacheEvictError(RuntimeException e, Cache cache, Object key) {
                log.warn("[Cache] Redis EVICT 降级: cache={}, key={}, reason={}", cache.getName(), key, e.getMessage());
            }

            @Override
            public void handleCacheClearError(RuntimeException e, Cache cache) {
                log.warn("[Cache] Redis CLEAR 降级: cache={}, reason={}", cache.getName(), e.getMessage());
            }
        };
    }
}
