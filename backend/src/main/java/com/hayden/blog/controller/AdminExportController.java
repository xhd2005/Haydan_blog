package com.hayden.blog.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hayden.blog.entity.*;
import com.hayden.blog.mapper.PostTagMapper;
import com.hayden.blog.service.*;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

/**
 * 全站数据资产与博文流式导出控制器
 * 严格保护站长资产，生成标准 YAML Frontmatter，作者严格且唯一标识为 Hayden Xue。
 */
@Slf4j
@RestController
@RequestMapping("/api/admin/export")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminExportController {

    private final PostService postService;
    private final CategoryService categoryService;
    private final TagService tagService;
    private final PostTagMapper postTagMapper;
    private final ProjectService projectService;
    private final JourneyService journeyService;
    private final MemoService memoService;
    private final NowService nowService;
    private final FriendService friendService;
    private final SiteSettingService siteSettingService;
    private final ObjectMapper objectMapper;

    /**
     * 流式导出全部博文为 .zip 压缩包
     * 每篇博文包含规范 YAML Frontmatter，作者为 Hayden Xue
     */
    @GetMapping("/posts-zip")
    public void exportPostsZip(HttpServletResponse response) throws IOException {
        long timestamp = System.currentTimeMillis();
        String zipFilename = "hayden_blog_posts_backup_" + timestamp + ".zip";

        response.setContentType("application/zip");
        response.setHeader("Content-Disposition", "attachment; filename=\"" + zipFilename + "\"");
        response.setHeader("Access-Control-Expose-Headers", "Content-Disposition");

        List<Post> posts = postService.list();
        Map<Long, String> categoryMap = categoryService.list().stream()
                .filter(c -> c.getId() != null && c.getName() != null)
                .collect(Collectors.toMap(Category::getId, Category::getName, (existing, replacement) -> existing));

        Map<Long, String> tagMap = tagService.list().stream()
                .filter(t -> t.getId() != null && t.getName() != null)
                .collect(Collectors.toMap(Tag::getId, Tag::getName, (existing, replacement) -> existing));

        Set<String> usedFilenames = new HashSet<>();

        try (ZipOutputStream zipOut = new ZipOutputStream(response.getOutputStream(), StandardCharsets.UTF_8)) {
            for (Post post : posts) {
                String baseSlug = StringUtils.hasText(post.getSlug())
                        ? post.getSlug().trim().replaceAll("[^a-zA-Z0-9_\\-\\.]", "_")
                        : "post_" + post.getId();
                if (baseSlug.isBlank()) {
                    baseSlug = "post_" + post.getId();
                }

                String entryName = baseSlug + ".md";
                int deduplicateCounter = 2;
                while (usedFilenames.contains(entryName.toLowerCase())) {
                    entryName = baseSlug + "_" + deduplicateCounter + ".md";
                    deduplicateCounter++;
                }
                usedFilenames.add(entryName.toLowerCase());

                // 获取分类与标签
                String categoryName = post.getCategoryId() != null ? categoryMap.get(post.getCategoryId()) : null;
                List<Long> tagIds = postTagMapper.selectTagIdsByPostId(post.getId());
                List<String> tagNames = new ArrayList<>();
                if (tagIds != null) {
                    for (Long tId : tagIds) {
                        String tName = tagMap.get(tId);
                        if (tName != null) {
                            tagNames.add(tName);
                        }
                    }
                }

                // 拼装标准 YAML Frontmatter
                StringBuilder mdBuilder = new StringBuilder();
                mdBuilder.append("---\n");
                mdBuilder.append("title: \"").append(escapeYaml(post.getTitle())).append("\"\n");
                mdBuilder.append("slug: \"").append(escapeYaml(post.getSlug())).append("\"\n");

                LocalDateTime dateVal = post.getPublishedAt() != null ? post.getPublishedAt() : post.getCreatedAt();
                if (dateVal != null) {
                    mdBuilder.append("date: \"").append(dateVal.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)).append("\"\n");
                } else {
                    mdBuilder.append("date: \"\"\n");
                }

                if (StringUtils.hasText(categoryName)) {
                    mdBuilder.append("categories:\n");
                    mdBuilder.append("  - \"").append(escapeYaml(categoryName)).append("\"\n");
                } else {
                    mdBuilder.append("categories: []\n");
                }

                if (!tagNames.isEmpty()) {
                    mdBuilder.append("tags:\n");
                    for (String tName : tagNames) {
                        mdBuilder.append("  - \"").append(escapeYaml(tName)).append("\"\n");
                    }
                } else {
                    mdBuilder.append("tags: []\n");
                }

                if (StringUtils.hasText(post.getExcerpt())) {
                    mdBuilder.append("summary: \"").append(escapeYaml(post.getExcerpt())).append("\"\n");
                }

                if (StringUtils.hasText(post.getCover())) {
                    mdBuilder.append("cover: \"").append(escapeYaml(post.getCover())).append("\"\n");
                }

                mdBuilder.append("lang: \"").append(post.getLang() != null ? post.getLang() : "zh").append("\"\n");
                mdBuilder.append("status: \"").append(post.getStatus() != null ? post.getStatus() : "DRAFT").append("\"\n");
                mdBuilder.append("maturity: \"").append(post.getMaturity() != null ? post.getMaturity() : "BUDDING").append("\"\n");
                mdBuilder.append("author: \"Hayden Xue\"\n");
                mdBuilder.append("---\n\n");

                if (StringUtils.hasText(post.getContent())) {
                    mdBuilder.append(post.getContent());
                }

                byte[] data = mdBuilder.toString().getBytes(StandardCharsets.UTF_8);
                ZipEntry entry = new ZipEntry(entryName);
                entry.setSize(data.length);
                zipOut.putNextEntry(entry);
                zipOut.write(data);
                zipOut.closeEntry();
            }

            zipOut.finish();
            zipOut.flush();
        } catch (Exception e) {
            log.error("流式导出博文 .zip 失败: {}", e.getMessage(), e);
            throw e;
        }
    }

    /**
     * 流式导出全站元数据 JSON 快照
     */
    @GetMapping("/snapshot-json")
    public void exportSnapshotJson(HttpServletResponse response) throws IOException {
        long timestamp = System.currentTimeMillis();
        String jsonFilename = "hayden_blog_snapshot_" + timestamp + ".json";

        response.setContentType("application/json; charset=UTF-8");
        response.setHeader("Content-Disposition", "attachment; filename=\"" + jsonFilename + "\"");
        response.setHeader("Access-Control-Expose-Headers", "Content-Disposition");

        Map<String, Object> snapshot = new LinkedHashMap<>();

        Map<String, Object> meta = new LinkedHashMap<>();
        meta.put("exportedAt", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        meta.put("version", "Hayden Studio 2026");
        meta.put("author", "Hayden Xue");
        meta.put("system", "Java 25 & Spring Boot 3.3");
        snapshot.put("meta", meta);

        snapshot.put("settings", siteSettingService.getSettings());
        snapshot.put("posts", postService.list());
        snapshot.put("categories", categoryService.list());
        snapshot.put("tags", tagService.list());
        snapshot.put("projects", projectService.list());
        snapshot.put("journeys", journeyService.list());
        snapshot.put("memos", memoService.list());
        snapshot.put("nowRecords", nowService.list());
        snapshot.put("friends", friendService.list());

        try {
            objectMapper.writerWithDefaultPrettyPrinter().writeValue(response.getOutputStream(), snapshot);
            response.flushBuffer();
        } catch (Exception e) {
            log.error("流式导出全站元数据 JSON 快照失败: {}", e.getMessage(), e);
            throw e;
        }
    }

    private String escapeYaml(String input) {
        if (input == null) return "";
        return input.replace("\"", "\\\"").replace("\n", " ");
    }
}
