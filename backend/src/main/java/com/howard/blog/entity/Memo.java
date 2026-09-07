package com.howard.blog.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.howard.blog.common.BaseEntity;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@TableName("memos")
public class Memo extends BaseEntity {

    private String content;
    private String images; // JSON Array String: ["url1", "url2"]
    private Integer likeCount;
    private Integer isPinned; // 0 or 1
}
