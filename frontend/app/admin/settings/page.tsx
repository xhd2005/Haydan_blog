'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { SiteSetting } from '@/lib/types';
import { toast } from '@/lib/toast';
import {
  Save,
  Loader2,
  KeyRound,
  Globe,
  Sparkles,
  UserCheck,
  Bell,
  ShieldCheck,
  CheckCircle,
  Plus,
  X,
  Volume2,
  Bot,
  Cpu
} from 'lucide-react';

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<'general' | 'hero' | 'about' | 'banner' | 'ai' | 'security'>('general');
  const [settings, setSettings] = useState<Partial<SiteSetting>>({});
  const [interests, setInterests] = useState<string[]>([]);
  const [newInterest, setNewInterest] = useState('');

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pwdSuccess, setPwdSuccess] = useState(false);

  useEffect(() => {
    api.getSettings().then((data) => {
      if (data) {
        setSettings(data);
        if (data.interestsJson) {
          try {
            const parsed = JSON.parse(data.interestsJson);
            if (Array.isArray(parsed)) setInterests(parsed);
          } catch {
            setInterests([]);
          }
        }
      }
    });
  }, []);

  const handleAddInterest = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter') return;
    e.preventDefault();
    const val = newInterest.trim();
    if (!val || interests.includes(val)) return;
    const next = [...interests, val];
    setInterests(next);
    setSettings({ ...settings, interestsJson: JSON.stringify(next) });
    setNewInterest('');
  };

  const handleRemoveInterest = (idx: number) => {
    const next = interests.filter((_, i) => i !== idx);
    setInterests(next);
    setSettings({ ...settings, interestsJson: JSON.stringify(next) });
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSaved(false);
    try {
      const payload: Partial<SiteSetting> = {
        ...settings,
        interestsJson: JSON.stringify(interests),
      };
      await api.updateSettings(payload);
      setSaved(true);
      toast.success('站点系统设置保存成功！');
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      toast.error(err.message || '保存设置失败');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword) {
      toast.warning('请填写旧密码与新密码');
      return;
    }
    setPwdLoading(true);
    setPwdSuccess(false);
    try {
      await api.changePassword({ oldPassword, newPassword });
      setPwdSuccess(true);
      setOldPassword('');
      setNewPassword('');
      toast.success('管理员密码修改成功，请妥善保管新凭据！');
      setTimeout(() => setPwdSuccess(false), 3000);
    } catch (err: any) {
      toast.error(err.message || '修改密码失败');
    } finally {
      setPwdLoading(false);
    }
  };

  const tabs = [
    { id: 'general', label: '常规与社交', icon: Globe },
    { id: 'hero', label: '首页 Hero 定制', icon: Sparkles },
    { id: 'about', label: '关于页自述与兴趣', icon: UserCheck },
    { id: 'banner', label: '公告与氛围白噪音', icon: Bell },
    { id: 'ai', label: 'AI 智能体分身', icon: Bot },
    { id: 'security', label: '页脚备案与安全', icon: ShieldCheck },
  ] as const;

  return (
    <div className="space-y-6 max-w-5xl text-xs">
      <div className="border-b border-border pb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">系统与内容设置中心</h1>
          <p className="text-muted-foreground mt-0.5">
            可视化定制全站 Hero、自述 Bio、多语言内容、全局公告、页脚备案与管理员安全凭据。
          </p>
        </div>
        {saved && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-500 font-medium text-xs self-start">
            <CheckCircle className="w-4 h-4" /> 配置保存成功并已同步全站！
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-3">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                isActive
                  ? 'bg-foreground text-background shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Settings Form */}
      {activeTab !== 'security' ? (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          {/* Tab 1: General */}
          {activeTab === 'general' && (
            <div className="p-6 rounded-3xl bg-card border border-border space-y-5">
              <div>
                <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Globe className="w-4 h-4 text-emerald-500" />
                  <span>站点基础元数据</span>
                </h2>
                <p className="text-muted-foreground mt-0.5">用于浏览器标题栏、SEO 标签与全局展示</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-medium text-foreground">网站品牌名称 (Site Name)</label>
                  <input
                    type="text"
                    value={settings.siteName || ''}
                    onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground"
                    placeholder="如 Hayden Xue"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-foreground">全局 Slogan 标语</label>
                  <input
                    type="text"
                    value={settings.slogan || ''}
                    onChange={(e) => setSettings({ ...settings, slogan: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground"
                    placeholder="如 From the East, toward the unknown."
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-foreground">全局 SEO 站点描述</label>
                <textarea
                  value={settings.siteDescription || ''}
                  onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
                  rows={2}
                  className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground"
                  placeholder="如 个人博客 / 数字花园 / 全栈开发 / 摄影足迹"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="space-y-1">
                  <label className="font-medium text-foreground">站长头像 URL</label>
                  <input
                    type="text"
                    value={settings.avatar || ''}
                    onChange={(e) => setSettings({ ...settings, avatar: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground"
                    placeholder="https://..."
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-foreground">GitHub 地址</label>
                  <input
                    type="text"
                    value={settings.githubUrl || ''}
                    onChange={(e) => setSettings({ ...settings, githubUrl: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground"
                    placeholder="https://github.com/..."
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-foreground">Twitter / X 地址</label>
                  <input
                    type="text"
                    value={settings.twitterUrl || ''}
                    onChange={(e) => setSettings({ ...settings, twitterUrl: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground"
                    placeholder="https://twitter.com/..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Hero Section */}
          {activeTab === 'hero' && (
            <div className="p-6 rounded-3xl bg-card border border-border space-y-5">
              <div>
                <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>首页 Hero 视差横幅定制</span>
                </h2>
                <p className="text-muted-foreground mt-0.5">
                  定制访客进入首页时最醒目的大标题、渐变标语及副标题介绍文字
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-medium text-foreground">Hero 主标题</label>
                  <input
                    type="text"
                    value={settings.heroTitle || ''}
                    onChange={(e) => setSettings({ ...settings, heroTitle: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground"
                    placeholder="如 Hayden Xue"
                  />
                  <p className="text-[11px] text-muted-foreground">对应首页超大主名称</p>
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-foreground">Hero 渐变标语 (Slogan)</label>
                  <input
                    type="text"
                    value={settings.heroSlogan || ''}
                    onChange={(e) => setSettings({ ...settings, heroSlogan: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground"
                    placeholder="如 From the East, toward the unknown."
                  />
                  <p className="text-[11px] text-muted-foreground">首页以渐变艺术字体居中展示</p>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-foreground">Hero 副标题自述介绍 (Bio)</label>
                <textarea
                  value={settings.heroBio || ''}
                  onChange={(e) => setSettings({ ...settings, heroBio: e.target.value })}
                  rows={3}
                  className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground"
                  placeholder="例如：全栈工程师 / 独立开发者 / 终身求知者。热爱构建高美感、高可靠的数字产品与基础设施。"
                />
              </div>
            </div>
          )}

          {/* Tab 3: About & Interests */}
          {activeTab === 'about' && (
            <div className="p-6 rounded-3xl bg-card border border-border space-y-5">
              <div>
                <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-blue-500" />
                  <span>关于页自述与兴趣爱好</span>
                </h2>
                <p className="text-muted-foreground mt-0.5">支持中英文双语 Bio 分开维护，以及兴趣标签可视化编辑</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-medium text-foreground">中文个人自述 (About Bio - 中文)</label>
                  <textarea
                    value={settings.aboutBioZh || ''}
                    onChange={(e) => setSettings({ ...settings, aboutBioZh: e.target.value })}
                    rows={5}
                    className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground"
                    placeholder="中文版的详细个人背景、技术经历与设计哲学..."
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-foreground">英文个人自述 (About Bio - English)</label>
                  <textarea
                    value={settings.aboutBioEn || ''}
                    onChange={(e) => setSettings({ ...settings, aboutBioEn: e.target.value })}
                    rows={5}
                    className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground"
                    placeholder="English version of personal bio, engineering passions, and background..."
                  />
                </div>
              </div>

              {/* Interests tag editor */}
              <div className="space-y-2 pt-2 border-t border-border">
                <label className="font-medium text-foreground">兴趣爱好标签列表 (Interests)</label>
                <div className="flex flex-wrap gap-2 p-3 rounded-2xl bg-secondary/50 border border-border min-h-[50px]">
                  {interests.map((tag, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-card border border-border text-foreground text-xs shadow-sm"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveInterest(idx)}
                        className="text-muted-foreground hover:text-red-500 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={newInterest}
                      onChange={(e) => setNewInterest(e.target.value)}
                      onKeyDown={handleAddInterest}
                      placeholder="输入兴趣并按 Enter 添加..."
                      className="px-2.5 py-1 text-xs rounded-lg bg-card border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-foreground"
                    />
                    <button
                      type="button"
                      onClick={handleAddInterest}
                      className="p-1 rounded-lg bg-foreground text-background hover:opacity-90"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Announcement & Music */}
          {activeTab === 'banner' && (
            <div className="p-6 rounded-3xl bg-card border border-border space-y-5">
              <div>
                <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Bell className="w-4 h-4 text-indigo-500" />
                  <span>全站公告与氛围白噪音设置</span>
                </h2>
                <p className="text-muted-foreground mt-0.5">控制前台顶部悬浮公告横幅及右下角白噪音小挂件</p>
              </div>

              <div className="p-4 rounded-2xl bg-secondary/40 border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-foreground">全站公告横幅开关</div>
                    <div className="text-[11px] text-muted-foreground">开启后将在全站导航栏顶部显眼展示</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.announcementEnabled === 1}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          announcementEnabled: e.target.checked ? 1 : 0,
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1">
                    <label className="font-medium text-foreground">公告文本内容</label>
                    <input
                      type="text"
                      value={settings.announcementText || ''}
                      onChange={(e) => setSettings({ ...settings, announcementText: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground"
                      placeholder="如 🎉 博客全新 V2.0 升级上线！欢迎体验双语与随记功能。"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-medium text-foreground">点击跳转链接 (可选)</label>
                    <input
                      type="text"
                      value={settings.announcementLink || ''}
                      onChange={(e) => setSettings({ ...settings, announcementLink: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground"
                      placeholder="如 /blog/welcome-to-v2"
                    />
                  </div>
                </div>
              </div>

              {/* Music */}
              <div className="p-4 rounded-2xl bg-secondary/40 border border-border space-y-3">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-emerald-500" />
                  <span className="font-semibold text-foreground">背景白噪音 / 轻音乐音频直链</span>
                </div>
                <input
                  type="text"
                  value={settings.bgMusicUrl || ''}
                  onChange={(e) => setSettings({ ...settings, bgMusicUrl: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground"
                  placeholder="如 https://assets.mixkit.co/active_storage/sfx/2874/2874-preview.mp3 (留空则默认使用内置舒缓雨声)"
                />
                <p className="text-[11px] text-muted-foreground">
                  读者可在前台右下角随时开启/关闭白噪音伴读。
                </p>
              </div>
            </div>
          )}

          {/* Tab: AI 智能体分身 */}
          {activeTab === 'ai' && (
            <div className="p-6 rounded-3xl bg-card border border-border space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-4">
                <div>
                  <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Bot className="w-4 h-4 text-primary" />
                    <span>Hayden AI 数字分身与大模型推理配置</span>
                  </h2>
                  <p className="text-muted-foreground mt-0.5">
                    驱动全站智能伴读助手、文章划词精讲与数字分身深度对话，支持 OpenAI 标准与国内大模型生态。
                  </p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={settings.aiEnabled !== 0}
                    onChange={(e) => setSettings({ ...settings, aiEnabled: e.target.checked ? 1 : 0 })}
                    className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                  />
                  <span className="font-semibold text-foreground">开启全站 AI 智能助手</span>
                </label>
              </div>

              {/* 快捷推荐预设 */}
              <div className="p-4 rounded-2xl bg-secondary/50 border border-border/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    推荐接口与模型预设 (点击一键填入)
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSettings({
                        ...settings,
                        aiBaseUrl: 'https://token.sensenova.cn/v1',
                        aiModel: 'deepseek-v4-flash',
                      });
                      toast.info('已应用商汤日日新 (SenseNova) - DeepSeek V4 Flash 预设');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-card border border-border hover:border-primary text-foreground text-xs transition-colors flex items-center gap-1"
                  >
                    <span>商汤日日新 / deepseek-v4-flash</span>
                    <span className="text-[10px] text-emerald-500 font-mono">（当前主力）</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSettings({
                        ...settings,
                        aiBaseUrl: 'https://token.sensenova.cn/v1',
                        aiModel: 'deepseek-v4-pro',
                      });
                      toast.info('已应用商汤日日新 (SenseNova) - DeepSeek V4 Pro 预设');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-card border border-border hover:border-primary text-foreground text-xs transition-colors"
                  >
                    商汤日日新 / deepseek-v4-pro
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSettings({
                        ...settings,
                        aiBaseUrl: 'https://token.sensenova.cn/v1',
                        aiModel: 'glm-5.2',
                      });
                      toast.info('已应用商汤日日新 (SenseNova) - GLM-5.2 预设');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-card border border-border hover:border-primary text-foreground text-xs transition-colors"
                  >
                    商汤日日新 / glm-5.2
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSettings({
                        ...settings,
                        aiBaseUrl: 'https://token.sensenova.cn/v1',
                        aiModel: 'sensenova-6.8-flash-lite',
                      });
                      toast.info('已应用商汤日日新 (SenseNova) - 6.8 Flash-Lite 预设');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-card border border-border hover:border-primary text-foreground text-xs transition-colors"
                  >
                    商汤原生 / sensenova-6.8-flash-lite
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-medium text-foreground">API 接口基地址 (Base URL)</label>
                  <input
                    type="text"
                    value={settings.aiBaseUrl || ''}
                    onChange={(e) => setSettings({ ...settings, aiBaseUrl: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground font-mono text-xs"
                    placeholder="https://token.sensenova.cn/v1"
                  />
                  <p className="text-[11px] text-muted-foreground">兼容 OpenAI 规范的 API 根路径，末尾可省略或保留 /v1</p>
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-foreground">大模型标识 (Model Identifier)</label>
                  <input
                    type="text"
                    value={settings.aiModel || ''}
                    onChange={(e) => setSettings({ ...settings, aiModel: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground font-mono text-xs"
                    placeholder="deepseek-v4-flash"
                  />
                  <p className="text-[11px] text-muted-foreground">推荐 deepseek-v4-flash，兼顾超高响应速度与深刻推导</p>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-foreground">API 授权密钥 (API Key / Token)</label>
                <input
                  type="password"
                  value={settings.aiApiKey || ''}
                  onChange={(e) => setSettings({ ...settings, aiApiKey: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground font-mono text-xs"
                  placeholder="sk-..."
                />
                <p className="text-[11px] text-muted-foreground">
                  已做后端权限脱敏隔离：只有已登录站长可在此查阅和修改，前台公开访客绝无法探测或窃取您的私有 Key。
                </p>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-foreground">数字分身个性人设与系统提示词 (System Prompt)</label>
                <textarea
                  value={settings.aiSystemPrompt || ''}
                  onChange={(e) => setSettings({ ...settings, aiSystemPrompt: e.target.value })}
                  rows={4}
                  className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground text-xs leading-relaxed"
                  placeholder="设定 Hayden AI 的对话风格、知识领域和座右铭..."
                />
                <p className="text-[11px] text-muted-foreground">
                  系统会自动注入全站数字花园哲学、当前博文上下文与读者划词段落，此处可自定义专属补充设定。
                </p>
              </div>
            </div>
          )}

          {/* Submit bar */}
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-foreground hover:opacity-90 text-background font-medium flex items-center gap-2 shadow-sm transition-opacity"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>保存当前配置</span>
            </button>
          </div>
        </form>
      ) : (
        /* Tab 5: Security & Footer */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Footer & ICP Form */}
          <form onSubmit={handleSaveSettings} className="p-6 rounded-3xl bg-card border border-border space-y-4">
            <div className="border-b border-border pb-3">
              <h2 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-emerald-500" />
                <span>页脚信息与工信部备案</span>
              </h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">控制全站底部版权文案与合规备案编号</p>
            </div>

            <div className="space-y-1">
              <label className="font-medium text-foreground">页脚自定义版权文案</label>
              <input
                type="text"
                value={settings.footerText || ''}
                onChange={(e) => setSettings({ ...settings, footerText: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground"
                placeholder="如 © 2026 Hayden Xue. Built with Next.js & Spring Boot."
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium text-foreground">ICP 备案号 (中国大陆合规)</label>
              <input
                type="text"
                value={settings.icpNumber || ''}
                onChange={(e) => setSettings({ ...settings, icpNumber: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground"
                placeholder="如 粤ICP备2026888888号"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-foreground text-background font-medium hover:opacity-90 transition-opacity flex items-center gap-1.5"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>保存页脚设置</span>
            </button>
          </form>

          {/* Change Password Card */}
          <form onSubmit={handleChangePassword} className="p-6 rounded-3xl bg-card border border-border space-y-4 h-fit">
            <div className="border-b border-border pb-3">
              <h2 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-amber-500" />
                <span>修改管理员密码</span>
              </h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">采用 BCrypt 高强哈希加盐加密</p>
            </div>

            {pwdSuccess && (
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-center font-medium">
                密码修改成功！请妥善保存新密码。
              </div>
            )}

            <div className="space-y-1">
              <label className="font-medium text-foreground">原登录密码</label>
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                required
                className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground"
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium text-foreground">新密码</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                placeholder="至少6位安全密码"
                className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground"
              />
            </div>

            <button
              type="submit"
              disabled={pwdLoading}
              className="w-full py-2.5 rounded-xl bg-foreground text-background font-medium hover:opacity-90 transition-opacity"
            >
              {pwdLoading ? '正在修改...' : '确认修改管理员密码'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
