'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';
import { Tag, AiRadarInsight, AiBacklinkSuggestionVO } from '@/lib/types';
import {
  Sparkles,
  Loader2,
  Tag as TagIcon,
  Compass,
  Link2,
  Check,
  ChevronDown,
  ChevronUp,
  Cpu,
  Layers,
  ArrowUpRight,
  Plus,
  Languages,
} from 'lucide-react';

export interface AiPostCurationToolbarProps {
  postId?: number;
  title: string;
  content: string;
  excerpt: string;
  seoDescription?: string;
  existingRadarJson?: string;
  allTags: Tag[];
  selectedTagIds: number[];
  onUpdateFields: (fields: {
    excerpt?: string;
    seoDescription?: string;
    aiRadarJson?: string;
    selectedTagIds?: number[];
    maturity?: 'SEEDLING' | 'BUDDING' | 'EVERGREEN';
  }) => void;
  onInsertContent?: (snippet: string) => void;
  onOpenTranslateStudio?: () => void;
}

export function AiPostCurationToolbar({
  postId,
  title,
  content,
  excerpt,
  seoDescription,
  existingRadarJson,
  allTags,
  selectedTagIds,
  onUpdateFields,
  onInsertContent,
  onOpenTranslateStudio,
}: AiPostCurationToolbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'radar' | 'tags' | 'backlinks'>('radar');
  
  // Loading states
  const [extractingRadar, setExtractingRadar] = useState(false);
  const [fetchingBacklinks, setFetchingBacklinks] = useState(false);

  // Data states
  const [radarInsight, setRadarInsight] = useState<AiRadarInsight | null>(() => {
    if (!existingRadarJson) return null;
    try {
      return JSON.parse(existingRadarJson);
    } catch {
      return null;
    }
  });
  const [backlinksData, setBacklinksData] = useState<AiBacklinkSuggestionVO | null>(null);

  // 1. 提取全息概念雷达与 SEO
  const handleExtractRadar = async () => {
    if (!content.trim()) {
      toast.warning('请先撰写部分文章正文后再提炼全息雷达');
      return;
    }
    setExtractingRadar(true);
    setIsOpen(true);
    setActiveTab('radar');
    try {
      const insight = await api.extractRadar({
        title: title || '未命名文章',
        content,
      });
      setRadarInsight(insight);
      toast.success('全息概念雷达提取成功！');
    } catch (err: any) {
      toast.error(err.message || '雷达提取失败');
    } finally {
      setExtractingRadar(false);
    }
  };

  // 2. 应用全息雷达字段到文章（自动同步摘要、SEO、标签与雷达 JSON）
  const handleApplyRadar = () => {
    if (!radarInsight) return;

    // 匹配建议标签
    const matchedTagIds = new Set(selectedTagIds);
    if (radarInsight.suggestedTags && radarInsight.suggestedTags.length > 0) {
      radarInsight.suggestedTags.forEach((sug) => {
        const found = allTags.find(
          (t) => t.name.toLowerCase() === sug.toLowerCase() || t.name.includes(sug) || sug.includes(t.name)
        );
        if (found) {
          matchedTagIds.add(found.id);
        }
      });
    }

    // 建议成熟度
    let suggestedMaturity: 'SEEDLING' | 'BUDDING' | 'EVERGREEN' | undefined = undefined;
    if (radarInsight.difficulty === 'ADVANCED') suggestedMaturity = 'EVERGREEN';
    else if (radarInsight.difficulty === 'INTERMEDIATE') suggestedMaturity = 'BUDDING';
    else if (radarInsight.difficulty === 'BEGINNER') suggestedMaturity = 'SEEDLING';

    onUpdateFields({
      aiRadarJson: JSON.stringify(radarInsight),
      excerpt: excerpt || radarInsight.summary,
      seoDescription: seoDescription || radarInsight.summary,
      selectedTagIds: Array.from(matchedTagIds),
      maturity: suggestedMaturity,
    });

    toast.success('全息概念雷达、摘要与智能标签已应用同步！');
  };

  // 3. 获取站内双向链接建议
  const handleFetchBacklinks = async () => {
    if (!postId) {
      toast.info('新文章请先保存一次生成 ID，即可检索站内双向图谱共振关联');
      return;
    }
    setFetchingBacklinks(true);
    setIsOpen(true);
    setActiveTab('backlinks');
    try {
      const res = await api.getBacklinks(postId);
      setBacklinksData(res);
      toast.success('已检索到站内知识图谱双向链接建议');
    } catch (err: any) {
      toast.error(err.message || '检索双向链接失败');
    } finally {
      setFetchingBacklinks(false);
    }
  };

  // 4. 插入双向链接 Markdown
  const handleInsertBacklink = (title: string, slug: string, concept: string) => {
    const mdSnippet = `\n> 延伸阅读：[${title}](/blog/${slug})（知识共振：${concept}）\n`;
    if (onInsertContent) {
      onInsertContent(mdSnippet);
      toast.success(`已插入双向引用链接：[${title}]`);
    } else {
      navigator.clipboard.writeText(mdSnippet);
      toast.success('链接已复制到剪贴板，可粘贴至正文');
    }
  };

  return (
    <div className="w-full rounded-2xl bg-gradient-to-r from-emerald-500/[0.04] via-indigo-500/[0.03] to-purple-500/[0.04] border border-emerald-500/20 dark:border-emerald-500/20 shadow-sm overflow-hidden transition-all">
      {/* 顶部策展按钮栏 */}
      <div className="px-4 py-3 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold text-foreground">AI 智能策展工作台</span>
          <span className="text-[10px] font-mono text-muted-foreground hidden sm:inline">
            (Authoring Co-pilot)
          </span>
          {radarInsight && (
            <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              已挂载概念雷达 ({radarInsight.concepts?.length || 0} 个概念)
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {/* 一键提取全息概念雷达 */}
          <button
            type="button"
            onClick={handleExtractRadar}
            disabled={extractingRadar}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1 shadow-sm transition-all hover:scale-[1.02] cursor-pointer disabled:opacity-50"
          >
            {extractingRadar ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Cpu className="w-3.5 h-3.5" />
            )}
            <span>提炼全息雷达 & SEO</span>
          </button>

          {/* 站内双向链接建议 */}
          <button
            type="button"
            onClick={handleFetchBacklinks}
            disabled={fetchingBacklinks}
            className="px-3 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-medium border border-indigo-500/20 flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
          >
            {fetchingBacklinks ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Link2 className="w-3.5 h-3.5" />
            )}
            <span>双向知识链接建议</span>
          </button>

          {/* 双语技术精译工作台入口 */}
          {onOpenTranslateStudio && (
            <button
              type="button"
              onClick={onOpenTranslateStudio}
              className="px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 text-xs font-medium border border-purple-500/20 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Languages className="w-3.5 h-3.5" />
              <span>双语流式精译</span>
            </button>
          )}

          {/* 折叠/展开切换 */}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors ml-1"
            title={isOpen ? '收起面板' : '展开面板'}
          >
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 展开内容抽屉 */}
      {isOpen && (
        <div className="border-t border-slate-200/80 dark:border-white/[0.08] bg-white/60 dark:bg-neutral-900/40 p-4 space-y-4">
          
          {/* 标签栏 */}
          <div className="flex items-center gap-2 border-b border-border/60 pb-2 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('radar')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'radar'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>全息概念雷达 ({radarInsight ? '已生成' : '未生成'})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('backlinks')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'backlinks'
                  ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Link2 className="w-3.5 h-3.5" />
              <span>双向链接建议 ({backlinksData?.suggestions?.length || 0})</span>
            </button>
          </div>

          {/* Tab 1: 全息概念雷达详情 */}
          {activeTab === 'radar' && (
            <div className="space-y-3">
              {radarInsight ? (
                <div className="space-y-3 text-xs">
                  {/* 30秒 TL;DR 摘要 */}
                  <div className="p-3 rounded-xl bg-card border border-border space-y-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-bold">
                      30s 速读概要 (TL;DR)
                    </span>
                    <p className="text-foreground leading-relaxed">
                      {radarInsight.summary}
                    </p>
                  </div>

                  {/* 提炼出的核心概念芯片 */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-mono text-muted-foreground">提炼的核心概念芯片 (Concepts)：</span>
                    <div className="flex flex-wrap gap-2">
                      {radarInsight.concepts?.map((c, idx) => (
                        <div
                          key={idx}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1.5"
                        >
                          <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                            {c.name}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            - {c.essence}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 评估指标与建议标签 */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="p-2.5 rounded-xl bg-card border border-border">
                      <span className="text-[10px] text-muted-foreground block">前置认知要求</span>
                      <span className="font-semibold text-foreground">{radarInsight.prerequisites}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-card border border-border">
                      <span className="text-[10px] text-muted-foreground block">评估难度</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">{radarInsight.difficulty}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-card border border-border">
                      <span className="text-[10px] text-muted-foreground block">建议标签</span>
                      <span className="font-mono text-muted-foreground">
                        {radarInsight.suggestedTags?.join(', ') || '无'}
                      </span>
                    </div>
                  </div>

                  {/* 应用按钮 */}
                  <div className="pt-1 flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground">
                      点击「应用」将自动填充摘要、SEO、关联标签并持久化前台雷达速读舱。
                    </span>
                    <button
                      type="button"
                      onClick={handleApplyRadar}
                      className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1.5 shadow-sm transition-all hover:scale-[1.02] cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>应用到文章属性</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-muted-foreground">
                  尚未提炼文章概念雷达。点击上方「提炼全息雷达 & SEO」开始智能分析。
                </div>
              )}
            </div>
          )}

          {/* Tab 2: 站内双向链接建议 */}
          {activeTab === 'backlinks' && (
            <div className="space-y-3">
              {backlinksData && backlinksData.suggestions?.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    基于星空知识图谱深度语义分析，以下是 Hayden Xue 数字花园中与本文存在思想共鸣的关联篇章：
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {backlinksData.suggestions.map((item) => (
                      <div
                        key={item.postId}
                        className="p-3 rounded-xl bg-card border border-border hover:border-indigo-500/30 transition-all flex flex-col justify-between gap-2"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-1.5">
                            <span className="font-bold text-foreground text-xs line-clamp-1">
                              {item.postTitle}
                            </span>
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-600 shrink-0">
                              {item.maturity || 'GARDEN'}
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground line-clamp-2">
                            共振契合点：{item.resonanceReason}
                          </p>
                          <div className="text-[10px] font-mono text-indigo-500">
                            锚点概念: #{item.anchorConcept}
                          </div>
                        </div>

                        <div className="pt-2 border-t border-border/60 flex items-center justify-end">
                          <button
                            type="button"
                            onClick={() => handleInsertBacklink(item.postTitle, item.postSlug, item.anchorConcept)}
                            className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            <span>插入正文双向引用</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-muted-foreground">
                  {postId
                    ? '暂无关联图谱数据，可点击上方「双向知识链接建议」重新检索。'
                    : '当前文章尚未保存入库，保存后即可智能检索站内知识共振。'}
                </div>
              )}
            </div>
          )}

        </div>
      )}
    </div>
  );
}
