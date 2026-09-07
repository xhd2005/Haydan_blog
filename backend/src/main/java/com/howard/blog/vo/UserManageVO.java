package com.howard.blog.vo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserManageVO {
    private Long id;
    private String username;
    private String nickname;
    private String avatar;
    private String email;
    private String role;
    private String status; // ACTIVE, BANNED
    private Long commentCount;
    private String lastLoginIp;
    private LocalDateTime lastLoginTime;
    private LocalDateTime createdAt;
}
