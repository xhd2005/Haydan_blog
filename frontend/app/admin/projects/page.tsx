'use client';

import React, { useEffect, useState, useRef, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Project, Timeline } from '@/lib/types';
import { CoverPickerButton } from '@/components/admin/CoverPickerButton';
import { toast, confirmModal } from '@/lib/toast';
import { 
  FolderGit2, 
  Milestone, 
  Clock, 
  Plus, 
  Trash2, 
  Edit2, 
  ExternalLink, 
  Star, 
  Upload, 
  Loader2, 
  Calendar, 
  Code, 
  Sparkles, 
  Search, 
  ArrowUpRight,
  GitBranch,
  Layers,
  CheckCircle2
} from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { triggerRevalidate } from '@/components/admin/revalidate';

type ProjectsWorkbenchTab = 'projects' | 'timeline' | 'living';

interface ResumeCreationsWorkbenchProps {
  defaultTab?: ProjectsWorkbenchTab;
}

function ResumeCreationsWorkbench({ defaultTab = 'projects' }: ResumeCreationsWorkbenchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 1. URL Query 参数联动（支持 ?tab=projects | timeline | living）
  const queryTab = searchParams?.get('tab') as ProjectsWorkbenchTab | null;
  const initialTab: ProjectsWorkbenchTab = (queryTab === 'timeline' || queryTab === 'living' || queryTab === 'projects')
    ? queryTab
    : defaultTab;

  const [activeTab, setActiveTab] = useState<ProjectsWorkbenchTab>(initialTab);

  useEffect(() => {
    if (queryTab && (queryTab === 'projects' || queryTab === 'timeline' || queryTab === 'living')) {
      setActiveTab(queryTab);
    }
  }, [queryTab]);

  const handleTabChange = (tab: ProjectsWorkbenchTab) => {
    setActiveTab(tab);
    router.replace(`/admin/projects?tab=${tab}`, { scroll: false });
  };

  // 2. 项目状态域 (Projects State - 解耦隔离)
  const [projects, setProjects] = useState<Project[]>([]);
  const [editingProject, setEditingProject] = useState<Partial<Project> | null>(null);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [projectSearch, setProjectSearch] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 3. 时间线状态域 (Timeline State - 解耦隔离)
  const [timelines, setTimelines] = useState<Timeline[]>([]);
  const [timelineYear, setTimelineYear] = useState('');
  const [timelineTitle, setTimelineTitle] = useState('');
  const [timelineDescription, setTimelineDescription] = useState('');
  const [timelineSortOrder, setTimelineSortOrder] = useState(10);
  const [timelineEditingId, setTimelineEditingId] = useState<number | null>(null);
  const [timelineSearch, setTimelineSearch] = useState('');
  const [timelineSubmitting, setTimelineSubmitting] = useState(false);

  // 初始化加载
  useEffect(() => {
    loadProjects();
    loadTimelines();
  }, []);

  const loadProjects = async () => {
    try {
      const data = await api.getProjects();
      setProjects(data || []);
    } catch (err) {
      console.error('加载项目列表失败:', err);
    }
  };

  const loadTimelines = async () => {
    try {
      const data = await api.getTimelines();
      setTimelines(data || []);
    } catch (err) {
      console.error('加载时间线失败:', err);
    }
  };

  // 项目操作
  const handleOpenCreateProject = () => {
    setEditingProject({
      name: '',
      slug: '',
      description: '',
      content: '',
      cover: '',
      technologies: '',
      githubUrl: '',
      demoUrl: '',
      featured: 0,
      status: 'PLANNING',
    });
    setIsProjectModalOpen(true);
  };

  const handleOpenEditProject = (proj: Project) => {
    setEditingProject({ ...proj });
    setIsProjectModalOpen(true);
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject?.name?.trim()) {
      toast.warning('请填写项目名称');
      return;
    }

    try {
      if (editingProject.id) {
        await api.updateProject(editingProject.id, editingProject);
        toast.success('造物项目更新成功');
      } else {
        await api.createProject(editingProject);
        toast.success('造物项目创建成功');
      }
      setIsProjectModalOpen(false);
      loadProjects();
      triggerRevalidate(['/projects', '/']);
    } catch (err: any) {
      toast.error(err.message || '保存项目失败');
    }
  };

  const handleDeleteProject = async (id: number) => {
    const target = projects.find((p) => p.id === id);
    const confirmed = await confirmModal({
      title: '删除项目确认',
      message: `确定要删除造物项目「${target?.name || id}」吗？此操作不可逆。`,
      confirmText: '确认删除',
      variant: 'danger',
    });
    if (!confirmed) return;

    try {
      await api.deleteProject(id);
      toast.success('项目已成功删除');
      loadProjects();
      triggerRevalidate(['/projects', '/']);
    } catch (err: any) {
      toast.error(err.message || '删除失败');
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await api.uploadMedia(file);
      setEditingProject((prev) => (prev ? { ...prev, cover: res.url } : null));
      toast.success('封面图片已成功上传至云端');
    } catch (err: any) {
      toast.error(err.message || '封面上传失败');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // 时间线操作
  const handleTimelineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!timelineYear.trim() || !timelineTitle.trim()) {
      toast.warning('请填写完整的年份与事件标题');
      return;
    }

    setTimelineSubmitting(true);
    try {
      if (timelineEditingId) {
        await api.updateTimeline(timelineEditingId, {
          year: timelineYear.trim(),
          title: timelineTitle.trim(),
          description: timelineDescription.trim(),
          sortOrder: timelineSortOrder,
        });
        toast.success('时间线里程碑更新成功');
      } else {
        await api.createTimeline({
          year: timelineYear.trim(),
          title: timelineTitle.trim(),
          description: timelineDescription.trim(),
          sortOrder: timelineSortOrder,
        });
        toast.success('时间线里程碑创建成功');
      }

      setTimelineEditingId(null);
      setTimelineYear('');
      setTimelineTitle('');
      setTimelineDescription('');
      setTimelineSortOrder(10);
      loadTimelines();
      triggerRevalidate(['/about', '/']);
    } catch (err: any) {
      toast.error(err.message || '保存时间线失败');
    } finally {
      setTimelineSubmitting(false);
    }
  };

  const handleEditTimeline = (t: Timeline) => {
    setTimelineEditingId(t.id);
    setTimelineYear(t.year);
    setTimelineTitle(t.title);
    setTimelineDescription(t.description || '');
    setTimelineSortOrder(t.sortOrder || 10);
  };

  const handleCancelEditTimeline = () => {
    setTimelineEditingId(null);
    setTimelineYear('');
    setTimelineTitle('');
    setTimelineDescription('');
    setTimelineSortOrder(10);
  };

  const handleDeleteTimeline = async (id: number) => {
    const target = timelines.find((t) => t.id === id);
    const confirmed = await confirmModal({
      title: '删除时间线节点确认',
      message: `确定删除里程碑「${target?.title || id}」吗？该操作不可逆。`,
      confirmText: '确认删除',
      variant: 'danger',
    });
    if (!confirmed) return;

    try {
      await api.deleteTimeline(id);
      toast.success('时间线节点已成功删除');
      if (timelineEditingId === id) {
        handleCancelEditTimeline();
      }
      loadTimelines();
      triggerRevalidate(['/about', '/']);
    } catch (err: any) {
      toast.error(err.message || '删除失败');
    }
  };

  // 筛选过滤
  const filteredProjects = useMemo(() => {
    if (!projectSearch.trim()) return projects;
    const q = projectSearch.trim().toLowerCase();
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.slug && p.slug.toLowerCase().includes(q)) ||
        (p.technologies && p.technologies.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q))
    );
  }, [projects, projectSearch]);

  const filteredTimelines = useMemo(() => {
    if (!timelineSearch.trim()) return timelines;
    const q = timelineSearch.trim().toLowerCase();
    return timelines.filter(
      (t) =>
        t.year.toLowerCase().includes(q) ||
        t.title.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q))
    );
  }, [timelines, timelineSearch]);

  // 全景时光轴数据聚合（按年份/时期聚合里程碑与造物项目）
  const panoramaGroups = useMemo(() => {
    const yearMap = new Map<string, { timelines: Timeline[]; projects: Project[] }>();

    timelines.forEach((t) => {
      const yr = t.year.trim() || '其他时期';
      if (!yearMap.has(yr)) yearMap.set(yr, { timelines: [], projects: [] });
      yearMap.get(yr)!.timelines.push(t);
    });

    projects.forEach((p) => {
      // 提取项目描述或命名中的年份，或归入造物列表
      let foundYear = '造物项目群';
      for (const [yr] of Array.from(yearMap.entries())) {
        if (p.description?.includes(yr) || p.content?.includes(yr) || p.name.includes(yr)) {
          foundYear = yr;
          break;
        }
      }
      if (!yearMap.has(foundYear)) yearMap.set(foundYear, { timelines: [], projects: [] });
      yearMap.get(foundYear)!.projects.push(p);
    });

    return Array.from(yearMap.entries());
  }, [timelines, projects]);

  return (
    <div className="w-full space-y-5">
      {/* 统一规范页面头部 */}
      <AdminPageHeader
        title="履历与造物工作台 (Resume & Creations)"
        description="深度聚合精选工程造物与生命成长编年史，同屏统一管理开源项目、架构演进与岁月里程碑。"
        icon={FolderGit2}
        badge={
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-semibold border border-emerald-500/20">
              {projects.length} 个造物项目
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-mono text-[10px] font-semibold border border-indigo-500/20">
              {timelines.length} 个成长里程碑
            </span>
          </div>
        }
        breadcrumbs={[
          { label: 'Studio', href: '/admin/dashboard' },
          { label: '知识与足迹', href: '/admin/categories' },
          { label: '履历与造物' },
        ]}
        action={
          activeTab === 'projects' ? (
            <button
              onClick={handleOpenCreateProject}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold hover:opacity-90 shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>新建造物项目</span>
            </button>
          ) : activeTab === 'timeline' ? (
            <button
              onClick={() => {
                handleCancelEditTimeline();
                const el = document.getElementById('timeline-form-card');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold hover:opacity-90 shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>新建里程碑节点</span>
            </button>
          ) : null
        }
      />

      {/* 顶部现代化 Segmented 风格 Tab 切换 */}
      <div className="flex items-center justify-between gap-4 p-1.5 rounded-2xl bg-slate-100/90 dark:bg-neutral-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/[0.08] shadow-sm">
        <div className="flex items-center gap-1.5 flex-1 sm:flex-initial">
          <button
            type="button"
            onClick={() => handleTabChange('projects')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'projects'
                ? 'bg-white dark:bg-neutral-800 text-slate-900 dark:text-white shadow-sm border border-slate-200/60 dark:border-white/[0.08]'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 hover:bg-slate-200/40 dark:hover:bg-white/[0.03]'
            }`}
          >
            <FolderGit2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>精选造物 (Projects)</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-slate-100 dark:bg-neutral-700 text-slate-500 dark:text-zinc-400">
              {projects.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('timeline')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'timeline'
                ? 'bg-white dark:bg-neutral-800 text-slate-900 dark:text-white shadow-sm border border-slate-200/60 dark:border-white/[0.08]'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 hover:bg-slate-200/40 dark:hover:bg-white/[0.03]'
            }`}
          >
            <Milestone className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>成长编年史 (Timeline)</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-slate-100 dark:bg-neutral-700 text-slate-500 dark:text-zinc-400">
              {timelines.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('living')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'living'
                ? 'bg-white dark:bg-neutral-800 text-slate-900 dark:text-white shadow-sm border border-slate-200/60 dark:border-white/[0.08]'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 hover:bg-slate-200/40 dark:hover:bg-white/[0.03]'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>全景时光轴 (Living Panorama)</span>
          </button>
        </div>

        {/* 快捷跳转链接 */}
        <div className="hidden md:flex items-center gap-2 pr-2 text-xs">
          <Link
            href="/projects"
            target="_blank"
            className="flex items-center gap-1 text-slate-500 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
          >
            <span>前台造物页</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
          <span className="text-slate-300 dark:text-zinc-700">·</span>
          <Link
            href="/about"
            target="_blank"
            className="flex items-center gap-1 text-slate-500 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
          >
            <span>关于 Hayden</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* ===================== TAB 1: 精选造物 (Projects) ===================== */}
      {activeTab === 'projects' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="rounded-2xl bg-white/80 dark:bg-neutral-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/[0.08] shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-200/80 dark:border-white/[0.08] flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-white/[0.01]">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-900 dark:text-white">
                <FolderGit2 className="w-4 h-4 text-emerald-500" />
                <span>工程造物列表</span>
                <span className="text-[10px] text-slate-400 dark:text-zinc-500">
                  ({filteredProjects.length} / {projects.length})
                </span>
              </div>
              <div className="relative w-48 sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
                <input
                  type="text"
                  value={projectSearch}
                  onChange={(e) => setProjectSearch(e.target.value)}
                  placeholder="搜索项目名称、技术栈..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 dark:bg-white/[0.02] text-slate-500 dark:text-zinc-400 font-semibold border-b border-slate-200/80 dark:border-white/[0.06]">
                  <tr>
                    <th className="p-3.5">项目名称 / Slug</th>
                    <th className="p-3.5">状态</th>
                    <th className="p-3.5">精选</th>
                    <th className="p-3.5">核心技术栈</th>
                    <th className="p-3.5">外链直达</th>
                    <th className="p-3.5 text-right">管理操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                  {filteredProjects.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-12 text-center text-slate-400 dark:text-zinc-500">
                        {projectSearch ? '未匹配到相关项目' : '暂无项目，点击右上角「新建造物项目」开始沉淀'}
                      </td>
                    </tr>
                  ) : (
                    filteredProjects.map((proj) => (
                      <tr key={proj.id} className="hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition-colors">
                        <td className="p-3.5 font-semibold text-slate-900 dark:text-white">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500/80" />
                            <span>{proj.name}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 dark:text-zinc-500 font-mono mt-0.5">
                            /{proj.slug}
                          </div>
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-semibold border ${
                              proj.status === 'COMPLETED'
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                : proj.status === 'DEVELOPING'
                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                                : 'bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-white/[0.08]'
                            }`}
                          >
                            {proj.status}
                          </span>
                        </td>
                        <td className="p-3.5">
                          {proj.featured === 1 ? (
                            <span className="inline-flex items-center gap-1 text-amber-500 font-semibold">
                              <Star className="w-3.5 h-3.5 fill-amber-500" />
                              <span>精选</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 dark:text-zinc-600">-</span>
                          )}
                        </td>
                        <td className="p-3.5 font-mono text-slate-600 dark:text-zinc-400 max-w-xs truncate">
                          {proj.technologies || '-'}
                        </td>
                        <td className="p-3.5 space-x-2 whitespace-nowrap">
                          {proj.githubUrl && (
                            <a
                              href={proj.githubUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-slate-700 dark:text-zinc-300 hover:text-emerald-500 transition-colors inline-flex items-center gap-0.5"
                            >
                              <span>GitHub</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                          {proj.demoUrl && (
                            <a
                              href={proj.demoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-teal-600 dark:text-teal-400 hover:underline inline-flex items-center gap-0.5"
                            >
                              <span>Demo</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </td>
                        <td className="p-3.5 text-right space-x-1 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleOpenEditProject(proj)}
                            title="编辑项目"
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProject(proj.id)}
                            title="删除项目"
                            className="p-1.5 rounded-lg hover:bg-rose-500/10 text-rose-500 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================== TAB 2: 成长编年史 (Timeline) ===================== */}
      {activeTab === 'timeline' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
          {/* 左侧：时间线表单 (状态完全独立解耦) */}
          <div
            id="timeline-form-card"
            className="rounded-2xl p-5 bg-white/80 dark:bg-neutral-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/[0.08] shadow-sm h-fit space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.06] pb-3">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Milestone className="w-4 h-4 text-indigo-500" />
                <span>{timelineEditingId ? '编辑成长里程碑' : '添加新里程碑'}</span>
              </h2>
              {timelineEditingId && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  编辑中 #{timelineEditingId}
                </span>
              )}
            </div>

            <form onSubmit={handleTimelineSubmit} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 dark:text-zinc-300">年份 / 时期</label>
                <input
                  type="text"
                  value={timelineYear}
                  onChange={(e) => setTimelineYear(e.target.value)}
                  required
                  placeholder="例如: 2026 或 2024-2025"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 dark:text-zinc-300">事件标题</label>
                <input
                  type="text"
                  value={timelineTitle}
                  onChange={(e) => setTimelineTitle(e.target.value)}
                  required
                  placeholder="例如: 构建个人数字花园 V2.0"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 dark:text-zinc-300">详细描述</label>
                <textarea
                  value={timelineDescription}
                  onChange={(e) => setTimelineDescription(e.target.value)}
                  rows={4}
                  placeholder="记录该时期的重要技术突破、关键转折或心境演进..."
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 dark:text-zinc-300">排序权重 (越小越靠前)</label>
                <input
                  type="number"
                  value={timelineSortOrder}
                  onChange={(e) => setTimelineSortOrder(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  disabled={timelineSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
                >
                  {timelineEditingId ? '更新里程碑' : '确认添加'}
                </button>
                {timelineEditingId && (
                  <button
                    type="button"
                    onClick={handleCancelEditTimeline}
                    className="px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-white/[0.05] hover:bg-slate-200 dark:hover:bg-white/[0.1] text-slate-700 dark:text-zinc-300 transition-colors cursor-pointer"
                  >
                    取消
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* 右侧：成长里程碑表格 */}
          <div className="lg:col-span-2 rounded-2xl bg-white/80 dark:bg-neutral-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/[0.08] shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-200/80 dark:border-white/[0.08] flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-white/[0.01]">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-900 dark:text-white">
                <Milestone className="w-4 h-4 text-indigo-500" />
                <span>成长里程碑清单</span>
                <span className="text-[10px] text-slate-400 dark:text-zinc-500">
                  ({filteredTimelines.length} / {timelines.length})
                </span>
              </div>
              <div className="relative w-48 sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
                <input
                  type="text"
                  value={timelineSearch}
                  onChange={(e) => setTimelineSearch(e.target.value)}
                  placeholder="搜索年份或里程碑内容..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 dark:bg-white/[0.02] text-slate-500 dark:text-zinc-400 font-semibold border-b border-slate-200/80 dark:border-white/[0.06]">
                  <tr>
                    <th className="p-3.5">年份 / 时期</th>
                    <th className="p-3.5">事件标题</th>
                    <th className="p-3.5">详细描述</th>
                    <th className="p-3.5">权重</th>
                    <th className="p-3.5 text-right">管理操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                  {filteredTimelines.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-slate-400 dark:text-zinc-500">
                        {timelineSearch ? '未匹配到相关里程碑' : '暂无成长里程碑，请在左侧表单中录入'}
                      </td>
                    </tr>
                  ) : (
                    filteredTimelines.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition-colors">
                        <td className="p-3.5 font-mono font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                          {t.year}
                        </td>
                        <td className="p-3.5 font-semibold text-slate-900 dark:text-white">
                          {t.title}
                        </td>
                        <td className="p-3.5 text-slate-500 dark:text-zinc-400 max-w-sm truncate">
                          {t.description || '-'}
                        </td>
                        <td className="p-3.5 font-mono text-slate-400 dark:text-zinc-500">
                          {t.sortOrder ?? 10}
                        </td>
                        <td className="p-3.5 text-right space-x-1 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleEditTimeline(t)}
                            title="编辑里程碑"
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTimeline(t.id)}
                            title="删除里程碑"
                            className="p-1.5 rounded-lg hover:bg-rose-500/10 text-rose-500 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================== TAB 3: 全景时光轴 (Living Panorama) ===================== */}
      {activeTab === 'living' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="p-6 rounded-2xl bg-white/80 dark:bg-neutral-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/[0.08] shadow-sm space-y-2">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>生命轴线：造物工程与岁月心智全景</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              将站长的成长轨迹里程碑与同时期研发落地的工程项目聚合展现，形成立体的技术沉淀编年谱。
            </p>
          </div>

          <div className="relative pl-6 space-y-8 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-white/[0.1]">
            {panoramaGroups.map(([yearGroup, groupData]) => (
              <div key={yearGroup} className="relative space-y-4">
                {/* 年份标记徽章 */}
                <div className="flex items-center gap-3">
                  <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-emerald-500 border-4 border-white dark:border-neutral-950 shadow-sm" />
                  <span className="px-3 py-1 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-mono text-xs font-bold shadow-sm">
                    {yearGroup}
                  </span>
                  <span className="text-xs text-slate-400 dark:text-zinc-500">
                    {groupData.timelines.length} 个里程碑 · {groupData.projects.length} 个工程项目
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 里程碑事件 */}
                  {groupData.timelines.map((t) => (
                    <div
                      key={`t-${t.id}`}
                      className="p-4 rounded-xl bg-white/80 dark:bg-neutral-900/60 border border-slate-200/80 dark:border-white/[0.08] space-y-2 hover:border-indigo-500/40 transition-colors shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 font-semibold flex items-center gap-1">
                          <Milestone className="w-3 h-3" />
                          <span>成长里程碑</span>
                        </span>
                        <button
                          onClick={() => {
                            handleEditTimeline(t);
                            handleTabChange('timeline');
                          }}
                          className="text-[11px] text-slate-400 hover:text-indigo-500 cursor-pointer"
                        >
                          编辑
                        </button>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        {t.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400 line-clamp-3">
                        {t.description || '暂无详细描述'}
                      </p>
                    </div>
                  ))}

                  {/* 对应工程项目 */}
                  {groupData.projects.map((p) => (
                    <div
                      key={`p-${p.id}`}
                      className="p-4 rounded-xl bg-white/80 dark:bg-neutral-900/60 border border-slate-200/80 dark:border-white/[0.08] space-y-2 hover:border-emerald-500/40 transition-colors shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-semibold flex items-center gap-1">
                          <FolderGit2 className="w-3 h-3" />
                          <span>造物项目</span>
                        </span>
                        <div className="flex items-center gap-2">
                          {p.featured === 1 && (
                            <span className="text-[10px] text-amber-500 font-semibold flex items-center gap-0.5">
                              <Star className="w-3 h-3 fill-amber-500" /> 精选
                            </span>
                          )}
                          <button
                            onClick={() => handleOpenEditProject(p)}
                            className="text-[11px] text-slate-400 hover:text-emerald-500 cursor-pointer"
                          >
                            编辑
                          </button>
                        </div>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>{p.name}</span>
                        <span className="text-[10px] font-mono text-slate-400 dark:text-zinc-500">
                          /{p.slug}
                        </span>
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400 line-clamp-2">
                        {p.description || '暂无项目描述'}
                      </p>
                      {p.technologies && (
                        <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 truncate">
                          {p.technologies}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 项目大模态编辑弹窗 (解耦独立) */}
      {isProjectModalOpen && editingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-2xl bg-[#fcfcfd] dark:bg-[#0c0d12] border border-slate-200 dark:border-white/[0.12] rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto text-xs text-slate-900 dark:text-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.08] pb-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FolderGit2 className="w-4 h-4 text-emerald-500" />
                <span>{editingProject.id ? '编辑造物工程项目' : '新建造物工程项目'}</span>
              </h2>
              {editingProject.id && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  ID: #{editingProject.id}
                </span>
              )}
            </div>

            <form onSubmit={handleSaveProject} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700 dark:text-zinc-300">项目名称</label>
                  <input
                    type="text"
                    value={editingProject.name || ''}
                    onChange={(e) => setEditingProject({ ...editingProject, name: e.target.value })}
                    required
                    placeholder="例如: Hayden Blog V2.0"
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700 dark:text-zinc-300">URL Slug</label>
                  <input
                    type="text"
                    value={editingProject.slug || ''}
                    onChange={(e) => setEditingProject({ ...editingProject, slug: e.target.value })}
                    placeholder="例如: hayden-blog"
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 dark:text-zinc-300">简介描述</label>
                <textarea
                  value={editingProject.description || ''}
                  onChange={(e) => setEditingProject({ ...editingProject, description: e.target.value })}
                  rows={2}
                  placeholder="用一两句话阐述该项目的核心定位与攻坚亮点..."
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 dark:text-zinc-300">
                  项目详情 Markdown (架构设计、核心技术与演进脉络)
                </label>
                <textarea
                  value={editingProject.content || ''}
                  onChange={(e) => setEditingProject({ ...editingProject, content: e.target.value })}
                  rows={8}
                  placeholder="支持完整 Markdown 语法，介绍架构选型、核心功能模块与技术突破点..."
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700 dark:text-zinc-300">核心技术栈 (逗号分隔)</label>
                  <input
                    type="text"
                    value={editingProject.technologies || ''}
                    onChange={(e) => setEditingProject({ ...editingProject, technologies: e.target.value })}
                    placeholder="Java 25, Spring Boot 3.3, Next.js 14, MinIO"
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-slate-700 dark:text-zinc-300">封面图片 (媒体库 / URL)</label>
                    <div className="flex items-center gap-2">
                      <CoverPickerButton
                        onSelect={(url) => setEditingProject((prev) => (prev ? { ...prev, cover: url } : null))}
                      />
                      <button
                        type="button"
                        disabled={uploading}
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 hover:underline disabled:opacity-50 cursor-pointer"
                      >
                        {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                        <span>上传封面</span>
                      </button>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleCoverUpload}
                      className="hidden"
                    />
                  </div>
                  <input
                    type="text"
                    value={editingProject.cover || ''}
                    onChange={(e) => setEditingProject({ ...editingProject, cover: e.target.value })}
                    placeholder="https://... 或点击上传"
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700 dark:text-zinc-300">GitHub 仓库 URL</label>
                  <input
                    type="text"
                    value={editingProject.githubUrl || ''}
                    onChange={(e) => setEditingProject({ ...editingProject, githubUrl: e.target.value })}
                    placeholder="https://github.com/..."
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700 dark:text-zinc-300">在线演示 Demo URL</label>
                  <input
                    type="text"
                    value={editingProject.demoUrl || ''}
                    onChange={(e) => setEditingProject({ ...editingProject, demoUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 items-center">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700 dark:text-zinc-300">研发状态</label>
                  <select
                    value={editingProject.status || 'PLANNING'}
                    onChange={(e) => setEditingProject({ ...editingProject, status: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="PLANNING">PLANNING (筹划中)</option>
                    <option value="DEVELOPING">DEVELOPING (研发中)</option>
                    <option value="COMPLETED">COMPLETED (已发布)</option>
                    <option value="ARCHIVED">ARCHIVED (已归档)</option>
                  </select>
                </div>
                <div className="pt-5">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={editingProject.featured === 1}
                      onChange={(e) => setEditingProject({ ...editingProject, featured: e.target.checked ? 1 : 0 })}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="font-semibold text-slate-800 dark:text-zinc-200 flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-amber-500" />
                      <span>标为前台首页精选造物</span>
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setIsProjectModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-white/[0.05] hover:bg-slate-200 dark:hover:bg-white/[0.1] text-slate-700 dark:text-zinc-300 transition-colors cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold hover:opacity-90 transition-opacity cursor-pointer shadow-sm"
                >
                  保存造物项目
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminProjectsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-xs text-slate-500 dark:text-zinc-400 font-mono">
          正在载入履历与造物工作台...
        </div>
      }
    >
      <ResumeCreationsWorkbench defaultTab="projects" />
    </Suspense>
  );
}
