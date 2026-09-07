'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Journey } from '@/lib/types';
import { toast, confirmModal } from '@/lib/toast';
import { Plus, Trash2, Edit2, MapPin } from 'lucide-react';

export default function AdminJourneyPage() {
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [editingJourney, setEditingJourney] = useState<Partial<Journey> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadJourneys();
  }, []);

  const loadJourneys = async () => {
    try {
      const data = await api.getJourneys();
      setJourneys(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenCreate = () => {
    setEditingJourney({
      title: '',
      slug: '',
      country: '',
      city: '',
      description: '',
      content: '',
      cover: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (j: Journey) => {
    setEditingJourney({ ...j });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    const confirmed = await confirmModal({
      title: '删除旅行记录确认',
      message: '确定删除该旅行记录吗？该操作不可逆。',
      confirmText: '确认删除',
      variant: 'danger',
    });
    if (!confirmed) return;

    try {
      await api.deleteJourney(id);
      toast.success('旅行记录已成功删除');
      loadJourneys();
    } catch (err: any) {
      toast.error(err.message || '删除失败');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingJourney?.title?.trim() || !editingJourney?.city?.trim()) {
      toast.warning('请填写旅行标题与城市名称');
      return;
    }

    try {
      if (editingJourney.id) {
        await api.updateJourney(editingJourney.id, editingJourney);
      } else {
        await api.createJourney(editingJourney);
      }
      setIsModalOpen(false);
      toast.success(editingJourney.id ? '旅行足迹更新成功' : '旅行足迹创建成功');
      loadJourneys();
    } catch (err: any) {
      toast.error(err.message || '保存失败');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">旅行管理</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            记录走过的国家、城市足迹与旅途思考。
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-foreground text-background text-xs font-medium hover:opacity-90 shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>添加旅行</span>
        </button>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-secondary/60 text-muted-foreground font-medium border-b border-border">
            <tr>
              <th className="p-3.5">旅行篇名</th>
              <th className="p-3.5">国家/城市</th>
              <th className="p-3.5">经纬度</th>
              <th className="p-3.5">旅行日期</th>
              <th className="p-3.5 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {journeys.map((item) => (
              <tr key={item.id} className="hover:bg-secondary/20">
                <td className="p-3.5 font-semibold text-foreground">
                  <div>{item.title}</div>
                  <div className="text-[11px] text-muted-foreground font-mono">/{item.slug}</div>
                </td>
                <td className="p-3.5">
                  <span className="flex items-center gap-1 text-cyan-600 dark:text-cyan-400">
                    <MapPin className="w-3.5 h-3.5" />
                    {item.country} · {item.city}
                  </span>
                </td>
                <td className="p-3.5 font-mono text-muted-foreground">
                  {item.latitude && item.longitude ? `${item.latitude}, ${item.longitude}` : '-'}
                </td>
                <td className="p-3.5 font-mono text-muted-foreground">
                  {item.startDate || '-'}
                </td>
                <td className="p-3.5 text-right space-x-1">
                  <button
                    onClick={() => handleOpenEdit(item)}
                    className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
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

      {isModalOpen && editingJourney && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-2xl bg-card border border-border rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto text-xs">
            <h2 className="text-base font-bold text-foreground">
              {editingJourney.id ? '编辑旅行记录' : '添加旅行足迹'}
            </h2>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1">
                <label className="font-medium text-foreground">旅行标题</label>
                <input
                  type="text"
                  value={editingJourney.title || ''}
                  onChange={(e) => setEditingJourney({ ...editingJourney, title: e.target.value })}
                  required
                  placeholder="例如: 京都与东京：春日漫行"
                  className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-medium text-foreground">国家/地区</label>
                  <input
                    type="text"
                    value={editingJourney.country || ''}
                    onChange={(e) => setEditingJourney({ ...editingJourney, country: e.target.value })}
                    required
                    placeholder="日本"
                    className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-foreground">城市</label>
                  <input
                    type="text"
                    value={editingJourney.city || ''}
                    onChange={(e) => setEditingJourney({ ...editingJourney, city: e.target.value })}
                    required
                    placeholder="京都"
                    className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-foreground">URL Slug</label>
                  <input
                    type="text"
                    value={editingJourney.slug || ''}
                    onChange={(e) => setEditingJourney({ ...editingJourney, slug: e.target.value })}
                    placeholder="kyoto-spring"
                    className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-medium text-foreground">纬度 Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={editingJourney.latitude || ''}
                    onChange={(e) => setEditingJourney({ ...editingJourney, latitude: Number(e.target.value) })}
                    placeholder="35.0116"
                    className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-foreground">经度 Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={editingJourney.longitude || ''}
                    onChange={(e) => setEditingJourney({ ...editingJourney, longitude: Number(e.target.value) })}
                    placeholder="135.7681"
                    className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-foreground">封面图片 URL</label>
                <input
                  type="text"
                  value={editingJourney.cover || ''}
                  onChange={(e) => setEditingJourney({ ...editingJourney, cover: e.target.value })}
                  placeholder="https://..."
                  className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-foreground">简短描述</label>
                <textarea
                  value={editingJourney.description || ''}
                  onChange={(e) => setEditingJourney({ ...editingJourney, description: e.target.value })}
                  rows={2}
                  className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-foreground">游记正文 (Markdown)</label>
                <textarea
                  value={editingJourney.content || ''}
                  onChange={(e) => setEditingJourney({ ...editingJourney, content: e.target.value })}
                  rows={7}
                  className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground font-mono"
                />
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
                  保存旅行记录
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
