'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { api } from '@/lib/api';
import { Post, Journey, Category, Tag as TagType } from '@/lib/types';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import {
  Layers,
  Search,
  RotateCcw,
  Sparkles,
  ExternalLink,
  PenTool,
  AlertTriangle,
  Compass,
  FileText,
  Tag,
  FolderTree,
  X,
  ArrowRight,
  Filter,
  CheckCircle2,
  ZoomIn,
  ZoomOut,
  Info
} from 'lucide-react';

export interface AdminGraphNode {
  id: string;
  rawId?: string | number;
  title: string;
  type: 'post' | 'tag' | 'category' | 'journey' | 'core';
  url?: string;
  adminEditUrl?: string;
  category?: string;
  summary?: string;
  isOrphan?: boolean;
  radius: number;
  color: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  isFixed?: boolean;
}

export interface AdminGraphLink {
  source: string;
  target: string;
  strength?: number;
}

export default function AdminGraphPage() {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const [posts, setPosts] = useState<Post[]>([]);
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<TagType[]>([]);
  const [loading, setLoading] = useState(true);

  // 物理模拟与视角
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const nodesRef = useRef<AdminGraphNode[]>([]);
  const linksRef = useRef<AdminGraphLink[]>([]);
  const [selectedNode, setSelectedNode] = useState<AdminGraphNode | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // 摄像机控制
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [scale, setScale] = useState<number>(1);
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const mouseStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const draggedNodeRef = useRef<AdminGraphNode | null>(null);

  // 过滤控制
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'post' | 'orphan' | 'taxonomy' | 'journey'>('ALL');

  // 加载全站内容数据
  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      setLoading(true);
      try {
        const [postsRes, journeysRes, catsRes, tagsRes] = await Promise.all([
          api.getPosts({ page: 1, pageSize: 200 }).catch(() => ({ records: [] as Post[] })),
          api.getJourneys().catch(() => [] as Journey[]),
          api.getCategories().catch(() => [] as Category[]),
          api.getTags().catch(() => [] as TagType[]),
        ]);

        if (mounted) {
          setPosts(postsRes.records || []);
          setJourneys(journeysRes || []);
          setCategories(catsRes || []);
          setTags(tagsRes || []);
        }
      } catch (err) {
        console.error('Failed to fetch graph data:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();
    return () => {
      mounted = false;
    };
  }, []);

  // 构建拓扑网络与孤岛博文诊断
  const { initialNodes, initialLinks, orphanCount } = useMemo(() => {
    const rawNodes: AdminGraphNode[] = [];
    const rawLinks: AdminGraphLink[] = [];

    // 1. 核心中心锚点
    rawNodes.push({
      id: 'core-hub',
      title: 'Hayden Xue // 知识矩阵中枢',
      type: 'core',
      category: 'Garden Core',
      summary: 'Hayden Xue 数字花园创作中枢，连接博文、技术标签、生活哲学与旅行足迹。',
      radius: 18,
      color: '#a855f7',
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      isFixed: true,
    });

    // 2. 标签与分类
    const tagNodeSet = new Set<string>();
    tags.forEach((t) => {
      if (!t.name) return;
      const tagId = `tag-${t.name}`;
      tagNodeSet.add(t.name);
      rawNodes.push({
        id: tagId,
        rawId: t.id,
        title: t.name,
        type: 'tag',
        category: '标签聚合',
        summary: `聚合标签【${t.name}】，归档相关文章切片。`,
        radius: 9,
        color: '#f59e0b',
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
      });
      rawLinks.push({ source: 'core-hub', target: tagId, strength: 0.5 });
    });

    categories.forEach((cat) => {
      if (!cat.name) return;
      const catId = `cat-${cat.name}`;
      rawNodes.push({
        id: catId,
        rawId: cat.id,
        title: cat.name,
        type: 'category',
        category: '分类枢纽',
        summary: `分类目录【${cat.name}】。`,
        radius: 12,
        color: '#8b5cf6',
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
      });
      rawLinks.push({ source: 'core-hub', target: catId, strength: 0.7 });
    });

    // 3. 博文节点 & 孤岛博文诊断
    let orphanCounter = 0;
    posts.forEach((post) => {
      const postId = `post-${post.id}`;
      const hasCategory = Boolean(post.category?.name);
      const hasTags = Array.isArray(post.tags) && post.tags.length > 0;
      const isOrphan = !hasCategory && !hasTags;

      if (isOrphan) {
        orphanCounter++;
      }

      rawNodes.push({
        id: postId,
        rawId: post.id,
        title: post.title,
        type: 'post',
        url: `/blog/${post.slug || post.id}`,
        adminEditUrl: `/admin/posts/edit/${post.id}`,
        category: post.category?.name || (isOrphan ? '无分类 (孤岛)' : '默认分类'),
        summary: post.excerpt || '全栈架构与思想深度文章。',
        isOrphan,
        radius: isOrphan ? 11 : 12,
        color: isOrphan ? '#f43f5e' : '#38bdf8', // 孤岛文章高亮为醒目警示红/玫瑰色
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
      });

      if (post.category?.name) {
        rawLinks.push({ source: postId, target: `cat-${post.category.name}`, strength: 0.9 });
      }

      if (Array.isArray(post.tags)) {
        post.tags.forEach((t) => {
          if (t.name) {
            const tagId = `tag-${t.name}`;
            if (!tagNodeSet.has(t.name)) {
              tagNodeSet.add(t.name);
              rawNodes.push({
                id: tagId,
                rawId: t.id,
                title: t.name,
                type: 'tag',
                category: '标签聚合',
                summary: `标签【${t.name}】。`,
                radius: 9,
                color: '#f59e0b',
                x: 0,
                y: 0,
                vx: 0,
                vy: 0,
              });
              rawLinks.push({ source: 'core-hub', target: tagId, strength: 0.5 });
            }
            rawLinks.push({ source: postId, target: tagId, strength: 0.8 });
          }
        });
      }
    });

    // 4. 旅行足迹
    journeys.forEach((journey) => {
      const jId = `journey-${journey.id}`;
      rawNodes.push({
        id: jId,
        rawId: journey.id,
        title: journey.title || `${journey.city} · 漫游`,
        type: 'journey',
        url: `/journey/${journey.slug || journey.id}`,
        adminEditUrl: '/admin/journey',
        category: '地理足迹',
        summary: journey.description || `${journey.city}, ${journey.country}`,
        radius: 10,
        color: '#10b981',
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
      });
      rawLinks.push({ source: jId, target: 'core-hub', strength: 0.4 });
    });

    return {
      initialNodes: rawNodes,
      initialLinks: rawLinks,
      orphanCount: orphanCounter,
    };
  }, [posts, journeys, categories, tags]);

  // 初始化分布位置
  useEffect(() => {
    const total = initialNodes.length;
    nodesRef.current = initialNodes.map((n, i) => {
      const angle = (i / Math.max(total, 1)) * Math.PI * 2;
      const dist = n.type === 'core' ? 0 : 120 + Math.random() * 260;
      return {
        ...n,
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist,
        vx: 0,
        vy: 0,
      };
    });
    linksRef.current = [...initialLinks];
  }, [initialNodes, initialLinks]);

  // 获取高亮连通集
  const connectedNodeIds = useMemo(() => {
    const activeId = hoveredNodeId || selectedNode?.id;
    if (!activeId) return new Set<string>();

    const set = new Set<string>([activeId]);
    linksRef.current.forEach((l) => {
      if (l.source === activeId) set.add(l.target);
      if (l.target === activeId) set.add(l.source);
    });
    return set;
  }, [hoveredNodeId, selectedNode]);

  // 物理模拟步进
  const simulateStep = useCallback(() => {
    const nodes = nodesRef.current;
    const links = linksRef.current;
    if (nodes.length === 0) return;

    const nodeMap = new Map<string, AdminGraphNode>();
    nodes.forEach((n) => nodeMap.set(n.id, n));

    // 1. 斥力 (库仑定律)
    const repulsion = 1400;
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const distSq = dx * dx + dy * dy || 1;
        if (distSq > 90000) continue;

        const dist = Math.sqrt(distSq);
        const force = repulsion / distSq;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;

        if (!a.isFixed && a !== draggedNodeRef.current) {
          a.vx -= fx;
          a.vy -= fy;
        }
        if (!b.isFixed && b !== draggedNodeRef.current) {
          b.vx += fx;
          b.vy += fy;
        }
      }
    }

    // 2. 引力 (胡克定律弹簧力)
    for (let i = 0; i < links.length; i++) {
      const link = links[i];
      const source = nodeMap.get(link.source);
      const target = nodeMap.get(link.target);
      if (!source || !target) continue;

      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const idealDist = link.source === 'core-hub' || link.target === 'core-hub' ? 140 : 80;
      const force = (dist - idealDist) * 0.02 * (link.strength || 1);

      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;

      if (!source.isFixed && source !== draggedNodeRef.current) {
        source.vx += fx;
        source.vy += fy;
      }
      if (!target.isFixed && target !== draggedNodeRef.current) {
        target.vx -= fx;
        target.vy -= fy;
      }
    }

    // 3. 中心向心引力与速度衰减 (阻尼)
    const damping = 0.88;
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      if (n.isFixed || n === draggedNodeRef.current) continue;

      n.vx -= n.x * 0.002;
      n.vy -= n.y * 0.002;

      n.vx *= damping;
      n.vy *= damping;

      n.x += n.vx;
      n.y += n.vy;
    }
  }, []);

  // 渲染 Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      simulateStep();

      const dpr = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      // 背景微点阵
      ctx.save();
      ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)';
      const dotSpacing = 28 * scale;
      const offsetX = (width / 2 + pan.x) % dotSpacing;
      const offsetY = (height / 2 + pan.y) % dotSpacing;
      for (let x = offsetX; x < width; x += dotSpacing) {
        for (let y = offsetY; y < height; y += dotSpacing) {
          ctx.fillRect(x, y, 1.5, 1.5);
        }
      }
      ctx.restore();

      // 应用平移与缩放矩阵
      ctx.save();
      ctx.translate(width / 2 + pan.x, height / 2 + pan.y);
      ctx.scale(scale, scale);

      const nodes = nodesRef.current;
      const links = linksRef.current;
      const nodeMap = new Map<string, AdminGraphNode>();
      nodes.forEach((n) => nodeMap.set(n.id, n));

      const hasActive = Boolean(hoveredNodeId || selectedNode);

      // 1. 绘制连线
      for (let i = 0; i < links.length; i++) {
        const link = links[i];
        const source = nodeMap.get(link.source);
        const target = nodeMap.get(link.target);
        if (!source || !target) continue;

        const isLinkActive =
          hasActive &&
          (connectedNodeIds.has(source.id) && connectedNodeIds.has(target.id));

        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);

        if (isLinkActive) {
          ctx.strokeStyle = isDark ? 'rgba(56, 189, 248, 0.8)' : 'rgba(14, 165, 233, 0.8)';
          ctx.lineWidth = 2 / scale;
        } else if (hasActive) {
          ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.03)';
          ctx.lineWidth = 0.5 / scale;
        } else {
          ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';
          ctx.lineWidth = 1 / scale;
        }
        ctx.stroke();
      }

      // 2. 绘制节点
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const isSelected = selectedNode?.id === node.id;
        const isHovered = hoveredNodeId === node.id;
        const isConnected = connectedNodeIds.has(node.id);

        let opacity = 1;
        if (hasActive && !isConnected) {
          opacity = 0.15;
        }

        // 过滤条件高亮
        if (typeFilter === 'orphan' && !node.isOrphan) {
          opacity = 0.1;
        } else if (typeFilter === 'post' && node.type !== 'post') {
          opacity = 0.1;
        } else if (typeFilter === 'taxonomy' && node.type !== 'tag' && node.type !== 'category') {
          opacity = 0.1;
        } else if (typeFilter === 'journey' && node.type !== 'journey') {
          opacity = 0.1;
        }

        if (searchQuery.trim()) {
          const match = node.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            node.category?.toLowerCase().includes(searchQuery.toLowerCase());
          if (!match) opacity = 0.08;
        }

        ctx.save();
        ctx.globalAlpha = opacity;

        // 外光晕
        if (isSelected || isHovered) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius + 6 / scale, 0, Math.PI * 2);
          ctx.fillStyle = node.color + '40';
          ctx.fill();
        }

        // 孤岛博文专属告警脉冲外环
        if (node.isOrphan) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius + 4 / scale, 0, Math.PI * 2);
          ctx.strokeStyle = isDark ? '#f43f5e' : '#e11d48';
          ctx.lineWidth = 1.5 / scale;
          ctx.setLineDash([3, 3]);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // 核心实心圆
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = node.color;
        ctx.fill();

        // 边框
        ctx.lineWidth = (isSelected ? 3 : 1.5) / scale;
        ctx.strokeStyle = isSelected
          ? (isDark ? '#ffffff' : '#000000')
          : (isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.2)');
        ctx.stroke();

        // 文本标签渲染 (在适当缩放或选中/悬停时显示)
        const shouldShowText = scale > 0.75 || isSelected || isHovered || node.type === 'core';
        if (shouldShowText) {
          ctx.font = `${node.type === 'core' ? 'bold 12px' : '10px'} system-ui, -apple-system, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';

          const textY = node.y + node.radius + 4 / scale;
          const label = node.title.length > 14 ? node.title.slice(0, 13) + '…' : node.title;

          // 文本底衬描边防遮挡
          ctx.strokeStyle = isDark ? '#090a0f' : '#ffffff';
          ctx.lineWidth = 3 / scale;
          ctx.strokeText(label, node.x, textY);

          ctx.fillStyle = isDark ? '#e2e8f0' : '#1e293b';
          ctx.fillText(label, node.x, textY);
        }

        ctx.restore();
      }

      ctx.restore();
      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [simulateStep, isDark, pan, scale, hoveredNodeId, selectedNode, connectedNodeIds, typeFilter, searchQuery]);

  // 坐标转换：屏幕坐标转图谱空间坐标
  const screenToGraph = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const sx = clientX - rect.left;
    const sy = clientY - rect.top;
    const gx = (sx - canvas.clientWidth / 2 - pan.x) / scale;
    const gy = (sy - canvas.clientHeight / 2 - pan.y) / scale;
    return { x: gx, y: gy };
  }, [pan, scale]);

  // 鼠标交互事件
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = screenToGraph(e.clientX, e.clientY);
    const nodes = nodesRef.current;

    // 检测命中节点
    let hitNode: AdminGraphNode | null = null;
    for (let i = nodes.length - 1; i >= 0; i--) {
      const n = nodes[i];
      const dx = n.x - x;
      const dy = n.y - y;
      if (dx * dx + dy * dy <= (n.radius + 6) * (n.radius + 6)) {
        hitNode = n;
        break;
      }
    }

    if (hitNode) {
      draggedNodeRef.current = hitNode;
      setSelectedNode(hitNode);
    } else {
      setIsPanning(true);
      panStartRef.current = { ...pan };
      mouseStartRef.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (draggedNodeRef.current) {
      const { x, y } = screenToGraph(e.clientX, e.clientY);
      draggedNodeRef.current.x = x;
      draggedNodeRef.current.y = y;
      draggedNodeRef.current.vx = 0;
      draggedNodeRef.current.vy = 0;
      return;
    }

    if (isPanning) {
      const dx = e.clientX - mouseStartRef.current.x;
      const dy = e.clientY - mouseStartRef.current.y;
      setPan({
        x: panStartRef.current.x + dx,
        y: panStartRef.current.y + dy,
      });
      return;
    }

    // 检测悬停
    const { x, y } = screenToGraph(e.clientX, e.clientY);
    const nodes = nodesRef.current;
    let hit: AdminGraphNode | null = null;
    for (let i = nodes.length - 1; i >= 0; i--) {
      const n = nodes[i];
      const dx = n.x - x;
      const dy = n.y - y;
      if (dx * dx + dy * dy <= (n.radius + 6) * (n.radius + 6)) {
        hit = n;
        break;
      }
    }
    setHoveredNodeId(hit ? hit.id : null);
  };

  const handleMouseUp = () => {
    draggedNodeRef.current = null;
    setIsPanning(false);
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = 1.1;
    const newScale = e.deltaY < 0 ? scale * zoomFactor : scale / zoomFactor;
    setScale(Math.min(Math.max(newScale, 0.3), 3));
  };

  const handleResetView = () => {
    setPan({ x: 0, y: 0 });
    setScale(1);
    setSelectedNode(null);
  };

  const handleResimulate = () => {
    nodesRef.current.forEach((n) => {
      n.vx = (Math.random() - 0.5) * 15;
      n.vy = (Math.random() - 0.5) * 15;
    });
  };

  // 获取选中节点的直接邻居
  const neighborNodes = useMemo(() => {
    if (!selectedNode) return [];
    const neighbors: AdminGraphNode[] = [];
    const nodeMap = new Map<string, AdminGraphNode>();
    nodesRef.current.forEach((n) => nodeMap.set(n.id, n));

    linksRef.current.forEach((l) => {
      if (l.source === selectedNode.id) {
        const target = nodeMap.get(l.target);
        if (target) neighbors.push(target);
      } else if (l.target === selectedNode.id) {
        const source = nodeMap.get(l.source);
        if (source) neighbors.push(source);
      }
    });
    return neighbors;
  }, [selectedNode]);

  return (
    <div className="space-y-6">
      {/* 顶部标题与面包屑 */}
      <AdminPageHeader
        title="内容生态知识图谱"
        description="全站博文关联拓扑、标签聚合星云与内容孤岛诊断。可穿梭探索关联脉络，点击节点直达后台文章编辑与前台视窗。"
        icon={Layers}
        badge={
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            LIVE GRAPH TOPOLOGY
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={handleResimulate}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-100 dark:bg-white/[0.04] text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-white/10 hover:bg-slate-200/80 dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
              title="重新激发引力场散开"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>引力激发</span>
            </button>
            <button
              onClick={handleResetView}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-100 dark:bg-white/[0.04] text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-white/10 hover:bg-slate-200/80 dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>复位视窗</span>
            </button>
          </div>
        }
      />

      {/* 核心指标与诊断看板 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white/70 dark:bg-neutral-900/50 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">图谱节点总数</span>
            <Layers className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
              {initialNodes.length}
            </span>
            <span className="text-[11px] text-slate-400 font-mono">NODES</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white/70 dark:bg-neutral-900/50 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">拓扑连通边数</span>
            <Share2Icon className="w-4 h-4 text-sky-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
              {initialLinks.length}
            </span>
            <span className="text-[11px] text-slate-400 font-mono">EDGES</span>
          </div>
        </div>

        <div
          onClick={() => setTypeFilter(typeFilter === 'orphan' ? 'ALL' : 'orphan')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs ${
            orphanCount > 0
              ? 'bg-rose-500/5 border-rose-500/30 hover:border-rose-500/50'
              : 'bg-emerald-500/5 border-emerald-500/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              孤岛博文诊断
            </span>
            <span className="text-[10px] font-mono uppercase text-slate-400">
              {typeFilter === 'orphan' ? '正在筛选' : '点击筛选'}
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-rose-600 dark:text-rose-400 font-mono">
              {orphanCount}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-zinc-400">
              {orphanCount === 0 ? '全站文章健康连通' : '篇博文暂无标签/分类'}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white/70 dark:bg-neutral-900/50 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">分类与标签聚类</span>
            <Tag className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
              {categories.length + tags.length}
            </span>
            <span className="text-[11px] text-slate-400 font-mono">HUBS</span>
          </div>
        </div>
      </div>

      {/* 控制栏 (搜索 + 类型筛选) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl bg-white/70 dark:bg-neutral-900/50 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08]">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索节点名称、分类或标签..."
            className="w-full pl-9 pr-8 py-1.5 rounded-xl text-xs bg-slate-100/80 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* 类型筛选标签 */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setTypeFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              typeFilter === 'ALL'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-neutral-900 font-semibold'
                : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-white/[0.05]'
            }`}
          >
            全部节点
          </button>
          <button
            onClick={() => setTypeFilter('post')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              typeFilter === 'post'
                ? 'bg-sky-500 text-white font-semibold'
                : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-white/[0.05]'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-sky-400" />
            技术博文
          </button>
          <button
            onClick={() => setTypeFilter('orphan')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              typeFilter === 'orphan'
                ? 'bg-rose-500 text-white font-semibold'
                : 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            孤岛博文 ({orphanCount})
          </button>
          <button
            onClick={() => setTypeFilter('taxonomy')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              typeFilter === 'taxonomy'
                ? 'bg-amber-500 text-white font-semibold'
                : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-white/[0.05]'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            标签/分类
          </button>
          <button
            onClick={() => setTypeFilter('journey')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              typeFilter === 'journey'
                ? 'bg-emerald-500 text-white font-semibold'
                : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-white/[0.05]'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            旅行足迹
          </button>
        </div>
      </div>

      {/* 画布主视口容器 */}
      <div
        ref={containerRef}
        className="relative w-full h-[620px] rounded-3xl bg-[#fcfcfd] dark:bg-[#07080c] border border-slate-200/80 dark:border-white/[0.08] overflow-hidden shadow-xl"
      >
        {/* Canvas 引擎 */}
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onWheel={handleWheel}
          className="absolute inset-0 w-full h-full block cursor-grab select-none z-0 active:cursor-grabbing"
        />

        {/* 视口浮动缩放操作 HUD */}
        <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 p-1.5 rounded-2xl bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-sm">
          <button
            onClick={() => setScale((s) => Math.min(s * 1.15, 3))}
            className="p-1.5 rounded-xl text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
            title="放大"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <span className="text-[11px] font-mono text-slate-500 px-1 select-none">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={() => setScale((s) => Math.max(s / 1.15, 0.3))}
            className="p-1.5 rounded-xl text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
            title="缩小"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>

        {/* 底部交互指引 HUD */}
        <div className="absolute bottom-4 left-4 right-4 z-10 flex items-center justify-between pointer-events-none text-xs font-mono text-slate-500 dark:text-zinc-400">
          <div className="pointer-events-auto flex items-center gap-2 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-slate-200/80 dark:border-white/10 shadow-xs">
            <Info className="w-3.5 h-3.5 text-emerald-500" />
            <span>拖拽节点拉伸弹簧 · 滚轮缩放 · 悬停高亮关联 · 点击唤出创作者面板</span>
          </div>
          <div className="hidden sm:block pointer-events-auto bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-white/10 shadow-xs">
            <span>{initialNodes.length} NODES · {initialLinks.length} EDGES</span>
          </div>
        </div>

        {/* 右侧节点创作者抽屉 (Node Creator Inspector) */}
        {selectedNode && (
          <aside className="absolute right-4 top-4 bottom-4 w-84 sm:w-96 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-2xl rounded-2xl border border-slate-200/90 dark:border-white/15 p-5 shadow-2xl flex flex-col justify-between z-20 animate-in slide-in-from-right-4 duration-200">
            <div className="space-y-4 overflow-y-auto pr-1 custom-scrollbar">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold text-white shadow-2xs"
                    style={{ backgroundColor: selectedNode.color }}
                  >
                    {selectedNode.type === 'post' && (selectedNode.isOrphan ? '孤岛博文' : '技术博文')}
                    {selectedNode.type === 'tag' && '聚合标签'}
                    {selectedNode.type === 'category' && '分类枢纽'}
                    {selectedNode.type === 'journey' && '地理足迹'}
                    {selectedNode.type === 'core' && '花园中枢'}
                  </span>
                  {selectedNode.isOrphan && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                      需补充标签
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white font-sans leading-snug">
                  {selectedNode.title}
                </h3>
                {selectedNode.category && (
                  <div className="text-xs font-mono text-slate-500 dark:text-zinc-400">
                    所属分类: {selectedNode.category}
                  </div>
                )}
              </div>

              {selectedNode.summary && (
                <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed font-sans bg-slate-50 dark:bg-white/[0.02] p-3 rounded-xl border border-slate-100 dark:border-white/[0.04]">
                  {selectedNode.summary}
                </p>
              )}

              {/* 关联直接相连邻居 */}
              {neighborNodes.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-white/[0.06]">
                  <div className="text-[11px] font-mono text-slate-500 dark:text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                    <span>关联节点 ({neighborNodes.length})</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {neighborNodes.map((neighbor) => (
                      <button
                        key={neighbor.id}
                        onClick={() => setSelectedNode(neighbor)}
                        className="px-2 py-1 rounded-lg text-xs bg-slate-100 dark:bg-white/[0.05] text-slate-700 dark:text-zinc-300 hover:text-emerald-600 dark:hover:text-emerald-400 border border-slate-200/60 dark:border-white/5 transition-colors cursor-pointer"
                      >
                        {neighbor.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 底部快捷管理动作栏 */}
            <div className="pt-4 border-t border-slate-100 dark:border-white/[0.06] space-y-2">
              {selectedNode.adminEditUrl && (
                <Link
                  href={selectedNode.adminEditUrl}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-all"
                >
                  <PenTool className="w-3.5 h-3.5" />
                  <span>
                    {selectedNode.type === 'post' ? '在后台编辑该文章' : '管理足迹记录'}
                  </span>
                </Link>
              )}

              {selectedNode.url && (
                <Link
                  href={selectedNode.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-slate-100 dark:bg-white/[0.05] hover:bg-slate-200/80 dark:hover:bg-white/[0.1] text-slate-700 dark:text-zinc-300 text-xs font-medium border border-slate-200 dark:border-white/10 transition-colors"
                >
                  <span>前台页面预览</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                </Link>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

// 辅助图标
function Share2Icon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}
