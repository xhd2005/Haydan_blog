package com.howard.blog.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.howard.blog.common.BaseEntity;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@TableName("journeys")
public class Journey extends BaseEntity {

    private String title;
    private String slug;
    private String country;
    private String city;
    private String description;
    private String content;
    private String cover;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private LocalDate startDate;
    private LocalDate endDate;
}
