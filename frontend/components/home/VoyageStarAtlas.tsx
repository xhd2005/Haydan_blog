'use client';

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useI18n } from '@/lib/i18n';
import { Journey } from '@/lib/types';
import { Compass, MapPin, MousePointer2 } from 'lucide-react';

interface VoyageStarAtlasProps {
  journeys: Journey[];
}

interface StarNode {
  x: number;
  y: number;
  journey: Journey;
}

interface Star {
  x: number;
  y: number;
  r: number;
  layer: number;
  phase: number;
}

/**
 * 交互星图航线（替代 3D 罗盘的星际远航核心交互）
 *
 * - 原生 2D Canvas：三层视差星野 + 真实 journeys 城市发光节点 + 贝塞尔发光航线；
 * - 悬停节点泛起涟漪并浮现游记信息，点击直达对应游记详情页；
 * - 自然文档流（零吸附零滚动劫持），无旅程时呈现纯星野引导空态（AGENTS.md 足迹铁律）。
 */
export function VoyageStarAtlas({ journeys }: VoyageStarAtlasProps) {
  const router = useRouter();
  const { locale } = useI18n();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme !== 'light';

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const nodesRef = useRef<StarNode[]>([]);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const hoverRef = useRef<StarNode | null>(null);
  const ripplesRef = useRef<Array<{ x: number; y: number; start: number }>>([]);

  const [hovered, setHovered] = useState<Journey | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // 真实足迹节点：严格仅使用数据库中带有效经纬度的已发布旅程
  const validJourneys = useMemo(
    () =>
      (journeys || []).filter(
        (j) =>
          typeof j.latitude === 'number' &&
          typeof j.longitude === 'number' &&
          !isNaN(j.latitude) &&
          !isNaN(j.longitude)
      ),
    [journeys]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = container.clientWidth;
    let height = container.clientHeight;
    let animationFrameId = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      width = container.clientWidth;
      height = container.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildScene();
    };

    const buildScene = () => {
      // 三层视差星野
      const stars: Star[] = [];
      const count = Math.floor((width * height) / 3200);
      for (let i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          r: Math.random() * 1.3 + 0.3,
          layer: (i % 3) + 1,
          phase: Math.random() * Math.PI * 2,
        });
      }
      starsRef.current = stars;

      // 等距圆柱投影（含 8% 安全边距）
      const padX = width * 0.08;
      const padY = height * 0.16;
      const sorted = [...validJourneys].sort((a, b) =>
        String(a.startDate || '').localeCompare(String(b.startDate || ''))
      );
      nodesRef.current = sorted.map((j) => ({
        x: padX + ((j.longitude! + 180) / 360) * (width - padX * 2),
        y: padY + ((90 - j.latitude!) / 180) * (height - padY * 2),
        journey: j,
      }));
    };

    const drawRoute = (a: StarNode, b: StarNode, t: number) => {
      const midX = (a.x + b.x) / 2;
      const midY = Math.min(a.y, b.y) - Math.abs(b.x - a.x) * 0.22 - 26;
      const grad = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
      grad.addColorStop(0, isDark ? 'rgba(16,185,129,0.65)' : 'rgba(5,150,105,0.55)');
      grad.addColorStop(1, isDark ? 'rgba(34,211,238,0.65)' : 'rgba(8,145,178,0.55)');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.2;
      ctx.setLineDash([7, 9]);
      ctx.lineDashOffset = -t * 26;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.quadraticCurveTo(midX, midY, b.x, b.y);
      ctx.stroke();
      ctx.setLineDash([]);
    };

    const render = (time: number) => {
      animationFrameId = requestAnimationFrame(render);
      const t = time * 0.001;
      ctx.clearRect(0, 0, width, height);

      // 鼠标视差偏移（三层不同深度）
      const mx = (mouseRef.current.x / Math.max(1, width) - 0.5) * 2;
      const my = (mouseRef.current.y / Math.max(1, height) - 0.5) * 2;

      // 1. 星野（闪烁 + 视差漂移）
      for (const s of starsRef.current) {
        const depth = s.layer * 3.2;
        const twinkle = 0.45 + 0.55 * Math.abs(Math.sin(t * 0.9 + s.phase));
        ctx.beginPath();
        ctx.arc(s.x + mx * depth, s.y + my * depth, s.r, 0, Math.PI * 2);
        ctx.fillStyle = isDark
          ? `rgba(226, 240, 235, ${0.28 * twinkle + 0.08 * s.layer})`
          : `rgba(71, 85, 105, ${0.22 * twinkle + 0.05 * s.layer})`;
        ctx.fill();
      }

      // 2. 航线（流动虚线贝塞尔）
      const nodes = nodesRef.current;
      for (let i = 0; i < nodes.length - 1; i++) {
        drawRoute(nodes[i], nodes[i + 1], t);
      }

      // 3. 城市发光节点
      nodes.forEach((n) => {
        const isHover = hoverRef.current === n;
        const pulse = 1 + Math.sin(t * 2.2 + n.x * 0.01) * 0.18;
        const baseR = isHover ? 6.2 : 3.8;

        // 环境光晕
        const glow = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, baseR * 6);
        glow.addColorStop(0, isDark ? 'rgba(16,185,129,0.5)' : 'rgba(5,150,105,0.4)');
        glow.addColorStop(1, 'rgba(16,185,129,0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(n.x, n.y, baseR * 6, 0, Math.PI * 2);
        ctx.fill();

        // 核点
        ctx.beginPath();
        ctx.arc(n.x, n.y, baseR * pulse * 0.9, 0, Math.PI * 2);
        ctx.fillStyle = isHover ? '#34d399' : isDark ? '#10b981' : '#059669';
        ctx.shadowColor = '#10b981';
        ctx.shadowBlur = isHover ? 18 : 8;
        ctx.fill();
        ctx.shadowBlur = 0;

        // 常亮呼吸环
        ctx.beginPath();
        ctx.arc(n.x, n.y, baseR * pulse * 1.7, 0, Math.PI * 2);
        ctx.strokeStyle = isDark ? 'rgba(52,211,153,0.4)' : 'rgba(5,150,105,0.35)';
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // 4. 悬停涟漪扩散
      ripplesRef.current = ripplesRef.current.filter((r) => t - r.start < 1.2);
      ripplesRef.current.forEach((r) => {
        const age = t - r.start;
        const radius = 8 + age * 42;
        const alpha = Math.max(0, 0.5 - age * 0.42);
        ctx.beginPath();
        ctx.arc(r.x, r.y, radius, 0, Math.PI * 2);
        ctx.strokeStyle = isDark ? `rgba(52,211,153,${alpha})` : `rgba(5,150,105,${alpha})`;
        ctx.lineWidth = 1.6;
        ctx.stroke();
      });
    };

    animationFrameId = requestAnimationFrame(render);

    // 交互：悬停探测 + 点击直达
    const pickNode = (px: number, py: number): StarNode | null => {
      let best: StarNode | null = null;
      let bestDist = 26;
      nodesRef.current.forEach((n) => {
        const d = Math.hypot(n.x - px, n.y - py);
        if (d < bestDist) {
          bestDist = d;
          best = n;
        }
      });
      return best;
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      mouseRef.current = { x, y };
      const node = pickNode(x, y);
      if (node !== hoverRef.current) {
        hoverRef.current = node;
        if (node) {
          ripplesRef.current.push({ x: node.x, y: node.y, start: performance.now() * 0.001 });
          setHovered(node.journey);
          setTooltipPos({ x: node.x, y: node.y });
        } else {
          setHovered(null);
        }
      }
      canvas.style.cursor = node ? 'pointer' : 'default';
    };

    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const node = pickNode(e.clientX - rect.left, e.clientY - rect.top);
      if (node?.journey.slug) {
        router.push(`/journey/${node.journey.slug}`);
      }
    };

    const handleLeave = () => {
      mouseRef.current = { x: -9999, y: -9999 };
      hoverRef.current = null;
      setHovered(null);
      canvas.style.cursor = 'default';
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    resize();

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('mouseleave', handleLeave);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('click', handleClick);
      canvas.removeEventListener('mouseleave', handleLeave);
    };
  }, [validJourneys, isDark, router]);

  return (
    <section
      aria-label={locale === 'en' ? 'Interactive Voyage Star Atlas' : '交互星图航线'}
      className="relative w-full h-[70vh] min-h-[440px] overflow-hidden starfield"
    >
      {/* 头部叙事栏 */}
      <div className="absolute top-4 left-4 sm:top-6 sm:left-8 z-20 flex items-center gap-3 pointer-events-none">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] font-mono font-semibold bg-white/80 dark:bg-neutral-900/60 text-cyan-700 dark:text-cyan-300 border border-slate-200/80 dark:border-white/[0.08] backdrop-blur-xl shadow-xs">
          <Compass className="w-3.5 h-3.5 text-cyan-500 animate-pulse" />
          <span>VOYAGE STAR ATLAS // {locale === 'en' ? 'FLIGHT MAP' : '星图航线'}</span>
        </div>
        <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground">
          <MapPin className="w-3 h-3 text-emerald-500" />
          {validJourneys.length} {locale === 'en' ? 'FOOTPRINTS' : '个真实足迹'}
        </span>
      </div>

      {/* 交互提示 */}
      <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-8 z-20 pointer-events-none">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground">
          <MousePointer2 className="w-3 h-3 text-emerald-500" />
          {locale === 'en' ? 'Hover to explore · Click to open the travelogue' : '悬停探索城市 · 点击直达游记'}
        </span>
      </div>

      {/* 星图画布 */}
      <div ref={containerRef} className="absolute inset-0">
        <canvas ref={canvasRef} className="block" />
      </div>

      {/* 悬停信息卡 */}
      {hovered && (
        <div
          className="absolute z-30 pointer-events-none px-3.5 py-2.5 rounded-2xl bg-white/90 dark:bg-neutral-900/85 border border-emerald-500/30 dark:border-emerald-400/25 backdrop-blur-xl shadow-xl shadow-emerald-500/10 -translate-x-1/2 -translate-y-[calc(100%+14px)] animate-fadeIn"
          style={{ left: tooltipPos.x, top: tooltipPos.y }}
        >
          <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            <MapPin className="w-3 h-3" />
            {hovered.city} · {hovered.country}
          </div>
          <p className="text-xs font-semibold text-foreground mt-0.5 max-w-[180px] truncate">
            {hovered.title}
          </p>
          {hovered.startDate && (
            <p className="text-[10px] font-mono text-muted-foreground mt-0.5">{hovered.startDate}</p>
          )}
        </div>
      )}

      {/* 无足迹空态：纯星野 + 引导 */}
      {validJourneys.length === 0 && (
        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
          <div className="text-center space-y-2 px-6 py-4 rounded-3xl bg-white/70 dark:bg-neutral-900/60 border border-slate-200/70 dark:border-white/[0.08] backdrop-blur-xl">
            <Compass className="w-6 h-6 mx-auto text-emerald-500 animate-pulse" />
            <p className="text-sm font-semibold text-foreground">
              {locale === 'en' ? 'The star atlas awaits its first voyage' : '星图静候第一段旅程'}
            </p>
            <p className="text-xs text-muted-foreground">
              {locale === 'en'
                ? 'Publish a journey and watch its route light up among the stars.'
                : '发布第一篇游记后，真实城市将在此点亮发光航线。'}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
