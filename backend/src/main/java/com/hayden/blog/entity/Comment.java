package com.hayden.blog.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.hayden.blog.common.BaseEntity;
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
    private Integer likeCount;
    private String status; // APPROVED, PENDING, SPAM
}
