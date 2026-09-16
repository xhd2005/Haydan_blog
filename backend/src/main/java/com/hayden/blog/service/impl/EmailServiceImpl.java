package com.hayden.blog.service.impl;

import com.hayden.blog.service.EmailService;
import com.hayden.blog.service.SiteSettingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailServiceImpl implements EmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    private final SiteSettingService siteSettingService;

    @Async
    @Override
    public void sendNewCommentNotification(String targetTitle, String authorNickname, String commentContent) {
        try {
            var settings = siteSettingService.getSettings();
            String adminEmail = settings != null && StringUtils.hasText(settings.getEmail())
                    ? settings.getEmail()
                    : "admin@example.com";

            String subject = "【博客新留言提醒】文章《" + targetTitle + "》收到了新评论";
            String text = String.format("你好，站长！\n\n读者「%s」在您的内容《%s》下发表了新留言：\n\n“%s”\n\n请前往管理后台查看与审核。",
                    authorNickname, targetTitle, commentContent);

            sendEmail(adminEmail, subject, text);
        } catch (Exception e) {
            log.warn("新评论邮件通知异常: {}", e.getMessage());
        }
    }

    @Async
    @Override
    public void sendReplyNotification(String toEmail, String targetTitle, String replyAuthor, String replyContent) {
        if (!StringUtils.hasText(toEmail)) {
            return;
        }
        try {
            String subject = "【留言回复提醒】您在《" + targetTitle + "》的评论收到了新回复";
            String text = String.format("你好！\n\n「%s」在文章《%s》中回复了你的留言：\n\n“%s”\n\n欢迎回访查看详情！",
                    replyAuthor, targetTitle, replyContent);

            sendEmail(toEmail, subject, text);
        } catch (Exception e) {
            log.warn("读者回复邮件通知异常: {}", e.getMessage());
        }
    }

    private void sendEmail(String to, String subject, String text) {
        if (mailSender == null) {
            log.info("[模拟邮件发送 - 未配置真实SMTP] 收件人: {}, 主题: {}, 内容: {}", to, subject, text);
            return;
        }
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("no-reply@howardxue.com");
            message.setTo(to);
            message.setSubject(subject);
            message.setText(text);
            mailSender.send(message);
            log.info("邮件成功发送至: {}", to);
        } catch (Exception e) {
            log.warn("真实邮件发送失败（降级为日志模拟）: {}", e.getMessage());
        }
    }
}
