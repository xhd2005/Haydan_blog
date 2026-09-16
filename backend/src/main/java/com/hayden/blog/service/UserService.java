package com.hayden.blog.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.hayden.blog.dto.ChangePasswordRequest;
import com.hayden.blog.dto.LoginRequest;
import com.hayden.blog.dto.LoginResponse;
import com.hayden.blog.entity.User;

public interface UserService extends IService<User> {

    LoginResponse login(LoginRequest request);

    LoginResponse login(LoginRequest request, String clientIp);

    LoginResponse register(com.hayden.blog.dto.RegisterRequest request);

    User getCurrentUser();

    void changePassword(ChangePasswordRequest request);

    void updateProfile(User profile);
}
