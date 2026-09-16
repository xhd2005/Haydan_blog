package com.hayden.blog;

import com.hayden.blog.entity.Journey;
import com.hayden.blog.service.JourneyService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("h2")
public class JourneyFootprintRealDataTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JourneyService journeyService;

    @Test
    @DisplayName("真实足迹与地球仪数据源：包含北京、上海、东京、京都、重庆、杭州、深圳 7 个真实足迹，精准经纬度与游记关联")
    void testRealJourneyFootprintsDataIntegrity() throws Exception {
        // 1. API 测试
        mockMvc.perform(get("/api/journey"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.length()").value(7));

        // 2. 数据库实体层深度核验
        List<Journey> list = journeyService.list();
        assertEquals(7, list.size(), "必须具备 7 个已发布的真实旅行足迹");

        List<String> cities = list.stream().map(Journey::getCity).toList();
        assertTrue(cities.contains("北京"));
        assertTrue(cities.contains("上海"));
        assertTrue(cities.contains("东京"));
        assertTrue(cities.contains("京都"));
        assertTrue(cities.contains("重庆"));
        assertTrue(cities.contains("杭州"));
        assertTrue(cities.contains("深圳"));

        for (Journey journey : list) {
            assertNotNull(journey.getLatitude(), "经纬度必填: " + journey.getCity());
            assertNotNull(journey.getLongitude(), "经纬度必填: " + journey.getCity());
            assertNotNull(journey.getCover(), "实拍封面必填: " + journey.getCity());
            assertNotNull(journey.getSlug(), "游记 slug 必填: " + journey.getCity());
            assertTrue(journey.getContent().contains("# "), "正文必须为真实 Markdown 游记博文");
        }
    }
}
