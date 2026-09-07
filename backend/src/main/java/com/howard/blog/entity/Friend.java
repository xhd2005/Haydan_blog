package com.howard.blog.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.howard.blog.common.BaseEntity;
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
    private String category; // Blog, Tech, Tools
    private Integer sortOrder;
    private String status; // ACTIVE, HIDDEN
}
