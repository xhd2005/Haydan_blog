package com.hayden.blog.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.hayden.blog.common.BaseEntity;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@TableName("tags")
public class Tag extends BaseEntity {

    private String name;
    private String slug;
}
