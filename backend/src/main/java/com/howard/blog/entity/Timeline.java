package com.howard.blog.entity;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableName;
import com.howard.blog.common.BaseEntity;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@TableName("timeline")
public class Timeline extends BaseEntity {

    @TableField("`year`")
    private String year;
    private String title;
    private String description;
    private Integer sortOrder;
}
