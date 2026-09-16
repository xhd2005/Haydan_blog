'use client';

import React from 'react';
import { 
  Sparkles, 
  Type, 
  Palette, 
  Layers, 
  Plus, 
  Trash2, 
  Sliders, 
  PenTool,
  RotateCcw
} from 'lucide-react';
import { HeroSloganLine, HeroSloganColorScheme, HeroSloganFontStyle } from '@/lib/types';

interface HeroSloganEditorProps {
  lines: HeroSloganLine[];
  onChange: (lines: HeroSloganLine[]) => void;
}

const COLOR_SCHEME_OPTIONS: Array<{
  key: HeroSloganColorScheme;
  label: string;
  gradientClass: string;
}> = [
  {
    key: 'emerald',
    label: '极光翡翠',
    gradientClass: 'from-emerald-500 via-teal-400 to-cyan-400',
  },
  {
    key: 'cyan',
    label: '冰川青蓝',
    gradientClass: 'from-cyan-500 via-sky-400 to-blue-500',
  },
  {
    key: 'violet',
    label: '暮色幻紫',
    gradientClass: 'from-violet-500 via-purple-400 to-fuchsia-400',
  },
  {
    key: 'amber',
    label: '落霞曜金',
    gradientClass: 'from-amber-500 via-orange-400 to-rose-400',
  },
  {
    key: 'rose',
    label: '霓虹玫瑰',
    gradientClass: 'from-rose-500 via-pink-400 to-fuchsia-400',
  },
  {
    key: 'monochrome',
    label: '黑白水墨',
    gradientClass: 'from-slate-900 to-slate-600 dark:from-white dark:to-slate-300',
  },
  {
    key: 'custom',
    label: '自定义拾色',
    gradientClass: 'from-indigo-500 via-pink-500 to-yellow-500',
  },
];

const FONT_STYLE_OPTIONS: Array<{
  key: HeroSloganFontStyle;
  name: string;
  desc: string;
  icon: string;
}> = [
  {
    key: 'handwrite',
    name: 'Apple 艺术手写',
    desc: 'Caveat 字体 + SVG 动态笔划描绘',
    icon: '✍️',
  },
  {
    key: 'sans',
    name: '现代无衬线',
    desc: 'Display ExtraBold 现代几何感',
    icon: '🅰️',
  },
  {
    key: 'serif',
    name: '人文经典衬线',
    desc: 'Classic Editorial 典雅杂志风',
    icon: '🏛️',
  },
  {
    key: 'mono',
    name: '赛博科技等宽',
    desc: 'Terminal Monospace 极客科技感',
    icon: '💻',
  },
];

const SIZE_PRESETS = [
  { label: '小 (100px)', value: 100 },
  { label: '常规 (120px)', value: 120 },
  { label: '标准 (140px)', value: 140 },
  { label: '大号 (160px)', value: 160 },
  { label: '特大 (180px)', value: 180 },
  { label: '巨幅 (200px)', value: 200 },
];

const STROKE_PRESETS = [
  { label: '细柔 (1.5)', value: 1.5 },
  { label: '标准 (2.0)', value: 2.0 },
  { label: '苍劲 (2.8)', value: 2.8 },
  { label: '浓墨 (3.5)', value: 3.5 },
];

