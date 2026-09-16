package com.hayden.blog.entity;

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

    // 数字花园生活心智手记扩展字段
    private String focusTopicsJson;
    private String readingNotesJson;
    private String currentCity;
    private String microLogsJson;
    private String musicTrackJson;
    private String moodStatus;
    private String moviesJson;

    private LocalDateTime updatedAt;
}
