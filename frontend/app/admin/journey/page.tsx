'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { api } from '@/lib/api';
import { CoverPickerButton } from '@/components/admin/CoverPickerButton';
import { Journey } from '@/lib/types';
import { toast, confirmModal } from '@/lib/toast';
import {
  Plus,
  Trash2,
  Edit2,
  MapPin,
  Upload,
  Loader2,
  Plane,
  Calendar,
  Route,
  HelpCircle,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Info,
} from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { triggerRevalidate } from '@/components/admin/revalidate';
import { getCityIataCode } from '@/components/journey/footprint';
import { AdminVoyageMapLibre } from '@/components/admin/journey/AdminVoyageMapLibre';

// 常用城市坐标与国家智能预设字典 (国内 20 城市 + 国际及常访 16 城市，共 36 个预设目的地)
const PRESET_LOCATIONS = {
  domestic: [
    { city: '重庆', country: '中国', lat: 29.5630, lon: 106.5516, slug: 'chongqing-voyage' },
    { city: '成都', country: '中国', lat: 30.5728, lon: 104.0668, slug: 'chengdu-voyage' },
    { city: '北京', country: '中国', lat: 39.9042, lon: 116.4074, slug: 'beijing-voyage' },
    { city: '上海', country: '中国', lat: 31.2304, lon: 121.4737, slug: 'shanghai-voyage' },
    { city: '广州', country: '中国', lat: 23.1291, lon: 113.2644, slug: 'guangzhou-voyage' },
    { city: '深圳', country: '中国', lat: 22.5431, lon: 114.0579, slug: 'shenzhen-voyage' },
    { city: '杭州', country: '中国', lat: 30.2741, lon: 120.1551, slug: 'hangzhou-voyage' },
    { city: '西安', country: '中国', lat: 34.3416, lon: 108.9398, slug: 'xian-voyage' },
    { city: '南京', country: '中国', lat: 32.0603, lon: 118.7969, slug: 'nanjing-voyage' },
    { city: '武汉', country: '中国', lat: 30.5928, lon: 114.3055, slug: 'wuhan-voyage' },
    { city: '长沙', country: '中国', lat: 28.2282, lon: 112.9388, slug: 'changsha-voyage' },
    { city: '厦门', country: '中国', lat: 24.4798, lon: 118.0894, slug: 'xiamen-voyage' },
    { city: '青岛', country: '中国', lat: 36.0671, lon: 120.3826, slug: 'qingdao-voyage' },
    { city: '大理', country: '中国', lat: 25.6065, lon: 100.2676, slug: 'dali-voyage' },
    { city: '丽江', country: '中国', lat: 26.8721, lon: 100.2297, slug: 'lijiang-voyage' },
    { city: '拉萨', country: '中国', lat: 29.6525, lon: 91.1721, slug: 'lhasa-voyage' },
    { city: '三亚', country: '中国', lat: 18.2528, lon: 109.5119, slug: 'sanya-voyage' },
    { city: '香港', country: '中国香港', lat: 22.3193, lon: 114.1694, slug: 'hongkong-voyage' },
    { city: '澳门', country: '中国澳门', lat: 22.1987, lon: 113.5439, slug: 'macao-voyage' },
    { city: '台北', country: '中国台湾', lat: 25.0330, lon: 121.5654, slug: 'taipei-voyage' },
  ],
  international: [
    { city: '东京', country: '日本', lat: 35.6762, lon: 139.6503, slug: 'tokyo-voyage' },
    { city: '京都', country: '日本', lat: 35.0116, lon: 135.7681, slug: 'kyoto-voyage' },
    { city: '大阪', country: '日本', lat: 34.6937, lon: 135.5023, slug: 'osaka-voyage' },
    { city: '新加坡', country: '新加坡', lat: 1.3521, lon: 103.8198, slug: 'singapore-voyage' },
    { city: '首尔', country: '韩国', lat: 37.5665, lon: 126.9780, slug: 'seoul-voyage' },
    { city: '曼谷', country: '泰国', lat: 13.7563, lon: 100.5018, slug: 'bangkok-voyage' },
    { city: '巴厘岛', country: '印度尼西亚', lat: -8.4095, lon: 115.1889, slug: 'bali-voyage' },
    { city: '巴黎', country: '法国', lat: 48.8566, lon: 2.3522, slug: 'paris-voyage' },
    { city: '伦敦', country: '英国', lat: 51.5074, lon: -0.1278, slug: 'london-voyage' },
    { city: '苏黎世', country: '瑞士', lat: 47.3769, lon: 8.5417, slug: 'zurich-voyage' },
    { city: '雷克雅未克', country: '冰岛', lat: 64.1466, lon: -21.9426, slug: 'reykjavik-voyage' },
    { city: '旧金山', country: '美国', lat: 37.7749, lon: -122.4194, slug: 'san-francisco-voyage' },
    { city: '纽约', country: '美国', lat: 40.7128, lon: -74.0060, slug: 'new-york-voyage' },
    { city: '洛杉矶', country: '美国', lat: 34.0522, lon: -118.2437, slug: 'los-angeles-voyage' },
    { city: '悉尼', country: '澳大利亚', lat: -33.8688, lon: 151.2093, slug: 'sydney-voyage' },
    { city: '迪拜', country: '阿联酋', lat: 25.2048, lon: 55.2708, slug: 'dubai-voyage' },
  ],
};

