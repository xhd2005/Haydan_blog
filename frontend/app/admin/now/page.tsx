'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { NowRecord } from '@/lib/types';
import { toast } from '@/lib/toast';
import { Save, Loader2, Clock, CheckCircle } from 'lucide-react';

export default function AdminNowPage() {
  const [learning, setLearning] = useState('');
  const [building, setBuilding] = useState('');
  const [exploring, setExploring] = useState('');
  const [thinking, setThinking] = useState('');
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.getNow().then((data) => {
      if (data) {
        setLearning(data.learning || '');
        setBuilding(data.building || '');
        setExploring(data.exploring || '');
        setThinking(data.thinking || '');
        setUpdatedAt(data.updatedAt || null);
      }
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSaved(false);
    try {
      await api.updateNow({ learning, building, exploring, thinking });
      setSaved(true);
      toast.success('Now 状态更新成功！');
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      toast.error(err.message || '保存失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex justify-between items-center border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Now 状态管理</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            直接在此更新正在学习、构建、探索与思考的事物，前台即时生效，无须重新部署。
          </p>
        </div>

        {saved && (
          <div className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
            <CheckCircle className="w-3.5 h-3.5" /> 已更新并生效
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        <div className="p-6 rounded-3xl bg-card border border-border space-y-4">
          <div className="flex items-center justify-between">
            <label className="font-bold text-sm text-foreground">1. Learning (正在学习)</label>
            <span className="text-muted-foreground">支持 Markdown</span>
          </div>
          <textarea
            value={learning}
            onChange={(e) => setLearning(e.target.value)}
            rows={4}
            className="w-full p-3 rounded-2xl bg-secondary border border-border text-foreground font-mono leading-relaxed"
            placeholder="例如: - 深入学习 Java 21 虚拟线程实践..."
          />
        </div>

        <div className="p-6 rounded-3xl bg-card border border-border space-y-4">
          <div className="flex items-center justify-between">
            <label className="font-bold text-sm text-foreground">2. Building (正在构建)</label>
            <span className="text-muted-foreground">支持 Markdown</span>
          </div>
          <textarea
            value={building}
            onChange={(e) => setBuilding(e.target.value)}
            rows={4}
            className="w-full p-3 rounded-2xl bg-secondary border border-border text-foreground font-mono leading-relaxed"
            placeholder="例如: - 打造全新的个人博客与数字花园系统..."
          />
        </div>

        <div className="p-6 rounded-3xl bg-card border border-border space-y-4">
          <div className="flex items-center justify-between">
            <label className="font-bold text-sm text-foreground">3. Exploring (正在探索)</label>
            <span className="text-muted-foreground">支持 Markdown</span>
          </div>
          <textarea
            value={exploring}
            onChange={(e) => setExploring(e.target.value)}
            rows={4}
            className="w-full p-3 rounded-2xl bg-secondary border border-border text-foreground font-mono leading-relaxed"
            placeholder="例如: - 城市建筑摄影与徒步探索..."
          />
        </div>

        <div className="p-6 rounded-3xl bg-card border border-border space-y-4">
          <div className="flex items-center justify-between">
            <label className="font-bold text-sm text-foreground">4. Thinking (正在思考)</label>
            <span className="text-muted-foreground">支持 Markdown</span>
          </div>
          <textarea
            value={thinking}
            onChange={(e) => setThinking(e.target.value)}
            rows={4}
            className="w-full p-3 rounded-2xl bg-secondary border border-border text-foreground font-mono leading-relaxed"
            placeholder="例如: - 个人数字花园如何沉淀长效思维资产？..."
          />
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 rounded-2xl bg-foreground hover:opacity-90 text-background text-xs font-semibold shadow-md flex items-center gap-2 transition-opacity disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>保存并发布到 Now 页面</span>
          </button>
        </div>
      </form>
    </div>
  );
}
