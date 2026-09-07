'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Project } from '@/lib/types';
import { toast, confirmModal } from '@/lib/toast';
import { Plus, Trash2, Edit2, ExternalLink, Star } from 'lucide-react';

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [editingProject, setEditingProject] = useState<Partial<Project> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const data = await api.getProjects();
      setProjects(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenCreate = () => {
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
    setIsModalOpen(true);
  };

  const handleOpenEdit = (proj: Project) => {
    setEditingProject({ ...proj });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    const confirmed = await confirmModal({
      title: '删除项目确认',
      message: '确定删除该项目吗？此操作不可逆。',
      confirmText: '确认删除',
      variant: 'danger',
    });
    if (!confirmed) return;

    try {
      await api.deleteProject(id);
      toast.success('项目已成功删除');
      loadProjects();
    } catch (err: any) {
      toast.error(err.message || '删除失败');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject?.name?.trim()) {
      toast.warning('请填写项目名称');
      return;
    }

    try {
      if (editingProject.id) {
        await api.updateProject(editingProject.id, editingProject);
      } else {
        await api.createProject(editingProject);
      }
      setIsModalOpen(false);
      toast.success(editingProject.id ? '项目更新成功' : '项目创建成功');
      loadProjects();
    } catch (err: any) {
      toast.error(err.message || '保存失败');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">项目管理</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            管理您的项目作品集、技术栈架构与 Demo 链接。
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-foreground text-background text-xs font-medium hover:opacity-90 shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>新建项目</span>
        </button>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-secondary/60 text-muted-foreground font-medium border-b border-border">
            <tr>
              <th className="p-3.5">项目名称</th>
              <th className="p-3.5">状态</th>
              <th className="p-3.5">精选</th>
              <th className="p-3.5">技术栈</th>
              <th className="p-3.5">链接</th>
              <th className="p-3.5 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {projects.map((proj) => (
              <tr key={proj.id} className="hover:bg-secondary/20">
                <td className="p-3.5 font-semibold text-foreground">
                  <div>{proj.name}</div>
                  <div className="text-[11px] text-muted-foreground font-mono">/{proj.slug}</div>
                </td>
                <td className="p-3.5">
                  <span className="px-2 py-0.5 rounded-full font-mono text-[10px] bg-secondary text-muted-foreground border border-border">
                    {proj.status}
                  </span>
                </td>
                <td className="p-3.5">
                  {proj.featured === 1 ? (
                    <span className="text-amber-500 font-medium">★ 精选</span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </td>
                <td className="p-3.5 font-mono text-muted-foreground max-w-xs truncate">
                  {proj.technologies || '-'}
                </td>
                <td className="p-3.5 space-x-2">
                  {proj.githubUrl && (
                    <a href={proj.githubUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-500 hover:underline">
                      GitHub
                    </a>
                  )}
                  {proj.demoUrl && (
                    <a href={proj.demoUrl} target="_blank" rel="noopener noreferrer" className="text-teal-500 hover:underline">
                      Demo
                    </a>
                  )}
                </td>
                <td className="p-3.5 text-right space-x-1">
                  <button
                    onClick={() => handleOpenEdit(proj)}
                    className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(proj.id)}
                    className="p-1.5 rounded-lg hover:bg-rose-500/10 text-rose-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Dialog */}
      {isModalOpen && editingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-2xl bg-card border border-border rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto text-xs">
            <h2 className="text-base font-bold text-foreground">
              {editingProject.id ? '编辑项目' : '新建项目'}
            </h2>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-medium text-foreground">项目名称</label>
                  <input
                    type="text"
                    value={editingProject.name || ''}
                    onChange={(e) => setEditingProject({ ...editingProject, name: e.target.value })}
                    required
                    className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-foreground">URL Slug</label>
                  <input
                    type="text"
                    value={editingProject.slug || ''}
                    onChange={(e) => setEditingProject({ ...editingProject, slug: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-foreground">简介描述</label>
                <textarea
                  value={editingProject.description || ''}
                  onChange={(e) => setEditingProject({ ...editingProject, description: e.target.value })}
                  rows={2}
                  className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-foreground">项目详情 Markdown (背景、架构、功能等)</label>
                <textarea
                  value={editingProject.content || ''}
                  onChange={(e) => setEditingProject({ ...editingProject, content: e.target.value })}
                  rows={8}
                  className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-medium text-foreground">技术栈 (逗号分隔)</label>
                  <input
                    type="text"
                    value={editingProject.technologies || ''}
                    onChange={(e) => setEditingProject({ ...editingProject, technologies: e.target.value })}
                    placeholder="Java, Spring Boot, React, Next.js"
                    className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-foreground">封面图片 URL</label>
                  <input
                    type="text"
                    value={editingProject.cover || ''}
                    onChange={(e) => setEditingProject({ ...editingProject, cover: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-medium text-foreground">GitHub URL</label>
                  <input
                    type="text"
                    value={editingProject.githubUrl || ''}
                    onChange={(e) => setEditingProject({ ...editingProject, githubUrl: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-foreground">在线演示 Demo URL</label>
                  <input
                    type="text"
                    value={editingProject.demoUrl || ''}
                    onChange={(e) => setEditingProject({ ...editingProject, demoUrl: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-medium text-foreground">开发状态</label>
                  <select
                    value={editingProject.status || 'PLANNING'}
                    onChange={(e) => setEditingProject({ ...editingProject, status: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground"
                  >
                    <option value="PLANNING">PLANNING</option>
                    <option value="DEVELOPING">DEVELOPING</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="ARCHIVED">ARCHIVED</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingProject.featured === 1}
                      onChange={(e) => setEditingProject({ ...editingProject, featured: e.target.checked ? 1 : 0 })}
                    />
                    <span className="font-medium text-foreground">标记为精选推荐</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-foreground text-background font-medium hover:opacity-90"
                >
                  保存项目
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
