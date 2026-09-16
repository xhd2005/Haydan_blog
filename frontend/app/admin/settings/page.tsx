'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { SiteSetting } from '@/lib/types';
import {
  Cpu,
  Sparkles,
  Bot,
  HardDrive,
  ShieldCheck,
  Database,
  Layers,
  Loader2,
  Wrench,
} from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AppearanceSettingsCard } from '@/components/admin/settings/AppearanceSettingsCard';
import { AiSettingsCard } from '@/components/admin/settings/AiSettingsCard';
import { StorageSettingsCard } from '@/components/admin/settings/StorageSettingsCard';
import { SecuritySettingsCard } from '@/components/admin/settings/SecuritySettingsCard';
import { ExportBackupCard } from '@/components/admin/settings/ExportBackupCard';
import { MaintenanceSettingsCard } from '@/components/admin/settings/MaintenanceSettingsCard';

type SettingsTab = 'all' | 'appearance' | 'ai' | 'storage' | 'security' | 'backup' | 'ops';

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('all');
  const [settings, setSettings] = useState<Partial<SiteSetting> | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSettings = async () => {
    try {
      const data = await api.getSettings();
      if (data) {
        setSettings(data);
      }
    } catch (err) {
      console.error('加载系统设置失败:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const tabs = [
    { id: 'all', label: '全部设置卡片', icon: Layers },
    { id: 'appearance', label: '外观与视觉', icon: Sparkles },
    { id: 'ai', label: 'AI 外脑与集群', icon: Bot },
    { id: 'storage', label: '云端对象存储', icon: HardDrive },
    { id: 'security', label: '安全合规与凭据', icon: ShieldCheck },
    { id: 'backup', label: '数据备份与导出', icon: Database },
    { id: 'ops', label: '运维重构与 SEO', icon: Wrench },
  ] as const;

  if (loading) {
    return (
      <div className="py-28 flex flex-col items-center justify-center gap-3 text-slate-500 dark:text-zinc-400 font-mono text-xs">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
        <span>正在载入系统配置与基建状态...</span>
      </div>
    );
  }

  return (
    <div className="w-full space-y-5">
      {/* 统一规范头部 */}
      <AdminPageHeader
        title="系统与全局设置 (Settings & Ops)"
        description="现代组件化卡片架构：各卡片拥有独立表单状态与保存按钮，外观改动即刻刷新全网 ISR，AI 与对象存储基建即时生效。"
        icon={Cpu}
        breadcrumbs={[
          { label: 'Studio', href: '/admin/dashboard' },
          { label: '系统与智能体', href: '/admin/settings' },
          { label: '系统设置' },
        ]}
      />

      {/* 快捷视图切换栏 */}
      <div className="flex flex-wrap gap-1.5 p-1.5 rounded-2xl bg-white/60 dark:bg-neutral-900/40 backdrop-blur-md border border-slate-200/80 dark:border-white/[0.08]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as SettingsTab)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                active
                  ? 'bg-white dark:bg-neutral-800 text-slate-900 dark:text-white shadow-xs border border-slate-200/80 dark:border-white/[0.12] font-semibold'
                  : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-neutral-800/40'
              }`}
            >
              <Icon className={`w-4 h-4 ${active ? 'text-emerald-500' : ''}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 卡片编排容器 */}
      <div className="space-y-6">
        {/* 外观视觉 */}
        {(activeTab === 'all' || activeTab === 'appearance') && (
          <AppearanceSettingsCard initialSettings={settings || {}} onSaved={loadSettings} />
        )}

        {/* AI 外脑 */}
        {(activeTab === 'all' || activeTab === 'ai') && (
          <AiSettingsCard initialSettings={settings || {}} onSaved={loadSettings} />
        )}

        {/* 存储基建 */}
        {(activeTab === 'all' || activeTab === 'storage') && (
          <StorageSettingsCard initialSettings={settings || {}} onSaved={loadSettings} />
        )}

        {/* 安全合规 */}
        {(activeTab === 'all' || activeTab === 'security') && (
          <SecuritySettingsCard initialSettings={settings || {}} onSaved={loadSettings} />
        )}

        {/* 备份导出 */}
        {(activeTab === 'all' || activeTab === 'backup') && (
          <ExportBackupCard />
        )}

        {/* 运维重构与 SEO 社交预览 */}
        {(activeTab === 'all' || activeTab === 'ops') && (
          <MaintenanceSettingsCard initialSettings={settings || {}} onSaved={loadSettings} />
        )}
      </div>
    </div>
  );
}
