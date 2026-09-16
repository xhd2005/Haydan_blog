'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { SiteSetting, Media, HeroSloganLine, PageVisualsConfig, PageVisualItem } from '@/lib/types';
import { toast } from '@/lib/toast';
import {
  Globe,
  Sparkles,
  Layers,
  Activity,
  UserCheck,
  Bell,
  Save,
  Loader2,
  CheckCircle,
  Plus,
  X,
  Volume2,
  Film,
} from 'lucide-react';
import { HeroLivePreview } from '@/components/admin/HeroLivePreview';
import { MediaPickerModal } from '@/components/admin/MediaPickerModal';
import { LifePulseEditor, LifePulseData } from '@/components/admin/LifePulseEditor';
import { HeroSloganEditor } from '@/components/admin/HeroSloganEditor';
import { PageVisualsEditor } from '@/components/admin/PageVisualsEditor';
import { triggerRevalidate } from '@/components/admin/revalidate';

const DEFAULT_SLOGAN_LINES: HeroSloganLine[] = [
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
];

const DEFAULT_LIFE_PULSE: LifePulseData = {
  statusText: '正在构建下一代 AI Agent 数字分身与 3D 航海体系',
  statusTextEn: 'Building Next-Gen AI Agent Twin & 3D Voyage Ecosystem',
  project: 'Hayden Garden 4.0',
  city: 'Beijing / Tokyo',
  listening: 'Ambient Lo-Fi & Cyber Chill',
  active: true,
  badgeTitle: 'Full-Stack Architect & AI System Explorer',
  badgeSerial: 'HX-2026-ARCHITECT // LV.99',
  badgeTags: ['GitHub Verified Architect', 'Digital Garden Maintainer'],
};

interface AppearanceSettingsCardProps {
  initialSettings?: Partial<SiteSetting>;
  onSaved?: () => void;
}

