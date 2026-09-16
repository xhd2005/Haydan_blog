package com.hayden.blog.security;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.annotation.web.configurers.HeadersConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> {}) // WebMvcConfig 处理
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .headers(headers -> headers.frameOptions(HeadersConfigurer.FrameOptionsConfig::sameOrigin))
                .authorizeHttpRequests(auth -> auth
                        // 静态资源与上传目录
                        .requestMatchers("/uploads/**", "/favicon.ico", "/h2-console/**").permitAll()
                        // 认证接口公开（登录、注册、登出、验证码及状态检测）
                        .requestMatchers("/api/auth/login", "/api/auth/logout", "/api/auth/register", "/api/auth/captcha", "/api/auth/captcha-status").permitAll()
                        // 媒体管理仅限 ADMIN 权限
                        .requestMatchers("/api/media", "/api/media/**").hasRole("ADMIN")
                        // AI 连通性测试与写作副驾仅限 ADMIN 权限
                        .requestMatchers("/api/ai/test-connection", "/api/ai/editor-assist", "/api/ai/stream-translate", "/api/ai/backlinks/**").hasRole("ADMIN")
                        // AI 服务状态探测与额度查询公开
                        .requestMatchers(HttpMethod.GET, "/api/ai/status", "/api/ai/quota").permitAll()
                        // AI 智能伴读与对话推理接口：读者与管理员必须登录认证
                        .requestMatchers("/api/ai/**").authenticated()
                        // 统一点赞与免登录点赞接口与友链自助申请
                        .requestMatchers("/api/likes/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/posts/*/like", "/api/memos/*/like", "/api/friends/apply").permitAll()
                        // 前台只读 API 公开
                        .requestMatchers(HttpMethod.GET,
                                "/api/posts", "/api/posts/featured", "/api/posts/latest", "/api/posts/*", "/api/posts/id/*",
                                "/api/categories", "/api/categories/**",
                                "/api/tags", "/api/tags/**",
                                "/api/projects", "/api/projects/**",
                                "/api/journey", "/api/journey/**",
                                "/api/now", "/api/now/**",
                                "/api/timeline", "/api/timeline/**",
                                "/api/settings", "/api/settings/**",
                                "/api/memos",
                                "/api/friends", "/api/friends/stream", "/api/friends/inspect",
                                "/api/comments",
                                "/api/users/*/public"
                        ).permitAll()
                        // 其余所有管理操作与写接口必须登录认证
                        .anyRequest().authenticated()
                )
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((request, response, authException) -> {
                            response.setContentType("application/json;charset=UTF-8");
                            response.setStatus(401);
                            response.getWriter().write("{\"code\":401,\"message\":\"未登录或登录已过期，请重新登录\",\"data\":null}");
                        })
                        .accessDeniedHandler((request, response, accessDeniedException) -> {
                            response.setContentType("application/json;charset=UTF-8");
                            response.setStatus(403);
                            response.getWriter().write("{\"code\":403,\"message\":\"没有权限执行该操作\",\"data\":null}");
                        })
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
