package com.hayden.blog.dto;

import lombok.Data;

@Data
public class NowUpdateRequest {

    private String learning;
    private String building;
    private String exploring;
    private String thinking;

    private String focusTopicsJson;
    private String readingNotesJson;
    private String currentCity;
    private String microLogsJson;
    private String musicTrackJson;
    private String moodStatus;
    private String moviesJson;
}
