package com.hayden.blog.security;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
public class CaptchaService {

    private static final String CHAR_POOL = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
    private static final int CODE_LENGTH = 4;
    private static final int WIDTH = 130;
    private static final int HEIGHT = 42;

    private final SecureRandom random = new SecureRandom();

    // 验证码缓存，5 分钟有效
    private final Cache<String, String> captchaCache = Caffeine.newBuilder()
            .expireAfterWrite(5, TimeUnit.MINUTES)
            .maximumSize(20000)
            .build();

    /**
     * 生成验证码，返回包含 captchaKey, captchaImage, imageBase64 的 Map
     */
    public Map<String, Object> generateCaptcha() {
        // 1. 生成随机字符
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < CODE_LENGTH; i++) {
            int idx = random.nextInt(CHAR_POOL.length());
            sb.append(CHAR_POOL.charAt(idx));
        }
        String code = sb.toString();
        String captchaKey = UUID.randomUUID().toString();

        // 2. 存入缓存
        captchaCache.put(captchaKey, code);

        // 3. 绘制图形验证码
        BufferedImage image = new BufferedImage(WIDTH, HEIGHT, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = image.createGraphics();

        // 开启抗锯齿
        g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);

        // 背景底色
        g.setColor(new Color(245, 247, 250));
        g.fillRect(0, 0, WIDTH, HEIGHT);

        // 绘制随机干扰线
        for (int i = 0; i < 6; i++) {
            g.setColor(new Color(180 + random.nextInt(50), 180 + random.nextInt(50), 180 + random.nextInt(50)));
            int x1 = random.nextInt(WIDTH);
            int y1 = random.nextInt(HEIGHT);
            int x2 = random.nextInt(WIDTH);
            int y2 = random.nextInt(HEIGHT);
            g.drawLine(x1, y1, x2, y2);
        }

        // 绘制干扰点
        for (int i = 0; i < 40; i++) {
            g.setColor(new Color(150 + random.nextInt(80), 150 + random.nextInt(80), 150 + random.nextInt(80)));
            int x = random.nextInt(WIDTH);
            int y = random.nextInt(HEIGHT);
            g.drawOval(x, y, 1, 1);
        }

        // 绘制文字
        Font font = new Font("Arial", Font.BOLD, 26);
        g.setFont(font);
        for (int i = 0; i < CODE_LENGTH; i++) {
            g.setColor(new Color(30 + random.nextInt(100), 30 + random.nextInt(100), 30 + random.nextInt(100)));
            int x = 20 + i * 26;
            int y = 30 + (random.nextInt(6) - 3);
            g.drawString(String.valueOf(code.charAt(i)), x, y);
        }

        g.dispose();

        // 4. 输出为 Base64 图片
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try {
            ImageIO.write(image, "png", baos);
        } catch (IOException e) {
            log.error("生成验证码图片异常: ", e);
        }
        String base64Image = "data:image/png;base64," + Base64.getEncoder().encodeToString(baos.toByteArray());

        Map<String, Object> result = new HashMap<>();
        result.put("captchaKey", captchaKey);
        result.put("captchaImage", base64Image);
        result.put("imageBase64", base64Image);

        return result;
    }

    /**
     * 校验验证码（一次性消耗，防重放）
     */
    public boolean validateCaptcha(String captchaKey, String captchaCode) {
        if (!StringUtils.hasText(captchaKey) || !StringUtils.hasText(captchaCode)) {
            return false;
        }

        String realCode = captchaCache.getIfPresent(captchaKey);
        if (realCode == null) {
            log.warn("验证码 key 不存在或已过期: {}", captchaKey);
            return false;
        }

        // 无论验证是否通过，立即删除该验证码（一次性）
        captchaCache.invalidate(captchaKey);

        return realCode.equalsIgnoreCase(captchaCode.trim());
    }

    /**
     * 供测试或内部使用的缓存注入
     */
    public void storeCaptchaForTest(String captchaKey, String captchaCode) {
        captchaCache.put(captchaKey, captchaCode);
    }
}
