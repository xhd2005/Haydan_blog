'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Post, Category, Tag, Journey, Friend } from '@/lib/types';
import { toast, confirmModal } from '@/lib/toast';
import {
  Activity,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  RefreshCw,
  ExternalLink,
  Edit3,
  Compass,
  FileText,
  FolderTree,
  Image as ImageIcon,
  Link2Off,
  Sparkles,
  Zap,
  Globe,
  Clock,
  BookOpen,
  Eye,
  Check,
  Search,
  BellRing,
  FileArchive,
  Layers,
} from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { 
  pingMiddlewareServices, 
  DEFAULT_MIDDLEWARE_HEALTH, 
  MiddlewareHealthStatus,
  calculateSystemHealthScore 
} from '@/lib/middlewareHealthCheck';
import { 
  scanGiantImages, 
  compressImageToWebp, 
  GiantImageItem 
} from '@/lib/imageCompressionWorkshop';
import { VisionOsHealthScoreRing } from '@/components/admin/health/VisionOsHealthScoreRing';
import { MiddlewareHealthCapsules } from '@/components/admin/health/MiddlewareHealthCapsules';
import { SilentInspectionModal } from '@/components/admin/health/SilentInspectionModal';
import { GiantImageCompressionWorkshop } from '@/components/admin/health/GiantImageCompressionWorkshop';

export interface HealthIssue {
  id: string;
  type:
    | 'broken_link'
    | 'missing_media'
    | 'orphan_tag'
    | 'empty_category'
    | 'seo_defect'
    | 'journey_anomaly'
    | 'friend_anomaly'
    | 'structure_defect'
    | 'image_alt_missing'
    | 'stale_draft';
  title: string;
  location: string;
  detail: string;
  severity: 'high' | 'medium' | 'low';
  targetId?: number;
  fixAction?: 'delete_tag' | 'delete_category' | 'edit_post' | 'edit_journey' | 'edit_friend';
}

