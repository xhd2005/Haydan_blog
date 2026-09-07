package com.howard.blog.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.howard.blog.common.BaseEntity;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@TableName("comments")
public class Comment extends BaseEntity {

    private String targetType; // POST, JOURNEY, MEMO
    private Long targetId;
    private Long userId;
    private Long parentId;
    private String content;
    private String status; // APPROVED, PENDING, SPAM
}
