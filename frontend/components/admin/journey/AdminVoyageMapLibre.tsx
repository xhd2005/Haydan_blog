'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useTheme } from 'next-themes';
import { Journey } from '@/lib/types';
import { getCityIataCode } from '@/components/journey/footprint';
import {
  MapPin,
  Crosshair,
  Globe,
  Route,
  Plus,
  Navigation,
} from 'lucide-react';

if (typeof window !== 'undefined' && typeof (maplibregl as any).setWorkerUrl === 'function') {
  (maplibregl as any).setWorkerUrl('/maplibre-gl-worker.mjs');
}

interface AdminVoyageMapLibreProps {
  journeys: Journey[];
  selectedJourneyId?: number | null;
  onSelectJourney?: (journey: Journey) => void;
  onPickCoordinates?: (lat: number, lon: number) => void;
  activePickingCoords?: { lat: number; lon: number } | null;
  onAddNewFromPicker?: (lat: number, lon: number) => void;
}

export function AdminVoyageMapLibre({
  journeys,
  selectedJourneyId,
  onSelectJourney,
  onPickCoordinates,
  activePickingCoords,
  onAddNewFromPicker,
}: AdminVoyageMapLibreProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const pickerMarkerRef = useRef<maplibregl.Marker | null>(null);

  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const [pickedPoint, setPickedPoint] = useState<{ lat: number; lon: number } | null>(
    activePickingCoords || null
  );
  const [mapLoaded, setMapLoaded] = useState(false);

  // 同步外部坐标变化
  useEffect(() => {
    if (activePickingCoords) {
      setPickedPoint(activePickingCoords);
    }
  }, [activePickingCoords]);

  // 获取深浅主题切片配置
  const getMapStyle = useCallback((dark: boolean): maplibregl.StyleSpecification => {
    const tileUrl = dark
      ? 'https://a.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}@2x.png'
      : 'https://a.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}@2x.png';

    return {
      version: 8,
      sources: {
        'carto-tiles': {
          type: 'raster',
          tiles: [
            tileUrl,
            tileUrl.replace('a.basemaps', 'b.basemaps'),
            tileUrl.replace('a.basemaps', 'c.basemaps'),
          ],
          tileSize: 256,
          attribution: '© OpenStreetMap contributors, © CARTO',
        },
      },
      layers: [
        {
          id: 'carto-tiles-layer',
          type: 'raster',
          source: 'carto-tiles',
          minzoom: 0,
          maxzoom: 20,
        },
      ],
    };
  }, []);

  // 1. 初始化地图
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: getMapStyle(isDark),
      center: [106.55, 29.56], // 默认以中国西南枢纽为视野中心
      zoom: 3.2,
      attributionControl: false,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: true, showZoom: true }), 'bottom-right');

    map.on('load', () => {
      setMapLoaded(true);
    });

    // 点击地图拾取坐标
    map.on('click', (e) => {
      const lat = Number(e.lngLat.lat.toFixed(6));
      const lon = Number(e.lngLat.lng.toFixed(6));
      setPickedPoint({ lat, lon });
      if (onPickCoordinates) {
        onPickCoordinates(lat, lon);
      }
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      setMapLoaded(false);
    };
  }, []);

  // 2. 响应深浅主题切换
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    mapRef.current.setStyle(getMapStyle(isDark));
  }, [isDark, mapLoaded, getMapStyle]);

  // 3. 绘制航线 GeoJSON 图层 (大圆与连线)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    const validJourneys = [...journeys]
      .filter((j) => typeof j.latitude === 'number' && typeof j.longitude === 'number')
      .sort((a, b) => {
        const tA = new Date(a.startDate || a.createdAt || '2020-01-01').getTime();
        const tB = new Date(b.startDate || b.createdAt || '2020-01-01').getTime();
        return tA - tB;
      });

    const updateRouteLayer = () => {
      // 移除旧航线图层与数据源
      if (map.getLayer('admin-route-glow')) map.removeLayer('admin-route-glow');
      if (map.getLayer('admin-route-core')) map.removeLayer('admin-route-core');
      if (map.getSource('admin-route-source')) map.removeSource('admin-route-source');

      if (validJourneys.length < 2) return;

      const coordinates = validJourneys.map((j) => [j.longitude!, j.latitude!]);

      map.addSource('admin-route-source', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates,
          },
        },
      });

      // 航线霓虹光晕外层
      map.addLayer({
        id: 'admin-route-glow',
        type: 'line',
        source: 'admin-route-source',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#10b981',
          'line-width': 6,
          'line-opacity': 0.38,
        },
      });

      // 航线核心点阵虚线
      map.addLayer({
        id: 'admin-route-core',
        type: 'line',
        source: 'admin-route-source',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#06b6d4',
          'line-width': 2.5,
          'line-dasharray': [3, 2],
        },
      });
    };

    // 每次样式重载或数据更新后绘制
    if (map.isStyleLoaded()) {
      updateRouteLayer();
    } else {
      map.once('style.load', updateRouteLayer);
    }
  }, [journeys, mapLoaded, isDark]);

  // 4. 渲染已录入航点标记 (Markers)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    // 清理旧航点
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const validJourneys = [...journeys]
      .filter((j) => typeof j.latitude === 'number' && typeof j.longitude === 'number')
      .sort((a, b) => {
        const tA = new Date(a.startDate || a.createdAt || '2020-01-01').getTime();
        const tB = new Date(b.startDate || b.createdAt || '2020-01-01').getTime();
        return tA - tB;
      });

    validJourneys.forEach((j, idx) => {
      const isSelected = selectedJourneyId === j.id;

      const el = document.createElement('div');
      el.className = 'voyage-city-marker group cursor-pointer select-none';
      el.innerHTML = `
        <div class="relative flex items-center gap-1.5 px-2.5 py-1 rounded-full shadow-lg border backdrop-blur-md transition-all duration-300 transform group-hover:scale-110 ${
          isSelected
            ? 'bg-emerald-500 text-white border-white ring-4 ring-emerald-500/30'
            : isDark
              ? 'bg-neutral-900/90 text-zinc-100 border-white/20 hover:border-emerald-400'
              : 'bg-white/95 text-slate-800 border-slate-200 hover:border-emerald-500'
        }">
          <span class="w-2 h-2 rounded-full ${isSelected ? 'bg-white animate-ping' : 'bg-emerald-500'}"></span>
          <span class="text-[11px] font-bold tracking-tight">${j.city}</span>
          <span class="text-[9px] font-mono opacity-80">${getCityIataCode(j.city)} · #${idx + 1}</span>
        </div>
      `;

      el.addEventListener('click', (ev) => {
        ev.stopPropagation();
        if (onSelectJourney) {
          onSelectJourney(j);
        }
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([j.longitude!, j.latitude!])
        .addTo(map);

      markersRef.current.push(marker);
    });
  }, [journeys, selectedJourneyId, mapLoaded, isDark, onSelectJourney]);

  // 5. 渲染可拖拽选点图钉 (Picker Marker)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    if (!pickedPoint) {
      if (pickerMarkerRef.current) {
        pickerMarkerRef.current.remove();
        pickerMarkerRef.current = null;
      }
      return;
    }

    if (!pickerMarkerRef.current) {
      const el = document.createElement('div');
      el.className = 'voyage-picker-pin cursor-grab active:cursor-grabbing select-none';
      el.innerHTML = `
        <div class="flex flex-col items-center">
          <div class="px-2.5 py-1 rounded-xl bg-amber-500 text-black text-[10px] font-bold shadow-xl border border-amber-300 flex items-center gap-1 whitespace-nowrap animate-bounce">
            <span>📍 选点锚标 (可拖拽微调)</span>
          </div>
          <div class="w-3 h-3 bg-amber-500 transform rotate-45 -mt-1.5 border-r border-b border-amber-300"></div>
          <div class="w-2 h-2 rounded-full bg-amber-400 ring-4 ring-amber-500/40 mt-0.5 animate-pulse"></div>
        </div>
      `;

      const picker = new maplibregl.Marker({
        element: el,
        draggable: true,
      })
        .setLngLat([pickedPoint.lon, pickedPoint.lat])
        .addTo(map);

      picker.on('dragend', () => {
        const lngLat = picker.getLngLat();
        const lat = Number(lngLat.lat.toFixed(6));
        const lon = Number(lngLat.lng.toFixed(6));
        setPickedPoint({ lat, lon });
        if (onPickCoordinates) {
          onPickCoordinates(lat, lon);
        }
      });

      pickerMarkerRef.current = picker;
    } else {
      pickerMarkerRef.current.setLngLat([pickedPoint.lon, pickedPoint.lat]);
    }
  }, [pickedPoint, mapLoaded, onPickCoordinates]);

  // 快捷视野控制操作
  const handleFitAllJourneys = () => {
    const map = mapRef.current;
    if (!map) return;

    const validJourneys = journeys.filter(
      (j) => typeof j.latitude === 'number' && typeof j.longitude === 'number'
    );

    if (validJourneys.length === 0) {
      map.flyTo({ center: [106.55, 29.56], zoom: 4 });
      return;
    }

    if (validJourneys.length === 1) {
      map.flyTo({
        center: [validJourneys[0].longitude!, validJourneys[0].latitude!],
        zoom: 7,
      });
      return;
    }

    const bounds = new maplibregl.LngLatBounds();
    validJourneys.forEach((j) => {
      bounds.extend([j.longitude!, j.latitude!]);
    });

    map.fitBounds(bounds, { padding: 60, maxZoom: 8, duration: 1200 });
  };

  const handleFocusChina = () => {
    if (!mapRef.current) return;
    mapRef.current.flyTo({ center: [105.0, 35.0], zoom: 3.8, duration: 1000 });
  };

  const handleWorldView = () => {
    if (!mapRef.current) return;
    mapRef.current.flyTo({ center: [10.0, 25.0], zoom: 1.6, duration: 1200 });
  };

  return (
    <div className="relative rounded-3xl overflow-hidden border border-slate-200/80 dark:border-white/[0.08] shadow-xl bg-slate-900 text-white space-y-0">
      {/* 顶部实时控制与航线状态栏 */}
      <div className="relative z-10 px-4 py-3 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-white/[0.08] flex flex-wrap items-center justify-between gap-3 text-slate-800 dark:text-zinc-100">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold font-mono flex items-center gap-1.5">
            <Route className="w-4 h-4 text-emerald-500" />
            <span>MapLibre GL 真实互动世界地图</span>
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-mono">
            {journeys.filter((j) => j.latitude && j.longitude).length} 处已标点 · Carto {isDark ? 'Dark Matter' : 'Positron'}
          </span>
        </div>

        {/* 快捷视图切换与操作胶囊 */}
        <div className="flex items-center gap-1.5 text-xs">
          <button
            type="button"
            onClick={handleFitAllJourneys}
            className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-white/[0.06] hover:bg-emerald-500 hover:text-white dark:hover:bg-emerald-600 transition-colors flex items-center gap-1 text-[11px] font-medium cursor-pointer"
            title="缩放并自适应包含全部足迹点"
          >
            <Crosshair className="w-3 h-3" />
            <span>自适应全貌</span>
          </button>

          <button
            type="button"
            onClick={handleFocusChina}
            className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.1] transition-colors flex items-center gap-1 text-[11px] font-medium cursor-pointer"
            title="聚焦中国大区"
          >
            <span>🇨🇳 聚焦中国</span>
          </button>

          <button
            type="button"
            onClick={handleWorldView}
            className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.1] transition-colors flex items-center gap-1 text-[11px] font-medium cursor-pointer"
            title="环球全览"
          >
            <Globe className="w-3 h-3" />
            <span>环球全览</span>
          </button>
        </div>
      </div>

      {/* 地图真实渲染视口 */}
      <div className="relative w-full h-[460px] sm:h-[500px]">
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* 悬浮坐标拾取控制面板 */}
        <div className="absolute top-3 left-3 z-10 p-3 rounded-2xl bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border border-slate-200/80 dark:border-white/[0.12] shadow-2xl space-y-2 max-w-xs text-xs text-slate-900 dark:text-zinc-100">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-white/[0.06] pb-1.5">
            <div className="flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-400">
              <MapPin className="w-3.5 h-3.5" />
              <span>经纬度实时拾取器</span>
            </div>
            <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono">
              点击地图即拾取
            </span>
          </div>

          {pickedPoint ? (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2 font-mono text-[11px] bg-slate-50 dark:bg-black/40 p-2 rounded-xl border border-slate-100 dark:border-white/[0.04]">
                <div>
                  <span className="text-slate-400 dark:text-zinc-500 block text-[9px]">纬度 (Lat)</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{pickedPoint.lat}</span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-zinc-500 block text-[9px]">经度 (Lon)</span>
                  <span className="font-bold text-cyan-600 dark:text-cyan-400">{pickedPoint.lon}</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {onAddNewFromPicker && (
                  <button
                    type="button"
                    onClick={() => onAddNewFromPicker(pickedPoint.lat, pickedPoint.lon)}
                    className="flex-1 py-1.5 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-sm"
                  >
                    <Plus className="w-3 h-3" />
                    <span>以此坐标新建航点</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed">
              💡 点击真实地图任意地点，或拖拽黄色图钉，即可精准拾取全球任意经纬度并一键填入表单。
            </p>
          )}
        </div>

        {/* 底部引导标签 */}
        <div className="absolute bottom-3 left-3 z-10 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-[10px] text-zinc-300 font-mono flex items-center gap-2 pointer-events-none">
          <Navigation className="w-3 h-3 text-cyan-400" />
          <span>点击标记可选中编辑 · 支持滚轮平滑缩放与右键倾斜 3D 俯仰</span>
        </div>
      </div>
    </div>
  );
}