export function HeroSloganEditor({ lines, onChange }: HeroSloganEditorProps) {
  const updateLine = (idx: number, updates: Partial<HeroSloganLine>) => {
    const next = [...lines];
    next[idx] = { ...next[idx], ...updates };
    onChange(next);
  };

  const handleAddLine = () => {
    const nextId = `line-${Date.now()}`;
    const nextLine: HeroSloganLine = {
      id: nextId,
      text: '',
      fontSize: 140,
      colorScheme: 'emerald',
      fontStyle: 'handwrite',
      strokeWidth: 2.0,
    };
    onChange([...lines, nextLine]);
  };

  const handleRemoveLine = (idx: number) => {
    if (lines.length <= 1) return;
    const next = lines.filter((_, i) => i !== idx);
    onChange(next);
  };

  const handleResetDefaults = () => {
    onChange([
      {
        id: 'line-1',
        text: 'From the East,',
        fontSize: 140,
        colorScheme: 'emerald',
        fontStyle: 'handwrite',
        strokeWidth: 2.0,
      },
      {
        id: 'line-2',
        text: 'toward the unknown.',
        fontSize: 140,
        colorScheme: 'emerald',
        fontStyle: 'handwrite',
        strokeWidth: 2.0,
      },
    ]);
  };

  return (
    <div className="space-y-6 pt-4 border-t border-border">
      {/* 头部标题与重置操作 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-500" />
            <span>Hero 艺术多排标语定制引擎 (每一排独立配置)</span>
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            分别调配每一排文字的文案、字号大小、渐变色板、字体样式与描边粗细，上方 16:9 画布实时所见即所得。
          </p>
        </div>

        <button
          type="button"
          onClick={handleResetDefaults}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary/80 hover:bg-secondary text-xs font-medium text-muted-foreground hover:text-foreground transition-colors border border-border shrink-0 self-start sm:self-auto cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>重置为官方预设</span>
        </button>
      </div>

      {/* 排标语列表卡片 */}
      <div className="space-y-4">
        {lines.map((line, idx) => {
          const isHandwrite = line.fontStyle === 'handwrite' || !line.fontStyle;

          return (
            <div
              key={line.id || idx}
              className="p-5 rounded-2xl bg-secondary/30 border border-border space-y-4 transition-all"
            >
              {/* 行标头与删除操作 */}
              <div className="flex items-center justify-between gap-3 pb-3 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-xs font-bold flex items-center justify-center border border-emerald-500/20">
                    {idx + 1}
                  </span>
                  <span className="text-xs font-bold text-foreground">
                    第 {idx + 1} 排标语配置
                  </span>
                  <span className="text-[11px] font-mono text-muted-foreground">
                    ({line.text ? `“${line.text}”` : '未填写文案'})
                  </span>
                </div>

                {lines.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveLine(idx)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 text-xs font-medium transition-colors cursor-pointer"
                    title="删除此排"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>删除该排</span>
                  </button>
                )}
              </div>

              {/* 1. 文字内容输入 */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Type className="w-3.5 h-3.5 text-emerald-500" />
                  <span>文字内容 (支持中英文)</span>
                </label>
                <input
                  type="text"
                  value={line.text || ''}
                  onChange={(e) => updateLine(idx, { text: e.target.value })}
                  placeholder={idx === 0 ? '如 From the East,' : '如 toward the unknown.'}
                  className="w-full p-2.5 rounded-xl bg-background border border-border text-foreground text-sm font-medium focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                />
              </div>

              {/* 2. 字体大小精准调节与快捷预设 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-teal-500" />
                    <span>字体大小 (Size)</span>
                  </label>
                  <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                    <span>{line.fontSize || 140}</span>
                    <span className="text-[10px]">px</span>
                  </div>
                </div>

                {/* 滑块 */}
                <input
                  type="range"
                  min={60}
                  max={240}
                  step={2}
                  value={line.fontSize || 140}
                  onChange={(e) => updateLine(idx, { fontSize: Number(e.target.value) })}
                  className="w-full accent-emerald-500 cursor-pointer"
                />

                {/* 快捷尺寸预设胶囊 */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {SIZE_PRESETS.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => updateLine(idx, { fontSize: preset.value })}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all cursor-pointer ${
                        (line.fontSize || 140) === preset.value
                          ? 'bg-emerald-500 text-white font-bold shadow-sm'
                          : 'bg-background hover:bg-muted text-muted-foreground border border-border'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. 色彩方案自选 (预设色板 + 自定义拾色器) */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-cyan-500" />
                  <span>色彩与渐变方案 (Color Scheme)</span>
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                  {COLOR_SCHEME_OPTIONS.map((opt) => {
                    const selected = (line.colorScheme || 'emerald') === opt.key;
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => updateLine(idx, { colorScheme: opt.key })}
                        className={`flex flex-col items-center gap-1.5 p-2 rounded-xl text-xs transition-all border cursor-pointer ${
                          selected
                            ? 'bg-emerald-500/10 border-emerald-500 text-foreground font-bold shadow-sm'
                            : 'bg-background hover:bg-muted/60 border-border text-muted-foreground'
                        }`}
                      >
                        <span
                          className={`w-full h-4 rounded-md bg-gradient-to-r ${opt.gradientClass}`}
                        />
                        <span className="text-[11px]">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* 自定义拾色器 (当选择 custom 时展开) */}
                {line.colorScheme === 'custom' && (
                  <div className="p-3 rounded-xl bg-background border border-border grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                    <div className="space-y-1">
                      <span className="text-[11px] font-medium text-muted-foreground">起始渐变色</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={line.customColorStart || '#10b981'}
                          onChange={(e) => updateLine(idx, { customColorStart: e.target.value })}
                          className="w-8 h-8 rounded-lg border border-border cursor-pointer"
                        />
                        <input
                          type="text"
                          value={line.customColorStart || '#10b981'}
                          onChange={(e) => updateLine(idx, { customColorStart: e.target.value })}
                          className="flex-1 p-1.5 rounded-lg bg-secondary border border-border text-xs font-mono"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[11px] font-medium text-muted-foreground">结束渐变色</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={line.customColorEnd || '#06b6d4'}
                          onChange={(e) => updateLine(idx, { customColorEnd: e.target.value })}
                          className="w-8 h-8 rounded-lg border border-border cursor-pointer"
                        />
                        <input
                          type="text"
                          value={line.customColorEnd || '#06b6d4'}
                          onChange={(e) => updateLine(idx, { customColorEnd: e.target.value })}
                          className="flex-1 p-1.5 rounded-lg bg-secondary border border-border text-xs font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 4. 字体风格选项 */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <PenTool className="w-3.5 h-3.5 text-violet-500" />
                  <span>字体样式风格 (Font Style)</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                  {FONT_STYLE_OPTIONS.map((style) => {
                    const selected = (line.fontStyle || 'handwrite') === style.key;
                    return (
                      <button
                        key={style.key}
                        type="button"
                        onClick={() => updateLine(idx, { fontStyle: style.key })}
                        className={`flex items-start gap-2.5 p-3 rounded-xl text-left border transition-all cursor-pointer ${
                          selected
                            ? 'bg-emerald-500/10 border-emerald-500 ring-1 ring-emerald-500/50'
                            : 'bg-background hover:bg-muted/60 border-border'
                        }`}
                      >
                        <span className="text-lg shrink-0">{style.icon}</span>
                        <div className="min-w-0">
                          <div className={`text-xs font-bold ${selected ? 'text-foreground' : 'text-slate-700 dark:text-zinc-300'}`}>
                            {style.name}
                          </div>
                          <div className="text-[10px] text-muted-foreground line-clamp-1">
                            {style.desc}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 5. 笔划描边粗细 (仅在 Apple 手写模式生效) */}
              {isHandwrite && (
                <div className="space-y-1.5 pt-1">
                  <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                    <span>手写描边笔划粗细 (Stroke Width)</span>
                  </label>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {STROKE_PRESETS.map((preset) => (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={() => updateLine(idx, { strokeWidth: preset.value })}
                        className={`px-3 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                          (line.strokeWidth || 2.0) === preset.value
                            ? 'bg-secondary text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/40 shadow-xs'
                            : 'bg-background hover:bg-muted text-muted-foreground border border-border'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 底部新增排按钮 */}
      <button
        type="button"
        onClick={handleAddLine}
        className="w-full py-3 rounded-2xl border-2 border-dashed border-border hover:border-emerald-500/50 hover:bg-emerald-500/[0.03] text-xs font-semibold text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center justify-center gap-2 transition-all cursor-pointer"
      >
        <Plus className="w-4 h-4" />
        <span>添加新排标语 (Add Another Slogan Line)</span>
      </button>
    </div>
  );
}
