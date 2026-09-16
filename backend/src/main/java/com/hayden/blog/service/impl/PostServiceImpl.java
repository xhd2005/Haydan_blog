package com.hayden.blog.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.hayden.blog.common.PageResult;
import com.hayden.blog.dto.PostCreateUpdateRequest;
import com.hayden.blog.entity.Category;
import com.hayden.blog.entity.Post;
import com.hayden.blog.entity.PostTag;
import com.hayden.blog.entity.Tag;
import com.hayden.blog.exception.BusinessException;
import com.hayden.blog.exception.ResourceNotFoundException;
import com.hayden.blog.mapper.CategoryMapper;
import com.hayden.blog.mapper.PostMapper;
import com.hayden.blog.mapper.PostTagMapper;
import com.hayden.blog.mapper.TagMapper;
import com.hayden.blog.service.PostService;
import com.hayden.blog.vo.PostDetailVO;
import com.hayden.blog.vo.PostListVO;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.context.request.RequestContextHolder;

import lombok.extern.slf4j.Slf4j;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PostServiceImpl extends ServiceImpl<PostMapper, Post> implements PostService {

    private final CategoryMapper categoryMapper;
    private final TagMapper tagMapper;
    private final PostTagMapper postTagMapper;

    @Override
    public PageResult<PostListVO> getPublishedPosts(Long page, Long pageSize, String categorySlug, String tagSlug, String keyword, String lang) {
        return getPublishedPosts(page, pageSize, categorySlug, tagSlug, keyword, lang, null);
    }

    @Override
    public PageResult<PostListVO> getPublishedPosts(Long page, Long pageSize, String categorySlug, String tagSlug, String keyword, String lang, String maturity) {
        LambdaQueryWrapper<Post> wrapper = new LambdaQueryWrapper<Post>()
                .eq(Post::getStatus, "PUBLISHED")
                .le(Post::getPublishedAt, LocalDateTime.now().plusMinutes(1));

        if (StringUtils.hasText(lang)) {
            wrapper.eq(Post::getLang, lang.trim().toLowerCase());
        }

        if (StringUtils.hasText(maturity)) {
            String mat = maturity.trim().toUpperCase();
            if ("SEED".equals(mat)) {
                mat = "SEEDLING";
            }
            wrapper.eq(Post::getMaturity, mat);
        }

        // 分类过滤
        if (StringUtils.hasText(categorySlug)) {
            Category category = categoryMapper.selectOne(new LambdaQueryWrapper<Category>().eq(Category::getSlug, categorySlug));
            if (category != null) {
                wrapper.eq(Post::getCategoryId, category.getId());
            } else {
                return PageResult.of(Collections.emptyList(), 0L, page, pageSize);
            }
        }

        // 标签过滤
        if (StringUtils.hasText(tagSlug)) {
            Tag tag = tagMapper.selectOne(new LambdaQueryWrapper<Tag>().eq(Tag::getSlug, tagSlug));
            if (tag != null) {
                List<PostTag> postTags = postTagMapper.selectList(new LambdaQueryWrapper<PostTag>().eq(PostTag::getTagId, tag.getId()));
                List<Long> postIds = postTags.stream().map(PostTag::getPostId).collect(Collectors.toList());
                if (postIds.isEmpty()) {
                    return PageResult.of(Collections.emptyList(), 0L, page, pageSize);
                }
                wrapper.in(Post::getId, postIds);
            } else {
                return PageResult.of(Collections.emptyList(), 0L, page, pageSize);
            }
        }

        // 关键词搜索 (标题、摘要、内容)
        if (StringUtils.hasText(keyword)) {
            wrapper.and(w -> w.like(Post::getTitle, keyword)
                    .or().like(Post::getExcerpt, keyword)
                    .or().like(Post::getContent, keyword));
        }

        // 优先置顶，其次按发布时间倒序，最后按创建时间倒序
        wrapper.orderByDesc(Post::getFeatured)
               .orderByDesc(Post::getPublishedAt)
               .orderByDesc(Post::getCreatedAt);

        Page<Post> postPage = page(new Page<>(page, pageSize), wrapper);
        List<PostListVO> voList = convertToListVO(postPage.getRecords());

        return PageResult.of(voList, postPage.getTotal(), page, pageSize);
    }

    @Override
    public PageResult<PostListVO> getAdminPosts(Long page, Long pageSize, String status, String keyword) {
        return getAdminPosts(page, pageSize, status, keyword, null);
    }

    @Override
    public PageResult<PostListVO> getAdminPosts(Long page, Long pageSize, String status, String keyword, String lang) {
        LambdaQueryWrapper<Post> wrapper = new LambdaQueryWrapper<>();

        if (StringUtils.hasText(status)) {
            wrapper.eq(Post::getStatus, status.toUpperCase());
        }

        if (StringUtils.hasText(keyword)) {
            wrapper.and(w -> w.like(Post::getTitle, keyword)
                    .or().like(Post::getExcerpt, keyword));
        }

        if (StringUtils.hasText(lang)) {
            wrapper.eq(Post::getLang, lang.trim().toLowerCase());
        }

        wrapper.orderByDesc(Post::getCreatedAt);

        Page<Post> postPage = page(new Page<>(page, pageSize), wrapper);
        List<PostListVO> voList = convertToListVO(postPage.getRecords());

        return PageResult.of(voList, postPage.getTotal(), page, pageSize);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public PostDetailVO deriveTranslation(Long id) {
        Post sourcePost = getById(id);
        if (sourcePost == null) {
            throw new BusinessException(404, "源文章不存在，无法派生译文: ID " + id);
        }

        // 防重校验：若源文章已绑定了有效的译文文章，则抛出业务异常友好提示
        if (sourcePost.getTranslationPostId() != null) {
            Post existingTrans = getById(sourcePost.getTranslationPostId());
            if (existingTrans != null) {
                throw new BusinessException(409, "该文章已存在关联译文，不可重复派生 (译文ID: " + existingTrans.getId() + ", 标题: " + existingTrans.getTitle() + ")");
            } else {
                sourcePost.setTranslationPostId(null);
            }
        }

        // 语言自动取反（zh -> en, en -> zh）
        String sourceLang = StringUtils.hasText(sourcePost.getLang()) ? sourcePost.getLang().trim().toLowerCase() : "zh";
        String targetLang = "en".equalsIgnoreCase(sourceLang) ? "zh" : "en";

        // 生成带语言后缀且保证唯一性的 Slug
        // 原 Slug 为 my-first-post 则为 my-first-post-en，反向剥离或加 -zh，并循环检测唯一性避免索引冲突
        String origSlug = sourcePost.getSlug();
        String baseSlug;
        if ("en".equalsIgnoreCase(targetLang)) {
            if (origSlug.endsWith("-zh")) {
                baseSlug = origSlug.substring(0, origSlug.length() - 3) + "-en";
            } else if (!origSlug.endsWith("-en")) {
                baseSlug = origSlug + "-en";
            } else {
                baseSlug = origSlug;
            }
        } else {
            // target is zh
            if (origSlug.endsWith("-en")) {
                baseSlug = origSlug.substring(0, origSlug.length() - 3);
            } else if (!origSlug.endsWith("-zh")) {
                baseSlug = origSlug + "-zh";
            } else {
                baseSlug = origSlug;
            }
        }

        String candidateSlug = baseSlug;
        int counter = 2;
        while (count(new LambdaQueryWrapper<Post>().eq(Post::getSlug, candidateSlug)) > 0) {
            candidateSlug = baseSlug + "-" + counter;
            counter++;
        }

        // 标题增加草稿后缀区分
        String targetTitle = sourcePost.getTitle() + ("en".equalsIgnoreCase(targetLang) ? " (English Draft)" : " (中文草稿)");

        // 状态强制置为 DRAFT，复制分类、封面图、摘要、正文
        Post derivedPost = Post.builder()
                .title(targetTitle)
                .slug(candidateSlug)
                .excerpt(sourcePost.getExcerpt())
                .content(sourcePost.getContent())
                .cover(sourcePost.getCover())
                .categoryId(sourcePost.getCategoryId())
                .status("DRAFT")
                .featured(0)
                .readingTime(sourcePost.getReadingTime() != null ? sourcePost.getReadingTime() : 1)
                .viewCount(0)
                .likeCount(0)
                .lang(targetLang)
                .seoTitle(sourcePost.getSeoTitle())
                .seoDescription(sourcePost.getSeoDescription())
                .maturity(sourcePost.getMaturity() != null ? sourcePost.getMaturity() : "BUDDING")
                .revisionCount(1)
                .publishedAt(null)
                .translationPostId(sourcePost.getId()) // 新文章的 translationPostId 设为源文章 ID
                .build();

        save(derivedPost);

        // 复制标签关联
        List<Long> sourceTagIds = postTagMapper.selectTagIdsByPostId(sourcePost.getId());
        if (sourceTagIds != null && !sourceTagIds.isEmpty()) {
            for (Long tagId : sourceTagIds) {
                postTagMapper.insert(new PostTag(derivedPost.getId(), tagId));
            }
        }

        // 双向互联：源文章写回更新 translation_post_id 为新文章 ID
        sourcePost.setTranslationPostId(derivedPost.getId());
        updateById(sourcePost);

        return buildPostDetailVO(derivedPost);
    }

    private boolean isAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null) {
            if (!auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
                return false;
            }
            return auth.getAuthorities().stream()
                    .anyMatch(a -> "ROLE_ADMIN".equalsIgnoreCase(a.getAuthority()) || "ADMIN".equalsIgnoreCase(a.getAuthority()));
        }
        // 当 auth == null 时：若处于真实的 Web HTTP 请求中（带有有效 Request URI），严格 Fail-Closed 阻断匿名访问草稿
        // 若处于非 Web 请求的内部纯 Java 服务调用、后台异步任务或测试环境上下文，放行以支持内部处理与既有业务调用
        org.springframework.web.context.request.RequestAttributes reqAttr = RequestContextHolder.getRequestAttributes();
        if (reqAttr instanceof org.springframework.web.context.request.ServletRequestAttributes sra) {
            String uri = sra.getRequest().getRequestURI();
            if (org.springframework.util.StringUtils.hasText(uri)) {
                return false;
            }
        }
        return true;
    }

    @Override
    public PostDetailVO getPostBySlug(String slug) {
        Post post = getOne(new LambdaQueryWrapper<Post>().eq(Post::getSlug, slug));
        if (post == null) {
            throw new ResourceNotFoundException("文章不存在: " + slug);
        }

        // 非 PUBLISHED 状态且未经过 ADMIN 鉴权则拒绝访问
        if (!"PUBLISHED".equalsIgnoreCase(post.getStatus())) {
            if (!isAdmin()) {
                throw new ResourceNotFoundException("文章不存在或未发布: " + slug);
            }
        }

        // 递增浏览量
        baseMapper.incrementViewCount(post.getId());
        post.setViewCount((post.getViewCount() == null ? 0 : post.getViewCount()) + 1);

        return buildPostDetailVO(post);
    }

    private PostDetailVO buildPostDetailVO(Post post) {
        // 分类
        Category category = post.getCategoryId() != null ? categoryMapper.selectById(post.getCategoryId()) : null;

        // 标签
        List<Long> tagIds = postTagMapper.selectTagIdsByPostId(post.getId());
        List<Tag> tags = tagIds.isEmpty() ? Collections.emptyList() : tagMapper.selectBatchIds(tagIds);

        // 上一篇 (同一发布状态下，发布时间早于当前)
        Post prev = null;
        Post next = null;
        List<Post> related = Collections.emptyList();
        if (post.getPublishedAt() != null) {
            prev = getOne(new LambdaQueryWrapper<Post>()
                    .eq(Post::getStatus, "PUBLISHED")
                    .lt(Post::getPublishedAt, post.getPublishedAt())
                    .orderByDesc(Post::getPublishedAt)
                    .last("LIMIT 1"));

            // 下一篇 (同一发布状态下，发布时间晚于当前)
            next = getOne(new LambdaQueryWrapper<Post>()
                    .eq(Post::getStatus, "PUBLISHED")
                    .gt(Post::getPublishedAt, post.getPublishedAt())
                    .orderByAsc(Post::getPublishedAt)
                    .last("LIMIT 1"));
        }

        // 相关推荐 (同分类下的其他已发布文章)
        if (post.getCategoryId() != null) {
            related = list(new LambdaQueryWrapper<Post>()
                    .eq(Post::getStatus, "PUBLISHED")
                    .eq(Post::getCategoryId, post.getCategoryId())
                    .ne(Post::getId, post.getId())
                    .orderByDesc(Post::getPublishedAt)
                    .last("LIMIT 3"));
        }

        // 关联译文信息
        Long transId = post.getTranslationPostId();
        String transSlug = null;
        String transTitle = null;
        String transLang = null;
        PostDetailVO.TranslationPostVO transVO = null;

        if (transId != null) {
            Post transPost = getById(transId);
            if (transPost != null) {
                transSlug = transPost.getSlug();
                transTitle = transPost.getTitle();
                transLang = transPost.getLang();
                transVO = PostDetailVO.TranslationPostVO.builder()
                        .id(transPost.getId())
                        .title(transPost.getTitle())
                        .slug(transPost.getSlug())
                        .lang(transPost.getLang())
                        .status(transPost.getStatus())
                        .build();
            }
        }

        return PostDetailVO.builder()
                .id(post.getId())
                .title(post.getTitle())
                .slug(post.getSlug())
                .excerpt(post.getExcerpt())
                .content(post.getContent())
                .cover(post.getCover())
                .categoryId(post.getCategoryId())
                .category(category)
                .tags(tags)
                .status(post.getStatus())
                .featured(post.getFeatured())
                .readingTime(post.getReadingTime())
                .viewCount(post.getViewCount() != null ? post.getViewCount() : 0)
                .likeCount(post.getLikeCount() != null ? post.getLikeCount() : 0)
                .lang(post.getLang() != null ? post.getLang() : "zh")
                .maturity(post.getMaturity() != null ? post.getMaturity() : "BUDDING")
                .revisionCount(post.getRevisionCount() != null ? post.getRevisionCount() : 1)
                .translationPostId(transId)
                .translationPostSlug(transSlug)
                .translationPostTitle(transTitle)
                .translationPostLang(transLang)
                .translationPost(transVO)
                .seoTitle(post.getSeoTitle())
                .seoDescription(post.getSeoDescription())
                .aiRadarJson(post.getAiRadarJson())
                .publishedAt(post.getPublishedAt())
                .createdAt(post.getCreatedAt())
                .updatedAt(post.getUpdatedAt())
                .prevPost(prev != null ? PostDetailVO.PostNavVO.builder().id(prev.getId()).title(prev.getTitle()).slug(prev.getSlug()).cover(prev.getCover()).build() : null)
                .nextPost(next != null ? PostDetailVO.PostNavVO.builder().id(next.getId()).title(next.getTitle()).slug(next.getSlug()).cover(next.getCover()).build() : null)
                .relatedPosts(related.stream().map(r -> PostDetailVO.PostNavVO.builder().id(r.getId()).title(r.getTitle()).slug(r.getSlug()).cover(r.getCover()).build()).collect(Collectors.toList()))
                .build();
    }

    @Override
    public Post getPostById(Long id) {
        Post post = getById(id);
        if (post == null) {
            throw new ResourceNotFoundException("文章不存在");
        }

        // 非 PUBLISHED 状态且未经过 ADMIN 鉴权则拒绝访问
        if (!"PUBLISHED".equalsIgnoreCase(post.getStatus())) {
            if (!isAdmin()) {
                throw new ResourceNotFoundException("文章不存在或未发布");
            }
        }

        return post;
    }

    @Override
    public List<PostListVO> getFeaturedPosts(int limit) {
        List<Post> posts = list(new LambdaQueryWrapper<Post>()
                .eq(Post::getStatus, "PUBLISHED")
                .eq(Post::getFeatured, 1)
                .orderByDesc(Post::getPublishedAt)
                .orderByDesc(Post::getCreatedAt)
                .last("LIMIT " + limit));
        return convertToListVO(posts);
    }

    @Override
    public List<PostListVO> getLatestPosts(int limit) {
        List<Post> posts = list(new LambdaQueryWrapper<Post>()
                .eq(Post::getStatus, "PUBLISHED")
                .orderByDesc(Post::getPublishedAt)
                .orderByDesc(Post::getCreatedAt)
                .last("LIMIT " + limit));
        return convertToListVO(posts);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long createPost(PostCreateUpdateRequest request) {
        String slug = StringUtils.hasText(request.getSlug())
                ? request.getSlug().trim()
                : generateSlug(request.getTitle());

        long count = count(new LambdaQueryWrapper<Post>().eq(Post::getSlug, slug));
        if (count > 0) {
            slug = slug + "-" + System.currentTimeMillis() % 10000;
        }

        int readingTime = request.getReadingTime() != null && request.getReadingTime() > 0
                ? request.getReadingTime()
                : Math.max(1, request.getContent().length() / 400);

        String status = StringUtils.hasText(request.getStatus()) ? request.getStatus().toUpperCase() : "DRAFT";
        LocalDateTime publishedAt = request.getPublishedAt();
        if ("PUBLISHED".equals(status) && publishedAt == null) {
            publishedAt = LocalDateTime.now();
        }

        Post post = Post.builder()
                .title(request.getTitle())
                .slug(slug)
                .excerpt(request.getExcerpt())
                .content(request.getContent())
                .cover(request.getCover())
                .categoryId(request.getCategoryId())
                .status(status)
                .featured(request.getFeatured() != null ? request.getFeatured() : 0)
                .readingTime(readingTime)
                .viewCount(0)
                .likeCount(0)
                .lang(StringUtils.hasText(request.getLang()) ? request.getLang().toLowerCase() : "zh")
                .translationPostId(request.getTranslationPostId())
                .maturity(StringUtils.hasText(request.getMaturity()) ? request.getMaturity().toUpperCase() : "BUDDING")
                .revisionCount(request.getRevisionCount() != null ? request.getRevisionCount() : 1)
                .seoTitle(request.getSeoTitle())
                .seoDescription(request.getSeoDescription())
                .aiRadarJson(request.getAiRadarJson())
                .publishedAt(publishedAt)
                .build();

        save(post);

        // 如果手动指定了关联译文，且该译文存在，则建立双向互联
        if (request.getTranslationPostId() != null) {
            Post target = getById(request.getTranslationPostId());
            if (target != null) {
                target.setTranslationPostId(post.getId());
                updateById(target);
            }
        }

        // 关联标签
        updatePostTags(post.getId(), request.getTagIds());

        return post.getId();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updatePost(Long id, PostCreateUpdateRequest request) {
        Post existing = getById(id);
        if (existing == null) {
            throw new BusinessException(404, "文章不存在");
        }

        // 处理 translationPostId 变更或解绑
        Long newTransId = request.getTranslationPostId();
        Long oldTransId = existing.getTranslationPostId();
        if (!Objects.equals(newTransId, oldTransId)) {
            // 1. 若原来绑了旧文章，将旧文章的 translation_post_id 置空
            if (oldTransId != null) {
                update(new LambdaUpdateWrapper<Post>()
                        .set(Post::getTranslationPostId, null)
                        .eq(Post::getId, oldTransId));
            }
            // 2. 若指定了新的关联文章
            if (newTransId != null) {
                if (newTransId.equals(id)) {
                    throw new BusinessException(400, "不能将文章关联到自身");
                }
                Post targetPost = getById(newTransId);
                if (targetPost == null) {
                    throw new BusinessException(404, "关联的目标文章不存在: " + newTransId);
                }
                // 若目标文章原有关联了其他文章，将第三方文章的 translation_post_id 置空
                if (targetPost.getTranslationPostId() != null && !targetPost.getTranslationPostId().equals(id)) {
                    update(new LambdaUpdateWrapper<Post>()
                            .set(Post::getTranslationPostId, null)
                            .eq(Post::getId, targetPost.getTranslationPostId()));
                }
                // 设置目标文章的 translation_post_id 为当前文章 id
                targetPost.setTranslationPostId(id);
                updateById(targetPost);
            }
            existing.setTranslationPostId(newTransId);
            update(new LambdaUpdateWrapper<Post>()
                    .set(Post::getTranslationPostId, newTransId)
                    .eq(Post::getId, id));
        }

        if (StringUtils.hasText(request.getSlug()) && !request.getSlug().equals(existing.getSlug())) {
            long count = count(new LambdaQueryWrapper<Post>()
                    .eq(Post::getSlug, request.getSlug())
                    .ne(Post::getId, id));
            if (count > 0) {
                throw new BusinessException(409, "文章 Slug 已被占用: " + request.getSlug());
            }
            existing.setSlug(request.getSlug());
        }

        if (request.getTitle() != null) existing.setTitle(request.getTitle());
        if (request.getExcerpt() != null) existing.setExcerpt(request.getExcerpt());
        if (request.getContent() != null) {
            existing.setContent(request.getContent());
            existing.setReadingTime(request.getReadingTime() != null ? request.getReadingTime() : Math.max(1, request.getContent().length() / 400));
        }
        if (request.getCover() != null) existing.setCover(request.getCover());
        if (request.getCategoryId() != null) existing.setCategoryId(request.getCategoryId());
        if (request.getStatus() != null) {
            String newStatus = request.getStatus().toUpperCase();
            if ("PUBLISHED".equals(newStatus) && existing.getPublishedAt() == null) {
                existing.setPublishedAt(LocalDateTime.now());
            }
            existing.setStatus(newStatus);
        }
        if (request.getFeatured() != null) existing.setFeatured(request.getFeatured());
        if (request.getLang() != null) existing.setLang(request.getLang().toLowerCase());
        if (request.getPublishedAt() != null) existing.setPublishedAt(request.getPublishedAt());
        if (request.getSeoTitle() != null) existing.setSeoTitle(request.getSeoTitle());
        if (request.getSeoDescription() != null) existing.setSeoDescription(request.getSeoDescription());
        if (request.getAiRadarJson() != null) existing.setAiRadarJson(request.getAiRadarJson());
        if (request.getMaturity() != null) existing.setMaturity(request.getMaturity().toUpperCase());
        existing.setRevisionCount(existing.getRevisionCount() != null ? existing.getRevisionCount() + 1 : 1);

        updateById(existing);

        // 更新标签关联
        if (request.getTagIds() != null) {
            updatePostTags(id, request.getTagIds());
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deletePost(Long id) {
        // 级联解绑安全逻辑：删除文章时，将以此文章为 translation_post_id 的关联文章字段置为 NULL，防止悬空外键
        update(new LambdaUpdateWrapper<Post>()
                .set(Post::getTranslationPostId, null)
                .eq(Post::getTranslationPostId, id));

        // 同时也解除当前文章指向对端的关联（若有）
        Post current = getById(id);
        if (current != null && current.getTranslationPostId() != null) {
            update(new LambdaUpdateWrapper<Post>()
                    .set(Post::getTranslationPostId, null)
                    .eq(Post::getId, current.getTranslationPostId()));
        }

        postTagMapper.deleteByPostId(id);
        removeById(id);
    }

    @Override
    public void updateStatus(Long id, String status) {
        Post post = getById(id);
        if (post == null) throw new BusinessException(404, "文章不存在");
        post.setStatus(status.toUpperCase());
        if ("PUBLISHED".equalsIgnoreCase(status) && post.getPublishedAt() == null) {
            post.setPublishedAt(LocalDateTime.now());
        }
        updateById(post);
    }

    @Override
    public void updateFeatured(Long id, Integer featured) {
        Post post = getById(id);
        if (post == null) throw new BusinessException(404, "文章不存在");
        post.setFeatured(featured);
        updateById(post);
    }

    private void updatePostTags(Long postId, List<Long> tagIds) {
        postTagMapper.deleteByPostId(postId);
        if (tagIds != null && !tagIds.isEmpty()) {
            for (Long tagId : tagIds) {
                postTagMapper.insert(new PostTag(postId, tagId));
            }
        }
    }

    private List<PostListVO> convertToListVO(List<Post> posts) {
        if (posts.isEmpty()) return Collections.emptyList();

        // 批量查询分类
        Set<Long> categoryIds = posts.stream().map(Post::getCategoryId).filter(Objects::nonNull).collect(Collectors.toSet());
        Map<Long, Category> categoryMap = categoryIds.isEmpty() ? Collections.emptyMap()
                : categoryMapper.selectBatchIds(categoryIds).stream().collect(Collectors.toMap(Category::getId, c -> c));

        // 批量查询关联译文信息
        Set<Long> transIds = posts.stream().map(Post::getTranslationPostId).filter(Objects::nonNull).collect(Collectors.toSet());
        Map<Long, Post> transMap = transIds.isEmpty() ? Collections.emptyMap()
                : listByIds(transIds).stream().collect(Collectors.toMap(Post::getId, p -> p));

        // 标签查询
        return posts.stream().map(p -> {
            List<Long> tagIds = postTagMapper.selectTagIdsByPostId(p.getId());
            List<Tag> tags = tagIds.isEmpty() ? Collections.emptyList() : tagMapper.selectBatchIds(tagIds);

            Post trans = p.getTranslationPostId() != null ? transMap.get(p.getTranslationPostId()) : null;

            return PostListVO.builder()
                    .id(p.getId())
                    .title(p.getTitle())
                    .slug(p.getSlug())
                    .excerpt(p.getExcerpt())
                    .cover(p.getCover())
                    .categoryId(p.getCategoryId())
                    .category(categoryMap.get(p.getCategoryId()))
                    .tags(tags)
                    .status(p.getStatus())
                    .featured(p.getFeatured())
                    .readingTime(p.getReadingTime())
                    .viewCount(p.getViewCount())
                    .likeCount(p.getLikeCount() != null ? p.getLikeCount() : 0)
                    .lang(p.getLang() != null ? p.getLang() : "zh")
                    .translationPostId(p.getTranslationPostId())
                    .translationPostSlug(trans != null ? trans.getSlug() : null)
                    .translationPostTitle(trans != null ? trans.getTitle() : null)
                    .maturity(p.getMaturity() != null ? p.getMaturity() : "BUDDING")
                    .revisionCount(p.getRevisionCount() != null ? p.getRevisionCount() : 1)
                    .publishedAt(p.getPublishedAt())
                    .createdAt(p.getCreatedAt())
                    .updatedAt(p.getUpdatedAt())
                    .build();
        }).collect(Collectors.toList());
    }

    @Override
    public void likePost(Long id) {
        Post post = getById(id);
        if (post == null) {
            throw new BusinessException(404, "文章不存在");
        }
        baseMapper.incrementLikeCount(id);
    }

    private String generateSlug(String title) {
        String slug = title.toLowerCase().replaceAll("[^a-z0-9\\u4e00-\\u9fa5]+", "-").replaceAll("^-|-$", "");
        if (!StringUtils.hasText(slug)) {
            slug = "post-" + System.currentTimeMillis();
        }
        return slug;
    }
}
