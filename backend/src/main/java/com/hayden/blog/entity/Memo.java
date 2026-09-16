package com.hayden.blog.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.hayden.blog.common.BaseEntity;
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
    private String location;
    private String mood;
    private String weather;
    private String tags;
    private Integer likeCount;
    private Integer isPinned; // 0 or 1
}
