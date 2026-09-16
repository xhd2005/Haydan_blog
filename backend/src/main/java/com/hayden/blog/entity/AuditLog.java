package com.hayden.blog.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@TableName("audit_logs")
public class AuditLog implements Serializable {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String username;
    private String clientIp;
    private String module;
    private String operation;
    private String method;
    private String params;
    private Integer status; // 1-成功 0-失败
    private String errorMsg;
    private Long durationMs;
    private LocalDateTime createdAt;
}
