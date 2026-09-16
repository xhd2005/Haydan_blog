'use client';

import React, { useState } from 'react';
import { PageVisualsConfig, PageVisualItem, LoadingVisualsConfig } from '@/lib/types';
import { toast } from '@/lib/toast';
import {
  BookOpen,
  Code2,
  Compass,
  User,
  Film,
  Image as ImageIcon,
  HardDrive,
  Trash2,
  ExternalLink,
  Sparkles,
  Info,
  CheckCircle2,
  Type,
  RotateCcw,
  Sliders,
  Shield,
  Layers,
  Sparkle,
  Play,
  Timer,
  Activity
} from 'lucide-react';

interface PageVisualsEditorProps {
  value: PageVisualsConfig;
  onChange: (value: PageVisualsConfig) => void;
  onOpenMediaPicker: (pageKey: keyof PageVisualsConfig) => void;
}

type PageKey = 'blog' | 'projects' | 'journey' | 'about' | 'ai' | 'loading';

interface PageMeta {
  key: PageKey;
  label: string;
  route: string;
  icon: React.ElementType;
  color: string;
  defaultTitle: string;
  defaultDesc: string;
  fallbackNote: string;
}

const PAGE_METAS: PageMeta[] = [
  {
    key: 'blog',
    label: '博客手记',
    route: '/blog',
    icon: BookOpen,
    color: 'emerald',
    defaultTitle: 'THOUGHTS & ESSAYS',
    defaultDesc: '技术手记、全栈工程思考与认知切片。在数字荒原中探寻确定性，记录每一步代码架构与审美演进。',
    fallbackNote: '如未配置背景，前台博客列表页将智能回退至最新焦点置顶手记的精选封面大图。',
  },
  {
    key: 'projects',
    label: '开源造物',
    route: '/projects',
    icon: Code2,
    color: 'teal',
    defaultTitle: 'ENGINEERING & ARTIFACTS',
    defaultDesc: '探索站长开源工具、全栈架构作品与数字实验。3D 鼠标视差 Tilt 交互与 Live Demo 悬浮沙盒。',
    fallbackNote: '如未配置背景，前台作品橱窗将智能回退至深空极光背景与 3D 解构卡片。',
  },
  {
    key: 'journey',
    label: '环球漫游',
    route: '/journey',
    icon: Compass,
    color: 'cyan',
    defaultTitle: 'VOYAGES & FOOTPRINTS',
    defaultDesc: '跨越山海的地理坐标与生活切片。以真实旅行轨迹为原点，记录世界各地的晨昏与温度。',
    fallbackNote: '如未配置背景，前台漫游页将智能回退至 3D 交互地球仪与深空星轨渐变。',
  },
  {
    key: 'about',
    label: '关于站长',
    route: '/about',
    icon: User,
    color: 'violet',
    defaultTitle: 'ARCHITECT & SYSTEM EXPLORER',
    defaultDesc: 'Hayden Xue 的个人数字花园、全栈研发理念、流动心智与 3D 数字工牌全景。',
    fallbackNote: '可自由定制双面灵魂字体、第一/第二句标语、拒绝雾蒙蒙纯净黑曜石深空。',
  },
  {
    key: 'ai',
    label: 'AI 外脑中枢',
    route: '/ai',
    icon: Sparkles,
    color: 'blue',
    defaultTitle: 'Into the Unknown',
    defaultDesc: '探索未知 · 数字心智与全栈知识中枢',
    fallbackNote: '支持配置 /ai 外脑的云端背景视频 (MP4/WebM)、超清壁纸或微晶星空，完美衬托高透光液态玻璃。',
  },
  {
    key: 'loading',
    label: '加载与开屏动效',
    route: '/',
    icon: Sparkle,
    color: 'emerald',
    defaultTitle: 'HAYDEN XUE // PRELOADER',
    defaultDesc: '品牌开屏预加载动效、顶部路由流光进度条与双主题 Liquid Shimmer 骨架屏配置',
    fallbackNote: '基于智能防疲劳机制，首次访问展示 800-1200ms，随时可按 ESC 或轻点任意位置跳过。',
  },
];

