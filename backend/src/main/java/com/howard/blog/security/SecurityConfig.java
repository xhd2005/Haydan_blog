package com.howard.blog.security;

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
                .headers(headers -> headers.frameOptions(HeadersConfigurer.FrameOptionsConfig::disable))
                .authorizeHttpRequests(auth -> auth
                        // 静态资源与上传目录
                        .requestMatchers("/uploads/**", "/favicon.ico", "/h2-console/**").permitAll()
                        // 认证接口公开（登录、注册、登出、验证码及状态检测）
                        .requestMatchers("/api/auth/login", "/api/auth/logout", "/api/auth/register", "/api/auth/captcha", "/api/auth/captcha-status", "/api/auth/reset-attempts").permitAll()
                        // AI 智能伴读与对话接口公开
                        .requestMatchers("/api/ai/**").permitAll()
                        // 免登录点赞接口
                        .requestMatchers(HttpMethod.POST, "/api/posts/*/like", "/api/memos/*/like").permitAll()
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
                                "/api/media", "/api/media/**",
                                "/api/memos",
                                "/api/friends",
                                "/api/comments"
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
