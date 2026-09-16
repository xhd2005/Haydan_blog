'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useI18n } from '@/lib/i18n';
import {
  Sparkles,
  Search,
  RotateCcw,
  Maximize2,
  Minimize2,
  BookOpen,
  MapPin,
  Tag,
  Compass,
  ArrowRight,
  Layers,
  X,
  Share2,
  Sliders,
  ExternalLink
} from 'lucide-react';

export interface GraphNode {
  id: string;
  title: string;
  type: 'post' | 'tag' | 'journey' | 'philosophy';
  url?: string;
  slug?: string;
  category?: string;
  summary?: string;
  radius: number;
  color: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  isFixed?: boolean;
}

export interface GraphLink {
  source: string;
  target: string;
  strength?: number;
}

interface KnowledgeGraphViewProps {
  initialNodes: GraphNode[];
  initialLinks: GraphLink[];
}

export function KnowledgeGraphView({ initialNodes, initialLinks }: KnowledgeGraphViewProps) {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const { locale } = useI18n();
  const isDark = resolvedTheme === 'dark';

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 物理引擎状态
  const nodesRef = useRef<GraphNode[]>([]);
  const linksRef = useRef<GraphLink[]>([]);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // 摄像机视角状态
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [scale, setScale] = useState<number>(1);
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const mouseStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const draggedNodeRef = useRef<GraphNode | null>(null);

  // 过滤状态
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'post' | 'tag' | 'journey'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // 初始化节点坐标与链接
  useEffect(() => {
    // 环形分布散开初始化
    const total = initialNodes.length;
    nodesRef.current = initialNodes.map((n, i) => {
      const angle = (i / Math.max(total, 1)) * Math.PI * 2;
      const dist = 120 + Math.random() * 260;
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

  // 获取高亮连通集（鼠标悬停某节点时，获取所有直接相连邻居）
  const connectedNodeIds = useMemo(() => {
    if (!hoveredNodeId && !selectedNode) return null;
    const targetId = hoveredNodeId || selectedNode?.id;
    const set = new Set<string>();
    set.add(targetId!);
    linksRef.current.forEach((l) => {
      if (l.source === targetId) set.add(l.target);
      if (l.target === targetId) set.add(l.source);
    });
    return set;
  }, [hoveredNodeId, selectedNode]);

  // 屏幕坐标 -> 世界坐标转换
  const screenToWorld = useCallback(
    (sx: number, sy: number) => {
      if (!canvasRef.current) return { wx: 0, wy: 0 };
      const rect = canvasRef.current.getBoundingClientRect();
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const wx = (sx - rect.left - cx - pan.x) / scale;
      const wy = (sy - rect.top - cy - pan.y) / scale;
      return { wx, wy };
    },
    [pan, scale]
  );

  // 物理模拟步进与 Canvas 渲染循环
  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.clientWidth;
    let height = canvas.clientHeight;
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;

    const runSimulation = () => {
      const nodes = nodesRef.current;
      const links = linksRef.current;

      // 1. 物理引斥力计算
      // 库仑排斥力 (Coulomb Repulsion)
      const kRepel = 2400;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const distSq = dx * dx + dy * dy || 1;
          const dist = Math.sqrt(distSq);
          if (dist < 500) {
            const force = kRepel / distSq;
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;
            if (!a.isFixed) {
              a.vx -= fx;
              a.vy -= fy;
            }
            if (!b.isFixed) {
              b.vx += fx;
              b.vy += fy;
            }
          }
        }
      }

      // 弹簧吸引力 (Hooke's Spring Links)
      const linkLength = 90;
      const kSpring = 0.035;
      const nodeMap = new Map<string, GraphNode>();
      nodes.forEach((n) => nodeMap.set(n.id, n));

      links.forEach((link) => {
        const a = nodeMap.get(link.source);
        const b = nodeMap.get(link.target);
        if (!a || !b) return;

        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const displacement = dist - linkLength;
        const force = displacement * kSpring * (link.strength || 1);
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;

        if (!a.isFixed) {
          a.vx += fx;
          a.vy += fy;
        }
        if (!b.isFixed) {
          b.vx -= fx;
          b.vy -= fy;
        }
      });

      // 中心引力与速度阻尼积分
      const centerGravity = 0.008;
      const damping = 0.88;
      nodes.forEach((node) => {
        if (node.isFixed) {
          node.vx = 0;
          node.vy = 0;
          return;
        }
        node.vx -= node.x * centerGravity;
        node.vy -= node.y * centerGravity;

        node.vx *= damping;
        node.vy *= damping;

        node.x += node.vx;
        node.y += node.vy;
      });

      // 2. 渲染绘制
      ctx.save();
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      ctx.clearRect(0, 0, width, height);

      // 背景微网格标尺
      const cx = width / 2;
      const cy = height / 2;
      ctx.translate(cx + pan.x, cy + pan.y);
      ctx.scale(scale, scale);

      // 绘制连线
      links.forEach((link) => {
        const a = nodeMap.get(link.source);
        const b = nodeMap.get(link.target);
        if (!a || !b) return;

        const isHighlighted =
          connectedNodeIds && connectedNodeIds.has(a.id) && connectedNodeIds.has(b.id);

        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);

        if (isHighlighted) {
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2 / scale;
          ctx.globalAlpha = 0.85;
        } else if (connectedNodeIds) {
          ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';
          ctx.lineWidth = 1 / scale;
          ctx.globalAlpha = 0.2;
        } else {
          ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(148,163,184,0.3)';
          ctx.lineWidth = 1 / scale;
          ctx.globalAlpha = 0.6;
        }
        ctx.stroke();
      });

      // 绘制节点
      nodes.forEach((node) => {
        const isConnected = !connectedNodeIds || connectedNodeIds.has(node.id);
        const isHovered = hoveredNodeId === node.id;
        const isSelected = selectedNode?.id === node.id;
        const matchesFilter = activeFilter === 'ALL' || node.type === activeFilter;

        const opacity = isConnected && matchesFilter ? 1 : 0.15;
        ctx.globalAlpha = opacity;

        // 节点外层光晕
        if (isHovered || isSelected) {
          const glowGrad = ctx.createRadialGradient(
            node.x,
            node.y,
            node.radius * 0.8,
            node.x,
            node.y,
            node.radius * 2.6
          );
          glowGrad.addColorStop(0, node.color);
          glowGrad.addColorStop(1, 'transparent');
          ctx.fillStyle = glowGrad;
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius * 2.6, 0, Math.PI * 2);
          ctx.fill();
        }

        // 节点核心实体
        ctx.beginPath();
        ctx.arc(node.x, node.y, isHovered ? node.radius * 1.3 : node.radius, 0, Math.PI * 2);
        ctx.fillStyle = node.color;
        ctx.fill();
        ctx.lineWidth = 2 / scale;
        ctx.strokeStyle = isDark ? '#ffffff' : '#0f172a';
        ctx.stroke();

        // 节点文字标注（仅当处于高亮集合或缩放较大时渲染）
        if ((scale >= 0.75 || isConnected || isHovered) && matchesFilter) {
          ctx.font = `${isHovered ? 'bold ' : ''}${Math.max(10, 11 / scale)}px sans-serif`;
          ctx.fillStyle = isDark ? '#f1f5f9' : '#0f172a';
          ctx.textAlign = 'center';
          ctx.fillText(node.title, node.x, node.y + node.radius + 12 / scale);
        }
      });

      ctx.restore();

      animId = requestAnimationFrame(runSimulation);
    };

    animId = requestAnimationFrame(runSimulation);

    const onResize = () => {
      if (!canvasRef.current) return;
      width = canvasRef.current.clientWidth;
      height = canvasRef.current.clientHeight;
      canvas.width = width * window.devicePixelRatio;
      canvas.height = height * window.devicePixelRatio;
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
    };
  }, [pan, scale, connectedNodeIds, hoveredNodeId, selectedNode, activeFilter, isDark]);

  // 鼠标交互处理
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { wx, wy } = screenToWorld(e.clientX, e.clientY);

    // 检查是否点击在某个节点上
    const hit = nodesRef.current.find((n) => {
      const dx = n.x - wx;
      const dy = n.y - wy;
      return Math.sqrt(dx * dx + dy * dy) <= n.radius + 6;
    });

    if (hit) {
      draggedNodeRef.current = hit;
      hit.isFixed = true;
      setSelectedNode(hit);
    } else {
      setIsPanning(true);
      mouseStartRef.current = { x: e.clientX, y: e.clientY };
      panStartRef.current = { ...pan };
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { wx, wy } = screenToWorld(e.clientX, e.clientY);

    // 拖拽节点中
    if (draggedNodeRef.current) {
      draggedNodeRef.current.x = wx;
      draggedNodeRef.current.y = wy;
      return;
    }

    // 画布平移中
    if (isPanning) {
      const dx = e.clientX - mouseStartRef.current.x;
      const dy = e.clientY - mouseStartRef.current.y;
      setPan({
        x: panStartRef.current.x + dx,
        y: panStartRef.current.y + dy,
      });
      return;
    }

    // 悬停检测
    const hit = nodesRef.current.find((n) => {
      const dx = n.x - wx;
      const dy = n.y - wy;
      return Math.sqrt(dx * dx + dy * dy) <= n.radius + 6;
    });

    if (hit) {
      setHoveredNodeId(hit.id);
      if (canvasRef.current) canvasRef.current.style.cursor = 'pointer';
    } else {
      setHoveredNodeId(null);
      if (canvasRef.current) canvasRef.current.style.cursor = isPanning ? 'grabbing' : 'grab';
    }
  };

  const handleMouseUp = () => {
    if (draggedNodeRef.current) {
      draggedNodeRef.current.isFixed = false;
      draggedNodeRef.current = null;
    }
    setIsPanning(false);
  };

  // 滚轮缩放
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    setScale((prev) => Math.min(Math.max(0.4, prev * zoomFactor), 2.5));
  };

  // 视角重置复位
  const handleResetView = () => {
    setScale(1);
    setPan({ x: 0, y: 0 });
    setSelectedNode(null);
  };

  // 重新激发引力场散开
  const handleResimulate = () => {
    nodesRef.current.forEach((n) => {
      n.vx = (Math.random() - 0.5) * 15;
      n.vy = (Math.random() - 0.5) * 15;
    });
  };

  // 获取选中节点直接关联的邻居列表
  const neighborNodes = useMemo(() => {
    if (!selectedNode) return [];
    const neighborIds = new Set<string>();
    linksRef.current.forEach((l) => {
      if (l.source === selectedNode.id) neighborIds.add(l.target);
      if (l.target === selectedNode.id) neighborIds.add(l.source);
    });
    return nodesRef.current.filter((n) => neighborIds.has(n.id));
  }, [selectedNode]);

  return (
    <div className="w-full min-h-screen pb-20">
      {/* 顶部 Header */}
      <section className="pt-28 pb-8 text-center max-w-4xl mx-auto px-4 space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono font-medium bg-neutral-100 dark:bg-neutral-800/80 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 shadow-2xs">
          <Compass className="w-3.5 h-3.5 text-blue-500" />
          <span>KNOWLEDGE GRAPH // 知识星图</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground font-sans">
          全站脑图与灵感星图
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base leading-relaxed max-w-xl mx-auto font-sans">
          数字花园的有机生态网络。博文、高并发架构、地理旷野与生活哲学在此共振互联。
        </p>
      </section>

      {/* 知识图谱主视口容器 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          ref={containerRef}
          className="w-full h-[680px] sm:h-[720px] rounded-3xl bg-white/88 dark:bg-neutral-900/70 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] shadow-lg relative overflow-hidden flex flex-col justify-between"
        >
          {/* 顶部浮动控制条 */}
          <div className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 z-10 pointer-events-none">
            {/* 分类药丸 */}
            <div className="flex flex-wrap items-center gap-1.5 pointer-events-auto bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md p-1 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm">
              <button
                onClick={() => setActiveFilter('ALL')}
                className={`px-3 py-1 rounded-xl text-xs font-sans transition-all cursor-pointer ${
                  activeFilter === 'ALL'
                    ? 'bg-blue-600 text-white font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-foreground'
                }`}
              >
                全部网络
              </button>
              <button
                onClick={() => setActiveFilter('post')}
                className={`flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-sans transition-all cursor-pointer ${
                  activeFilter === 'post'
                    ? 'bg-sky-500 text-white font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-foreground'
                }`}
              >
                <BookOpen className="w-3 h-3" />
                <span>技术博文</span>
              </button>
              <button
                onClick={() => setActiveFilter('tag')}
                className={`flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-sans transition-all cursor-pointer ${
                  activeFilter === 'tag'
                    ? 'bg-amber-500 text-white font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-foreground'
                }`}
              >
                <Tag className="w-3 h-3" />
                <span>概念枢纽</span>
              </button>
              <button
                onClick={() => setActiveFilter('journey')}
                className={`flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-sans transition-all cursor-pointer ${
                  activeFilter === 'journey'
                    ? 'bg-emerald-500 text-white font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-foreground'
                }`}
              >
                <MapPin className="w-3 h-3" />
                <span>地理足迹</span>
              </button>
            </div>

            {/* 视角控制按钮 */}
            <div className="flex items-center gap-2 pointer-events-auto bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm text-xs font-mono">
              <button
                onClick={handleResimulate}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-neutral-800 text-slate-600 dark:text-slate-300 transition-colors"
                title="重新激发引力场散开"
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
              </button>
              <button
                onClick={handleResetView}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-neutral-800 text-slate-600 dark:text-slate-300 transition-colors"
                title="复位视角"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <span className="text-slate-400 px-1">
                {Math.round(scale * 100)}%
              </span>
            </div>
          </div>

          {/* HTML5 Canvas 力导向交互物理引擎画布 */}
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onWheel={handleWheel}
            className="absolute inset-0 w-full h-full block cursor-grab select-none z-0"
          />

          {/* 底部 HUD 提示 */}
          <div className="p-4 sm:p-5 flex items-center justify-between z-10 pointer-events-none text-xs font-mono text-muted-foreground">
            <div className="pointer-events-auto bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-slate-200/80 dark:border-white/10">
              <span>DRAG NODE TO STRETCH · HOVER TO HIGHLIGHT · CLICK TO INSPECT</span>
            </div>
            <div className="hidden sm:block pointer-events-auto bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-slate-200/80 dark:border-white/10">
              <span>{initialNodes.length} NODES · {initialLinks.length} CONNECTIONS</span>
            </div>
          </div>

          {/* 右侧滑出知识切片卡片 (Selected Node Drawer) */}
          {selectedNode && (
            <aside className="absolute right-4 top-20 bottom-4 w-80 sm:w-96 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-2xl rounded-3xl border border-slate-200/90 dark:border-white/15 p-6 shadow-2xl flex flex-col justify-between z-20 animate-in slide-in-from-right-4 duration-300">
              <div className="space-y-4 overflow-y-auto pr-1">
                <div className="flex items-center justify-between">
                  <span
                    className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold text-white shadow-2xs"
                    style={{ backgroundColor: selectedNode.color }}
                  >
                    {selectedNode.type === 'post' && '技术博文'}
                    {selectedNode.type === 'tag' && '概念标签'}
                    {selectedNode.type === 'journey' && '地理足迹'}
                    {selectedNode.type === 'philosophy' && '生活哲学'}
                  </span>
                  <button
                    onClick={() => setSelectedNode(null)}
                    className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-neutral-800 text-slate-400 hover:text-foreground transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-foreground font-sans">
                    {selectedNode.title}
                  </h3>
                  {selectedNode.category && (
                    <div className="text-xs font-mono text-muted-foreground">
                      分类: {selectedNode.category}
                    </div>
                  )}
                </div>

                {selectedNode.summary && (
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                    {selectedNode.summary}
                  </p>
                )}

                {/* 关联直接邻居 */}
                {neighborNodes.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-white/[0.06]">
                    <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                      关联节点 ({neighborNodes.length})
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {neighborNodes.map((neighbor) => (
                        <button
                          key={neighbor.id}
                          onClick={() => setSelectedNode(neighbor)}
                          className="px-2.5 py-1 rounded-xl text-xs font-sans bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200/50 dark:border-white/5 transition-colors cursor-pointer"
                        >
                          {neighbor.title}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 底部直达按钮 */}
              {selectedNode.url && (
                <div className="pt-4 border-t border-slate-100 dark:border-white/[0.06]">
                  <Link
                    href={selectedNode.url}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-sans font-bold text-xs shadow-md hover:opacity-90 transition-opacity"
                  >
                    <span>{selectedNode.type === 'journey' ? '前往足迹航图' : '阅读完整文章'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </aside>
          )}
        </div>
      </main>
    </div>
  );
}
