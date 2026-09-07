package com.howard.blog.controller;

import com.howard.blog.common.Result;
import com.howard.blog.dto.ChangePasswordRequest;
import com.howard.blog.dto.LoginRequest;
import com.howard.blog.dto.LoginResponse;
import com.howard.blog.entity.User;
import com.howard.blog.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;
    private final com.howard.blog.security.CaptchaService captchaService;
    private final com.howard.blog.security.LoginAttemptService loginAttemptService;

    @GetMapping("/captcha-status")
    public Result<java.util.Map<String, Object>> getCaptchaStatus(
            @RequestParam(required = false) String username,
            jakarta.servlet.http.HttpServletRequest httpRequest) {
        String clientIp = com.howard.blog.common.IpUtils.getClientIp(httpRequest);
        boolean required = loginAttemptService.isCaptchaRequired(clientIp, username);
        return Result.success(java.util.Map.of("captchaRequired", required));
    }

    @PostMapping("/reset-attempts")
    public Result<Void> resetAttempts(
            @RequestParam(required = false) String username,
            jakarta.servlet.http.HttpServletRequest httpRequest) {
        String clientIp = com.howard.blog.common.IpUtils.getClientIp(httpRequest);
        loginAttemptService.reset(clientIp, username);
        return Result.success();
    }

    @GetMapping("/captcha")
    public Result<java.util.Map<String, Object>> getCaptcha() {
        return Result.success(captchaService.generateCaptcha());
    }

    @PostMapping("/login")
    public Result<LoginResponse> login(
            @Valid @RequestBody LoginRequest request,
            jakarta.servlet.http.HttpServletRequest httpRequest) {
        String clientIp = com.howard.blog.common.IpUtils.getClientIp(httpRequest);
        return Result.success(userService.login(request, clientIp));
    }

    @PostMapping("/register")
    public Result<LoginResponse> register(@Valid @RequestBody com.howard.blog.dto.RegisterRequest request) {
        return Result.success(userService.register(request));
    }

    @PostMapping("/logout")
    public Result<Void> logout() {
        return Result.success();
    }

    @GetMapping("/me")
    public Result<User> getCurrentUser() {
        return Result.success(userService.getCurrentUser());
    }

    @PutMapping("/password")
    public Result<Void> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        userService.changePassword(request);
        return Result.success();
    }

    @PutMapping("/profile")
    public Result<Void> updateProfile(@RequestBody User profile) {
        userService.updateProfile(profile);
        return Result.success();
    }
}
