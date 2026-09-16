package com.hayden.blog.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FriendInspectResult {

    private String name;
    private String description;
    private String avatar;
    private String url;
    private Long responseTimeMs;
    private Boolean online;
}
