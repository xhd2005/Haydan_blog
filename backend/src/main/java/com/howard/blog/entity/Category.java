package com.howard.blog.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.howard.blog.common.BaseEntity;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@TableName("categories")
public class Category extends BaseEntity {

    private String name;
    private String slug;
    private String description;
}
