package com.hayden.blog.vo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LikeToggleVO implements Serializable {
    private Boolean liked;
    private Integer likeCount;
}
