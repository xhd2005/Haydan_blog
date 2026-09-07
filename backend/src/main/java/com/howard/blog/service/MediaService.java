package com.howard.blog.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.howard.blog.common.PageResult;
import com.howard.blog.entity.Media;
import org.springframework.web.multipart.MultipartFile;

public interface MediaService extends IService<Media> {

    Media uploadFile(MultipartFile file);

    PageResult<Media> getMediaList(Long page, Long pageSize, String keyword);

    void deleteMedia(Long id);
}
