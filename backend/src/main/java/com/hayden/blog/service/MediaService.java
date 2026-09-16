package com.hayden.blog.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.hayden.blog.common.PageResult;
import com.hayden.blog.entity.Media;
import com.hayden.blog.dto.PresignedUploadRequest;
import com.hayden.blog.dto.PresignedUploadResponse;
import org.springframework.web.multipart.MultipartFile;

public interface MediaService extends IService<Media> {

    Media uploadFile(MultipartFile file);

    PresignedUploadResponse createPresignedUploadUrl(PresignedUploadRequest request);

    PageResult<Media> getMediaList(Long page, Long pageSize, String keyword);

    void deleteMedia(Long id);
}
