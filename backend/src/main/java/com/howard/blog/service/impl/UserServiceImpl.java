package com.howard.blog.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.howard.blog.dto.ChangePasswordRequest;
import com.howard.blog.dto.LoginRequest;
import com.howard.blog.dto.LoginResponse;
import com.howard.blog.entity.User;
import com.howard.blog.exception.BusinessException;
import com.howard.blog.mapper.UserMapper;
import com.howard.blog.security.JwtTokenProvider;
import com.howard.blog.security.SecurityUtils;
import com.howard.blog.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserServiceImpl extends ServiceImpl<UserMapper, User> implements UserService {

    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final com.howard.blog.security.LoginAttemptService loginAttemptService;
    private final com.howard.blog.security.CaptchaService captchaService;

    @Override
    public LoginResponse login(LoginRequest request) {
        return login(request, "127.0.0.1");
    }

    @Override
    public LoginResponse login(LoginRequest request, String clientIp) {
        String username = request.getUsername() != null ? request.getUsername().trim() : "";

        // 1. 检查是否已被锁定（连续 5 次密码错误锁定 15 分钟）
        loginAttemptService.checkLocked(clientIp, username);

        // 2. 检查验证码（若连续输错 >= 3 次进入防刷状态，或请求显式携带验证码入参）
        boolean captchaRequired = loginAttemptService.isCaptchaRequired(clientIp, username);
        if (captchaRequired || org.springframework.util.StringUtils.hasText(request.getCaptchaKey()) || org.springframework.util.StringUtils.hasText(request.getCaptchaCode())) {
            if (!org.springframework.util.StringUtils.hasText(request.getCaptchaCode())) {
                throw new BusinessException(400, "连续尝试失败次数较多，请输入图形验证码");
            }
            if (!captchaService.validateCaptcha(request.getCaptchaKey(), request.getCaptchaCode())) {
                throw new BusinessException(400, "图形验证码错误或已失效");
            }
        }

        // 3. 用户查询与密码校验
        User user = getOne(new LambdaQueryWrapper<User>()
                .eq(User::getUsername, username));

        if (user == null || !passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            // 记录失败次数
            loginAttemptService.loginFailed(clientIp, username);
            // 若第 5 次失败刚触发锁定，立即抛出 429 锁定异常
            loginAttemptService.checkLocked(clientIp, username);
            int currentFailed = loginAttemptService.getFailedAttempts(clientIp, username);
            if (currentFailed >= com.howard.blog.security.LoginAttemptService.CAPTCHA_THRESHOLD) {
                throw new BusinessException(401, "用户名或密码错误，已触发安全防护，请输入图形验证码后重试");
            }
            throw new BusinessException(401, "用户名或密码错误");
        }

        if (!"ACTIVE".equalsIgnoreCase(user.getStatus())) {
            throw new BusinessException(403, "账户已被禁用，请联系管理员");
        }

        // 4. 登录成功，立即清除失败计数
        loginAttemptService.loginSucceeded(clientIp, username);

        String token = jwtTokenProvider.generateToken(user.getUsername(), user.getRole());

        return LoginResponse.builder()
                .accessToken(token)
                .expiresIn(jwtTokenProvider.getExpiresInSeconds())
                .username(user.getUsername())
                .nickname(user.getNickname())
                .avatar(user.getAvatar())
                .role(user.getRole())
                .build();
    }

    @Override
    public LoginResponse register(com.howard.blog.dto.RegisterRequest request) {
        long count = count(new LambdaQueryWrapper<User>().eq(User::getUsername, request.getUsername().trim()));
        if (count > 0) {
            throw new BusinessException(400, "该用户名已被注册，请更换其他用户名");
        }

        User newUser = User.builder()
                .username(request.getUsername().trim())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .nickname(org.springframework.util.StringUtils.hasText(request.getNickname()) ? request.getNickname().trim() : request.getUsername().trim())
                .avatar(org.springframework.util.StringUtils.hasText(request.getAvatar()) ? request.getAvatar().trim() : "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop")
                .email(request.getEmail())
                .role("USER")
                .status("ACTIVE")
                .build();

        save(newUser);

        String token = jwtTokenProvider.generateToken(newUser.getUsername(), newUser.getRole());

        return LoginResponse.builder()
                .accessToken(token)
                .expiresIn(jwtTokenProvider.getExpiresInSeconds())
                .username(newUser.getUsername())
                .nickname(newUser.getNickname())
                .avatar(newUser.getAvatar())
                .role(newUser.getRole())
                .build();
    }

    @Override
    public User getCurrentUser() {
        String username = SecurityUtils.getCurrentUsername();
        if (username == null) {
            throw new BusinessException(401, "当前未登录");
        }
        User user = getOne(new LambdaQueryWrapper<User>().eq(User::getUsername, username));
        if (user != null) {
            user.setPasswordHash(null); // 脱敏
        }
        return user;
    }

    @Override
    public void changePassword(ChangePasswordRequest request) {
        String username = SecurityUtils.getCurrentUsername();
        User user = getOne(new LambdaQueryWrapper<User>().eq(User::getUsername, username));
        if (user == null) {
            throw new BusinessException(404, "用户不存在");
        }

        if (!passwordEncoder.matches(request.getOldPassword(), user.getPasswordHash())) {
            throw new BusinessException(400, "原密码错误");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        updateById(user);
    }

    @Override
    public void updateProfile(User profile) {
        String username = SecurityUtils.getCurrentUsername();
        User user = getOne(new LambdaQueryWrapper<User>().eq(User::getUsername, username));
        if (user == null) {
            throw new BusinessException(404, "用户不存在");
        }

        if (profile.getNickname() != null) user.setNickname(profile.getNickname());
        if (profile.getAvatar() != null) user.setAvatar(profile.getAvatar());
        if (profile.getEmail() != null) user.setEmail(profile.getEmail());

        updateById(user);
    }
}