function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export default function AdminJourneyPage() {
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [editingJourney, setEditingJourney] = useState<Partial<Journey> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showGuide, setShowGuide] = useState(true);
  const [presetTab, setPresetTab] = useState<'domestic' | 'international'>('domestic');
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // 根据出发日期排布时序航线
  const sortedJourneys = useMemo(() => {
    return [...journeys].sort((a, b) => {
      const tA = new Date(a.startDate || a.createdAt || '2020-01-01').getTime();
      const tB = new Date(b.startDate || b.createdAt || '2020-01-01').getTime();
      return tA - tB;
    });
  }, [journeys]);

  // 计算当前飞行航段
  const flightLegs = useMemo(() => {
    if (sortedJourneys.length < 2) return [];
    const legs: Array<{
      from: Journey;
      to: Journey;
      distanceKm: number;
      flightNumber: string;
    }> = [];

    for (let i = 0; i < sortedJourneys.length - 1; i++) {
      const from = sortedJourneys[i];
      const to = sortedJourneys[i + 1];
      const dist =
        from.latitude && from.longitude && to.latitude && to.longitude
          ? calculateHaversineDistance(from.latitude, from.longitude, to.latitude, to.longitude)
          : 0;

      legs.push({
        from,
        to,
        distanceKm: dist,
        flightNumber: `HX-${100 + i * 12}`,
      });
    }
    return legs;
  }, [sortedJourneys]);

  const handleOpenCreateWithCoords = (lat?: number, lon?: number) => {
    const today = new Date().toISOString().slice(0, 10);
    setEditingJourney({
      title: '',
      slug: '',
      country: '',
      city: '',
      description: '',
      content: '',
      cover: '',
      latitude: lat,
      longitude: lon,
      startDate: today,
      endDate: today,
    });
    setIsModalOpen(true);
  };

  const handleOpenCreate = () => {
    handleOpenCreateWithCoords();
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
      triggerRevalidate(['/journey', '/']);
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
      triggerRevalidate(['/journey', '/']);
    } catch (err: any) {
      toast.error(err.message || '保存失败');
    }
  };

  // 快速交换两站时序 (交换 startDate)
  const handleSwapOrder = async (indexA: number, indexB: number) => {
    if (indexA < 0 || indexB < 0 || indexA >= sortedJourneys.length || indexB >= sortedJourneys.length) return;
    const a = sortedJourneys[indexA];
    const b = sortedJourneys[indexB];

    try {
      const dateA = a.startDate || '2025-01-01';
      const dateB = b.startDate || '2025-06-01';

      // 互相调换日期
      await api.updateJourney(a.id, { ...a, startDate: dateB });
      await api.updateJourney(b.id, { ...b, startDate: dateA });

      toast.success(`已调整航线时序：${a.city} 与 ${b.city} 顺序已互换`);
      loadJourneys();
      triggerRevalidate(['/journey', '/']);
    } catch (err: any) {
      toast.error('调整航线时序失败：' + (err.message || '未知错误'));
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await api.uploadMedia(file);
      setEditingJourney((prev) => (prev ? { ...prev, cover: res.url } : null));
      toast.success('封面图片已成功上传至 MinIO');
    } catch (err: any) {
      toast.error(err.message || '上传失败');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full space-y-5">
      <AdminPageHeader
        title="旅行足迹与航线编排"
        description="管理旅行故事、3D 地球仪坐标锚点与大圆飞行航迹时空时序"
        icon={MapPin}
        badgeText={`${journeys.length} 处航点`}
        breadcrumbs={[
          { label: 'Studio 控制台', href: '/admin/dashboard' },
          { label: '旅行足迹' },
        ]}
        action={
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-foreground text-background text-xs font-semibold hover:opacity-90 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>添加旅行航点</span>
          </button>
        }
      />

      {/* 1. 飞行轨迹编排与起止点设置指南面板 (针对用户问询：我怎么设置飞行的轨迹) */}
      <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/5 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-emerald-700 dark:text-emerald-400">
            <Route className="w-4 h-4" />
            <span>航线轨迹自由编排与起止点定制指南</span>
          </div>
          <button
            onClick={() => setShowGuide(!showGuide)}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{showGuide ? '收起指南' : '查看设置指南'}</span>
          </button>
        </div>

        {showGuide && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs leading-relaxed text-muted-foreground">
            <div className="p-3 rounded-2xl bg-card border border-border space-y-1.5">
              <div className="font-bold text-foreground flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[10px]">
                  1
                </span>
                <span>轨迹串联底层原理</span>
              </div>
              <p>
                全站 3D 地球仪的大圆飞行航迹是<b>严格按照旅行的【出发日期 (startDate)】时空先后顺序</b>自动计算并相互串联的。
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-card border border-border space-y-1.5">
              <div className="font-bold text-foreground flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[10px]">
                  2
                </span>
                <span>如何自由调整航线起止点</span>
              </div>
              <p>
                只需在下方表格或编辑弹窗中调整<b>【旅行日期】</b>先后：日期最早的城市为<b>起飞始发站</b>，最晚的为<b>终点站</b>；也可以直接点击下方的<b>【上移/下移】</b>一键调换航序。
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-card border border-border space-y-1.5">
              <div className="font-bold text-foreground flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[10px]">
                  3
                </span>
                <span>经纬度与城市版图</span>
              </div>
              <p>
                准确填写经纬度后，前台将自动以霓虹激光勾勒出城市真实行政版图；新建时可直接点击<b>快捷预设城市坐标胶囊</b>一键填充！
              </p>
            </div>
          </div>
        )}

        {/* 航段拓扑流向图与 2D 大圆航线矢量实时模拟 */}
        <div className="p-3.5 rounded-2xl bg-card dark:bg-neutral-950 border border-border dark:border-white/[0.08] space-y-3">
          {flightLegs.length > 0 && (
            <>
              <div className="text-[11px] font-mono font-bold text-foreground flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Plane className="w-3.5 h-3.5 text-emerald-500" />
                  当前实时飞行动态拓扑 (共 {flightLegs.length} 个航段)
                </span>
                <span className="text-muted-foreground font-normal">
                  前台 /journey 页面实时同步渲染
                </span>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto py-1 custom-scrollbar text-xs font-mono">
                {flightLegs.map((leg, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 shrink-0 p-2 rounded-xl bg-secondary/50 border border-border"
                  >
                    <div className="text-left">
                      <span className="font-bold text-foreground">{leg.from.city}</span>
                      <span className="text-[10px] text-muted-foreground ml-1">
                        ({getCityIataCode(leg.from.city)})
                      </span>
                    </div>

                    <div className="flex flex-col items-center px-1">
                      <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold">
                        {leg.flightNumber}
                      </span>
                      <div className="flex items-center gap-0.5 text-muted-foreground">
                        <span className="text-[10px]">───✈</span>
                      </div>
                      <span className="text-[8px] text-muted-foreground">
                        {leg.distanceKm.toLocaleString()} KM
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {leg.to.city}
                      </span>
                      <span className="text-[10px] text-muted-foreground ml-1">
                        ({getCityIataCode(leg.to.city)})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* 嵌入 MapLibre GL 真实互动世界地图与坐标实时拾取 */}
          <AdminVoyageMapLibre
            journeys={sortedJourneys}
            selectedJourneyId={editingJourney?.id}
            onSelectJourney={(j) => handleOpenEdit(j)}
            onPickCoordinates={(lat, lon) => {
              setEditingJourney((prev) => (prev ? { ...prev, latitude: lat, longitude: lon } : null));
              toast.info(`已拾取坐标：[${lat}, ${lon}]，可继续微调或保存`);
            }}
            activePickingCoords={
              editingJourney?.latitude && editingJourney?.longitude
                ? { lat: editingJourney.latitude, lon: editingJourney.longitude }
                : null
            }
            onAddNewFromPicker={(lat, lon) => {
              handleOpenCreateWithCoords(lat, lon);
            }}
          />
        </div>
      </div>

      {/* 2. 旅行记录与航段列表 */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-secondary/60 text-muted-foreground font-medium border-b border-border">
            <tr>
              <th className="p-3.5">时序航段</th>
              <th className="p-3.5">旅行篇名</th>
              <th className="p-3.5">国家 / 城市 (IATA)</th>
              <th className="p-3.5">经纬度坐标</th>
              <th className="p-3.5">出发日期 (决定时序)</th>
              <th className="p-3.5 text-center">时序调序</th>
              <th className="p-3.5 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {sortedJourneys.map((item, idx) => (
              <tr key={item.id} className="hover:bg-secondary/20 transition-colors">
                <td className="p-3.5 font-mono">
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-bold">
                    LEG {idx + 1}
                  </span>
                </td>
                <td className="p-3.5 font-semibold text-foreground">
                  <div>{item.title}</div>
                  <div className="text-[11px] text-muted-foreground font-mono">/{item.slug}</div>
                </td>
                <td className="p-3.5">
                  <span className="flex items-center gap-1 text-cyan-600 dark:text-cyan-400 font-medium">
                    <MapPin className="w-3.5 h-3.5" />
                    {item.country} · {item.city}
                    <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-secondary text-foreground">
                      {getCityIataCode(item.city)}
                    </span>
                  </span>
                </td>
                <td className="p-3.5 font-mono text-muted-foreground">
                  {item.latitude && item.longitude
                    ? `${item.latitude.toFixed(4)}, ${item.longitude.toFixed(4)}`
                    : '待设置'}
                </td>
                <td className="p-3.5 font-mono text-foreground font-medium">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-emerald-500" />
                    <span>{item.startDate || '-'}</span>
                  </div>
                </td>
                <td className="p-3.5 text-center">
                  <div className="inline-flex items-center gap-1">
                    <button
                      onClick={() => handleSwapOrder(idx, idx - 1)}
                      disabled={idx === 0}
                      className="p-1 rounded hover:bg-secondary disabled:opacity-30 text-muted-foreground hover:text-foreground cursor-pointer"
                      title="上移航段次序 (自动提前出发日期)"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleSwapOrder(idx, idx + 1)}
                      disabled={idx === sortedJourneys.length - 1}
                      className="p-1 rounded hover:bg-secondary disabled:opacity-30 text-muted-foreground hover:text-foreground cursor-pointer"
                      title="下移航段次序 (自动后延出发日期)"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
                <td className="p-3.5 text-right space-x-1">
                  <button
                    onClick={() => handleOpenEdit(item)}
                    className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground cursor-pointer"
                    title="编辑航点与坐标"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 rounded-lg hover:bg-rose-500/10 text-rose-500 cursor-pointer"
                    title="删除记录"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 3. 新增 / 编辑旅行记录模态框 */}
      {isModalOpen && editingJourney && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-2xl bg-card border border-border rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h2 className="text-base font-bold text-foreground">
                  {editingJourney.id ? '编辑旅行足迹与航点' : '添加旅行足迹航点'}
                </h2>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  设定出发日期可编排飞行轨迹，设定经纬度可在 3D 地球仪上绘制航线与行政版图
                </p>
              </div>
            </div>

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

              {/* 常用城市坐标快捷填入 (分类 Tab 智能预设库) */}
              <div className="p-3 rounded-2xl bg-secondary/50 border border-border space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                    <span>快捷填入坐标与国家预设库 (点击自动补全城市、国家、经纬度与 Slug)：</span>
                  </div>
                  <div className="inline-flex rounded-lg bg-card p-0.5 border border-border text-[10px]">
                    <button
                      type="button"
                      onClick={() => setPresetTab('domestic')}
                      className={`px-2 py-0.5 rounded-md font-medium transition-colors cursor-pointer ${
                        presetTab === 'domestic'
                          ? 'bg-emerald-500 text-white font-bold shadow-xs'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      国内城市 ({PRESET_LOCATIONS.domestic.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setPresetTab('international')}
                      className={`px-2 py-0.5 rounded-md font-medium transition-colors cursor-pointer ${
                        presetTab === 'international'
                          ? 'bg-emerald-500 text-white font-bold shadow-xs'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      国际枢纽 ({PRESET_LOCATIONS.international.length})
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto custom-scrollbar p-1">
                  {PRESET_LOCATIONS[presetTab].map((p) => (
                    <button
                      key={p.city}
                      type="button"
                      onClick={() => {
                        setEditingJourney((prev) => ({
                          ...prev,
                          city: p.city,
                          country: p.country,
                          latitude: p.lat,
                          longitude: p.lon,
                          slug: prev?.slug ? prev.slug : p.slug,
                        }));
                      }}
                      className="px-2 py-1 rounded-lg bg-card border border-border hover:border-emerald-500 hover:text-emerald-500 transition-all text-[11px] font-mono cursor-pointer flex items-center gap-1 hover:shadow-xs"
                    >
                      <span>{p.city}</span>
                      <span className="text-[9px] text-muted-foreground">({getCityIataCode(p.city)})</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-medium text-foreground">国家/地区</label>
                  <input
                    type="text"
                    value={editingJourney.country || ''}
                    onChange={(e) => setEditingJourney({ ...editingJourney, country: e.target.value })}
                    required
                    placeholder="例如: 中国 / 日本"
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
                    placeholder="例如: 重庆 / 京都"
                    className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-foreground">URL Slug</label>
                  <input
                    type="text"
                    value={editingJourney.slug || ''}
                    onChange={(e) => setEditingJourney({ ...editingJourney, slug: e.target.value })}
                    placeholder="chongqing-voyage"
                    className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground font-mono"
                  />
                </div>
              </div>

              {/* 核心：出发日期与结束日期 (决定航迹时序) */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
                <div className="space-y-1">
                  <label className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>出发日期 (航线时序关键字段)</span>
                  </label>
                  <input
                    type="date"
                    value={editingJourney.startDate || ''}
                    onChange={(e) => setEditingJourney({ ...editingJourney, startDate: e.target.value })}
                    required
                    className="w-full p-2.5 rounded-xl bg-card border border-border text-foreground font-mono"
                  />
                  <span className="text-[10px] text-muted-foreground block">
                    航线将按该日期的先后顺序连接
                  </span>
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-foreground flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>结束日期</span>
                  </label>
                  <input
                    type="date"
                    value={editingJourney.endDate || ''}
                    onChange={(e) => setEditingJourney({ ...editingJourney, endDate: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-card border border-border text-foreground font-mono"
                  />
                  <span className="text-[10px] text-muted-foreground block">
                    选填，旅行结束返航日期
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-medium text-foreground">纬度 Latitude (北纬为正)</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={editingJourney.latitude ?? ''}
                    onChange={(e) =>
                      setEditingJourney({
                        ...editingJourney,
                        latitude: e.target.value === '' ? undefined : Number(e.target.value),
                      })
                    }
                    placeholder="29.5630"
                    className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-foreground">经度 Longitude (东经为正)</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={editingJourney.longitude ?? ''}
                    onChange={(e) =>
                      setEditingJourney({
                        ...editingJourney,
                        longitude: e.target.value === '' ? undefined : Number(e.target.value),
                      })
                    }
                    placeholder="106.5516"
                    className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="font-medium text-foreground">封面图片 (MinIO / URL)</label>
                  <div className="flex items-center gap-2">
                    <CoverPickerButton
                      onSelect={(url) => setEditingJourney((prev) => (prev ? { ...prev, cover: url } : null))}
                    />
                    <button
                      type="button"
                      disabled={uploading}
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-500 hover:text-blue-600 disabled:opacity-50 cursor-pointer"
                    >
                      {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                      <span>上传到 MinIO</span>
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
                  value={editingJourney.cover || ''}
                  onChange={(e) => setEditingJourney({ ...editingJourney, cover: e.target.value })}
                  placeholder="https://... 或点击右上角上传"
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
                  rows={6}
                  className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-foreground text-background font-medium hover:opacity-90 cursor-pointer"
                >
                  保存旅行足迹与航点
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