export function PageVisualsEditor({
  value,
  onChange,
  onOpenMediaPicker,
}: PageVisualsEditorProps) {
  const [selectedPage, setSelectedPage] = useState<PageKey>('about');

  const currentMeta = PAGE_METAS.find((m) => m.key === selectedPage) || PAGE_METAS[0];
  const currentVisual: PageVisualItem = (selectedPage !== 'loading' ? (value[selectedPage] as PageVisualItem) : undefined) || {
    bgType: (selectedPage === 'about' || selectedPage === 'ai') ? 'obsidian' : 'image',
    bgUrl: '',
    customTitle: '',
    customDesc: '',
    titleLine1: 'Engineering Elegance,',
    titleLine2: 'Wandering in Nature.',
    fontFamilyLine1: 'sans',
    fontFamilyLine2: 'handwrite',
  };

  const handleUpdateCurrent = (patch: Partial<PageVisualItem>) => {
    if (selectedPage === 'loading') return;
    onChange({
      ...value,
      [selectedPage]: {
        ...currentVisual,
        ...patch,
      },
    });
  };

  const handleUpdateLoading = (patch: Partial<LoadingVisualsConfig>) => {
    onChange({
      ...value,
      loading: {
        ...value.loading,
        ...patch,
      },
    });
  };

  // 一键应用关于页黄金搭配组合
  const handleApplyAboutGoldenCombo = () => {
    handleUpdateCurrent({
      bgType: 'obsidian',
      titleLine1: 'Engineering Elegance,',
      titleLine2: 'Wandering in Nature.',
      fontFamilyLine1: 'sans',
      fontFamilyLine2: 'handwrite',
      customFontLine1: '',
      customFontLine2: '',
    });
  };

  // 辅助解析预览字体样式
  const getPreviewFontFamilyLine1 = () => {
    if (currentVisual.customFontLine1) return currentVisual.customFontLine1;
    switch (currentVisual.fontFamilyLine1) {
      case 'sans':
      case 'modernSans':
        return "'Inter', system-ui, -apple-system, sans-serif";
      case 'playfair':
        return "'Playfair Display', Georgia, serif";
      case 'serif':
        return "'Instrument Serif', Georgia, serif";
      case 'mono':
        return "'JetBrains Mono', monospace";
      case 'handwrite':
        return "'Caveat', cursive";
      default:
        return "'Inter', system-ui, -apple-system, sans-serif";
    }
  };

  const getPreviewFontFamilyLine2 = () => {
    if (currentVisual.customFontLine2) return currentVisual.customFontLine2;
    switch (currentVisual.fontFamilyLine2) {
      case 'handwrite':
        return "'Caveat', 'Dancing Script', cursive";
      case 'dancing':
        return "'Dancing Script', cursive";
      case 'playfair':
        return "'Playfair Display', Georgia, serif";
      case 'serif':
        return "'Instrument Serif', Georgia, serif";
      case 'sans':
      case 'modernSans':
        return "'Inter', system-ui, -apple-system, sans-serif";
      case 'mono':
        return "'JetBrains Mono', monospace";
      default:
        return "'Caveat', 'Dancing Script', cursive";
    }
  };

  return (
    <div className="space-y-6">
      {/* 顶部概览说明与各板块切换栏 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-500" />
            <span>页面视觉与 100vw 全景通栏巨幕配置</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            独立设定各页面专属巨幕背景与艺术标语，支持关于页双面灵魂字体、入场动效与黑曜石纯净深空。
          </p>
        </div>

        {/* 页面子标签切换 */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-secondary border border-border shrink-0 self-start sm:self-auto">
          {PAGE_METAS.map((meta) => {
            const Icon = meta.icon;
            const isSelected = selectedPage === meta.key;
            const hasCustomBg = meta.key === 'loading'
              ? value.loading?.preloaderEnabled !== false
              : !!(value[meta.key] as PageVisualItem)?.bgUrl;
            return (
              <button
                key={meta.key}
                type="button"
                onClick={() => setSelectedPage(meta.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-card text-foreground shadow-sm border border-border font-semibold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{meta.label}</span>
                {hasCustomBg && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="已配置独立背景" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 主配置卡片与微缩实时预览 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* 左侧：表单配置项 (7 列) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* 页面元信息标识 */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-secondary/50 border border-border">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <currentMeta.icon className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-foreground flex items-center gap-2">
                  <span>{currentMeta.label}视觉定制</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground">
                    {currentMeta.route}
                  </span>
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {selectedPage === 'about'
                    ? '已集成沉浸式电影长卷，支持两行双面灵魂字体、字符入场动效与黑曜石纯净深空'
                    : '100vw 全景通栏 + 1400px 白瓷画卷微重叠'}
                </div>
              </div>
            </div>

            <a
              href={currentMeta.route}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-secondary border border-transparent hover:border-border transition-all"
            >
              <span>前台浏览</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* ================= 全站加载与开屏动效专属控制台 ================= */}
          {selectedPage === 'loading' && (
            <div className="space-y-4">
              {/* 开屏品牌动画主开关 */}
              <div className="p-4 rounded-2xl bg-card border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-foreground flex items-center gap-2">
                      <Sparkle className="w-4 h-4 text-emerald-500" />
                      <span>全站开屏品牌动画 (Brand Preloader)</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      采用智能防疲劳机制，仅在用户首次访问或硬刷新时优雅舒展，站内路由无缝衔接。
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={value.loading?.preloaderEnabled !== false}
                      onChange={(e) => handleUpdateLoading({ preloaderEnabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-neutral-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-500" />
                  </label>
                </div>

                {/* 顶部路由进度条开关 */}
                <div className="pt-3 border-t border-border flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-foreground flex items-center gap-2">
                      <Activity className="w-3.5 h-3.5 text-emerald-500" />
                      <span>顶部翡翠流光路由进度条 (Route Progress)</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      在页面跳转时于顶端呈现 2.5px 翡翠流光物理缓动反馈。
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={value.loading?.enableRouteProgress !== false}
                      onChange={(e) => handleUpdateLoading({ enableRouteProgress: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-neutral-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-500" />
                  </label>
                </div>
              </div>

              {/* 开屏副标语配置 */}
              <div className="p-4 rounded-2xl bg-card border border-border space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-foreground">
                  <span>开屏副标语 (Slogan)</span>
                  <span className="text-[10px] font-mono text-emerald-500">SUBTITLE</span>
                </div>
                <input
                  type="text"
                  value={value.loading?.slogan ?? 'From the East, toward the unknown.'}
                  onChange={(e) => handleUpdateLoading({ slogan: e.target.value })}
                  placeholder="例如：From the East, toward the unknown."
                  className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground text-xs font-serif italic"
                />
                <p className="text-[11px] text-muted-foreground">
                  置于 Hayden Xue 品牌徽标下方，以典雅衬线或手写体呈现，默认是经典标语。
                </p>
              </div>

              {/* 停留时长选择 */}
              <div className="p-4 rounded-2xl bg-card border border-border space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-foreground">
                  <span className="flex items-center gap-1.5">
                    <Timer className="w-3.5 h-3.5 text-emerald-500" />
                    <span>开屏停留时长</span>
                  </span>
                  <span className="text-[10px] font-mono text-emerald-500">
                    {(value.loading?.durationMs || 1000)}ms
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[800, 1000, 1200, 1500].map((ms) => (
                    <button
                      key={ms}
                      type="button"
                      onClick={() => handleUpdateLoading({ durationMs: ms })}
                      className={`py-2 px-3 rounded-xl text-xs font-mono font-medium transition-all ${
                        (value.loading?.durationMs || 1000) === ms
                          ? 'bg-emerald-500/15 border-emerald-500 text-emerald-600 dark:text-emerald-400 border font-semibold'
                          : 'bg-secondary border border-border text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {ms}ms
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  推荐 1000ms，兼顾品牌仪式感与首屏访问流畅度。
                </p>
              </div>

              {/* 底部跳过提示开关 */}
              <div className="p-4 rounded-2xl bg-card border border-border flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-foreground">显示跳过引导提示</div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    在开屏底端显示「ESC 或轻点屏幕跳过」微标签。
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={value.loading?.showSkipHint !== false}
                    onChange={(e) => handleUpdateLoading({ showSkipHint: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-neutral-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-500" />
                </label>
              </div>

              {/* 实时预览触发动作条 */}
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Play className="w-3.5 h-3.5 text-emerald-500" />
                    <span>全屏模拟体验</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    点击即刻唤起全屏开屏动效，现场校验光环、标语与解构退场。
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('hayden:trigger-preloader'));
                    toast.success('已触发开屏动画预览（随时按 ESC 或轻点屏幕跳过）');
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>触发全屏预览</span>
                </button>
              </div>
            </div>
          )}

          {/* ================= 页面背景与视觉工坊 (非 loading 模式) ================= */}
          {selectedPage !== 'loading' && (
            <>
              {/* ================= 关于页专属高级定制工坊 ================= */}
              {selectedPage === 'about' && (
            <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Type className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-bold text-foreground">关于页「双面灵魂」标语与排印工坊</span>
                </div>
                <button
                  type="button"
                  onClick={handleApplyAboutGoldenCombo}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>恢复黄金组合</span>
                </button>
              </div>

              {/* 第一句：工程理性 */}
              <div className="p-3 rounded-xl bg-card border border-border space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-foreground">
                  <span>第一句标语（工程理性 · 激光雕琢字符入场）</span>
                  <span className="text-[10px] font-mono text-emerald-500">LINE 01 // PRECISION</span>
                </div>
                <input
                  type="text"
                  value={currentVisual.titleLine1 ?? 'Engineering Elegance,'}
                  onChange={(e) => handleUpdateCurrent({ titleLine1: e.target.value })}
                  placeholder="例如：Engineering Elegance,"
                  className="w-full p-2 rounded-lg bg-secondary border border-border text-foreground text-xs font-medium"
                />
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="text-[11px] text-muted-foreground block mb-1">第一句字体风格</label>
                    <select
                      value={currentVisual.fontFamilyLine1 || 'sans'}
                      onChange={(e) => handleUpdateCurrent({ fontFamilyLine1: e.target.value })}
                      className="w-full p-2 rounded-lg bg-secondary border border-border text-foreground text-xs"
                    >
                      <option value="sans">极简现代工匠无衬线 (Inter/Geist · 推荐)</option>
                      <option value="playfair">典雅高奢衬线 (Playfair Display)</option>
                      <option value="serif">古典古典衬线 (Instrument Serif)</option>
                      <option value="mono">极客硬核等宽 (JetBrains Mono)</option>
                      <option value="custom">自定义字体名称 (需在下方输入)</option>
                    </select>
                  </div>
                  {currentVisual.fontFamilyLine1 === 'custom' && (
                    <div>
                      <label className="text-[11px] text-muted-foreground block mb-1">自定义字体名称</label>
                      <input
                        type="text"
                        value={currentVisual.customFontLine1 || ''}
                        onChange={(e) => handleUpdateCurrent({ customFontLine1: e.target.value })}
                        placeholder="如 'Fira Code', 'Helvetica'"
                        className="w-full p-2 rounded-lg bg-secondary border border-border text-foreground text-xs"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* 第二句：旷野自然 */}
              <div className="p-3 rounded-xl bg-card border border-border space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-foreground">
                  <span>第二句标语（旷野自然 · 流体山风拂过入场）</span>
                  <span className="text-[10px] font-mono text-teal-500">LINE 02 // NATURE</span>
                </div>
                <input
                  type="text"
                  value={currentVisual.titleLine2 ?? 'Wandering in Nature.'}
                  onChange={(e) => handleUpdateCurrent({ titleLine2: e.target.value })}
                  placeholder="例如：Wandering in Nature."
                  className="w-full p-2 rounded-lg bg-secondary border border-border text-foreground text-xs font-medium"
                />
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="text-[11px] text-muted-foreground block mb-1">第二句字体风格</label>
                    <select
                      value={currentVisual.fontFamilyLine2 || 'handwrite'}
                      onChange={(e) => handleUpdateCurrent({ fontFamilyLine2: e.target.value })}
                      className="w-full p-2 rounded-lg bg-secondary border border-border text-foreground text-xs"
                    >
                      <option value="handwrite">自然旷野流体手写 (Caveat · 推荐)</option>
                      <option value="dancing">灵动艺术流风 (Dancing Script)</option>
                      <option value="playfair">优雅斜体衬线 (Playfair Italic)</option>
                      <option value="sans">纯净现代无衬线 (Inter)</option>
                      <option value="serif">古典斜体衬线 (Instrument Italic)</option>
                      <option value="custom">自定义字体名称 (需在下方输入)</option>
                    </select>
                  </div>
                  {currentVisual.fontFamilyLine2 === 'custom' && (
                    <div>
                      <label className="text-[11px] text-muted-foreground block mb-1">自定义字体名称</label>
                      <input
                        type="text"
                        value={currentVisual.customFontLine2 || ''}
                        onChange={(e) => handleUpdateCurrent({ customFontLine2: e.target.value })}
                        placeholder="如 'Caveat', 'Brush Script MT'"
                        className="w-full p-2 rounded-lg bg-secondary border border-border text-foreground text-xs"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 媒体类型切换（关于页与 AI 外脑提供专属微晶深空选项） */}
          <div className="space-y-1.5">
            <label className="font-medium text-foreground text-xs">
              巨幕媒体形态 (Media & Clarity Mode)
            </label>
            <div className={`grid gap-2 ${(selectedPage === 'about' || selectedPage === 'ai') ? 'grid-cols-3' : 'grid-cols-2'}`}>
              {(selectedPage === 'about' || selectedPage === 'ai') && (
                <button
                  type="button"
                  onClick={() => handleUpdateCurrent({ bgType: 'obsidian', bgUrl: '' })}
                  className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                    currentVisual.bgType === 'obsidian' || !currentVisual.bgType
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-700 dark:text-emerald-400 font-semibold shadow-xs'
                      : 'bg-secondary border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{selectedPage === 'ai' ? '微晶星轨星空 (默认透光)' : '黑曜石微晶深空 (推荐·无雾)'}</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => handleUpdateCurrent({ bgType: 'video' })}
                className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                  currentVisual.bgType === 'video'
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-700 dark:text-emerald-400 font-semibold shadow-xs'
                    : 'bg-secondary border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                <Film className="w-3.5 h-3.5" />
                <span>超清云端循环视频</span>
              </button>
              <button
                type="button"
                onClick={() => handleUpdateCurrent({ bgType: 'image' })}
                className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                  currentVisual.bgType === 'image'
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-700 dark:text-emerald-400 font-semibold shadow-xs'
                    : 'bg-secondary border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>超清全景图片壁纸</span>
              </button>
            </div>
          </div>

          {/* 背景资源 URL 与媒体库直选（仅在视频或图片模式下显示） */}
          {currentVisual.bgType !== 'obsidian' && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-medium text-foreground text-xs">
                  背景资源链接 ({currentVisual.bgType === 'video' ? '视频直链' : '超清图片直链'})
                </label>
                {currentVisual.bgUrl && (
                  <button
                    type="button"
                    onClick={() => handleUpdateCurrent({ bgUrl: '' })}
                    className="text-[11px] text-rose-500 hover:text-rose-600 flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>清除背景并回退</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={currentVisual.bgUrl || ''}
                  onChange={(e) => handleUpdateCurrent({ bgUrl: e.target.value })}
                  placeholder={
                    currentVisual.bgType === 'video'
                      ? '请输入云端 MP4/WebM 视频直链，或点击右侧从媒体库选择'
                      : '请输入云端 JPG/PNG/WebP 图片直链，或点击右侧从媒体库选择'
                  }
                  className="flex-1 p-2.5 rounded-xl bg-secondary border border-border text-foreground font-mono text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={() => onOpenMediaPicker(selectedPage)}
                  className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-700 dark:text-emerald-400 border border-emerald-600/30 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <HardDrive className="w-3.5 h-3.5" />
                  <span>媒体库选择</span>
                </button>
              </div>
            </div>
          )}

          {/* 非关于页时显示的通用大标题/副标题 */}
          {selectedPage !== 'about' && (
            <>
              <div className="space-y-1.5">
                <label className="font-medium text-foreground text-xs">
                  自定义巨幕大标题 (Custom Hero Title)
                </label>
                <input
                  type="text"
                  value={currentVisual.customTitle || ''}
                  onChange={(e) => handleUpdateCurrent({ customTitle: e.target.value })}
                  placeholder={`留空则使用默认：「${currentMeta.defaultTitle}」`}
                  className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-medium text-foreground text-xs">
                  自定义巨幕导言 / 标语 (Custom Slogan / Description)
                </label>
                <textarea
                  rows={2}
                  value={currentVisual.customDesc || ''}
                  onChange={(e) => handleUpdateCurrent({ customDesc: e.target.value })}
                  placeholder={`留空则使用默认：「${currentMeta.defaultDesc}」`}
                  className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground text-xs leading-relaxed focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              {selectedPage === 'ai' && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-medium text-foreground text-xs">
                      自定义输入框占位提示语 (Custom Placeholder)
                    </label>
                    <span className="text-[11px] text-muted-foreground">留空默认：Ask anything, explore together</span>
                  </div>
                  <input
                    type="text"
                    value={currentVisual.customPlaceholder || ''}
                    onChange={(e) => handleUpdateCurrent({ customPlaceholder: e.target.value })}
                    placeholder="默认: Ask anything, explore together"
                    className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground text-xs focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>

        {/* 右侧：所见即所得实时模拟预览 (WYSIWYG Live Mockup) (5 列) */}
        <div className="lg:col-span-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">所见即所得实时预览 (Live WYSIWYG)</span>
            <span className="text-[10px] font-mono text-emerald-500">DYNAMIC SYNC</span>
          </div>

          <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden border border-border bg-[#050608] shadow-xl flex flex-col justify-end p-5 select-none">
            
            {/* 背景底层与前景排版渲染 */}
            {selectedPage === 'loading' ? (
              <div className="absolute inset-0 bg-[#090a0f] flex flex-col items-center justify-center p-6 text-center space-y-4 select-none">
                {/* 环形光晕 */}
                <div className="absolute w-40 h-40 rounded-full bg-emerald-500/10 blur-[30px] pointer-events-none animate-pulse-glow" />

                {/* 中心微标 */}
                <div className="relative flex items-center justify-center w-14 h-14">
                  <div className="absolute inset-0 rounded-2xl border border-emerald-500/40 animate-spin" style={{ animationDuration: '8s' }} />
                  <div className="w-9 h-9 rounded-xl bg-neutral-900 border border-emerald-500/50 flex items-center justify-center shadow-[0_0_12px_rgba(16,185,129,0.5)]">
                    <Sparkle className="w-4 h-4 text-emerald-400" />
                  </div>
                </div>

                <div className="space-y-1 z-10">
                  <div className="text-xs font-bold tracking-[0.25em] text-white uppercase font-sans">
                    HAYDEN XUE
                  </div>
                  <div className="text-[11px] font-serif italic text-emerald-400 font-medium">
                    {value.loading?.slogan || 'From the East, toward the unknown.'}
                  </div>
                </div>

                {/* 模拟进度条 */}
                <div className="w-24 h-[2px] rounded-full bg-neutral-800 overflow-hidden relative z-10">
                  <div className="w-full h-full bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-liquid-shimmer" />
                </div>

                {value.loading?.showSkipHint !== false && (
                  <div className="text-[9px] font-mono text-neutral-400 flex items-center gap-1 z-10">
                    <span className="px-1 py-0.2 rounded border border-neutral-700 bg-neutral-900 text-[8px]">ESC</span>
                    <span>轻点屏幕跳过</span>
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* 背景底层渲染 */}
                {currentVisual.bgType === 'obsidian' || (!currentVisual.bgUrl && selectedPage === 'about') ? (
                  <div className="absolute inset-0 bg-[#050608]">
                    {/* 纯净微晶体网格 */}
                    <div 
                      className="absolute inset-0 opacity-30"
                      style={{
                        backgroundImage: `radial-gradient(circle, currentColor 1px, transparent 1px)`,
                        backgroundSize: '24px 24px',
                        color: 'rgb(148, 163, 184)',
                      }}
                    />
                    <div 
                      className="absolute inset-0 opacity-40"
                      style={{
                        background: 'radial-gradient(circle at 50% 30%, rgba(16, 185, 129, 0.15) 0%, transparent 70%)',
                      }}
                    />
                  </div>
                ) : currentVisual.bgUrl ? (
                  currentVisual.bgType === 'video' ? (
                    <video
                      key={currentVisual.bgUrl}
                      src={currentVisual.bgUrl}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="absolute inset-0 w-full h-full object-cover scale-105"
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={currentVisual.bgUrl}
                      src={currentVisual.bgUrl}
                      alt={currentMeta.label}
                      className="absolute inset-0 w-full h-full object-cover scale-105"
                    />
                  )
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-neutral-950 to-neutral-900 flex flex-col items-center justify-center text-center p-4">
                    <currentMeta.icon className="w-8 h-8 text-neutral-600 mb-2" />
                    <span className="text-[11px] text-neutral-400 font-medium">默认回退模式已激活</span>
                  </div>
                )}

                {/* 景深遮罩 */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none" />

                {/* 前景排版预览 */}
                <div className="relative z-10 space-y-1.5">
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 backdrop-blur-md text-white/90 text-[9px] font-mono border border-white/20">
                    <Sparkles className="w-2.5 h-2.5 text-emerald-400" />
                    <span>{selectedPage.toUpperCase()} // HERO PREVIEW</span>
                  </div>

                  {selectedPage === 'about' ? (
                    <div className="space-y-0.5">
                      <div 
                        className="text-base sm:text-lg font-bold text-white tracking-tight leading-tight line-clamp-1"
                        style={{ fontFamily: getPreviewFontFamilyLine1() }}
                      >
                        {currentVisual.titleLine1 || 'Engineering Elegance,'}
                      </div>
                      <div 
                        className="text-lg sm:text-xl font-normal bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300 bg-clip-text text-transparent leading-tight line-clamp-1"
                        style={{ fontFamily: getPreviewFontFamilyLine2() }}
                      >
                        {currentVisual.titleLine2 || 'Wandering in Nature.'}
                      </div>
                    </div>
                  ) : selectedPage === 'ai' ? (
                    <div className="space-y-2">
                      <div>
                        <h3 className="text-base font-light text-white tracking-tight leading-tight line-clamp-1">
                          {currentVisual.customTitle || currentMeta.defaultTitle}
                        </h3>
                        <p className="text-[10px] text-white/70 line-clamp-1 leading-relaxed">
                          {currentVisual.customDesc || currentMeta.defaultDesc}
                        </p>
                      </div>
                      {/* 液态玻璃透光胶囊微缩拟真 */}
                      <div className="rounded-xl p-2 bg-white/20 dark:bg-black/30 backdrop-blur-xl border border-white/40 shadow-lg shadow-black/20 text-[10px] text-white/80 space-y-1.5">
                        <div className="text-white/60 text-[9px] truncate">
                          {currentVisual.customPlaceholder || 'Ask anything, explore together'}
                        </div>
                        <div className="flex items-center justify-between pt-0.5 border-t border-white/10">
                          <div className="flex items-center gap-1 text-[8px]">
                            <span className="px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 font-medium">DeepThink</span>
                            <span className="px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 font-medium">Search</span>
                          </div>
                          <div className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center text-white text-[8px] font-bold">↑</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h3 className="text-base font-extrabold text-white tracking-tight leading-tight line-clamp-1">
                        {currentVisual.customTitle || currentMeta.defaultTitle}
                      </h3>
                      <p className="text-[11px] text-white/70 line-clamp-2 leading-relaxed">
                        {currentVisual.customDesc || currentMeta.defaultDesc}
                      </p>
                    </>
                  )}
                </div>
              </>
            )}

            {/* 底部微亮边 */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent pointer-events-none" />
          </div>

          <div className="p-3 rounded-xl bg-secondary/40 border border-border text-[11px] text-muted-foreground flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>修改后点击上方「保存全站设置」，前台即时同步并触发 Next.js ISR 增量刷新。</span>
          </div>
        </div>
      </div>
    </div>
  );
}
