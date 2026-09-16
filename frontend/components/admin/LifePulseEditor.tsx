'use client';

import React, { useState } from 'react';
import { 
  Activity, 
  Radio, 
  MapPin, 
  Headphones, 
  Code2, 
  Sparkles, 
  ShieldCheck, 
  Award,
  Plus,
  X,
  Eye
} from 'lucide-react';

export interface LifePulseData {
  statusText: string;
  statusTextEn: string;
  project: string;
  city: string;
  listening?: string;
  active?: boolean;
  badgeTitle?: string;
  badgeSerial?: string;
  badgeTags?: string[];
}

interface LifePulseEditorProps {
  value: LifePulseData;
  onChange: (data: LifePulseData) => void;
}

export function LifePulseEditor({ value, onChange }: LifePulseEditorProps) {
  const [newBadgeTag, setNewBadgeTag] = useState('');
  const [previewLang, setPreviewLang] = useState<'zh' | 'en'>('zh');

  const updateField = <K extends keyof LifePulseData>(field: K, val: LifePulseData[K]) => {
    onChange({
      ...value,
      [field]: val,
    });
  };

  const handleAddBadgeTag = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter') return;
    e.preventDefault();
    const val = newBadgeTag.trim();
    const currentTags = value.badgeTags || [];
    if (!val || currentTags.includes(val)) return;
    updateField('badgeTags', [...currentTags, val]);
    setNewBadgeTag('');
  };

  const handleRemoveBadgeTag = (idx: number) => {
    const currentTags = value.badgeTags || [];
    updateField('badgeTags', currentTags.filter((_, i) => i !== idx));
  };

  const badgeTags = value.badgeTags || ['GitHub Verified Architect', 'Digital Garden Maintainer'];

  return (
    <div className="space-y-6">
      {/* 1. 流动心智胶囊 (Living Pulse) 表单 */}
      <div className="p-5 sm:p-6 rounded-3xl bg-secondary/30 border border-border space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">
                流动心智胶囊 (Living Pulse HUD)
              </h3>
              <p className="text-[11px] text-muted-foreground">
                驱动首页与关于页顶部的实时心跳看板、物理驻留城市与冲刺专题
              </p>
            </div>
          </div>

          {/* 在线脉动开关 */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5 cursor-pointer">
              <span className={`w-2 h-2 rounded-full ${value.active !== false ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400'}`} />
              <span>{value.active !== false ? '在线脉动 (ACTIVE)' : '离线沉潜 (STANDBY)'}</span>
            </label>
            <input
              type="checkbox"
              checked={value.active !== false}
              onChange={(e) => updateField('active', e.target.checked)}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
            />
          </div>
        </div>

        {/* 状态文案：双语 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1.5">
            <label className="font-semibold text-foreground flex items-center gap-1">
              <Radio className="w-3.5 h-3.5 text-emerald-500" />
              <span>当前心智聚焦专题 (中文)</span>
            </label>
            <textarea
              rows={2}
              value={value.statusText || ''}
              onChange={(e) => updateField('statusText', e.target.value)}
              placeholder="如: 正在构建下一代 AI Agent 数字分身与 3D 航海体系"
              className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-foreground flex items-center gap-1">
              <Radio className="w-3.5 h-3.5 text-emerald-500" />
              <span>Current Focus Presence (English)</span>
            </label>
            <textarea
              rows={2}
              value={value.statusTextEn || ''}
              onChange={(e) => updateField('statusTextEn', e.target.value)}
              placeholder="e.g. Building Next-Gen AI Agent Twin & 3D Voyage Ecosystem"
              className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground font-sans focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* 项目、城市与音乐 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
          <div className="space-y-1">
            <label className="font-semibold text-foreground flex items-center gap-1">
              <Code2 className="w-3.5 h-3.5 text-cyan-500" />
              <span>攻坚工程 (Project)</span>
            </label>
            <input
              type="text"
              value={value.project || ''}
              onChange={(e) => updateField('project', e.target.value)}
              placeholder="如: Hayden Garden 4.0"
              className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-foreground flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-amber-500" />
              <span>驻留城市 (Location)</span>
            </label>
            <input
              type="text"
              value={value.city || ''}
              onChange={(e) => updateField('city', e.target.value)}
              placeholder="如: 杭州 · 滨江 / Beijing"
              className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-foreground flex items-center gap-1">
              <Headphones className="w-3.5 h-3.5 text-indigo-500" />
              <span>专注声场 (Listening)</span>
            </label>
            <input
              type="text"
              value={value.listening || ''}
              onChange={(e) => updateField('listening', e.target.value)}
              placeholder="如: Ambient Lo-Fi & Cyber Chill"
              className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* 2. 3D 数字全栈工牌 (3D Parallax Badge) 表单 */}
      <div className="p-5 sm:p-6 rounded-3xl bg-secondary/30 border border-border space-y-5">
        <div className="flex items-center gap-2.5 border-b border-border pb-3">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 flex items-center justify-center shrink-0">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">
              3D 数字全栈工牌参数 (Parallax Badge 3D)
            </h3>
            <p className="text-[11px] text-muted-foreground">
              配置关于页顶部 3D 悬浮视差工牌的极客职称、防伪序列号与认证微章
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1">
            <label className="font-semibold text-foreground">工牌主称号 (Badge Title / Role)</label>
            <input
              type="text"
              value={value.badgeTitle || 'Full-Stack Architect & AI System Explorer'}
              onChange={(e) => updateField('badgeTitle', e.target.value)}
              placeholder="如: Full-Stack Architect & AI System Explorer"
              className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-foreground">工牌硬件序列号 (Serial Identifier)</label>
            <input
              type="text"
              value={value.badgeSerial || 'HX-2026-ARCHITECT // LV.99'}
              onChange={(e) => updateField('badgeSerial', e.target.value)}
              placeholder="如: HX-2026-ARCHITECT // LV.99"
              className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>
        </div>

        {/* 认证徽章列表 */}
        <div className="space-y-1.5 text-xs">
          <label className="font-semibold text-foreground flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>工牌认证微章 (Badge Verified Tags)</span>
          </label>
          <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-secondary/60 border border-border min-h-[42px] items-center">
            {badgeTags.map((t, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-card border border-border text-foreground font-mono text-[11px] shadow-sm"
              >
                <Sparkles className="w-3 h-3 text-cyan-500" />
                <span>{t}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveBadgeTag(idx)}
                  className="text-muted-foreground hover:text-rose-500 ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            <div className="flex items-center gap-1 flex-1 min-w-[140px]">
              <input
                type="text"
                value={newBadgeTag}
                onChange={(e) => setNewBadgeTag(e.target.value)}
                onKeyDown={handleAddBadgeTag}
                placeholder="输入认证微章并回车..."
                className="w-full px-2 py-1 text-xs bg-transparent focus:outline-none text-foreground"
              />
              <button
                type="button"
                onClick={handleAddBadgeTag}
                className="p-1 rounded bg-cyan-500/10 text-cyan-600 hover:bg-cyan-500/20"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. 实时视差预览卡片 (Live HUD Sandbox Preview) */}
      <div className="p-5 rounded-3xl bg-card border border-border space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-indigo-500" />
            <span className="text-xs font-bold text-foreground">前台视觉实时效果模拟 (Live Preview)</span>
          </div>

          {/* 语言切换 */}
          <div className="flex items-center p-0.5 rounded-lg bg-secondary border border-border text-[11px] font-mono">
            <button
              type="button"
              onClick={() => setPreviewLang('zh')}
              className={`px-2.5 py-0.5 rounded-md transition-all cursor-pointer ${
                previewLang === 'zh'
                  ? 'bg-foreground text-background font-bold shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              中文视角
            </button>
            <button
              type="button"
              onClick={() => setPreviewLang('en')}
              className={`px-2.5 py-0.5 rounded-md transition-all cursor-pointer ${
                previewLang === 'en'
                  ? 'bg-foreground text-background font-bold shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              English
            </button>
          </div>
        </div>

        {/* 模拟前台卡片 */}
        <div className="p-5 rounded-2xl bg-secondary/50 border border-emerald-500/20 space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-mono font-bold text-foreground">
                {previewLang === 'en' ? 'DIGITAL PRESENCE HUD' : '数字花园心智流'}
              </span>
            </div>
            <div className="text-[10px] font-mono text-muted-foreground">
              SER: {value.badgeSerial || 'HX-2026-ARCHITECT // LV.99'}
            </div>
          </div>

          <p className="text-sm font-semibold text-foreground leading-relaxed">
            {previewLang === 'en'
              ? (value.statusTextEn || 'Building Next-Gen AI Agent Twin & 3D Voyage Ecosystem')
              : (value.statusText || '正在构建下一代 AI Agent 数字分身与 3D 航海体系')}
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/60 text-[11px] font-mono text-muted-foreground">
            <span className="flex items-center gap-1 text-cyan-600 dark:text-cyan-400">
              <Code2 className="w-3 h-3" /> {value.project || 'Hayden Garden 4.0'}
            </span>
            <span>·</span>
            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
              <MapPin className="w-3 h-3" /> {value.city || '杭州 · 滨江'}
            </span>
            {value.listening && (
              <>
                <span>·</span>
                <span className="flex items-center gap-1 text-indigo-500">
                  <Headphones className="w-3 h-3" /> {value.listening}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
