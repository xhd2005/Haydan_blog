package com.hayden.blog.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.hayden.blog.common.BaseEntity;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@TableName("friends")
public class Friend extends BaseEntity {

    private String name;
    private String url;
    private String avatar;
    private String description;
    private String category; // 独立博客, 极客同好, 开源先锋
    private Integer sortOrder;
    private String status; // ACTIVE, PENDING, REJECTED, HIDDEN

    // 健康探活指标
    private String pingStatus; // ONLINE, OFFLINE, UNKNOWN
    private java.time.LocalDateTime lastPingTime;
    private Long responseTimeMs;
}
