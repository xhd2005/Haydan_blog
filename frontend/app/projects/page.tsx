import React from 'react';
import { api } from '@/lib/api';
import { Project, PageVisualsConfig, SiteSetting } from '@/lib/types';
import { getServerTranslation } from '@/lib/i18n-server';
import type { Metadata } from 'next';
import { ProjectsShowcaseCarousel } from '@/components/projects/ProjectsShowcaseCarousel';
import { ProjectInteractiveContainer } from '@/components/projects/ProjectInteractiveContainer';

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = getServerTranslation();
  return {
    title: locale === 'en' ? 'Projects & Works | Hayden Xue' : '项目与作品橱窗 | Hayden Xue',
    description: 'Showcase of software projects, open source tools, and digital experiments with 3D Tilt and Live Sandbox Viewports.',
  };
}

export const revalidate = 60;

export default async function ProjectsPage() {
  const { locale, t } = getServerTranslation();

  // 1. 并发获取项目列表数据与后台站点设置
  const [projects, settings] = await Promise.all([
    api.getProjects().catch(() => [] as Project[]),
    api.getSettings().catch(() => null as SiteSetting | null),
  ]);

  // 2. 解析后台为开源造物配置的专属视觉背景与标语
  let pageVisuals: PageVisualsConfig = {};
  try {
    if (settings?.pageVisualsJson) {
      pageVisuals = JSON.parse(settings.pageVisualsJson);
    }
  } catch {}

  return (
    <div className="w-full min-h-screen bg-[#fbfbfd] dark:bg-[#090a0f] transition-colors duration-300">
      {/* 1. 全景互动橱窗与作品展台首屏 (Interactive Carousel & Lab Showcase) */}
      <ProjectsShowcaseCarousel
        projects={projects}
        pageVisual={pageVisuals.projects}
        locale={locale}
        translations={{
          badge: locale === 'en' ? 'PORTFOLIO SHOWCASE // 3D DECONSTRUCT' : 'PORTFOLIO SHOWCASE // 全栈架构与开源造物',
          featuredTag: locale === 'zh' ? '精选代表作' : 'FEATURED WORK',
          exploreDetails: locale === 'zh' ? '探索作品解构' : 'Explore Architecture',
          liveDemo: locale === 'zh' ? '实时体验' : 'Live Demo',
          sourceCode: locale === 'zh' ? '开源仓库' : 'Source Code',
          defaultTitle: locale === 'zh' ? '开源造物与数字工程' : 'ENGINEERING & ARTIFACTS',
          defaultDesc: locale === 'zh'
            ? '探索站长开源工具、全栈架构系统与智能体数字实验。支持全景橱窗直达 Live Demo 与工程手记。'
            : 'Explore open-source systems, full-stack architectures, and AI experiments with interactive showcase viewports.',
        }}
      />

      {/* 2. 开源工程卡片矩阵与即时筛选 (平滑衔接，彻底告别与详情页撞车的 -mt-16 假抽屉) */}
      <div className="relative z-20 max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-10 pb-24">
        <ProjectInteractiveContainer
          projects={projects}
          locale={locale}
          translations={{
            all: locale === 'zh' ? '全部作品' : 'All Works',
            searchPlaceholder: locale === 'zh' ? '搜索作品名称、技术栈...' : 'Search projects, technologies...',
            searchNoResults: locale === 'zh' ? '未找到符合条件的作品' : 'No projects match your query',
            clearSearch: locale === 'zh' ? '清除所有筛选' : 'Clear filters',
            viewGrid: locale === 'zh' ? '网格卡片' : 'Grid View',
            viewList: locale === 'zh' ? '列表视图' : 'List View',
            empty: t('projects.empty'),
          }}
        />
      </div>
    </div>
  );
}
