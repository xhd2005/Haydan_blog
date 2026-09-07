package com.howard.blog.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.howard.blog.common.BaseEntity;
import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@TableName("users")
public class User extends BaseEntity {

    private String username;
    private String passwordHash;
    private String nickname;
    private String avatar;
    private String email;
    private String role;
    private String status;
    private String lastLoginIp;
    private LocalDateTime lastLoginTime;
}
