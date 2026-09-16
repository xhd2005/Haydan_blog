package com.hayden.blog.common;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.Collections;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PageResult<T> implements Serializable {

    @Builder.Default
    private List<T> records = Collections.emptyList();
    private Long total;
    private Long page;
    private Long pageSize;

    public static <T> PageResult<T> of(List<T> records, Long total, Long page, Long pageSize) {
        return PageResult.<T>builder()
                .records(records)
                .total(total)
                .page(page)
                .pageSize(pageSize)
                .build();
    }
}
