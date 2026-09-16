package com.hayden.blog;

import com.hayden.blog.dto.LoginRequest;
import com.hayden.blog.dto.LoginResponse;
import com.hayden.blog.service.PostService;
import com.hayden.blog.service.UserService;
import com.hayden.blog.vo.PostListVO;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("h2")
class BlogApplicationTests {

    @Autowired
    private UserService userService;

    @Autowired
    private PostService postService;

    @Test
    void contextLoads() {
        assertNotNull(userService);
        assertNotNull(postService);
    }

    @Test
    void testAdminLogin() {
        LoginRequest request = new LoginRequest();
        request.setUsername("admin");
        request.setPassword("admin123");

        LoginResponse response = userService.login(request);
        assertNotNull(response);
        assertNotNull(response.getAccessToken());
        assertEquals("admin", response.getUsername());
        assertEquals("ADMIN", response.getRole());
    }

    @Test
    void testGetPublishedPosts() {
        List<PostListVO> latestPosts = postService.getLatestPosts(5);
        assertNotNull(latestPosts);
        assertFalse(latestPosts.isEmpty());
        assertTrue(latestPosts.stream().anyMatch(p -> p.getSlug().contains("from-the-east-toward-the-unknown")));
    }
}
