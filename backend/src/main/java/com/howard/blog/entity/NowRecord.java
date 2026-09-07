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
@TableName("now_records")
public class NowRecord implements Serializable {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String learning;
    private String building;
    private String exploring;
    private String thinking;
    private LocalDateTime updatedAt;
}
