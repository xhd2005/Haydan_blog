package com.howard.blog.entity;

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
@TableName("media")
public class Media implements Serializable {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String filename;
    private String objectKey;
    private String url;
    private String mimeType;
    private Long size;
    private Integer width;
    private Integer height;
    private LocalDateTime createdAt;
}
