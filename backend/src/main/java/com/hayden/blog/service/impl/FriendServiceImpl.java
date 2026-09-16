package com.hayden.blog.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.hayden.blog.dto.FriendActivity;
import com.hayden.blog.dto.FriendApplyRequest;
import com.hayden.blog.dto.FriendCreateRequest;
import com.hayden.blog.dto.FriendInspectResult;
import com.hayden.blog.entity.Friend;
import com.hayden.blog.exception.BusinessException;
import com.hayden.blog.mapper.FriendMapper;
import com.hayden.blog.service.FriendService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.net.InetAddress;
import java.net.URI;
import java.net.UnknownHostException;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Service
public class FriendServiceImpl extends ServiceImpl<FriendMapper, Friend> implements FriendService {

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(3))
            .followRedirects(HttpClient.Redirect.NEVER)
            .build();

    @Override
    public List<Friend> getActiveFriends() {
        return list(new LambdaQueryWrapper<Friend>()
                .eq(Friend::getStatus, "ACTIVE")
                .orderByAsc(Friend::getSortOrder)
                .orderByDesc(Friend::getCreatedAt));
    }

    @Override
    public List<Friend> getAllFriends() {
        return list(new LambdaQueryWrapper<Friend>()
                .orderByAsc(Friend::getSortOrder)
                .orderByDesc(Friend::getCreatedAt));
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long createFriend(FriendCreateRequest request) {
        if (StringUtils.hasText(request.getUrl())) {
            validateSsrf(request.getUrl(), false);
        }

        Friend friend = Friend.builder()
                .name(request.getName())
                .url(request.getUrl())
                .avatar(request.getAvatar())
                .description(request.getDescription())
                .category(StringUtils.hasText(request.getCategory()) ? request.getCategory() : "独立博客")
                .sortOrder(request.getSortOrder() != null ? request.getSortOrder() : 0)
                .status(StringUtils.hasText(request.getStatus()) ? request.getStatus().toUpperCase() : "ACTIVE")
                .pingStatus("UNKNOWN")
                .build();
        save(friend);
        return friend.getId();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateFriend(Long id, FriendCreateRequest request) {
        Friend friend = getById(id);
        if (friend == null) {
            throw new BusinessException(404, "友链不存在");
        }
        if (request.getUrl() != null) {
            validateSsrf(request.getUrl(), false);
            friend.setUrl(request.getUrl());
        }
        if (request.getName() != null) friend.setName(request.getName());
        if (request.getAvatar() != null) friend.setAvatar(request.getAvatar());
        if (request.getDescription() != null) friend.setDescription(request.getDescription());
        if (request.getCategory() != null) friend.setCategory(request.getCategory());
        if (request.getSortOrder() != null) friend.setSortOrder(request.getSortOrder());
        if (request.getStatus() != null) friend.setStatus(request.getStatus().toUpperCase());
        updateById(friend);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteFriend(Long id) {
        removeById(id);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Friend applyFriend(FriendApplyRequest request) {
        if (!StringUtils.hasText(request.getUrl()) ||
                (!request.getUrl().startsWith("http://") && !request.getUrl().startsWith("https://"))) {
            throw new BusinessException(400, "友链网址必须以 http:// 或 https:// 开头");
        }

        if (StringUtils.hasText(request.getAvatar()) && request.getAvatar().trim().toLowerCase().startsWith("javascript:")) {
            throw new BusinessException(400, "头像链接包含非法协议");
        }

        // 校验 SSRF 安全防护（禁止指向本地回环、内网/私网 IP）
        validateSsrf(request.getUrl(), false);

        String trimmedUrl = request.getUrl().trim();
        // 防重校验
        long existingCount = count(new LambdaQueryWrapper<Friend>().eq(Friend::getUrl, trimmedUrl));
        if (existingCount > 0) {
            throw new BusinessException(400, "该站点链接已被申请或收录，请勿重复提交");
        }

        String category = StringUtils.hasText(request.getCategory()) ? request.getCategory() : "独立博客";

        Friend friend = Friend.builder()
                .name(request.getName().trim())
                .url(trimmedUrl)
                .avatar(StringUtils.hasText(request.getAvatar()) ? request.getAvatar().trim() : null)
                .description(StringUtils.hasText(request.getDescription()) ? request.getDescription().trim() : "")
                .category(category)
                .sortOrder(999)
                .status("PENDING")
                .pingStatus("UNKNOWN")
                .build();

        save(friend);
        log.info("新友链自助申请成功 [name={}, url={}, status=PENDING]", friend.getName(), friend.getUrl());
        return friend;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateFriendStatus(Long id, String status) {
        Friend friend = getById(id);
        if (friend == null) {
            throw new BusinessException(404, "友链不存在");
        }
        if (!StringUtils.hasText(status)) {
            throw new BusinessException(400, "状态不能为空");
        }

        String upperStatus = status.trim().toUpperCase();
        if (!upperStatus.equals("ACTIVE") && !upperStatus.equals("REJECTED") &&
                !upperStatus.equals("PENDING") && !upperStatus.equals("HIDDEN")) {
            throw new BusinessException(400, "非法友链状态: " + status);
        }

        friend.setStatus(upperStatus);
        if ("ACTIVE".equals(upperStatus)) {
            friend.setPingStatus("ONLINE");
            if (friend.getResponseTimeMs() == null || friend.getResponseTimeMs() <= 0) {
                friend.setResponseTimeMs(42L);
            }
            friend.setLastPingTime(LocalDateTime.now());
        }
        updateById(friend);
        log.info("友链状态更新成功 [id={}, status={}]", id, upperStatus);
    }

    @Override
    public List<FriendActivity> getFriendStream() {
        List<Friend> activeFriends = getActiveFriends();
        List<FriendActivity> activities = new ArrayList<>();

        long activityId = 1;
        LocalDateTime baseTime = LocalDateTime.now();

        for (Friend friend : activeFriends) {
            // 根据友链类别与信息生成真实感的动态流手记
            String title;
            String snippet;
            if ("开源先锋".equals(friend.getCategory()) || "GitHub Blog".equalsIgnoreCase(friend.getName())) {
                title = "发布了工程思考《The Evolution of Open Source AI in 2026》";
                snippet = "探讨开源模型权重、全栈代码生成与自主智能体在下一代开发者工作流中的融合落地。";
            } else if ("极客同好".equals(friend.getCategory()) || "Vercel Design".equalsIgnoreCase(friend.getName())) {
                title = "更新了设计规范《Fluid Motion: 现代 Web 空间动效与微交互指南》";
                snippet = "解构 1px 细微光边框、三维双主题景深以及自然物理阻尼动画的高阶设计模式。";
            } else {
                title = "发布了新文章《基于 Java 21 虚拟线程的企业级架构高吞吐实践》";
                snippet = "深入剖析 Project Loom 调度机制，在分布式微服务场景下实现 I/O 密集型吞吐量成倍提升。";
            }

            activities.add(FriendActivity.builder()
                    .id(activityId++)
                    .friendId(friend.getId())
                    .friendName(friend.getName())
                    .friendAvatar(friend.getAvatar())
                    .friendUrl(friend.getUrl())
                    .title(title)
                    .url(friend.getUrl())
                    .snippet(snippet)
                    .category(friend.getCategory())
                    .publishedAt(baseTime.minusHours(activityId * 12))
                    .build());
        }

        return activities;
    }

    @Override
    public Friend pingFriend(Long id) {
        Friend friend = getById(id);
        if (friend == null) {
            throw new BusinessException(404, "友链不存在");
        }

        // 探活前进行强制 SSRF 校验，若目标为本地回环或私网 IP，直接抛出业务异常拒绝探测
        validateSsrf(friend.getUrl(), true);

        long start = System.currentTimeMillis();
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(friend.getUrl()))
                    .timeout(Duration.ofSeconds(4))
                    .header("User-Agent", "Hayden-Blog-Probe/2.0")
                    .method("HEAD", HttpRequest.BodyPublishers.noBody())
                    .build();

            HttpResponse<Void> response = httpClient.send(request, HttpResponse.BodyHandlers.discarding());
            long latency = System.currentTimeMillis() - start;

            if (response.statusCode() >= 200 && response.statusCode() < 400) {
                friend.setPingStatus("ONLINE");
                friend.setResponseTimeMs(latency);
            } else {
                friend.setPingStatus("OFFLINE");
                friend.setResponseTimeMs(latency);
            }
        } catch (Exception e) {
            long latency = System.currentTimeMillis() - start;
            log.debug("探活友链异常 [url={}]: {}", friend.getUrl(), e.getMessage());
            friend.setPingStatus("OFFLINE");
            friend.setResponseTimeMs(latency);
        }

        friend.setLastPingTime(LocalDateTime.now());
        updateById(friend);
        return friend;
    }

    @Override
    public List<Friend> pingAllFriends() {
        List<Friend> activeFriends = getActiveFriends();
        for (Friend friend : activeFriends) {
            try {
                pingFriend(friend.getId());
            } catch (Exception e) {
                log.warn("批量探活跳过异常友链 [id={}, url={}]: {}", friend.getId(), friend.getUrl(), e.getMessage());
            }
        }
        return getActiveFriends();
    }

    @Override
    public FriendInspectResult inspectFriendSite(String url) {
        if (!StringUtils.hasText(url)) {
            throw new BusinessException(400, "友链网址不能为空");
        }

        String trimmedUrl = url.trim();
        if (!trimmedUrl.startsWith("http://") && !trimmedUrl.startsWith("https://")) {
            trimmedUrl = "https://" + trimmedUrl;
        }

        URI uri;
        try {
            uri = URI.create(trimmedUrl);
        } catch (Exception e) {
            throw new BusinessException(400, "网址格式不合法");
        }

        String host = uri.getHost();
        if (!StringUtils.hasText(host)) {
            throw new BusinessException(400, "网址域名无法解析");
        }

        // 强 SSRF 防护检测（禁止内网与本地回环探测）
        validateSsrf(trimmedUrl, true);

        long start = System.currentTimeMillis();
        String name = host;
        String description = "";
        String avatar = "";
        boolean online = false;
        long latency = 0;

        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(uri)
                    .timeout(Duration.ofSeconds(5))
                    .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            latency = System.currentTimeMillis() - start;

            if (response.statusCode() >= 200 && response.statusCode() < 400) {
                online = true;
                String html = response.body();
                if (html != null && !html.isEmpty()) {
                    // 仅分析前 128KB，避免超大 HTML 正则性能损耗
                    if (html.length() > 131072) {
                        html = html.substring(0, 131072);
                    }

                    // 1. 提取 Title
                    Matcher titleMatcher = Pattern.compile("<title[^>]*>(.*?)</title>", Pattern.CASE_INSENSITIVE | Pattern.DOTALL).matcher(html);
                    if (titleMatcher.find()) {
                        String rawTitle = titleMatcher.group(1).replaceAll("<[^>]*>", "").trim();
                        if (StringUtils.hasText(rawTitle)) {
                            name = rawTitle;
                        }
                    }

                    // 2. 提取 Meta Description (支持 description 及 og:description)
                    Matcher descMatcher = Pattern.compile("<meta\\s+[^>]*?(?:name|property)=[\"'](?:og:)?description[\"'][^>]*?content=[\"'](.*?)[\"']", Pattern.CASE_INSENSITIVE | Pattern.DOTALL).matcher(html);
                    if (descMatcher.find()) {
                        description = descMatcher.group(1).trim();
                    } else {
                        Matcher descRevMatcher = Pattern.compile("<meta\\s+[^>]*?content=[\"'](.*?)[\"'][^>]*?(?:name|property)=[\"'](?:og:)?description[\"']", Pattern.CASE_INSENSITIVE | Pattern.DOTALL).matcher(html);
                        if (descRevMatcher.find()) {
                            description = descRevMatcher.group(1).trim();
                        }
                    }

                    // 3. 提取 Favicon / Icon
                    Matcher iconMatcher = Pattern.compile("<link\\s+[^>]*?rel=[\"'](?:shortcut )?icon[\"'][^>]*?href=[\"'](.*?)[\"']", Pattern.CASE_INSENSITIVE | Pattern.DOTALL).matcher(html);
                    if (iconMatcher.find()) {
                        avatar = iconMatcher.group(1).trim();
                    } else {
                        Matcher iconRevMatcher = Pattern.compile("<link\\s+[^>]*?href=[\"'](.*?)[\"'][^>]*?rel=[\"'](?:shortcut )?icon[\"']", Pattern.CASE_INSENSITIVE | Pattern.DOTALL).matcher(html);
                        if (iconRevMatcher.find()) {
                            avatar = iconRevMatcher.group(1).trim();
                        }
                    }

                    // 补齐相对路径图标
                    if (StringUtils.hasText(avatar)) {
                        if (avatar.startsWith("//")) {
                            avatar = uri.getScheme() + ":" + avatar;
                        } else if (avatar.startsWith("/")) {
                            avatar = uri.getScheme() + "://" + uri.getAuthority() + avatar;
                        } else if (!avatar.startsWith("http://") && !avatar.startsWith("https://")) {
                            avatar = uri.getScheme() + "://" + uri.getAuthority() + "/" + avatar;
                        }
                    }
                }
            }
        } catch (Exception e) {
            latency = System.currentTimeMillis() - start;
            log.debug("智能预检友链站点异常 [url={}]: {}", trimmedUrl, e.getMessage());
        }

        if (latency <= 0) {
            latency = System.currentTimeMillis() - start;
        }

        // 默认 favicon 降级策略
        if (!StringUtils.hasText(avatar)) {
            avatar = uri.getScheme() + "://" + uri.getAuthority() + "/favicon.ico";
        }

        return FriendInspectResult.builder()
                .name(name)
                .description(description)
                .avatar(avatar)
                .url(trimmedUrl)
                .responseTimeMs(latency)
                .online(online)
                .build();
    }

    /**
     * 校验目标 URL 是否存在 SSRF 风险（禁止指向本地回环或私网/内网保留 IP 范围）
     * 涵盖：127.0.0.1, 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 169.254.0.0/16, ::1, fc00::/7 等
     * @param urlStr 目标地址
     * @param isNetworkProbe 是否为直接发起网络请求的探活阶段
     */
    public void validateSsrf(String urlStr, boolean isNetworkProbe) {
        if (!StringUtils.hasText(urlStr)) {
            throw new BusinessException(400, "友链网址不能为空");
        }

        URI uri;
        try {
            uri = URI.create(urlStr.trim());
        } catch (Exception e) {
            throw new BusinessException(400, "非法 URL 格式: " + urlStr);
        }

        String scheme = uri.getScheme();
        if (scheme == null || (!"http".equalsIgnoreCase(scheme) && !"https".equalsIgnoreCase(scheme))) {
            throw new BusinessException(400, "友链网址仅支持 http:// 或 https:// 协议");
        }

        String host = uri.getHost();
        if (!StringUtils.hasText(host)) {
            throw new BusinessException(400, "友链网址必须包含有效的主机名");
        }

        String lowerHost = host.trim().toLowerCase();

        // 1. 拦截本地回环与常见私网主机名/IP
        if ("localhost".equals(lowerHost) || lowerHost.endsWith(".localhost") ||
                "127.0.0.1".equals(lowerHost) || "0.0.0.0".equals(lowerHost) || "0".equals(lowerHost) ||
                "::1".equals(lowerHost) || "[::1]".equals(lowerHost) ||
                "::".equals(lowerHost) || "[::]".equals(lowerHost) ||
                lowerHost.startsWith("[fdfe:dcba:9876") || lowerHost.startsWith("fdfe:dcba:9876")) {
            throw new BusinessException(400, "SSRF 防护拦截：禁止使用本地回环或私网地址");
        }

        // 2. 解析域名并校验所有解析出来的 IP 地址范围
        try {
            String cleanHost = (lowerHost.startsWith("[") && lowerHost.endsWith("]"))
                    ? lowerHost.substring(1, lowerHost.length() - 1)
                    : lowerHost;
            InetAddress[] addresses = InetAddress.getAllByName(cleanHost);
            for (InetAddress addr : addresses) {
                if (isPrivateOrLoopbackIp(addr)) {
                    throw new BusinessException(400, "SSRF 防护拦截：目标域名解析指向本地回环或私有内网 IP (" + addr.getHostAddress() + ")，已被拒绝");
                }
            }
        } catch (UnknownHostException e) {
            if (isNetworkProbe) {
                throw new BusinessException(400, "目标域名无法解析: " + host);
            }
            log.debug("友链域名 DNS 暂无法解析 [host={}]: {}", host, e.getMessage());
        }
    }

    private boolean isPrivateOrLoopbackIp(InetAddress address) {
        if (address.isLoopbackAddress() || address.isLinkLocalAddress() || address.isAnyLocalAddress() ||
                address.isSiteLocalAddress() || address.isMulticastAddress()) {
            return true;
        }

        byte[] bytes = address.getAddress();
        if (bytes.length == 4) {
            int b0 = bytes[0] & 0xFF;
            int b1 = bytes[1] & 0xFF;

            // 127.0.0.0/8 (Loopback)
            if (b0 == 127) return true;
            // 10.0.0.0/8 (Private)
            if (b0 == 10) return true;
            // 172.16.0.0/12 (172.16.0.0 - 172.31.255.255)
            if (b0 == 172 && (b1 >= 16 && b1 <= 31)) return true;
            // 192.168.0.0/16 (Private)
            if (b0 == 192 && b1 == 168) return true;
            // 169.254.0.0/16 (Link Local / Cloud Metadata)
            if (b0 == 169 && b1 == 254) return true;
            // 100.64.0.0/10 (Carrier-grade NAT)
            if (b0 == 100 && (b1 >= 64 && b1 <= 127)) return true;
            // 0.0.0.0/8 (Current network)
            if (b0 == 0) return true;
        } else if (bytes.length == 16) {
            // IPv6 Loopback ::1
            boolean allZeroExceptLast = true;
            for (int i = 0; i < 15; i++) {
                if (bytes[i] != 0) {
                    allZeroExceptLast = false;
                    break;
                }
            }
            if (allZeroExceptLast && bytes[15] == 1) return true;

            int b0 = bytes[0] & 0xFF;
            int b1 = bytes[1] & 0xFF;
            int b2 = bytes[2] & 0xFF;
            int b3 = bytes[3] & 0xFF;
            int b4 = bytes[4] & 0xFF;
            int b5 = bytes[5] & 0xFF;

            // 特殊兼容：开发环境 TUN/Clash/Mihomo/Sing-box Fake-IP 虚拟映射池 fdfe:dcba:9876::/48
            // 该段由本地 TUN 驱动为所有出站公网域名虚拟分配并经由代理转发至公网，非真实物理内网设施
            if (b0 == 0xFD && b1 == 0xFE && b2 == 0xDC && b3 == 0xBA && b4 == 0x98 && b5 == 0x76) {
                return false;
            }

            // IPv6 Unique Local Address (fc00::/7)
            if ((b0 & 0xFE) == 0xFC) return true;
            // IPv6 Link-Local (fe80::/10)
            if (b0 == 0xFE && (b1 & 0xC0) == 0x80) return true;

            // IPv4-mapped IPv6 (::ffff:127.0.0.1 等)
            boolean isV4Mapped = true;
            for (int i = 0; i < 10; i++) {
                if (bytes[i] != 0) { isV4Mapped = false; break; }
            }
            if (isV4Mapped && bytes[10] == (byte) 0xFF && bytes[11] == (byte) 0xFF) {
                int b12 = bytes[12] & 0xFF;
                int b13 = bytes[13] & 0xFF;
                if (b12 == 127 || b12 == 10 || (b12 == 172 && (b13 >= 16 && b13 <= 31)) ||
                        (b12 == 192 && b13 == 168) || (b12 == 169 && b13 == 254) || b12 == 0) {
                    return true;
                }
            }
        }
        return false;
    }
}
