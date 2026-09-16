package com.hayden.blog.service;

public interface EmailService {

    void sendNewCommentNotification(String targetTitle, String authorNickname, String commentContent);

    void sendReplyNotification(String toEmail, String targetTitle, String replyAuthor, String replyContent);
}
