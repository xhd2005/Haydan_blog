'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
} from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

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

  // 检测出的异常列表
  const [issues, setIssues] = useState<HealthIssue[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [fixing, setFixing] = useState(false);

  // 执行 10 维全景健康检测引擎
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
          if (p.content) return p;
          try {
            const detail = await api.getPostById(p.id);
            return { ...p, content: detail?.content || '' };
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
      // 维度 2：封面缺失与非安全媒体链接 (Missing Media & Insecure Assets)
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
      // 维度 5：SEO 元数据与社交卡片缺失 (SEO & Metadata Anomalies)
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
      // 维度 6：真实游记足迹与地理坐标规范 (Journey Coordinates & Depth)
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
        } else if (!journey.content || journey.content.trim().length < 20) {
          discoveredIssues.push({
            id: `journey-content-${journey.id}`,
            type: 'journey_anomaly',
            title: '游记手记内容过于单薄',
            location: `足迹: ${journey.title}`,
            detail: '游记详情少于 20 字符，点击地标后展示内容较单薄，建议补充随行实拍与游记心得',
            severity: 'medium',
            targetId: journey.id,
            fixAction: 'edit_journey',
          });
        }
      });

      // ----------------------------------------------------
      // 维度 7：友链生态健康与安全探活 (Friend Links Integrity)
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
        if (!friend.avatar || friend.avatar.trim() === '') {
          discoveredIssues.push({
            id: `friend-avatar-${friend.id}`,
            type: 'friend_anomaly',
            title: '友链缺失站点图标/头像',
            location: `友链: ${friend.name}`,
            detail: '友链头像为空，前台展示时将使用默认首字母徽章占位',
            severity: 'medium',
            targetId: friend.id,
            fixAction: 'edit_friend',
          });
        }
        if (friend.pingStatus === 'OFFLINE') {
          discoveredIssues.push({
            id: `friend-offline-${friend.id}`,
            type: 'friend_anomaly',
            title: '友链探测站点连续离线',
            location: `友链: ${friend.name}`,
            detail: `最近一次健康探活失败或超时 (响应异常)，请核实对方站点是否存活`,
            severity: 'medium',
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
          if (!altText) {
            missingAltCount++;
          }
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
          const updateTime = new Date(post.updatedAt || post.createdAt).getTime();
          if (nowMs - updateTime > thirtyDaysMs) {
            const idleDays = Math.floor((nowMs - updateTime) / (24 * 60 * 60 * 1000));
            discoveredIssues.push({
              id: `stale-draft-${post.id}`,
              type: 'stale_draft',
              title: `长期沉睡草稿 (已停滞 ${idleDays} 天)`,
              location: `草稿: 《${post.title}》`,
              detail: `自 ${post.updatedAt?.slice(0, 10) || '未知日期'} 后未再修改，建议复核发布或归档`,
              severity: 'low',
              targetId: post.id,
              fixAction: 'edit_post',
            });
          }
        }
      });

      setIssues(discoveredIssues);
      setHasScanned(true);
      toast.success(
        `10 维全景体检完成！扫描 ${allPosts.length} 篇博文、${allTags.length} 标签、${allCats.length} 分类、${allJourneys.length} 足迹与 ${allFriends.length} 友链，定位 ${discoveredIssues.length} 项关注点。`
      );
    } catch (err: any) {
      toast.error('执行资产体检扫描时发生异常');
    } finally {
      setScanning(false);
    }
  };

  useEffect(() => {
    runHealthScan();
  }, []);

  // 计算健康评分 (满分 100)
  const healthScore = useMemo(() => {
    if (!hasScanned) return 100;
    let score = 100;
    issues.forEach((item) => {
      if (item.severity === 'high') score -= 10;
      else if (item.severity === 'medium') score -= 4;
      else score -= 1.5;
    });
    return Math.max(0, Math.min(100, Math.round(score)));
  }, [issues, hasScanned]);

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
    } catch (err: any) {
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
    } catch (err: any) {
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
      } catch (err: any) {
        toast.error('删除标签失败');
      }
    } else if (issue.fixAction === 'delete_category' && issue.targetId) {
      const confirmed = await confirmModal({
        title: '删除空分类确认',
        message: `确定要删除该空分类吗？该操作不可逆。`,
        confirmText: '确认删除',
        variant: 'danger',
      });
      if (!confirmed) return;

      try {
        await api.deleteCategory(issue.targetId);
        setIssues((prev) => prev.filter((i) => i.id !== issue.id));
        toast.success('已删除该空分类');
      } catch (err: any) {
        toast.error('删除分类失败');
      }
    }
  };

  // 过滤展示
  const filteredIssues = useMemo(() => {
    if (activeFilter === 'all') return issues;
    return issues.filter((i) => i.type === activeFilter);
  }, [issues, activeFilter]);

  const orphanTagCount = issues.filter((i) => i.type === 'orphan_tag').length;
  const emptyCatCount = issues.filter((i) => i.type === 'empty_category').length;
  const brokenLinkCount = issues.filter((i) => i.type === 'broken_link').length;
  const missingMediaCount = issues.filter((i) => i.type === 'missing_media').length;
  const seoDefectCount = issues.filter((i) => i.type === 'seo_defect').length;
  const journeyAnomalyCount = issues.filter((i) => i.type === 'journey_anomaly').length;
  const friendAnomalyCount = issues.filter((i) => i.type === 'friend_anomaly').length;
  const structDefectCount = issues.filter((i) => i.type === 'structure_defect').length;
  const altMissingCount = issues.filter((i) => i.type === 'image_alt_missing').length;
  const staleDraftCount = issues.filter((i) => i.type === 'stale_draft').length;

  return (
    <div className="w-full space-y-5">
      {/* 统一规范头部 */}
      <AdminPageHeader
        title="内容资产健康体检中心 (Content Health & Integrity)"
        description="10 维全景智能质检引擎：深度扫描站内死链、404媒体、孤岛标签、空分类、SEO元数据、足迹坐标、友链健康、长文排版、Alt无障碍及沉睡草稿。"
        icon={Activity}
        badge={
          <span className="px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>10-DIM HEALTH RADAR READY</span>
          </span>
        }
        breadcrumbs={[
          { label: 'Studio', href: '/admin/dashboard' },
          { label: '系统与智能体', href: '/admin/settings' },
          { label: '资产健康体检' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={runHealthScan}
              disabled={scanning}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${scanning ? 'animate-spin' : ''}`} />
              <span>{scanning ? '正在深度体检中...' : '重新执行全量体检'}</span>
            </button>
          </div>
        }
      />

      {/* 顶部：环形健康评分仪表盘与资产基线 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* 健康评分雷达 (4 Cols) */}
        <div className="lg:col-span-4 rounded-3xl bg-white/80 dark:bg-neutral-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/[0.08] shadow-sm p-6 flex flex-col items-center justify-center text-center space-y-3">
          <div className="relative flex items-center justify-center">
            {/* SVG 环形进度条 */}
            <svg className="w-36 h-36 transform -rotate-90" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r="50"
                className="stroke-slate-100 dark:stroke-white/[0.06]"
                strokeWidth="10"
                fill="transparent"
              />
              <circle
                cx="60"
                cy="60"
                r="50"
                className={`transition-all duration-1000 ease-out ${
                  healthScore >= 90
                    ? 'stroke-emerald-500'
                    : healthScore >= 75
                      ? 'stroke-cyan-500'
                      : healthScore >= 60
                        ? 'stroke-amber-500'
                        : 'stroke-rose-500'
                }`}
                strokeWidth="10"
                strokeDasharray={314.16}
                strokeDashoffset={314.16 - (314.16 * healthScore) / 100}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>

            <div className="absolute flex flex-col items-center">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight">
                {healthScore}
              </span>
              <span className="text-[10px] uppercase font-mono text-slate-400 dark:text-zinc-500 font-bold">
                Health Score
              </span>
            </div>
          </div>

          <div>
            <div className="text-sm font-bold text-slate-900 dark:text-white">
              {healthScore >= 90
                ? '全站资产状态卓越'
                : healthScore >= 75
                  ? '资产状态良好，建议适度优化'
                  : healthScore >= 60
                    ? '存在多项异常指标，请按指引修复'
                    : '检测到较多高危或缺失项，需尽快治理'}
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              全域体检已覆盖 10 个维度 · 发现 {issues.length} 项关注建议
            </p>
          </div>
        </div>

        {/* 资产统计与一键快速修复栏 (8 Cols) */}
        <div className="lg:col-span-8 rounded-3xl bg-white/80 dark:bg-neutral-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/[0.08] shadow-sm p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              <span>全站内容资产基线总览</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="p-3 rounded-2xl bg-slate-50/70 dark:bg-black/30 border border-slate-200/80 dark:border-white/[0.04]">
                <div className="text-[11px] text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-emerald-500" />
                  <span>博文总数</span>
                </div>
                <div className="text-xl font-bold text-slate-900 dark:text-white font-mono mt-1">
                  {posts.length}
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50/70 dark:bg-black/30 border border-slate-200/80 dark:border-white/[0.04]">
                <div className="text-[11px] text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
                  <FolderTree className="w-3.5 h-3.5 text-teal-500" />
                  <span>知识分类</span>
                </div>
                <div className="text-xl font-bold text-slate-900 dark:text-white font-mono mt-1">
                  {categories.length}
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50/70 dark:bg-black/30 border border-slate-200/80 dark:border-white/[0.04]">
                <div className="text-[11px] text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-cyan-500" />
                  <span>标签网络</span>
                </div>
                <div className="text-xl font-bold text-slate-900 dark:text-white font-mono mt-1">
                  {tags.length}
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50/70 dark:bg-black/30 border border-slate-200/80 dark:border-white/[0.04]">
                <div className="text-[11px] text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-indigo-500" />
                  <span>真实足迹</span>
                </div>
                <div className="text-xl font-bold text-slate-900 dark:text-white font-mono mt-1">
                  {journeys.length}
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50/70 dark:bg-black/30 border border-slate-200/80 dark:border-white/[0.04]">
                <div className="text-[11px] text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-blue-500" />
                  <span>友链伙伴</span>
                </div>
                <div className="text-xl font-bold text-slate-900 dark:text-white font-mono mt-1">
                  {friends.length}
                </div>
              </div>
            </div>
          </div>

          {/* 快捷一键修复工具条 */}
          <div className="pt-3 border-t border-slate-200/60 dark:border-white/[0.04] flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-slate-500 dark:text-zinc-400">
              快捷批量治理动作：
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleCleanOrphanTags}
                disabled={fixing || orphanTagCount === 0}
                className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/20 text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>一键清理孤岛标签 ({orphanTagCount})</span>
              </button>

              <button
                type="button"
                onClick={handleCleanEmptyCategories}
                disabled={fixing || emptyCatCount === 0}
                className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-500/20 text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>一键清理空分类 ({emptyCatCount})</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 下方：异常问题清单与 10 维全景多维筛选 */}
      <div className="rounded-3xl bg-white/80 dark:bg-neutral-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/[0.08] shadow-sm p-6 space-y-4">
        <div className="flex flex-col gap-3 border-b border-slate-200/60 dark:border-white/[0.04] pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                <span>10 维异常问题与修复指引 ({issues.length})</span>
              </h3>
            </div>
            <span className="text-xs text-slate-400 dark:text-zinc-500">
              当前展示：{filteredIssues.length} 项
            </span>
          </div>

          {/* 筛选标签条 */}
          <div className="flex flex-wrap gap-1.5 text-xs">
            {[
              { id: 'all', label: `全部 (${issues.length})` },
              { id: 'broken_link', label: `站内死链 (${brokenLinkCount})` },
              { id: 'missing_media', label: `媒体封面 (${missingMediaCount})` },
              { id: 'orphan_tag', label: `孤岛标签 (${orphanTagCount})` },
              { id: 'empty_category', label: `空分类 (${emptyCatCount})` },
              { id: 'seo_defect', label: `SEO缺陷 (${seoDefectCount})` },
              { id: 'journey_anomaly', label: `游记足迹 (${journeyAnomalyCount})` },
              { id: 'friend_anomaly', label: `友链健康 (${friendAnomalyCount})` },
              { id: 'structure_defect', label: `长文排版 (${structDefectCount})` },
              { id: 'image_alt_missing', label: `图片Alt (${altMissingCount})` },
              { id: 'stale_draft', label: `沉睡草稿 (${staleDraftCount})` },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setActiveFilter(f.id)}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer font-medium text-xs ${
                  activeFilter === f.id
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold shadow-sm'
                    : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white bg-slate-100/70 dark:bg-neutral-800/50'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* 清单展示 */}
        <div className="space-y-2.5">
          {filteredIssues.length > 0 ? (
            filteredIssues.map((issue) => (
              <div
                key={issue.id}
                className="p-4 rounded-2xl bg-slate-50/70 dark:bg-black/30 border border-slate-200/80 dark:border-white/[0.04] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-all hover:border-slate-300 dark:hover:border-white/[0.12]"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase ${
                        issue.severity === 'high'
                          ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                          : issue.severity === 'medium'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                            : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                      }`}
                    >
                      {issue.severity === 'high' ? '高危' : issue.severity === 'medium' ? '告警' : '提示'}
                    </span>

                    <span className="font-semibold text-slate-900 dark:text-white">
                      {issue.title}
                    </span>

                    <span className="text-slate-400 dark:text-zinc-500">·</span>

                    <span className="text-slate-600 dark:text-zinc-300 font-medium">
                      {issue.location}
                    </span>
                  </div>

                  <p className="text-slate-500 dark:text-zinc-400 font-mono text-[11px]">
                    {issue.detail}
                  </p>
                </div>

                {/* 操作动作 */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                  {issue.fixAction === 'edit_post' && issue.targetId && (
                    <Link
                      href={`/admin/posts/edit/${issue.targetId}`}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-700 dark:text-zinc-200 font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200/80 dark:border-white/[0.08]"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>定位编辑</span>
                    </Link>
                  )}

                  {issue.fixAction === 'edit_journey' && (
                    <Link
                      href="/admin/journey"
                      className="px-3 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-indigo-500/20"
                    >
                      <Compass className="w-3.5 h-3.5" />
                      <span>完善足迹</span>
                    </Link>
                  )}

                  {issue.fixAction === 'edit_friend' && (
                    <Link
                      href="/admin/links"
                      className="px-3 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-blue-500/20"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>维护友链</span>
                    </Link>
                  )}

                  {(issue.fixAction === 'delete_tag' || issue.fixAction === 'delete_category') && (
                    <button
                      type="button"
                      onClick={() => handleFixItem(issue)}
                      className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-rose-500/20"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>立即清理</span>
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="py-16 text-center text-xs text-slate-400 dark:text-zinc-500 flex flex-col items-center gap-2.5">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              <span className="font-medium text-slate-700 dark:text-zinc-300">
                此分类下暂无异常发现，资产健康度卓越！
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