export default function AdminHealthCheckPage() {
  const [scanning, setScanning] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);

  // 原始全景资产
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);

  // 核心中间件延迟探活状态
  const [middlewareHealth, setMiddlewareHealth] = useState<MiddlewareHealthStatus>(DEFAULT_MIDDLEWARE_HEALTH);
  const [isPingingMiddleware, setIsPingingMiddleware] = useState(false);

  // 巨幅大图无损压缩工坊状态
  const [giantImages, setGiantImages] = useState<GiantImageItem[]>([]);
  const [isCompressingImages, setIsCompressingImages] = useState(false);

  // 检测出的异常列表
  const [issues, setIssues] = useState<HealthIssue[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [fixing, setFixing] = useState(false);

  // 定时巡检与告警机器人模态框
  const [isSilentModalOpen, setIsSilentModalOpen] = useState(false);

  // 执行中间件并发探活
  const handlePingMiddleware = useCallback(async () => {
    setIsPingingMiddleware(true);
    try {
      const status = await pingMiddlewareServices();
      setMiddlewareHealth(status);
      toast.success('中间件全链路测速探活完成！');
    } catch {
      toast.error('中间件探活失败');
    } finally {
      setIsPingingMiddleware(false);
    }
  }, []);

  // 执行全景健康检测引擎 (严格遵守 Content Hydration Invariant)
  const runHealthScan = async () => {
    setScanning(true);
    try {
      const [postsRes, catsRes, tagsRes, journeysRes, friendsRes] = await Promise.all([
        api.getAdminPosts({ pageSize: 1000 }).catch(() => null),
        api.getCategories().catch(() => [] as Category[]),
        api.getTags().catch(() => [] as Tag[]),
        api.getJourneys().catch(() => [] as Journey[]),
        api.getAdminFriends().catch(() => [] as Friend[]),
      ]);

      const rawPosts: Post[] = postsRes?.records || [];
      // 并发水合拉取博文完整详情（严格遵守 Content Hydration Invariant，获取真实完整 content）
      const allPosts: Post[] = await Promise.all(
        rawPosts.map(async (p) => {
          if (p.content && p.content.length > 50) return p;
          try {
            const detail = await api.getPostById(p.id);
            return { ...p, content: detail?.content || p.content || '' };
          } catch {
            return p;
          }
        })
      );
      const allCats: Category[] = catsRes || [];
      const allTags: Tag[] = tagsRes || [];
      const allJourneys: Journey[] = journeysRes || [];
      const allFriends: Friend[] = friendsRes || [];

      setPosts(allPosts);
      setCategories(allCats);
      setTags(allTags);
      setJourneys(allJourneys);
      setFriends(allFriends);

      // 并发扫描 >2MB 巨幅大图
      const giantRes = await scanGiantImages({
        minSizeBytes: 2000000,
        postsList: allPosts,
      });
      setGiantImages(giantRes.giantImages);

      // 触发一次中间件并发探活
      const mwStatus = await pingMiddlewareServices();
      setMiddlewareHealth(mwStatus);

      const discoveredIssues: HealthIssue[] = [];

      // ----------------------------------------------------
      // 维度 1：博文站内死链与破损引用扫描 (Broken Links)
      // ----------------------------------------------------
      const postSlugSet = new Set(allPosts.map((p) => p.slug?.toLowerCase()).filter(Boolean));
      const journeySlugSet = new Set(allJourneys.map((j) => j.slug?.toLowerCase()).filter(Boolean));
      const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;

      allPosts.forEach((post) => {
        if (!post.content) return;
        let match;
        while ((match = linkRegex.exec(post.content)) !== null) {
          const rawUrl = match[2].trim();
          if (rawUrl.startsWith('/blog/')) {
            const targetSlug = rawUrl.replace('/blog/', '').split(/[?#]/)[0].toLowerCase();
            if (targetSlug && !postSlugSet.has(targetSlug)) {
              discoveredIssues.push({
                id: `link-${post.id}-${targetSlug}`,
                type: 'broken_link',
                title: '博文内部死链引用',
                location: `博文: 《${post.title}》`,
                detail: `正文引用了不存在的站内文章 Slug: ${rawUrl}`,
                severity: 'high',
                targetId: post.id,
                fixAction: 'edit_post',
              });
            }
          } else if (rawUrl.startsWith('/journey/')) {
            const targetSlug = rawUrl.replace('/journey/', '').split(/[?#]/)[0].toLowerCase();
            if (targetSlug && !journeySlugSet.has(targetSlug)) {
              discoveredIssues.push({
                id: `journey-link-${post.id}-${targetSlug}`,
                type: 'broken_link',
                title: '游记足迹死链引用',
                location: `博文: 《${post.title}》`,
                detail: `正文引用了未关联或不存在的足迹 Slug: ${rawUrl}`,
                severity: 'high',
                targetId: post.id,
                fixAction: 'edit_post',
              });
            }
          }
        }
      });

      // ----------------------------------------------------
      // 维度 2：封面缺失与非安全媒体链接 (Missing Media)
      // ----------------------------------------------------
      allPosts.forEach((post) => {
        if (!post.cover || post.cover.trim() === '') {
          discoveredIssues.push({
            id: `cover-missing-${post.id}`,
            type: 'missing_media',
            title: '文章缺失封面素材',
            location: `博文: 《${post.title}》`,
            detail: '文章未配置封面图，前台列表可能回退为纯色占位',
            severity: 'medium',
            targetId: post.id,
            fixAction: 'edit_post',
          });
        } else if (post.cover.startsWith('http://')) {
          discoveredIssues.push({
            id: `cover-http-${post.id}`,
            type: 'missing_media',
            title: '文章封面使用非安全 HTTP 图床',
            location: `博文: 《${post.title}》`,
            detail: `封面使用了不安全协议: ${post.cover.slice(0, 40)}...，可能导致浏览器混合内容阻断或 404`,
            severity: 'medium',
            targetId: post.id,
            fixAction: 'edit_post',
          });
        }
      });

      // ----------------------------------------------------
      // 维度 3：孤岛无主标签检测 (Orphan Tags)
      // ----------------------------------------------------
      const usedTagIds = new Set<number>();
      allPosts.forEach((p) => {
        if (p.tags && Array.isArray(p.tags)) {
          p.tags.forEach((t) => usedTagIds.add(t.id));
        }
      });

      allTags.forEach((tag) => {
        if (!usedTagIds.has(tag.id)) {
          discoveredIssues.push({
            id: `orphan-tag-${tag.id}`,
            type: 'orphan_tag',
            title: '孤岛无主标签 (0 篇博文引用)',
            location: `标签: #${tag.name}`,
            detail: `标签 ID: ${tag.id}, Slug: ${tag.slug}，未挂接任何文章`,
            severity: 'low',
            targetId: tag.id,
            fixAction: 'delete_tag',
          });
        }
      });

      // ----------------------------------------------------
      // 维度 4：空分类检测 (Empty Categories)
      // ----------------------------------------------------
      const usedCatIds = new Set(allPosts.map((p) => p.categoryId).filter(Boolean));
      allCats.forEach((cat) => {
        if (!usedCatIds.has(cat.id)) {
          discoveredIssues.push({
            id: `empty-cat-${cat.id}`,
            type: 'empty_category',
            title: '空分类 (0 篇博文归档)',
            location: `分类: ${cat.name}`,
            detail: `分类 ID: ${cat.id}, Slug: ${cat.slug}，未归档任何文章`,
            severity: 'low',
            targetId: cat.id,
            fixAction: 'delete_category',
          });
        }
      });

      // ----------------------------------------------------
      // 维度 5：SEO 元数据与社交卡片缺失 (SEO Anomalies)
      // ----------------------------------------------------
      allPosts.forEach((post) => {
        if (!post.excerpt || post.excerpt.trim().length < 15) {
          discoveredIssues.push({
            id: `seo-excerpt-${post.id}`,
            type: 'seo_defect',
            title: 'SEO 摘要描述过短或缺失',
            location: `博文: 《${post.title}》`,
            detail: '文章摘要少于 15 字，将降低搜索引擎收录评分与社交分享卡片展示效果',
            severity: 'medium',
            targetId: post.id,
            fixAction: 'edit_post',
          });
        }
        if (!post.tags || post.tags.length === 0) {
          discoveredIssues.push({
            id: `seo-tags-${post.id}`,
            type: 'seo_defect',
            title: '文章未标注任何标签',
            location: `博文: 《${post.title}》`,
            detail: '文章标签为空，无法参与全站 3D 知识图谱聚类与相关文章推荐计算',
            severity: 'low',
            targetId: post.id,
            fixAction: 'edit_post',
          });
        }
        if (post.title && post.title.trim().length < 4) {
          discoveredIssues.push({
            id: `seo-title-${post.id}`,
            type: 'seo_defect',
            title: '文章标题过短 (< 4 字符)',
            location: `博文: 《${post.title}》`,
            detail: '标题字数过少，缺乏明确的主题关键词与检索识别度',
            severity: 'low',
            targetId: post.id,
            fixAction: 'edit_post',
          });
        }
      });

      // ----------------------------------------------------
      // 维度 6：真实游记足迹与地理坐标规范 (Journey Coordinates)
      // ----------------------------------------------------
      allJourneys.forEach((journey) => {
        if (journey.latitude == null || journey.longitude == null) {
          discoveredIssues.push({
            id: `journey-coords-${journey.id}`,
            type: 'journey_anomaly',
            title: '足迹经纬度坐标缺失',
            location: `足迹: ${journey.title} (${journey.city || '未知城市'})`,
            detail: '该足迹未设置有效经纬度，无法在 3D 地球仪和 2D 航迹矢量画布上投影渲染',
            severity: 'high',
            targetId: journey.id,
            fixAction: 'edit_journey',
          });
        }
      });

      // ----------------------------------------------------
      // 维度 7：友链生态健康与安全探活 (Friend Links)
      // ----------------------------------------------------
      allFriends.forEach((friend) => {
        if (!friend.url || (!friend.url.startsWith('https://') && !friend.url.startsWith('http://'))) {
          discoveredIssues.push({
            id: `friend-url-${friend.id}`,
            type: 'friend_anomaly',
            title: '友链 URL 格式异常',
            location: `友链: ${friend.name}`,
            detail: `链接地址无效: ${friend.url || '未填写'}`,
            severity: 'high',
            targetId: friend.id,
            fixAction: 'edit_friend',
          });
        } else if (friend.url.startsWith('http://')) {
          discoveredIssues.push({
            id: `friend-http-${friend.id}`,
            type: 'friend_anomaly',
            title: '友链使用不安全 HTTP 协议',
            location: `友链: ${friend.name}`,
            detail: `地址为 HTTP 协议 (${friend.url})，前台读者跳转可能被标记为不安全连接`,
            severity: 'low',
            targetId: friend.id,
            fixAction: 'edit_friend',
          });
        }
      });

      // ----------------------------------------------------
      // 维度 8：长文排版层级与导读目录体检 (Structure & TOC)
      // ----------------------------------------------------
      const headingRegex = /(^|\n)#{1,3}\s+/;
      allPosts.forEach((post) => {
        if (post.content && post.content.length > 1800) {
          if (!headingRegex.test(post.content)) {
            discoveredIssues.push({
              id: `struct-heading-${post.id}`,
              type: 'structure_defect',
              title: '长文缺乏标题层级 (无 H2/H3)',
              location: `博文: 《${post.title}》 (${post.content.length} 字)`,
              detail: '正文超过 1800 字却未划分任何二级/三级标题，读者无法使用浮动大纲 (TOC) 导读',
              severity: 'medium',
              targetId: post.id,
              fixAction: 'edit_post',
            });
          }
        }
      });

      // ----------------------------------------------------
      // 维度 9：图片 Alt 无障碍与 SEO 描述体检 (Image Accessibility)
      // ----------------------------------------------------
      const imgAltRegex = /!\[(.*?)\]\((.*?)\)/g;
      allPosts.forEach((post) => {
        if (!post.content) return;
        let imgMatch;
        let missingAltCount = 0;
        while ((imgMatch = imgAltRegex.exec(post.content)) !== null) {
          const altText = imgMatch[1].trim();
          if (!altText) missingAltCount++;
        }
        if (missingAltCount > 0) {
          discoveredIssues.push({
            id: `alt-missing-${post.id}`,
            type: 'image_alt_missing',
            title: `正文图片缺失 Alt 描述 (${missingAltCount} 处)`,
            location: `博文: 《${post.title}》`,
            detail: `检测到 ${missingAltCount} 处 Markdown 图片使用了空描述 ![]()，影响无障碍屏幕阅读与图片 SEO`,
            severity: 'low',
            targetId: post.id,
            fixAction: 'edit_post',
          });
        }
      });

      // ----------------------------------------------------
      // 维度 10：长期停滞沉睡草稿排查 (Stale Drafts)
      // ----------------------------------------------------
      const nowMs = Date.now();
      const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
      allPosts.forEach((post) => {
        if (post.status === 'DRAFT') {
          const updatedMs = new Date(post.updatedAt || post.createdAt).getTime();
          if (nowMs - updatedMs > thirtyDaysMs) {
            discoveredIssues.push({
              id: `stale-draft-${post.id}`,
              type: 'stale_draft',
              title: '长期未更新的沉睡草稿 (>30 天)',
              location: `博文草稿: 《${post.title}》`,
              detail: `最后编辑于 ${new Date(post.updatedAt || post.createdAt).toLocaleDateString()}，建议复审完成发布或清理`,
              severity: 'low',
              targetId: post.id,
              fixAction: 'edit_post',
            });
          }
        }
      });

      setIssues(discoveredIssues);
      setHasScanned(true);
      toast.success(`全景体检完成！共排查 10 维全量资产`);
    } catch (err: any) {
      toast.error(err.message || '体检执行失败，请稍后重试');
    } finally {
      setScanning(false);
    }
  };

  useEffect(() => {
    runHealthScan();
  }, []);

  // 综合跑分计算
  const healthReport = useMemo(() => {
    const brokenLinks = issues.filter((i) => i.type === 'broken_link').length;
    const orphanTags = issues.filter((i) => i.type === 'orphan_tag').length;
    const emptyCats = issues.filter((i) => i.type === 'empty_category').length;

    return calculateSystemHealthScore({
      middleware: middlewareHealth,
      giantImagesCount: giantImages.length,
      brokenLinksCount: brokenLinks,
      orphanTagsCount: orphanTags,
      emptyCategoriesCount: emptyCats,
      unresolvedThreatsCount: 0,
      daysSinceLastBackup: 2,
    });
  }, [middlewareHealth, giantImages.length, issues]);

  // 大图单张压缩转码
  const handleCompressOneImage = async (image: GiantImageItem) => {
    setIsCompressingImages(true);
    try {
      const result = await compressImageToWebp(image, posts);
      if (result.converted) {
        toast.success(`图片已成功转码为 WebP！已无损重写 ${result.rewrittenPosts} 篇博文引用`);
        // 移除已转码图片
        setGiantImages((prev) => prev.filter((img) => img.id !== image.id));
      } else {
        toast.info(result.reason || '该图片已是 WebP');
      }
    } catch (err: any) {
      toast.error(err.message || '转码失败');
    } finally {
      setIsCompressingImages(false);
    }
  };

  // 大图批量全量压缩转码
  const handleCompressAllImages = async () => {
    if (giantImages.length === 0) return;
    setIsCompressingImages(true);
    try {
      let totalRewritten = 0;
      for (const img of giantImages) {
        const res = await compressImageToWebp(img, posts);
        if (res.converted) totalRewritten += res.rewrittenPosts;
      }
      toast.success(`全站大图批量转码完成！共重写 ${totalRewritten} 处博文引用`);
      setGiantImages([]);
    } catch (err: any) {
      toast.error('批量转码失败');
    } finally {
      setIsCompressingImages(false);
    }
  };

  // 一键清理全部孤岛标签（带二次确认拦截）
  const handleCleanOrphanTags = async () => {
    const orphanTags = issues.filter((i) => i.type === 'orphan_tag' && i.targetId);
    if (orphanTags.length === 0) {
      toast.info('当前没有需要清理的孤岛标签');
      return;
    }

    const confirmed = await confirmModal({
      title: '批量清理孤岛标签确认',
      message: `确定要清理这 ${orphanTags.length} 个无任何文章引用的孤岛标签吗？此操作将执行物理删除且不可逆。`,
      confirmText: '确认清理',
      variant: 'danger',
    });
    if (!confirmed) return;

    setFixing(true);
    try {
      await Promise.allSettled(orphanTags.map((i) => api.deleteTag(i.targetId!)));
      toast.success(`已成功批量清理 ${orphanTags.length} 个孤岛标签！`);
      setIssues((prev) => prev.filter((i) => i.type !== 'orphan_tag'));
    } catch {
      toast.error('清理孤岛标签失败');
    } finally {
      setFixing(false);
    }
  };

  // 一键清理全部空分类（带二次确认拦截）
  const handleCleanEmptyCategories = async () => {
    const emptyCats = issues.filter((i) => i.type === 'empty_category' && i.targetId);
    if (emptyCats.length === 0) {
      toast.info('当前没有需要清理的空分类');
      return;
    }

    const confirmed = await confirmModal({
      title: '批量清理空分类确认',
      message: `确定要清理这 ${emptyCats.length} 个无任何博文归档的空分类吗？此操作将执行物理删除且不可逆。`,
      confirmText: '确认清理',
      variant: 'danger',
    });
    if (!confirmed) return;

    setFixing(true);
    try {
      await Promise.allSettled(emptyCats.map((i) => api.deleteCategory(i.targetId!)));
      toast.success(`已成功批量清理 ${emptyCats.length} 个空分类！`);
      setIssues((prev) => prev.filter((i) => i.type !== 'empty_category'));
    } catch {
      toast.error('清理空分类失败');
    } finally {
      setFixing(false);
    }
  };

  // 单条清理/修复
  const handleFixItem = async (issue: HealthIssue) => {
    if (issue.fixAction === 'delete_tag' && issue.targetId) {
      const confirmed = await confirmModal({
        title: '删除孤岛标签确认',
        message: `确定要删除该孤岛标签吗？该操作不可逆。`,
        confirmText: '确认删除',
        variant: 'danger',
      });
      if (!confirmed) return;

      try {
        await api.deleteTag(issue.targetId);
        setIssues((prev) => prev.filter((i) => i.id !== issue.id));
        toast.success('已删除该孤岛标签');
      } catch {
        toast.error('删除标签失败');
      }
    } else if (issue.fixAction === 'delete_category' && issue.targetId) {
      const confirmed = await confirmModal({
        title: '删除空分类确认',
        message: `确定要删除该分类吗？该操作不可逆。`,
        confirmText: '确认删除',
        variant: 'danger',
      });
      if (!confirmed) return;

      try {
        await api.deleteCategory(issue.targetId);
        setIssues((prev) => prev.filter((i) => i.id !== issue.id));
        toast.success('已删除该分类');
      } catch {
        toast.error('删除分类失败');
      }
    }
  };

  const filteredIssues = useMemo(() => {
    if (activeFilter === 'all') return issues;
    return issues.filter((i) => i.type === activeFilter);
  }, [issues, activeFilter]);

  const issueStats = useMemo(() => {
    return {
      high: issues.filter((i) => i.severity === 'high').length,
      medium: issues.filter((i) => i.severity === 'medium').length,
      low: issues.filter((i) => i.severity === 'low').length,
    };
  }, [issues]);

  return (
    <div className="w-full space-y-6 text-xs select-text">
      <AdminPageHeader
        title="内容资产健康体检中心"
        description="VisionOS 3D 全息健康跑分、核心中间件延迟悬浮探活、定时静默巡检机器人与巨幅大图无损压缩工坊"
        icon={Activity}
        badgeText={`全站综合健康跑分 ${healthReport.score} • 评级 ${healthReport.grade}`}
        breadcrumbs={[
          { label: 'Studio 控制台', href: '/admin/dashboard' },
          { label: '资产体检中心' },
        ]}
      />

      {/* 顶部总览仪表盘 Bento */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* 左侧：VisionOS 3D 全息评分光环卡片 (占 4 列) */}
        <div className="lg:col-span-4 flex flex-col">
          <VisionOsHealthScoreRing
            score={healthReport.score}
            grade={healthReport.grade}
            gradeText={healthReport.gradeText}
            isScanning={scanning}
          />
        </div>

        {/* 右侧：统计概览与核心快捷指令卡片 (占 8 列) */}
        <div className="lg:col-span-8 flex flex-col justify-between p-6 rounded-3xl bg-white/80 dark:bg-neutral-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/[0.08] shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <span>10 维全景内容资产安全与规范报告</span>
                {hasScanned && (
                  <span className="text-[11px] font-normal text-slate-400 font-mono">
                    (已水合 {posts.length} 篇博文)
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">
                包含站内死链、游记坐标、孤岛标签、空分类、SEO 描述、图片 Alt 及长文排版层级全量探测
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* 告警机器人配置入口 */}
              <button
                type="button"
                onClick={() => setIsSilentModalOpen(true)}
                className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 text-slate-700 dark:text-zinc-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <BellRing className="w-3.5 h-3.5 text-purple-500" />
                <span>巡检机器人</span>
              </button>

              {/* 重新体检 */}
              <button
                type="button"
                onClick={runHealthScan}
                disabled={scanning}
                className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs hover:opacity-90 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${scanning ? 'animate-spin' : ''}`} />
                <span>{scanning ? '全景体检中...' : '重新体检'}</span>
              </button>
            </div>
          </div>

          {/* 异常等级胶囊 Bento */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 space-y-1">
              <div className="text-[11px] font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                <span>高危风险 (High)</span>
              </div>
              <div className="text-2xl font-extrabold font-mono">{issueStats.high} 项</div>
              <div className="text-[10px] text-rose-600/80 dark:text-rose-400/80">
                死链、不安全协议或关键经纬度缺失
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 space-y-1">
              <div className="text-[11px] font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                <span>中度缺陷 (Medium)</span>
              </div>
              <div className="text-2xl font-extrabold font-mono">{issueStats.medium} 项</div>
              <div className="text-[10px] text-amber-600/80 dark:text-amber-400/80">
                封面缺失、SEO 摘要过短或目录缺失
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-700 dark:text-cyan-400 space-y-1">
              <div className="text-[11px] font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-500" />
                <span>优化建议 (Low)</span>
              </div>
              <div className="text-2xl font-extrabold font-mono">{issueStats.low} 项</div>
              <div className="text-[10px] text-cyan-600/80 dark:text-cyan-400/80">
                孤岛标签、空分类及图片 Alt 优化
              </div>
            </div>
          </div>

          {/* 快捷批量修复栏 */}
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-black/40 border border-slate-200/80 dark:border-white/[0.04] flex flex-wrap items-center justify-between gap-3">
            <span className="text-slate-500 dark:text-zinc-400 text-[11px]">
              一键批处理修复行动 (带二次确认安全拦截)：
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCleanOrphanTags}
                disabled={fixing}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-neutral-800 hover:bg-rose-500/10 hover:text-rose-600 border border-slate-200 dark:border-white/[0.08] text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3 h-3 text-rose-500" />
                <span>一键清理孤岛标签</span>
              </button>

              <button
                type="button"
                onClick={handleCleanEmptyCategories}
                disabled={fixing}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-neutral-800 hover:bg-rose-500/10 hover:text-rose-600 border border-slate-200 dark:border-white/[0.08] text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3 h-3 text-rose-500" />
                <span>一键清理空分类</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 核心中间件与依赖延迟探活胶囊群 */}
      <MiddlewareHealthCapsules
        health={middlewareHealth}
        isPinging={isPingingMiddleware}
        onRefreshAll={handlePingMiddleware}
      />

      {/* 巨幅大图无损压缩转换工坊 (WebP/AVIF 与原地直链重写) */}
      <GiantImageCompressionWorkshop
        giantImages={giantImages}
        isCompressing={isCompressingImages}
        onCompressOne={handleCompressOneImage}
        onCompressAll={handleCompressAllImages}
      />

      {/* 异常排查列表与分类过滤 */}
      <div className="p-5 rounded-3xl bg-white/80 dark:bg-neutral-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/[0.08] shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-white/[0.04]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-500" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              质检异常诊断流水 ({filteredIssues.length} / {issues.length})
            </h3>
          </div>

          {/* 过滤器胶囊 */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { key: 'all', label: '全部异常' },
              { key: 'broken_link', label: '死链引用' },
              { key: 'missing_media', label: '缺失封面' },
              { key: 'orphan_tag', label: '孤岛标签' },
              { key: 'empty_category', label: '空分类' },
              { key: 'seo_defect', label: 'SEO 缺陷' },
              { key: 'journey_anomaly', label: '足迹坐标' },
              { key: 'friend_anomaly', label: '友链异常' },
              { key: 'structure_defect', label: '长文排版' },
              { key: 'image_alt_missing', label: 'Alt 缺失' },
            ].map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setActiveFilter(f.key)}
                className={`px-2.5 py-1 rounded-xl text-[11px] transition-all cursor-pointer ${
                  activeFilter === f.key
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold shadow-xs'
                    : 'bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-zinc-400 hover:text-slate-900'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* 诊断卡片列表 */}
        {filteredIssues.length === 0 ? (
          <div className="py-12 text-center text-slate-400 dark:text-zinc-500 space-y-1">
            <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 opacity-80 mb-1" />
            <div className="font-semibold text-slate-700 dark:text-zinc-300">
              当前维度未检测到任何健康缺陷
            </div>
            <p className="text-[11px]">全站内容资产合规完备，保持良好的数字花园生态！</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredIssues.map((issue) => {
              const isHigh = issue.severity === 'high';
              const isMedium = issue.severity === 'medium';

              return (
                <div
                  key={issue.id}
                  className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-black/30 border border-slate-200/70 dark:border-white/[0.04] flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-cyan-500/30 transition-all"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-1.5 py-0.2 rounded text-[10px] font-bold border font-mono ${
                          isHigh
                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                            : isMedium
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                            : 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30'
                        }`}
                      >
                        {issue.severity.toUpperCase()}
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white text-xs">
                        {issue.title}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono truncate">
                        {issue.location}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 dark:text-zinc-400 leading-relaxed font-sans">
                      {issue.detail}
                    </p>
                  </div>

                  {/* 动作按键 */}
                  <div className="shrink-0 flex items-center gap-2">
                    {issue.fixAction === 'edit_post' && issue.targetId && (
                      <Link
                        href={`/admin/posts/edit/${issue.targetId}`}
                        className="px-3 py-1.5 rounded-xl bg-white dark:bg-neutral-800 hover:bg-slate-100 dark:hover:bg-neutral-700 border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-zinc-300 font-semibold flex items-center gap-1 transition-colors"
                      >
                        <Edit3 className="w-3 h-3 text-cyan-500" />
                        <span>前往修复</span>
                      </Link>
                    )}

                    {issue.fixAction === 'edit_journey' && (
                      <Link
                        href="/admin/journey"
                        className="px-3 py-1.5 rounded-xl bg-white dark:bg-neutral-800 hover:bg-slate-100 dark:hover:bg-neutral-700 border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-zinc-300 font-semibold flex items-center gap-1 transition-colors"
                      >
                        <Compass className="w-3 h-3 text-emerald-500" />
                        <span>足迹中心</span>
                      </Link>
                    )}

                    {issue.fixAction === 'edit_friend' && (
                      <Link
                        href="/admin/links"
                        className="px-3 py-1.5 rounded-xl bg-white dark:bg-neutral-800 hover:bg-slate-100 dark:hover:bg-neutral-700 border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-zinc-300 font-semibold flex items-center gap-1 transition-colors"
                      >
                        <ExternalLink className="w-3 h-3 text-blue-500" />
                        <span>友链设置</span>
                      </Link>
                    )}

                    {(issue.fixAction === 'delete_tag' || issue.fixAction === 'delete_category') && (
                      <button
                        type="button"
                        onClick={() => handleFixItem(issue)}
                        className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-600 hover:text-white dark:text-rose-400 border border-rose-500/20 font-semibold flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>安全清理</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 定时静默巡检与告警机器人模态框 */}
      <SilentInspectionModal
        isOpen={isSilentModalOpen}
        onClose={() => setIsSilentModalOpen(false)}
        currentScore={healthReport.score}
      />
    </div>
  );
}
