package com.hayden.blog.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FriendActivity {

    private Long id;
    private Long friendId;
    private String friendName;
    private String friendAvatar;
    private String friendUrl;
    private String title;
    private String url;
    private String snippet;
    private String category;
    private LocalDateTime publishedAt;
}
