'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { KnowledgeGraphVO, KnowledgeGraphNode, KnowledgeGraphEdge } from '@/lib/types';
import { useTheme } from 'next-themes';
import { useTranslation } from '@/lib/i18n-client';
import { Compass, Sparkles, Filter, Maximize2, ZoomIn, ZoomOut, RotateCcw, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SimNode extends KnowledgeGraphNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

interface SimEdge extends KnowledgeGraphEdge {
  sourceNode?: SimNode;
  targetNode?: SimNode;
}

interface GardenConstellationGraphProps {
  data: KnowledgeGraphVO;
  onSelectNode?: (node: KnowledgeGraphNode) => void;
  activeNodeId?: string | null;
}

export function GardenConstellationGraph({
  data,
  onSelectNode,
  activeNodeId,
}: GardenConstellationGraphProps) {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme !== 'light';
  const { locale } = useTranslation();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [filter, setFilter] = useState<'ALL' | 'POST' | 'CONCEPT' | 'JOURNEY'>('ALL');
  const [hoveredNode, setHoveredNode] = useState<SimNode | null>(null);
  const [selectedNode, setSelectedNode] = useState<SimNode | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  // 物理模拟节点与边
  const simDataRef = useRef<{ nodes: SimNode[]; edges: SimEdge[] }>({ nodes: [], edges: [] });
  const isDraggingRef = useRef<{ node: SimNode | null; isPanning: boolean; startX: number; startY: number }>({
    node: null,
    isPanning: false,
    startX: 0,
    startY: 0,
  });

  // 初始化节点物理模型
  useEffect(() => {
    if (!data || !data.nodes) return;

    const width = 800;
    const height = 550;

    const nodes: SimNode[] = data.nodes.map((n, i) => {
      const angle = (i / data.nodes.length) * 2 * Math.PI;
      const dist = 120 + Math.random() * 160;
      return {
        ...n,
        x: width / 2 + Math.cos(angle) * dist,
        y: height / 2 + Math.sin(angle) * dist,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: n.type === 'concept' ? 14 : (n.type === 'post' ? 10 : 8),
      };
    });

    const nodeMap = new Map<string, SimNode>();
    nodes.forEach((n) => nodeMap.set(n.id, n));

    const edges: SimEdge[] = (data.edges || []).map((e) => ({
      ...e,
      sourceNode: nodeMap.get(e.source),
      targetNode: nodeMap.get(e.target),
    })).filter((e) => e.sourceNode && e.targetNode);

    simDataRef.current = { nodes, edges };
  }, [data]);

  // 力导向物理引擎循环 + Canvas 绘制
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const { nodes, edges } = simDataRef.current;
      const width = canvas.width;
      const height = canvas.height;

      // 1. 简易力导向物理迭代 (弹簧力 + 斥力 + 中心引力 + 阻尼)
      const center = { x: width / 2, y: height / 2 };
      for (let i = 0; i < nodes.length; i++) {
        const n1 = nodes[i];
        if (isDraggingRef.current.node === n1) continue;

        // 中心引力
        n1.vx += (center.x - n1.x) * 0.0003;
        n1.vy += (center.y - n1.y) * 0.0003;

        // 节点间斥力 (反比平方)
        for (let j = i + 1; j < nodes.length; j++) {
          const n2 = nodes[j];
          const dx = n1.x - n2.x;
          const dy = n1.y - n2.y;
          const distSq = dx * dx + dy * dy + 100;
          const dist = Math.sqrt(distSq);
          if (dist < 220) {
            const force = 120 / distSq;
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;
            n1.vx += fx;
            n1.vy += fy;
            n2.vx -= fx;
            n2.vy -= fy;
          }
        }
      }

      // 边弹簧力 (拉紧相连节点)
      for (const edge of edges) {
        if (!edge.sourceNode || !edge.targetNode) continue;
        const dx = edge.targetNode.x - edge.sourceNode.x;
        const dy = edge.targetNode.y - edge.sourceNode.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const desiredDist = edge.relation === 'TRANSLATION' ? 40 : 100;
        const spring = (dist - desiredDist) * 0.0015 * (edge.weight || 1);
        const fx = (dx / dist) * spring;
        const fy = (dy / dist) * spring;

        if (isDraggingRef.current.node !== edge.sourceNode) {
          edge.sourceNode.vx += fx;
          edge.sourceNode.vy += fy;
        }
        if (isDraggingRef.current.node !== edge.targetNode) {
          edge.targetNode.vx -= fx;
          edge.targetNode.vy -= fy;
        }
      }

      // 更新位置与速度阻尼
      for (const n of nodes) {
        if (isDraggingRef.current.node === n) continue;
        n.vx *= 0.88;
        n.vy *= 0.88;
        n.x += n.vx;
        n.y += n.vy;
      }

      // 2. 清屏与背景渲染
      ctx.clearRect(0, 0, width, height);

      ctx.save();
      ctx.translate(pan.x, pan.y);
      ctx.scale(zoom, zoom);

      // 3. 绘制连线
      for (const edge of edges) {
        if (!edge.sourceNode || !edge.targetNode) continue;
        const isHighlight =
          (selectedNode && (edge.source === selectedNode.id || edge.target === selectedNode.id)) ||
          (hoveredNode && (edge.source === hoveredNode.id || edge.target === hoveredNode.id));

        ctx.beginPath();
        ctx.moveTo(edge.sourceNode.x, edge.sourceNode.y);
        ctx.lineTo(edge.targetNode.x, edge.targetNode.y);

        if (isHighlight) {
          ctx.strokeStyle = isDark ? 'rgba(56, 189, 248, 0.7)' : 'rgba(14, 165, 233, 0.8)';
          ctx.lineWidth = 2.2;
        } else {
          ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.07)';
          ctx.lineWidth = edge.relation === 'TRANSLATION' ? 1.5 : 1;
        }
        ctx.stroke();
      }

      // 4. 绘制节点粒子
      for (const node of nodes) {
        // 过滤筛选
        if (filter === 'POST' && node.type !== 'post') continue;
        if (filter === 'CONCEPT' && node.type !== 'concept') continue;
        if (filter === 'JOURNEY' && node.type !== 'journey') continue;

        const isHovered = hoveredNode?.id === node.id;
        const isSelected = selectedNode?.id === node.id || activeNodeId === node.id;

        // 节点色彩体系
        let fillColor = '#10b981'; // 默认翠绿
        if (node.type === 'concept') {
          fillColor = isDark ? '#c084fc' : '#9333ea'; // 紫晶
        } else if (node.type === 'journey') {
          fillColor = isDark ? '#38bdf8' : '#0284c7'; // 晴空海蓝
        } else if (node.type === 'post') {
          if (node.maturity === 'SEEDLING') fillColor = '#f59e0b'; // 暖金萌芽
          else if (node.maturity === 'BUDDING') fillColor = isDark ? '#38bdf8' : '#0ea5e9'; // 青蓝生长
          else fillColor = '#10b981'; // 翠绿常青
        }

        // 外层高亮光晕
        if (isHovered || isSelected) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius + 7, 0, Math.PI * 2);
          ctx.fillStyle = isDark ? 'rgba(56, 189, 248, 0.25)' : 'rgba(14, 165, 233, 0.2)';
          ctx.fill();
        }

        // 核心实心圆
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = fillColor;
        ctx.fill();
        ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(255, 255, 255, 0.9)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // 节点文字标签
        ctx.font = node.type === 'concept' ? 'bold 11px ui-monospace, monospace' : '10px ui-sans-serif, system-ui';
        ctx.fillStyle = isDark ? '#e5e5e5' : '#18181b';
        ctx.textAlign = 'center';
        ctx.fillText(node.label.length > 12 ? node.label.substring(0, 10) + '..' : node.label, node.x, node.y + node.radius + 13);
      }

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [isDark, zoom, pan, filter, selectedNode, hoveredNode, activeNodeId]);

  // 鼠标交互事件处理 (拖拽节点、平移画布、滚轮缩放、点击选择)
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left - pan.x) / zoom;
    const mouseY = (e.clientY - rect.top - pan.y) / zoom;

    const clickedNode = simDataRef.current.nodes.find((n) => {
      const dx = n.x - mouseX;
      const dy = n.y - mouseY;
      return dx * dx + dy * dy < (n.radius + 6) * (n.radius + 6);
    });

    if (clickedNode) {
      isDraggingRef.current = { node: clickedNode, isPanning: false, startX: mouseX, startY: mouseY };
      setSelectedNode(clickedNode);
      if (onSelectNode) onSelectNode(clickedNode);
    } else {
      isDraggingRef.current = { node: null, isPanning: true, startX: e.clientX - pan.x, startY: e.clientY - pan.y };
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();

    if (isDraggingRef.current.node) {
      const mouseX = (e.clientX - rect.left - pan.x) / zoom;
      const mouseY = (e.clientY - rect.top - pan.y) / zoom;
      isDraggingRef.current.node.x = mouseX;
      isDraggingRef.current.node.y = mouseY;
      return;
    }

    if (isDraggingRef.current.isPanning) {
      setPan({
        x: e.clientX - isDraggingRef.current.startX,
        y: e.clientY - isDraggingRef.current.startY,
      });
      return;
    }

    // 悬停探测
    const mouseX = (e.clientX - rect.left - pan.x) / zoom;
    const mouseY = (e.clientY - rect.top - pan.y) / zoom;
    const hoverNode = simDataRef.current.nodes.find((n) => {
      const dx = n.x - mouseX;
      const dy = n.y - mouseY;
      return dx * dx + dy * dy < (n.radius + 6) * (n.radius + 6);
    });

    setHoveredNode(hoverNode || null);
  };

  const handleMouseUp = () => {
    isDraggingRef.current = { node: null, isPanning: false, startX: 0, startY: 0 };
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    setZoom((prev) => Math.min(Math.max(prev * zoomFactor, 0.4), 2.5));
  };

  return (
    <div className="relative w-full rounded-3xl overflow-hidden border border-slate-200/90 dark:border-white/[0.08] bg-slate-50/50 dark:bg-neutral-950/70 backdrop-blur-2xl shadow-xl">
      {/* 顶部控制栏 */}
      <div className="flex flex-wrap items-center justify-between p-4 border-b border-slate-200/70 dark:border-white/[0.06] gap-3 select-none">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
            <Compass className="w-3.5 h-3.5 animate-spin-slow text-emerald-500" />
            <span>KNOWLEDGE CONSTELLATION GRAPH</span>
          </div>

          <span className="text-xs font-mono text-muted-foreground hidden sm:inline">
            {simDataRef.current.nodes.length} 核心引力节点
          </span>
        </div>

        {/* 筛选微胶囊 */}
        <div className="flex items-center gap-1.5 text-xs font-mono">
          <button
            type="button"
            onClick={() => setFilter('ALL')}
            className={`px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
              filter === 'ALL'
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 font-bold'
                : 'border-border/60 text-muted-foreground hover:text-foreground'
            }`}
          >
            {locale === 'en' ? 'All' : '全景'}
          </button>
          <button
            type="button"
            onClick={() => setFilter('POST')}
            className={`px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
              filter === 'POST'
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 font-bold'
                : 'border-border/60 text-muted-foreground hover:text-foreground'
            }`}
          >
            {locale === 'en' ? 'Posts' : '博文'}
          </button>
          <button
            type="button"
            onClick={() => setFilter('CONCEPT')}
            className={`px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
              filter === 'CONCEPT'
                ? 'bg-purple-500/15 border-purple-500/40 text-purple-600 dark:text-purple-400 font-bold'
                : 'border-border/60 text-muted-foreground hover:text-foreground'
            }`}
          >
            {locale === 'en' ? 'Concepts' : '概念'}
          </button>
          <button
            type="button"
            onClick={() => setFilter('JOURNEY')}
            className={`px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
              filter === 'JOURNEY'
                ? 'bg-sky-500/15 border-sky-500/40 text-sky-600 dark:text-sky-400 font-bold'
                : 'border-border/60 text-muted-foreground hover:text-foreground'
            }`}
          >
            {locale === 'en' ? 'Journeys' : '足迹'}
          </button>
        </div>

        {/* 缩放控制 */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(z * 1.15, 2.5))}
            className="p-1.5 rounded-lg border border-border/60 hover:bg-secondary text-muted-foreground transition-colors cursor-pointer"
            title="放大"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(z * 0.85, 0.4))}
            className="p-1.5 rounded-lg border border-border/60 hover:bg-secondary text-muted-foreground transition-colors cursor-pointer"
            title="缩小"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              setZoom(1);
              setPan({ x: 0, y: 0 });
            }}
            className="p-1.5 rounded-lg border border-border/60 hover:bg-secondary text-muted-foreground transition-colors cursor-pointer"
            title="复位"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2D Canvas 画布区域 */}
      <div className="relative w-full h-[520px] cursor-grab active:cursor-grabbing overflow-hidden">
        <canvas
          ref={canvasRef}
          width={900}
          height={520}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onWheel={handleWheel}
          className="w-full h-full block"
        />

        {/* 节点详情微卡片浮窗 (选中的节点) */}
        {(selectedNode || hoveredNode) && (
          <div className="absolute bottom-4 left-4 max-w-[320px] p-4 rounded-2xl bg-white/90 dark:bg-neutral-900/90 border border-slate-200/90 dark:border-white/[0.12] backdrop-blur-xl shadow-2xl text-xs space-y-2 animate-fade-in pointer-events-auto">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20">
                {(selectedNode || hoveredNode)?.type?.toUpperCase()}
              </span>
              {(selectedNode || hoveredNode)?.url && (
                <button
                  type="button"
                  onClick={() => router.push((selectedNode || hoveredNode)!.url!)}
                  className="flex items-center gap-1 text-[11px] font-mono text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  <span>直达页面</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              )}
            </div>
            <h4 className="font-bold text-sm text-foreground line-clamp-1">
              {(selectedNode || hoveredNode)?.label}
            </h4>
            {(selectedNode || hoveredNode)?.excerpt && (
              <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                {(selectedNode || hoveredNode)?.excerpt}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
