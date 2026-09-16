package com.hayden.blog.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.*;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@TableName("journey_images")
public class JourneyImage implements Serializable {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long journeyId;
    private String imageUrl;
    private String caption;
    private Integer sortOrder;
    private LocalDateTime createdAt;
}