export function AppearanceSettingsCard({ initialSettings, onSaved }: AppearanceSettingsCardProps) {
  const [activeSection, setActiveSection] = useState<'general' | 'hero' | 'visuals' | 'pulse' | 'about' | 'banner'>('general');
  const [settings, setSettings] = useState<Partial<SiteSetting>>({
    siteName: 'Hayden Studio',
    slogan: 'From the East, toward the unknown.',
    bio: '',
    email: '',
    avatar: '',
    githubUrl: '',
    twitterUrl: '',
    instagramUrl: '',
    heroBgType: 'video',
    heroVideoUrl: '',
    heroTitle: 'Hayden Xue',
    heroSlogan: 'From the East, toward the unknown.',
    heroBio: '',
    announcementEnabled: 0,
    announcementText: '',
    announcementLink: '',
    bgMusicUrl: '',
    aboutBioZh: '',
    aboutBioEn: '',
  });

  const [interests, setInterests] = useState<string[]>([]);
  const [newInterest, setNewInterest] = useState('');
  const [sloganLines, setSloganLines] = useState<HeroSloganLine[]>(DEFAULT_SLOGAN_LINES);
  const [lifePulse, setLifePulse] = useState<LifePulseData>(DEFAULT_LIFE_PULSE);
  const [pageVisuals, setPageVisuals] = useState<PageVisualsConfig>({
    blog: { bgType: 'image', bgUrl: '', customTitle: '', customDesc: '' },
    projects: { bgType: 'image', bgUrl: '', customTitle: '', customDesc: '' },
    journey: { bgType: 'image', bgUrl: '', customTitle: '', customDesc: '' },
    about: { bgType: 'image', bgUrl: '', customTitle: '', customDesc: '' },
    ai: { bgType: 'obsidian', bgUrl: '', customTitle: '', customDesc: '' },
  });

  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [mediaPickerTarget, setMediaPickerTarget] = useState<'hero' | 'blog' | 'projects' | 'journey' | 'about' | 'ai' | null>(null);

  useEffect(() => {
    if (initialSettings) {
      setSettings((prev) => ({ ...prev, ...initialSettings }));

      if (initialSettings.interestsJson) {
        try {
          const parsed = JSON.parse(initialSettings.interestsJson);
          if (Array.isArray(parsed)) setInterests(parsed);
        } catch {}
      }

      if (initialSettings.lifePulseJson) {
        try {
          const parsedPulse = JSON.parse(initialSettings.lifePulseJson);
          if (parsedPulse && typeof parsedPulse === 'object') {
            setLifePulse((prev) => ({ ...prev, ...parsedPulse }));
          }
        } catch {}
      }

      if (initialSettings.pageVisualsJson) {
        try {
          const parsedVisuals = JSON.parse(initialSettings.pageVisualsJson);
          if (parsedVisuals && typeof parsedVisuals === 'object') {
            setPageVisuals((prev) => ({
              blog: { bgType: 'image', bgUrl: '', customTitle: '', customDesc: '', ...parsedVisuals.blog },
              projects: { bgType: 'image', bgUrl: '', customTitle: '', customDesc: '', ...parsedVisuals.projects },
              journey: { bgType: 'image', bgUrl: '', customTitle: '', customDesc: '', ...parsedVisuals.journey },
              about: { bgType: 'image', bgUrl: '', customTitle: '', customDesc: '', ...parsedVisuals.about },
              ai: { bgType: 'obsidian', bgUrl: '', customTitle: '', customDesc: '', ...parsedVisuals.ai },
            }));
          }
        } catch {}
      }

      if (initialSettings.heroSloganConfigJson) {
        try {
          const parsedSlogans = JSON.parse(initialSettings.heroSloganConfigJson);
          if (Array.isArray(parsedSlogans) && parsedSlogans.length > 0) {
            setSloganLines(parsedSlogans);
          }
        } catch {}
      }
    }
  }, [initialSettings]);

  const handleAddInterest = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter') return;
    e.preventDefault();
    const val = newInterest.trim();
    if (!val || interests.includes(val)) return;
    const next = [...interests, val];
    setInterests(next);
    setNewInterest('');
  };

  const handleRemoveInterest = (idx: number) => {
    setInterests(interests.filter((_, i) => i !== idx));
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setSaved(false);

    try {
      const line1Text = sloganLines[0]?.text || settings.heroTitle || 'From the East,';
      const line2Text = sloganLines[1]?.text || settings.heroSlogan || 'toward the unknown.';

      const payload: Partial<SiteSetting> = {
        siteName: settings.siteName,
        slogan: settings.slogan,
        bio: settings.bio,
        email: settings.email,
        avatar: settings.avatar,
        githubUrl: settings.githubUrl,
        twitterUrl: settings.twitterUrl,
        instagramUrl: settings.instagramUrl,
        heroTitle: line1Text,
        heroSlogan: line2Text,
        heroBio: settings.heroBio,
        heroBgType: settings.heroBgType,
        heroVideoUrl: settings.heroVideoUrl,
        heroSloganConfigJson: JSON.stringify(sloganLines),
        interestsJson: JSON.stringify(interests),
        lifePulseJson: JSON.stringify(lifePulse),
        pageVisualsJson: JSON.stringify(pageVisuals),
        announcementEnabled: settings.announcementEnabled,
        announcementText: settings.announcementText,
        announcementLink: settings.announcementLink,
        bgMusicUrl: settings.bgMusicUrl,
        aboutBioZh: settings.aboutBioZh,
        aboutBioEn: settings.aboutBioEn,
      };

      await api.updateSettings(payload);

      // 仅外观设置保存触发全网 ISR 静态刷新
      await triggerRevalidate(['/', '/about', '/blog', '/projects', '/journey', '/ai']);

      setSaved(true);
      toast.success('外观视觉与全景配置已保存，已触发全网 ISR 静态缓存刷新！');
      onSaved?.();
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      toast.error(err.message || '保存外观设置失败');
    } finally {
      setLoading(false);
    }
  };

  const sections = [
    { id: 'general', label: '常规与社交', icon: Globe },
    { id: 'hero', label: '首页 Hero 定制', icon: Sparkles },
    { id: 'visuals', label: '页面全景巨幕', icon: Layers },
    { id: 'pulse', label: '流动心智与 3D 工牌', icon: Activity },
    { id: 'about', label: '关于自述与兴趣', icon: UserCheck },
    { id: 'banner', label: '公告与氛围白噪音', icon: Bell },
  ] as const;

  return (
    <div className="rounded-3xl bg-white/80 dark:bg-neutral-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/[0.08] shadow-sm overflow-hidden transition-all">
      {/* 媒体选择器 */}
      <MediaPickerModal
        open={mediaPickerTarget !== null}
        onClose={() => setMediaPickerTarget(null)}
        mimePrefix={
          mediaPickerTarget === 'hero'
            ? 'video/'
            : mediaPickerTarget
              ? (pageVisuals[mediaPickerTarget as keyof PageVisualsConfig] as PageVisualItem | undefined)?.bgType === 'video'
                ? 'video/'
                : ''
              : undefined
        }
        title={
          mediaPickerTarget === 'hero'
            ? '从媒体资产库选择 Hero 背景视频'
            : `从媒体资产库选择【${mediaPickerTarget}】背景素材`
        }
        onSelect={(media: Media) => {
          if (mediaPickerTarget === 'hero') {
            setSettings((prev) => ({ ...prev, heroVideoUrl: media.url, heroBgType: 'video' }));
            toast.success(`已选用 Hero 云端视频「${media.filename}」，保存后即刻生效`);
          } else if (mediaPickerTarget) {
            const pageKey = mediaPickerTarget as keyof PageVisualsConfig;
            const isVideo = media.mimeType?.startsWith('video/') || !!media.url?.match(/\.(mp4|webm|mov)$/i);
            setPageVisuals((prev) => ({
              ...prev,
              [pageKey]: {
                ...(prev[pageKey] as PageVisualItem | undefined),
                bgUrl: media.url,
                bgType: isVideo ? 'video' : 'image',
              },
            }));
            toast.success(`已选用页面背景「${media.filename}」，保存后即刻生效`);
          }
          setMediaPickerTarget(null);
        }}
      />

      {/* 卡片头部与独立保存按钮 */}
      <div className="p-6 border-b border-slate-200/80 dark:border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>外观视觉与全景巨幕</span>
                {saved && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold">
                    <CheckCircle className="w-3 h-3" /> 已刷新静态缓存
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                管理站点标题、Hero 电影画幅视频与粒子、全景背景、自述文案，保存后单独触发全网 ISR 静态刷新
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => handleSave()}
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer self-start sm:self-auto shrink-0"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          <span>{loading ? '正在保存与刷新...' : '保存外观视觉'}</span>
        </button>
      </div>

      {/* 子模块微导航 */}
      <div className="px-6 pt-4 pb-2 flex flex-wrap gap-1.5 border-b border-slate-200/60 dark:border-white/[0.04] bg-slate-50/50 dark:bg-black/20">
        {sections.map((sec) => {
          const Icon = sec.icon;
          const active = activeSection === sec.id;
          return (
            <button
              key={sec.id}
              type="button"
              onClick={() => setActiveSection(sec.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                active
                  ? 'bg-white dark:bg-neutral-800 text-slate-900 dark:text-white shadow-xs border border-slate-200/80 dark:border-white/[0.12] font-semibold'
                  : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-neutral-800/50'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${active ? 'text-emerald-500' : ''}`} />
              <span>{sec.label}</span>
            </button>
          );
        })}
      </div>

      {/* 模块内容区 */}
      <div className="p-6 space-y-6 text-xs">
        {/* 常规与社交 */}
        {activeSection === 'general' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-medium text-slate-700 dark:text-zinc-300">站点主名称 (Site Name)</label>
                <input
                  type="text"
                  value={settings.siteName || ''}
                  onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50/70 dark:bg-black/40 border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                  placeholder="如 Hayden Xue's Digital Garden"
                />
              </div>
              <div className="space-y-1.5">
                <label className="font-medium text-slate-700 dark:text-zinc-300">个性签名 (Slogan)</label>
                <input
                  type="text"
                  value={settings.slogan || ''}
                  onChange={(e) => setSettings({ ...settings, slogan: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50/70 dark:bg-black/40 border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                  placeholder="如 From the East, toward the unknown."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-medium text-slate-700 dark:text-zinc-300">站长公开邮箱 (Email)</label>
                <input
                  type="email"
                  value={settings.email || ''}
                  onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50/70 dark:bg-black/40 border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                  placeholder="admin@haydenxue.com"
                />
              </div>
              <div className="space-y-1.5">
                <label className="font-medium text-slate-700 dark:text-zinc-300">站长头像直链 (Avatar URL)</label>
                <input
                  type="text"
                  value={settings.avatar || ''}
                  onChange={(e) => setSettings({ ...settings, avatar: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50/70 dark:bg-black/40 border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white font-mono text-xs focus:border-emerald-500 focus:outline-none"
                  placeholder="https://... 或 MinIO 图片直链"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200/60 dark:border-white/[0.04] grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="font-medium text-slate-700 dark:text-zinc-300">GitHub 主页</label>
                <input
                  type="text"
                  value={settings.githubUrl || ''}
                  onChange={(e) => setSettings({ ...settings, githubUrl: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50/70 dark:bg-black/40 border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                  placeholder="https://github.com/..."
                />
              </div>
              <div className="space-y-1.5">
                <label className="font-medium text-slate-700 dark:text-zinc-300">Twitter / X 主页</label>
                <input
                  type="text"
                  value={settings.twitterUrl || ''}
                  onChange={(e) => setSettings({ ...settings, twitterUrl: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50/70 dark:bg-black/40 border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                  placeholder="https://twitter.com/..."
                />
              </div>
              <div className="space-y-1.5">
                <label className="font-medium text-slate-700 dark:text-zinc-300">Instagram 主页</label>
                <input
                  type="text"
                  value={settings.instagramUrl || ''}
                  onChange={(e) => setSettings({ ...settings, instagramUrl: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50/70 dark:bg-black/40 border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                  placeholder="https://instagram.com/..."
                />
              </div>
            </div>
          </div>
        )}

        {/* 首页 Hero 定制 */}
        {activeSection === 'hero' && (
          <div className="space-y-5">
            <HeroLivePreview
              heroTitle={settings.heroTitle || 'Hayden Xue'}
              heroSlogan={settings.heroSlogan || 'From the East, toward the unknown.'}
              heroBio={settings.heroBio || ''}
              heroBgType={settings.heroBgType || 'video'}
              heroVideoUrl={settings.heroVideoUrl || ''}
              sloganLines={sloganLines}
              onVideoUploaded={(url) => {
                setSettings((prev) => ({ ...prev, heroVideoUrl: url, heroBgType: 'video' }));
                toast.success('Hero 视频已更新！点击保存即可刷新全站生效。');
              }}
            />

            <div className="space-y-3 pt-2">
              <label className="font-semibold text-slate-900 dark:text-white">Hero 背景模式切换</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label
                  className={`p-3.5 rounded-2xl border cursor-pointer flex items-center gap-3 transition-all ${
                    settings.heroBgType === 'video'
                      ? 'border-emerald-500 bg-emerald-500/5 ring-1 ring-emerald-500/20'
                      : 'border-slate-200 dark:border-white/[0.08] hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="heroBgType"
                    value="video"
                    checked={settings.heroBgType === 'video'}
                    onChange={() => setSettings({ ...settings, heroBgType: 'video' })}
                    className="sr-only"
                  />
                  <Film className="w-5 h-5 text-emerald-500" />
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">4K/HD 电影画幅视频背景</div>
                    <div className="text-[11px] text-slate-500 dark:text-zinc-400">对标 ysjf.com 影视级质感</div>
                  </div>
                </label>

                <label
                  className={`p-3.5 rounded-2xl border cursor-pointer flex items-center gap-3 transition-all ${
                    settings.heroBgType === 'particles'
                      ? 'border-emerald-500 bg-emerald-500/5 ring-1 ring-emerald-500/20'
                      : 'border-slate-200 dark:border-white/[0.08] hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="heroBgType"
                    value="particles"
                    checked={settings.heroBgType === 'particles'}
                    onChange={() => setSettings({ ...settings, heroBgType: 'particles' })}
                    className="sr-only"
                  />
                  <Sparkles className="w-5 h-5 text-emerald-500" />
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">Three.js WebGL 流光微粒</div>
                    <div className="text-[11px] text-slate-500 dark:text-zinc-400">轻量高能交互粒子引擎</div>
                  </div>
                </label>
              </div>

              {settings.heroBgType === 'video' && (
                <div className="space-y-1.5 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="font-medium text-slate-700 dark:text-zinc-300">背景视频直链 URL (MinIO/S3 CDN)</label>
                    <button
                      type="button"
                      onClick={() => setMediaPickerTarget('hero')}
                      className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                    >
                      从媒体资产库选择
                    </button>
                  </div>
                  <input
                    type="text"
                    value={settings.heroVideoUrl || ''}
                    onChange={(e) => setSettings({ ...settings, heroVideoUrl: e.target.value })}
                    placeholder="https://... 或 MinIO 生产视频直链"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50/70 dark:bg-black/40 border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white font-mono text-xs focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              )}
            </div>

            {/* 艺术排版标语行级控制器 */}
            <HeroSloganEditor lines={sloganLines} onChange={setSloganLines} />
          </div>
        )}

        {/* 页面全景巨幕 */}
        {activeSection === 'visuals' && (
          <PageVisualsEditor
            value={pageVisuals}
            onChange={setPageVisuals}
            onOpenMediaPicker={(pageKey) => setMediaPickerTarget(pageKey as any)}
          />
        )}

        {/* 流动心智与 3D 工牌 */}
        {activeSection === 'pulse' && (
          <LifePulseEditor
            value={lifePulse}
            onChange={setLifePulse}
          />
        )}

        {/* 关于页双语自述与兴趣标签 */}
        {activeSection === 'about' && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="font-medium text-slate-700 dark:text-zinc-300">中文自述文案 (About Bio ZH)</label>
              <textarea
                value={settings.aboutBioZh || ''}
                onChange={(e) => setSettings({ ...settings, aboutBioZh: e.target.value })}
                rows={3}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50/70 dark:bg-black/40 border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white text-xs leading-relaxed focus:border-emerald-500 focus:outline-none"
                placeholder="介绍您的个人工程哲学、全栈技能体系与探索足迹..."
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-medium text-slate-700 dark:text-zinc-300">英文自述文案 (About Bio EN)</label>
              <textarea
                value={settings.aboutBioEn || ''}
                onChange={(e) => setSettings({ ...settings, aboutBioEn: e.target.value })}
                rows={3}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50/70 dark:bg-black/40 border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white text-xs leading-relaxed focus:border-emerald-500 focus:outline-none"
                placeholder="Write your personal profile, tech radar, and thoughts in English..."
              />
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-200/60 dark:border-white/[0.04]">
              <label className="font-medium text-slate-700 dark:text-zinc-300">关于页兴趣标签池</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {interests.map((item, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-zinc-300 border border-slate-200/80 dark:border-white/[0.08] text-xs font-mono"
                  >
                    <span>{item}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveInterest(idx)}
                      className="text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newInterest}
                  onChange={(e) => setNewInterest(e.target.value)}
                  onKeyDown={handleAddInterest}
                  placeholder="添加兴趣标签（如 分布式系统、Three.js、摄影）"
                  className="flex-1 px-3.5 py-2 rounded-xl bg-slate-50/70 dark:bg-black/40 border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white text-xs focus:border-emerald-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddInterest}
                  className="px-3.5 py-2 rounded-xl bg-slate-200 dark:bg-neutral-800 text-slate-700 dark:text-zinc-200 hover:bg-slate-300 dark:hover:bg-neutral-700 text-xs font-medium transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>添加</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 公告与白噪音 */}
        {activeSection === 'banner' && (
          <div className="space-y-5">
            <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-black/30 border border-slate-200 dark:border-white/[0.08] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">全站置顶横幅公告</div>
                  <div className="text-[11px] text-slate-500 dark:text-zinc-400">展示于首页顶部，可配置超链接直达文章或外链</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.announcementEnabled === 1}
                    onChange={(e) => setSettings({ ...settings, announcementEnabled: e.target.checked ? 1 : 0 })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 dark:bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>

              {settings.announcementEnabled === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-600 dark:text-zinc-400">公告文本</label>
                    <input
                      type="text"
                      value={settings.announcementText || ''}
                      onChange={(e) => setSettings({ ...settings, announcementText: e.target.value })}
                      placeholder="如：数字花园 4.0 全新发布，探索新特性"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white text-xs focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-600 dark:text-zinc-400">跳转链接</label>
                    <input
                      type="text"
                      value={settings.announcementLink || ''}
                      onChange={(e) => setSettings({ ...settings, announcementLink: e.target.value })}
                      placeholder="/blog/garden-4-release"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white text-xs focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-black/30 border border-slate-200 dark:border-white/[0.08] space-y-3">
              <div>
                <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 text-emerald-500" />
                  <span>全局白噪音 / 沉浸式伴读音频 (Background Music URL)</span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                  为前台读者提供轻量氛围音乐播放胶囊，配置 mp3/wav 音频直链或 MinIO 公开 URL
                </div>
              </div>

              <div className="space-y-1 pt-1">
                <label className="text-[11px] text-slate-600 dark:text-zinc-400">音频直链 URL</label>
                <input
                  type="text"
                  value={settings.bgMusicUrl || ''}
                  onChange={(e) => setSettings({ ...settings, bgMusicUrl: e.target.value })}
                  placeholder="https://.../ambient.mp3 或 MinIO 音频直链"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white font-mono text-xs focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
