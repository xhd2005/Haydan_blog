package com.howard.blog.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.howard.blog.dto.ChangePasswordRequest;
import com.howard.blog.dto.LoginRequest;
import com.howard.blog.dto.LoginResponse;
import com.howard.blog.entity.User;

public interface UserService extends IService<User> {

    LoginResponse login(LoginRequest request);

    LoginResponse login(LoginRequest request, String clientIp);

    LoginResponse register(com.howard.blog.dto.RegisterRequest request);

    User getCurrentUser();

    void changePassword(ChangePasswordRequest request);

    void updateProfile(User profile);
}
