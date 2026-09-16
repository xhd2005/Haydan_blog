'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { CityFootprint, getCityIataCode, FlightLeg } from './footprint';
import { getCityBoundaryData } from '@/lib/cityBoundaries';
import {
  GLOBAL_MAJOR_CITIES,
  GEOGRAPHIC_PLACE_LABELS,
  URBAN_CORRIDOR_LINES,
} from '@/lib/earthGeoData';

// 配置 MapLibre GL 独立 WebWorker 静态资源路径
if (typeof window !== 'undefined' && typeof (maplibregl as any).setWorkerUrl === 'function') {
  (maplibregl as any).setWorkerUrl('/maplibre-gl-worker.mjs');
}

// 计算当前 UTC 真实时间的太阳直射点经纬度 (Subsolar Point) 与赤纬正余弦
function getSubsolarCoordinates(): { lat: number; lon: number; sinDecl: number; cosDecl: number } {
  const now = new Date();
  const startOfYear = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
  const dayOfYear = Math.floor((now.getTime() - startOfYear.getTime()) / 86400000);

  // 太阳赤纬角 (Declination, 范围约 -23.44° ~ +23.44°)
  const declRad = -23.44 * (Math.PI / 180) * Math.cos(((2 * Math.PI) / 365) * (dayOfYear + 10));
  const sinDecl = Math.sin(declRad);
  const cosDecl = Math.cos(declRad);

  // 真太阳时差 (Equation of Time, 单位：分钟)
  const B = ((2 * Math.PI) / 365) * (dayOfYear - 81);
  const eotMinutes = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);

  // UTC 正午时间
  const utcHours = now.getUTCHours() + now.getUTCMinutes() / 60 + now.getUTCSeconds() / 3600;
  const solarNoonUTC = 12 - eotMinutes / 60;

  // 太阳直射点经度
  let subsolarLon = -(utcHours - solarNoonUTC) * 15;
  while (subsolarLon > 180) subsolarLon -= 360;
  while (subsolarLon < -180) subsolarLon += 360;

  return {
    lat: (declRad * 180) / Math.PI,
    lon: subsolarLon,
    sinDecl,
    cosDecl,
  };
}

// ==========================================
// 1. 双级高效瓦片缓存系统 (L1 Memory + L2 CacheStorage)
// 配合 UTC Hour Bucket 天体时差换能机制，兼顾 0ms 瞬间秒出与真实昼夜同步
// ==========================================
const TILE_MEM_CACHE = new Map<string, ArrayBuffer>();
const MAX_MEM_TILES = 250;
const TILE_CACHE_NAME = 'nasa-blackmarble-tile-cache-v1';

function setL1Tile(key: string, buffer: ArrayBuffer) {
  if (TILE_MEM_CACHE.size >= MAX_MEM_TILES) {
    const oldestKey = TILE_MEM_CACHE.keys().next().value;
    if (oldestKey) TILE_MEM_CACHE.delete(oldestKey);
  }
  TILE_MEM_CACHE.set(key, buffer.slice(0));
}

async function getL2CachedTile(key: string): Promise<ArrayBuffer | null> {
  if (typeof window === 'undefined' || !('caches' in window)) return null;
  try {
    const cache = await caches.open(TILE_CACHE_NAME);
    const match = await cache.match(key);
    if (match) {
      return await match.arrayBuffer();
    }
  } catch {
    // 忽略缓存读取异常
  }
  return null;
}

async function putL2CachedTile(key: string, buffer: ArrayBuffer) {
  if (typeof window === 'undefined' || !('caches' in window)) return;
  try {
    const cache = await caches.open(TILE_CACHE_NAME);
    const response = new Response(buffer.slice(0), {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600',
      },
    });
    await cache.put(key, response);
  } catch {
    // 忽略缓存写入异常
  }
}

// 注册 NASA Black Marble 真实航天卫星夜景瓦片天体解算与自适应调色协议
if (typeof window !== 'undefined' && typeof (maplibregl as any).addProtocol === 'function') {
  try {
    (maplibregl as any).addProtocol('nasa-lights', async (requestParameters: any, abortController: any) => {
      const realUrl = requestParameters.url.replace('nasa-lights://', 'https://');

      // 天体换能分桶键（以 1 小时为周期，太阳移动 15°，既享受 0ms 瞬时秒出，又与现实昼夜精准同步）
      const utcHourBucket = Math.floor(Date.now() / 3600000);
      const cacheKey = `${realUrl}?utcH=${utcHourBucket}`;

      // 1. 检查 L1 内存热缓存 (0ms)
      const l1Buffer = TILE_MEM_CACHE.get(cacheKey);
      if (l1Buffer) {
        return { data: l1Buffer.slice(0) };
      }

      // 2. 检查 L2 浏览器 CacheStorage 磁盘缓存 (<2ms)
      const l2Buffer = await getL2CachedTile(cacheKey);
      if (l2Buffer) {
        setL1Tile(cacheKey, l2Buffer);
        return { data: l2Buffer.slice(0) };
      }

      // 3. 缓存均未命中：发起网络拉取
      const response = await fetch(realUrl, { signal: abortController.signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();

      // 解析瓦片 Mercator 坐标 {z}/{y}/{x}
      const match = realUrl.match(/\/(\d+)\/(\d+)\/(\d+)\.png/);
      let z = 0, y = 0, x = 0;
      if (match) {
        z = parseInt(match[1], 10);
        y = parseInt(match[2], 10);
        x = parseInt(match[3], 10);
      }

      const imageBitmap = await createImageBitmap(blob);
      let canvas: any;
      if (typeof OffscreenCanvas !== 'undefined') {
        canvas = new OffscreenCanvas(imageBitmap.width, imageBitmap.height);
      } else if (typeof document !== 'undefined') {
        canvas = document.createElement('canvas');
        canvas.width = imageBitmap.width;
        canvas.height = imageBitmap.height;
      }

      if (!canvas) {
        const arrayBuffer = await blob.arrayBuffer();
        setL1Tile(cacheKey, arrayBuffer);
        putL2CachedTile(cacheKey, arrayBuffer);
        return { data: arrayBuffer };
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context error');

      const W = imageBitmap.width;
      const H = imageBitmap.height;
      const subsolar = getSubsolarCoordinates();
      const n = Math.pow(2, z);
      const toRad = Math.PI / 180;

      // 快速检查瓦片 4 个角点的太阳高度角正弦值
      const corners = [
        [x, y],
        [x + 1, y],
        [x, y + 1],
        [x + 1, y + 1],
      ];
      let minSinAlt = 1;
      let maxSinAlt = -1;
      for (const [cx, cy] of corners) {
        const cWorldY = cy;
        const cLatRad = Math.atan(Math.sinh(Math.PI * (1 - (2 * cWorldY) / n)));
        const cLon = (cx / n) * 360 - 180;
        const cDeltaLonRad = (cLon - subsolar.lon) * toRad;
        const cSinAlt =
          Math.sin(cLatRad) * subsolar.sinDecl +
          Math.cos(cLatRad) * subsolar.cosDecl * Math.cos(cDeltaLonRad);
        if (cSinAlt < minSinAlt) minSinAlt = cSinAlt;
        if (cSinAlt > maxSinAlt) maxSinAlt = cSinAlt;
      }

      // 如果整张瓦片处于白昼侧 (minSinAlt >= 0.12)：
      // 白昼艳阳高照，直接输出全透明瓦片，显示底层原汁原味的自然卫星图，0 像素循环开销！
      if (minSinAlt >= 0.12) {
        ctx.clearRect(0, 0, W, H);
        let daylightBuffer: ArrayBuffer;
        if (canvas.convertToBlob) {
          const outputBlob = await canvas.convertToBlob({ type: 'image/png' });
          daylightBuffer = await outputBlob.arrayBuffer();
        } else {
          daylightBuffer = await new Promise<ArrayBuffer>((resolve) => {
            canvas.toBlob(async (b: Blob) => resolve(await b.arrayBuffer()), 'image/png');
          });
        }
        setL1Tile(cacheKey, daylightBuffer);
        putL2CachedTile(cacheKey, daylightBuffer);
        return { data: daylightBuffer };
      }

      ctx.drawImage(imageBitmap, 0, 0);
      const imgData = ctx.getImageData(0, 0, W, H);
      const data = imgData.data;

      const isFullNight = maxSinAlt <= -0.15;

      // 预计算列经度余弦值，将 256x256 处理压减到 1.8ms 极速
      const colCos = new Float32Array(W);
      for (let px = 0; px < W; px++) {
        const worldX = x + (px + 0.5) / W;
        const lon = (worldX / n) * 360 - 180;
        colCos[px] = Math.cos((lon - subsolar.lon) * toRad);
      }

      for (let py = 0; py < H; py++) {
        const worldY = y + (py + 0.5) / H;
        const latRad = Math.atan(Math.sinh(Math.PI * (1 - (2 * worldY) / n)));
        const k1 = Math.sin(latRad) * subsolar.sinDecl;
        const k2 = Math.cos(latRad) * subsolar.cosDecl;
        const rowOffset = py * W * 4;

        for (let px = 0; px < W; px++) {
          const i = rowOffset + (px << 2);
          let nightFactor = 1.0;

          if (!isFullNight) {
            const sinAlt = k1 + k2 * colCos[px];
            // 完全白昼半球：完全透明
            if (sinAlt >= 0.08) {
              data[i + 3] = 0;
              continue;
            }
            // 晨昏线平滑过渡带 (-0.12 ~ 0.08)：S 型羽化，绝无锯齿与极地拉丝
            if (sinAlt > -0.12) {
              nightFactor = (0.08 - sinAlt) / 0.20;
              nightFactor = nightFactor * nightFactor * (3 - 2 * nightFactor);
            }
          }

          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const luma = 0.299 * r + 0.587 * g + 0.114 * b;

          if (luma < 9) {
            // 暗夜海洋与陆地覆膜：沉浸深空幽蓝，透出卫星地形肌理
            data[i] = 4;
            data[i + 1] = 7;
            data[i + 2] = 16;
            data[i + 3] = Math.round(195 * nightFactor);
          } else {
            // 3.0x+ 超亮航天都会璀璨夜景 (温暖琥珀金 + 白炽钻石级大都会核心)
            const norm = (luma - 9) / 246;
            const intensity = Math.min(1.0, Math.pow(norm, 0.35) * 2.8);
            data[i] = Math.min(255, Math.round(r * 2.1 + 90 * intensity));
            data[i + 1] = Math.min(255, Math.round(g * 1.85 + 65 * intensity));
            data[i + 2] = Math.min(255, Math.round(b * 1.5 + (norm > 0.3 ? 160 * (norm - 0.3) : 0)));
            data[i + 3] = Math.round(Math.min(255, 75 + intensity * 180) * nightFactor);
          }
        }
      }

      ctx.putImageData(imgData, 0, 0);

      let arrayBuffer: ArrayBuffer;
      if (canvas.convertToBlob) {
        const outputBlob = await canvas.convertToBlob({ type: 'image/png' });
        arrayBuffer = await outputBlob.arrayBuffer();
      } else {
        arrayBuffer = await new Promise<ArrayBuffer>((resolve) => {
          canvas.toBlob(async (b: Blob) => resolve(await b.arrayBuffer()), 'image/png');
        });
      }
      setL1Tile(cacheKey, arrayBuffer);
      putL2CachedTile(cacheKey, arrayBuffer);
      return { data: arrayBuffer };
    });
  } catch (e) {
    // 已经注册过无需重复注册
  }
}

// ==========================================
// 2. Esri 高清遥感卫星底图持久化缓存系统 (L1 Memory + L2 CacheStorage 30 天持久化)
// 彻底解决卫星底图网络延迟，二次访问 0ms 瞬间秒出
// ==========================================
const ESRI_TILE_MEM_CACHE = new Map<string, ArrayBuffer>();
const MAX_ESRI_MEM_TILES = 300;
const ESRI_CACHE_NAME = 'esri-satellite-tile-cache-v1';

function setEsriL1Tile(key: string, buffer: ArrayBuffer) {
  if (ESRI_TILE_MEM_CACHE.size >= MAX_ESRI_MEM_TILES) {
    const oldestKey = ESRI_TILE_MEM_CACHE.keys().next().value;
    if (oldestKey) ESRI_TILE_MEM_CACHE.delete(oldestKey);
  }
  ESRI_TILE_MEM_CACHE.set(key, buffer.slice(0));
}

async function getEsriL2CachedTile(key: string): Promise<ArrayBuffer | null> {
  if (typeof window === 'undefined' || !('caches' in window)) return null;
  try {
    const cache = await caches.open(ESRI_CACHE_NAME);
    const match = await cache.match(key);
    if (match) {
      return await match.arrayBuffer();
    }
  } catch {}
  return null;
}

async function putEsriL2CachedTile(key: string, buffer: ArrayBuffer) {
  if (typeof window === 'undefined' || !('caches' in window)) return;
  try {
    const cache = await caches.open(ESRI_CACHE_NAME);
    const response = new Response(buffer.slice(0), {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=2592000', // 30 天持久化
      },
    });
    await cache.put(key, response);
  } catch {}
}

if (typeof window !== 'undefined' && typeof (maplibregl as any).addProtocol === 'function') {
  try {
    (maplibregl as any).addProtocol('esri-cache', async (requestParameters: any, abortController: any) => {
      const realUrl = requestParameters.url.replace('esri-cache://', 'https://');
      const cacheKey = realUrl;

      // 1. L1 内存热缓存 (0ms)
      const l1Buffer = ESRI_TILE_MEM_CACHE.get(cacheKey);
      if (l1Buffer) {
        return { data: l1Buffer.slice(0) };
      }

      // 2. L2 CacheStorage 磁盘缓存 (<2ms)
      const l2Buffer = await getEsriL2CachedTile(cacheKey);
      if (l2Buffer) {
        setEsriL1Tile(cacheKey, l2Buffer);
        return { data: l2Buffer.slice(0) };
      }

      // 3. 网络拉取
      const response = await fetch(realUrl, { signal: abortController.signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const arrayBuffer = await response.arrayBuffer();

      setEsriL1Tile(cacheKey, arrayBuffer);
      putEsriL2CachedTile(cacheKey, arrayBuffer);
      return { data: arrayBuffer };
    });
  } catch (e) {
    // 已经注册过无需重复注册
  }
}

export interface GoogleEarthGlobeViewProps {
  citiesData: CityFootprint[];
  flightLegs: FlightLeg[];
  activeLegIndex: number;
  onLegChange: (index: number) => void;
  onProgressChange: (percent: number) => void;
  onSelectCity: (city: CityFootprint) => void;
  onProbeCoords?: (lat: string, lon: string) => void;
  isDark: boolean;
  locale?: string;
  isDrawerOpen: boolean;
  selectedCity?: CityFootprint | null;
  isIntroComplete?: boolean;
  onMapLoaded?: () => void;
  onHoverRoute?: (leg: FlightLeg | null) => void;
  onOrbitStateChange?: (isOrbiting: boolean) => void;
  onRegisterControls?: (controls: {
    flyToCity: (city: CityFootprint) => void;
    changeLeg: (idx: number) => void;
    setScrubProgress: (p: number) => void;
    zoomIn: () => void;
    zoomOut: () => void;
    resetNorth: () => void;
    toggle3DTilt: () => void;
    toggleOrbit: () => void;
    toggleOverviewCloseUp: () => void;
  }) => void;
}

// 城市中英文对应字典
const CITY_ENGLISH_MAP: Record<string, string> = {
  北京: 'Beijing',
  上海: 'Shanghai',
  广州: 'Guangzhou',
  深圳: 'Shenzhen',
  成都: 'Chengdu',
  重庆: 'Chongqing',
  杭州: 'Hangzhou',
  西安: "Xi'an",
  武汉: 'Wuhan',
  南京: 'Nanjing',
  厦门: 'Xiamen',
  青岛: 'Qingdao',
  香港: 'Hong Kong',
  澳门: 'Macao',
  台北: 'Taipei',
  东京: 'Tokyo',
  京都: 'Kyoto',
  '京都 / 东京': 'Kyoto & Tokyo',
  大阪: 'Osaka',
  首尔: 'Seoul',
  新加坡: 'Singapore',
  曼谷: 'Bangkok',
  巴黎: 'Paris',
  伦敦: 'London',
  纽约: 'New York',
  旧金山: 'San Francisco',
  洛杉矶: 'Los Angeles',
  苏黎世: 'Zurich',
  迪拜: 'Dubai',
};

// 球面大圆插值算法 (Great Circle Slerp)
function getGreatCircleInterpolation(
  start: [number, number],
  end: [number, number],
  numPoints = 120
): [number, number][] {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const toDeg = (r: number) => (r * 180) / Math.PI;

  const [lng1, lat1] = start;
  const [lng2, lat2] = end;

  const phi1 = toRad(lat1);
  const lambda1 = toRad(lng1);
  const phi2 = toRad(lat2);
  const lambda2 = toRad(lng2);

  const deltaLambda = lambda2 - lambda1;
  const cosD =
    Math.sin(phi1) * Math.sin(phi2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);
  const d = Math.acos(Math.max(-1, Math.min(1, cosD)));

  if (isNaN(d) || d < 1e-6) {
    return [start, end];
  }

  const coords: [number, number][] = [];
  for (let i = 0; i <= numPoints; i++) {
    const f = i / numPoints;
    const A = Math.sin((1 - f) * d) / Math.sin(d);
    const B = Math.sin(f * d) / Math.sin(d);

    const x = A * Math.cos(phi1) * Math.cos(lambda1) + B * Math.cos(phi2) * Math.cos(lambda2);
    const y = A * Math.cos(phi1) * Math.sin(lambda1) + B * Math.cos(phi2) * Math.sin(lambda2);
    const z = A * Math.sin(phi1) + B * Math.sin(phi2);

    const lat = toDeg(Math.atan2(z, Math.sqrt(x * x + y * y)));
    const lng = toDeg(Math.atan2(y, x));
    coords.push([lng, lat]);
  }
  return coords;
}

// 计算航向角 (Heading Bearing)
function calculateHeadingBearing(p1: [number, number], p2: [number, number]): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const toDeg = (r: number) => (r * 180) / Math.PI;

  const [lng1, lat1] = p1;
  const [lng2, lat2] = p2;

  const y = Math.sin(toRad(lng2 - lng1)) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(toRad(lng2 - lng1));
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

function formatCoordinates(lat: number, lon: number): { latStr: string; lonStr: string } {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lonDir = lon >= 0 ? 'E' : 'W';
  const latAbs = Math.abs(lat);
  const lonAbs = Math.abs(lon);

  const latDeg = Math.floor(latAbs);
  const latMin = Math.round((latAbs - latDeg) * 60);
  const lonDeg = Math.floor(lonAbs);
  const lonMin = Math.round((lonAbs - lonDeg) * 60);

  return {
    latStr: `${latDeg}°${latMin.toString().padStart(2, '0')}'${latDir}`,
    lonStr: `${lonDeg}°${lonMin.toString().padStart(2, '0')}'${lonDir}`,
  };
}

export function GoogleEarthGlobeView({
  citiesData,
  flightLegs,
  activeLegIndex,
  onLegChange,
  onProgressChange,
  onSelectCity,
  onProbeCoords,
  isDark,
  locale = 'zh',
  isDrawerOpen,
  selectedCity,
  isIntroComplete = false,
  onMapLoaded,
  onHoverRoute,
  onOrbitStateChange,
  onRegisterControls,
}: GoogleEarthGlobeViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const airplaneMarkerRef = useRef<maplibregl.Marker | null>(null);
  const cityMarkersRef = useRef<maplibregl.Marker[]>([]);
  const boundaryBadgeMarkerRef = useRef<maplibregl.Marker | null>(null);
  const geoPlaceMarkersRef = useRef<maplibregl.Marker[]>([]);

  // 动画状态引用
  const flightProgressRef = useRef(0);
  const activeLegIndexRef = useRef(activeLegIndex);
  const isUserScrubbingRef = useRef(false);
  const animFrameIdRef = useRef<number | null>(null);
  const currentArcPointsRef = useRef<[number, number][]>([]);

  // 3D 环绕与行星自转运镜控制器
  const isOrbitingRef = useRef(false);
  const orbitFrameIdRef = useRef<number | null>(null);
  const introSpinFrameIdRef = useRef<number | null>(null);
  const hasFlownInRef = useRef(false);

  // 空间站微漫游与状态引用 (ISS Cinematic Drift)
  const issDriftFrameIdRef = useRef<number | null>(null);
  const isUserInteractingRef = useRef(false);
  const userInteractionTimeoutRef = useRef<any>(null);
  const selectedCityRef = useRef(selectedCity);
  selectedCityRef.current = selectedCity;

  // 城市激光勾勒动画引用
  const laserAnimFrameRef = useRef<number | null>(null);
  const pendingCityBoundaryRef = useRef<CityFootprint | null>(null);

  activeLegIndexRef.current = activeLegIndex;

  // 纯粹高清卫星遥感地球样式表（集成真实 NASA Black Marble 航天夜光遥感瓦片）
  const getSatelliteMapStyle = useCallback((dark: boolean): maplibregl.StyleSpecification => {
    return {
      version: 8,
      projection: { type: 'globe' },
      sky: dark
        ? {
            'sky-color': 'rgba(0, 0, 0, 0)',
            'horizon-color': 'rgba(0, 0, 0, 0)',
            'fog-color': 'rgba(0, 0, 0, 0)',
            'fog-ground-blend': 0,
            'atmosphere-blend': 0.22,
          }
        : {
            // 晨曦模式：透明宇宙底色 + 绕球极轻柔冰蓝平流层大气辉光 (绝不泛灰泛白)
            'sky-color': 'rgba(0, 0, 0, 0)',
            'horizon-color': 'rgba(56, 189, 248, 0.28)',
            'fog-color': 'rgba(0, 0, 0, 0)',
            'fog-ground-blend': 0,
            'atmosphere-blend': 0.35,
          },
      sources: {
        'esri-satellite': {
          type: 'raster',
          tiles: [
            'esri-cache://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          ],
          tileSize: 256,
          maxzoom: 19,
          attribution: '© Esri, Maxar, Earthstar Geographics',
        },
        'nasa-night-lights': {
          type: 'raster',
          tiles: [
            'nasa-lights://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_Black_Marble/default/2016-01-01/GoogleMapsCompatible_Level8/{z}/{y}/{x}.png',
          ],
          tileSize: 256,
          maxzoom: 8,
          attribution: '© NASA Earth Observatory / NOAA',
        },
      },
      layers: [
        {
          id: 'esri-satellite-layer',
          type: 'raster',
          source: 'esri-satellite',
          layout: { visibility: 'visible' },
          paint: dark
            ? {
                'raster-fade-duration': 200,
                'raster-brightness-max': 0.98,
                'raster-contrast': 0.06,
              }
            : {
                // 晨曦模式：影像提亮加饱和，告别压抑暗面
                'raster-fade-duration': 200,
                'raster-brightness-max': 1.0,
                'raster-brightness-min': -0.05,
                'raster-saturation': 0.15,
                'raster-contrast': 0.02,
              },
        },
        // 航天级自适应都会璀璨夜光与自然夜色图层
        {
          id: 'nasa-night-lights-layer',
          type: 'raster',
          source: 'nasa-night-lights',
          layout: { visibility: 'visible' },
          paint: {
            'raster-fade-duration': 300,
            'raster-opacity': dark ? 1.0 : 0.95,
            'raster-brightness-min': 0.0,
            'raster-brightness-max': 1.0,
            'raster-contrast': 0.18,
          },
        },
      ],
    };
  }, []);

  // 主题切换时同步卫星底图与高亮夜景灯火质感
  const applyMapThemePaint = useCallback((map: maplibregl.Map, dark: boolean) => {
    if (map.getLayer('nasa-night-lights-layer')) {
      map.setPaintProperty('nasa-night-lights-layer', 'raster-opacity', dark ? 1.0 : 0.95);
    }
    if (map.getLayer('esri-satellite-layer')) {
      map.setPaintProperty('esri-satellite-layer', 'raster-brightness-max', dark ? 0.98 : 1.0);
    }
  }, []);

  // 球面地平线背面遮挡剔除算法 (Horizon Occlusion Culling)
  const updateOcclusion = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    const center = map.getCenter();
    const toRad = (d: number) => (d * Math.PI) / 180;
    const centerLatRad = toRad(center.lat);
    const centerLonRad = toRad(center.lng);
    const cosCenterLat = Math.cos(centerLatRad);
    const sinCenterLat = Math.sin(centerLatRad);

    const getCosAngle = (lon: number, lat: number) => {
      const latRad = toRad(lat);
      const lonRad = toRad(lon);
      return (
        sinCenterLat * Math.sin(latRad) +
        cosCenterLat * Math.cos(latRad) * Math.cos(lonRad - centerLonRad)
      );
    };

    // 1. 剔除 Google Earth 城市地名微标
    geoPlaceMarkersRef.current.forEach((marker, idx) => {
      const item = GEOGRAPHIC_PLACE_LABELS[idx];
      if (!item) return;
      const cosAngle = getCosAngle(item.lon, item.lat);
      const el = marker.getElement();
      if (cosAngle < 0.10) {
        el.style.opacity = '0';
        el.style.pointerEvents = 'none';
      } else if (cosAngle < 0.25) {
        const fade = (cosAngle - 0.10) / 0.15;
        el.style.opacity = String(Math.max(0, Math.min(1, fade)));
        el.style.pointerEvents = 'none';
      } else {
        el.style.opacity = '1';
        el.style.pointerEvents = 'auto';
      }
    });

    // 2. 剔除站长足迹信标
    cityMarkersRef.current.forEach((marker, idx) => {
      const city = citiesData[idx];
      if (!city) return;
      const cosAngle = getCosAngle(city.lon, city.lat);
      const el = marker.getElement();
      if (cosAngle < 0.08) {
        el.style.opacity = '0';
        el.style.pointerEvents = 'none';
      } else if (cosAngle < 0.22) {
        const fade = (cosAngle - 0.08) / 0.14;
        el.style.opacity = String(Math.max(0, Math.min(1, fade)));
        el.style.pointerEvents = 'none';
      } else {
        el.style.opacity = '1';
        el.style.pointerEvents = 'auto';
      }
    });

    // 3. 剔除选中的行政边界标题徽标
    if (boundaryBadgeMarkerRef.current && selectedCity) {
      const cosAngle = getCosAngle(selectedCity.lon, selectedCity.lat);
      const bEl = boundaryBadgeMarkerRef.current.getElement();
      bEl.style.opacity = cosAngle < 0.10 ? '0' : '1';
    }

    // 4. 剔除巡航客机（位于地球背面地平线以下时平滑淡出，避免穿透球体）
    if (airplaneMarkerRef.current && !selectedCity) {
      const planeLngLat = airplaneMarkerRef.current.getLngLat();
      const cosAngle = getCosAngle(planeLngLat.lng, planeLngLat.lat);
      const pEl = airplaneMarkerRef.current.getElement();
      if (cosAngle < 0.08) {
        pEl.style.opacity = '0';
        pEl.style.pointerEvents = 'none';
      } else if (cosAngle < 0.22) {
        const fade = (cosAngle - 0.08) / 0.14;
        pEl.style.opacity = String(Math.max(0, Math.min(1, fade)));
      } else {
        pEl.style.opacity = '1';
        pEl.style.pointerEvents = 'auto';
      }
    }
  }, [citiesData, selectedCity]);

  // 渲染/更新 Google Earth 风格全球中英双语城市地名注记（支持轻触直达真实测绘行政辖区）
  const updateGeoPlaceLabels = useCallback(
    (map: maplibregl.Map, currentLocale: string) => {
      if (geoPlaceMarkersRef.current.length > 0) {
        geoPlaceMarkersRef.current.forEach((marker, idx) => {
          const item = GEOGRAPHIC_PLACE_LABELS[idx];
          if (!item) return;
          const textEl = marker.getElement().querySelector('.place-label-text');
          if (textEl) {
            textEl.textContent = currentLocale === 'en' ? item.name_en : item.name_zh;
          }
        });
        return;
      }

      GEOGRAPHIC_PLACE_LABELS.forEach((item) => {
        const isTier1 = item.tier === 1;
        const el = document.createElement('div');
        el.className =
          'group/label select-none flex items-center gap-1.5 transform -translate-y-1/2 transition-all duration-200 cursor-pointer pointer-events-auto hover:scale-110';

        const text = currentLocale === 'en' ? item.name_en : item.name_zh;

        el.innerHTML = `
          <span class="${isTier1 ? 'w-1.5 h-1.5' : 'w-1 h-1'} rounded-full bg-white/90 shadow-[0_0_5px_rgba(255,255,255,0.95)] group-hover/label:bg-emerald-400 group-hover/label:shadow-[0_0_10px_#34d399] transition-all shrink-0"></span>
          <span class="place-label-text ${
            isTier1
              ? 'text-[11px] font-sans font-semibold text-white/95 tracking-wider drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)]'
              : 'text-[9.5px] font-sans font-medium text-white/80 tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)]'
          } group-hover/label:text-emerald-300 group-hover/label:font-bold whitespace-nowrap transition-colors">
            ${text}
          </span>
        `;

        el.addEventListener('click', (e) => {
          e.stopPropagation();
          const matchedCity = citiesData.find(
            (c) =>
              c.city === item.name_zh ||
              item.name_zh.includes(c.city) ||
              c.city.includes(item.name_zh)
          );

          if (matchedCity) {
            onSelectCity(matchedCity);
          } else {
            const idHash = Array.from(item.name_zh).reduce(
              (acc, c) => (acc * 31 + c.charCodeAt(0)) & 0x7fffffff,
              999000
            );
            const syntheticCity: CityFootprint = {
              id: idHash,
              city: item.name_zh,
              title: `${item.name_zh} · 行政辖区`,
              description: `测绘级真实行政版图与空间地理走廊`,
              lat: item.lat,
              lon: item.lon,
              slug: item.name_en.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
              country:
                ['东京', '京都', '大阪', '札幌', '福冈'].includes(item.name_zh)
                  ? '日本'
                  : ['首尔', '釜山'].includes(item.name_zh)
                  ? '韩国'
                  : item.name_zh === '新加坡'
                  ? '新加坡'
                  : '中国',
              startDate: '2026-01-01',
            };
            onSelectCity(syntheticCity);
          }
        });

        const marker = new maplibregl.Marker({
          element: el,
          anchor: 'left',
        })
          .setLngLat([item.lon, item.lat])
          .addTo(map);

        geoPlaceMarkersRef.current.push(marker);
      });
    },
    [citiesData, onSelectCity]
  );

  // 1. 初始化 3D 全景地球
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // 初始居中中国核心经纬度
    const initialCenter: [number, number] = [115.0, 29.0];

    if (typeof (maplibregl as any).setWorkerUrl === 'function') {
      (maplibregl as any).setWorkerUrl('/maplibre-gl-worker.mjs');
    }

    if (typeof (maplibregl as any).setMaxParallelImageRequests === 'function') {
      (maplibregl as any).setMaxParallelImageRequests(16);
    }

    // 初始化时设在外太空深空轨道 (Zoom 0.88, Pitch 38)，开屏地球自转
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: getSatelliteMapStyle(isDark),
      center: initialCenter,
      zoom: 0.88,
      pitch: 38,
      bearing: 0,
      maxPitch: 82,
      dragRotate: true,
      touchPitch: true,
      attributionControl: false,
      fadeDuration: 200,
      canvasContextAttributes: {
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      },
    });

    mapRef.current = map;
    if (typeof window !== 'undefined') {
      (window as any)._globeMap = map;
    }

    map.on('load', () => {
      map.setProjection({ type: 'globe' });
      if (typeof window !== 'undefined') {
        (window as any)._globeMap = map;
      }

      // 添加 Google Earth 风格中英双语城市地名标注
      updateGeoPlaceLabels(map, locale);
      // 添加航路图层
      updateRouteLayers(map);
      // 添加城市发光点标与高定 Hover 名片
      updateCityMarkers(map);
      // 添加巡航客机
      initAirplaneMarker(map);

      // 注册视界背面遮挡剔除更新监听
      map.on('render', updateOcclusion);
      map.on('move', updateOcclusion);
      updateOcclusion();

      // 若在地图加载完成前已有选中的城市，立即触发版图绘制
      if (pendingCityBoundaryRef.current) {
        const pCity = pendingCityBoundaryRef.current;
        pendingCityBoundaryRef.current = null;
        drawCityBoundary(pCity);
      }

      // 通知上层地图初始渲染就绪
      let hasNotified = false;
      const notifyLoaded = () => {
        if (!hasNotified) {
          hasNotified = true;
          onMapLoaded?.();
        }
      };

      map.once('idle', notifyLoaded);
      setTimeout(notifyLoaded, 1000);

      // 地图加载完成即刻与开屏入场仪式并发执行深空下潜放大（画幅对标图2空间站近地特写：Zoom 2.40，Pitch 38°）
      const launchFlyIn = () => {
        if (hasFlownInRef.current) return;
        hasFlownInRef.current = true;
        const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
        const isTablet = typeof window !== 'undefined' && window.innerWidth < 1024;
        const targetZoom = isMobile ? 1.85 : isTablet ? 2.10 : 2.40;

        map.flyTo({
          center: [109.5, 31.0],
          zoom: targetZoom,
          pitch: 38,
          bearing: 0,
          duration: 3200,
          essential: true,
        });
      };

      launchFlyIn();

      // 启动空间站超微速舷窗微漂移 (ISS Cinematic Drift: 每帧向东微漫游 0.0035°，如身临其境从空间站舷窗俯瞰)
      const startIssDrift = () => {
        if (issDriftFrameIdRef.current) return;
        const driftLoop = () => {
          const m = mapRef.current;
          if (
            m &&
            hasFlownInRef.current &&
            !m.isMoving() &&
            !isOrbitingRef.current &&
            !selectedCityRef.current &&
            !isUserInteractingRef.current
          ) {
            const curCenter = m.getCenter();
            let newLng = curCenter.lng + 0.0035;
            if (newLng > 180) newLng -= 360;
            m.setCenter([newLng, curCenter.lat]);
          }
          issDriftFrameIdRef.current = requestAnimationFrame(driftLoop);
        };
        issDriftFrameIdRef.current = requestAnimationFrame(driftLoop);
      };

      startIssDrift();
    });

    // 射线反解探针：鼠标移动时反解当前地理经纬度
    map.on('mousemove', (e) => {
      if (!onProbeCoords) return;
      const { lat, lng } = e.lngLat;
      const { latStr, lonStr } = formatCoordinates(lat, lng);
      onProbeCoords(latStr, lonStr);
    });

    // 用户交互时暂停微漫游与受控环绕，静默 2.5 秒后平滑恢复
    const handleUserInteraction = () => {
      isUserInteractingRef.current = true;
      if (userInteractionTimeoutRef.current) {
        clearTimeout(userInteractionTimeoutRef.current);
      }
      userInteractionTimeoutRef.current = setTimeout(() => {
        isUserInteractingRef.current = false;
      }, 2500);

      if (isOrbitingRef.current) {
        stopOrbit();
      }
    };

    map.on('dragstart', handleUserInteraction);
    map.on('rotatestart', handleUserInteraction);
    map.on('pitchstart', handleUserInteraction);
    map.on('zoomstart', handleUserInteraction);
    map.on('mousedown', handleUserInteraction);
    map.on('touchstart', handleUserInteraction);

    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      if (orbitFrameIdRef.current) cancelAnimationFrame(orbitFrameIdRef.current);
      if (introSpinFrameIdRef.current) cancelAnimationFrame(introSpinFrameIdRef.current);
      if (laserAnimFrameRef.current) cancelAnimationFrame(laserAnimFrameRef.current);
      if (issDriftFrameIdRef.current) cancelAnimationFrame(issDriftFrameIdRef.current);
      if (userInteractionTimeoutRef.current) clearTimeout(userInteractionTimeoutRef.current);
      geoPlaceMarkersRef.current.forEach((m) => m.remove());
      geoPlaceMarkersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // 2. 开屏动画备用保护：若尚未飞入则平滑补正
  useEffect(() => {
    if (!isIntroComplete || hasFlownInRef.current || !mapRef.current) return;

    hasFlownInRef.current = true;
    const map = mapRef.current;
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
    const isTablet = typeof window !== 'undefined' && window.innerWidth < 1024;
    const targetZoom = isMobile ? 1.85 : isTablet ? 2.10 : 2.40;

    map.flyTo({
      center: [109.5, 31.0],
      zoom: targetZoom,
      pitch: 38,
      bearing: 0,
      duration: 2400,
      essential: true,
    });
  }, [isIntroComplete]);

  // 监听全局语言切换并即时响应城市地名注记
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    updateGeoPlaceLabels(map, locale);
  }, [locale, updateGeoPlaceLabels]);

  // 3. 主题切换时动态更新大气层光晕、影像质感与高亮夜景透光度
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    map.setSky(
      isDark
        ? {
            'sky-color': 'rgba(0, 0, 0, 0)',
            'horizon-color': 'rgba(0, 0, 0, 0)',
            'fog-color': 'rgba(0, 0, 0, 0)',
            'fog-ground-blend': 0,
            'atmosphere-blend': 0.22,
          }
        : {
            'sky-color': 'rgba(0, 0, 0, 0)',
            'horizon-color': 'rgba(125, 211, 252, 0.22)',
            'fog-color': 'rgba(0, 0, 0, 0)',
            'fog-ground-blend': 0,
            'atmosphere-blend': 0.32,
          }
    );

    if (map.getLayer('esri-satellite-layer')) {
      if (isDark) {
        map.setPaintProperty('esri-satellite-layer', 'raster-brightness-max', 0.98);
        map.setPaintProperty('esri-satellite-layer', 'raster-contrast', 0.06);
      } else {
        map.setPaintProperty('esri-satellite-layer', 'raster-brightness-max', 1.0);
        map.setPaintProperty('esri-satellite-layer', 'raster-saturation', 0.15);
        map.setPaintProperty('esri-satellite-layer', 'raster-contrast', 0.02);
      }
    }

    applyMapThemePaint(map, isDark);
  }, [isDark, applyMapThemePaint]);

  // 4. 构建大圆航线 GeoJSON 图层
  const updateRouteLayers = useCallback(
    (map: maplibregl.Map) => {
      if (!map.isStyleLoaded()) return;

      [
        'route-glow-layer',
        'route-core-layer',
        'route-active-pulse',
        'route-hitbox-layer',
        'route-hover-glow-layer',
        'route-hover-core-layer',
      ].forEach((id) => {
        if (map.getLayer(id)) map.removeLayer(id);
      });
      if (map.getSource('flight-routes')) {
        map.removeSource('flight-routes');
      }
      if (map.getSource('route-hover-glow-src')) {
        map.removeSource('route-hover-glow-src');
      }

      if (flightLegs.length === 0) return;

      const features: any[] = [];
      flightLegs.forEach((leg, idx) => {
        const arcCoords = getGreatCircleInterpolation(
          [leg.fromCity.lon, leg.fromCity.lat],
          [leg.toCity.lon, leg.toCity.lat],
          100
        );

        features.push({
          type: 'Feature',
          properties: {
            legIndex: idx,
            isActive: idx === activeLegIndex,
            flightNumber: leg.flightNumber,
            fromCity: leg.fromCity.city,
            toCity: leg.toCity.city,
            distanceKm: leg.distanceKm,
          },
          geometry: {
            type: 'LineString',
            coordinates: arcCoords,
          },
        });
      });

      map.addSource('flight-routes', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features,
        },
      });

      // 悬浮动态高亮流光数据源与图层
      map.addSource('route-hover-glow-src', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: [],
          },
        },
      });

      map.addLayer({
        id: 'route-hover-glow-layer',
        type: 'line',
        source: 'route-hover-glow-src',
        paint: {
          'line-color': '#67e8f9',
          'line-width': 7,
          'line-blur': 5,
          'line-opacity': 0.85,
        },
      });

      map.addLayer({
        id: 'route-hover-core-layer',
        type: 'line',
        source: 'route-hover-glow-src',
        paint: {
          'line-color': '#ffffff',
          'line-width': 2.4,
          'line-opacity': 0.95,
        },
      });

      // 航线发光光晕层
      map.addLayer({
        id: 'route-glow-layer',
        type: 'line',
        source: 'flight-routes',
        paint: {
          'line-color': [
            'case',
            ['==', ['get', 'isActive'], true],
            '#10b981',
            '#059669',
          ],
          'line-width': [
            'case',
            ['==', ['get', 'isActive'], true],
            6,
            3,
          ],
          'line-blur': 4,
          'line-opacity': [
            'case',
            ['==', ['get', 'isActive'], true],
            0.8,
            0.4,
          ],
        },
      });

      // 航线核心亮线层
      map.addLayer({
        id: 'route-core-layer',
        type: 'line',
        source: 'flight-routes',
        paint: {
          'line-color': [
            'case',
            ['==', ['get', 'isActive'], true],
            '#6ee7b7',
            '#34d399',
          ],
          'line-width': [
            'case',
            ['==', ['get', 'isActive'], true],
            2.2,
            1.2,
          ],
          'line-opacity': 0.9,
        },
      });

      // 当前激活航段流光脉冲虚线层
      map.addLayer({
        id: 'route-active-pulse',
        type: 'line',
        source: 'flight-routes',
        filter: ['==', ['get', 'isActive'], true],
        paint: {
          'line-color': '#ffffff',
          'line-width': 2.5,
          'line-dasharray': [1, 2],
          'line-opacity': 0.85,
        },
      });

      // 航线鼠标交互感应层
      map.addLayer({
        id: 'route-hitbox-layer',
        type: 'line',
        source: 'flight-routes',
        paint: {
          'line-color': 'transparent',
          'line-width': 18,
          'line-opacity': 0.01,
        },
      });

      map.on('mouseenter', 'route-hitbox-layer', (e) => {
        map.getCanvas().style.cursor = 'pointer';
        if (e.features && e.features[0]) {
          const idx = e.features[0].properties.legIndex;
          const leg = flightLegs[idx];
          if (leg) {
            onHoverRoute?.(leg);
            const arc = getGreatCircleInterpolation(
              [leg.fromCity.lon, leg.fromCity.lat],
              [leg.toCity.lon, leg.toCity.lat],
              100
            );
            const hSrc = map.getSource('route-hover-glow-src') as maplibregl.GeoJSONSource;
            if (hSrc) {
              hSrc.setData({
                type: 'Feature',
                properties: {},
                geometry: {
                  type: 'LineString',
                  coordinates: arc,
                },
              });
            }
          }
        }
      });

      map.on('mouseleave', 'route-hitbox-layer', () => {
        map.getCanvas().style.cursor = '';
        onHoverRoute?.(null);
        const hSrc = map.getSource('route-hover-glow-src') as maplibregl.GeoJSONSource;
        if (hSrc) {
          hSrc.setData({
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: [],
            },
          });
        }
      });

      map.on('click', 'route-hitbox-layer', (e) => {
        if (e.features && e.features[0]) {
          const idx = e.features[0].properties.legIndex;
          onLegChange(idx);
        }
      });
    },
    [flightLegs, activeLegIndex, onHoverRoute, onLegChange]
  );

  // 5. 动态高定绘制城市真实行政轮廓激光勾勒动画
  const drawCityBoundary = useCallback((city: CityFootprint) => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) {
      pendingCityBoundaryRef.current = city;
      return;
    }

    if (laserAnimFrameRef.current) {
      cancelAnimationFrame(laserAnimFrameRef.current);
      laserAnimFrameRef.current = null;
    }

    const boundaryData = getCityBoundaryData(city.city, city.lat, city.lon);
    const fullRing = boundaryData.polygonCoords;

    const fillGeoJSON: any = {
      type: 'Feature',
      properties: { name: city.city },
      geometry: {
        type: 'Polygon',
        coordinates: [fullRing],
      },
    };

    const emptyLineGeoJSON: any = {
      type: 'Feature',
      properties: {},
      geometry: { type: 'LineString', coordinates: [] },
    };

    const emptyPointGeoJSON: any = {
      type: 'Feature',
      properties: {},
      geometry: { type: 'Point', coordinates: [0, 0] },
    };

    if (map.getSource('city-boundary-fill-src')) {
      (map.getSource('city-boundary-fill-src') as maplibregl.GeoJSONSource).setData(fillGeoJSON);
    } else {
      map.addSource('city-boundary-fill-src', {
        type: 'geojson',
        data: fillGeoJSON,
      });
      map.addLayer({
        id: 'city-boundary-fill-layer',
        type: 'fill',
        source: 'city-boundary-fill-src',
        paint: {
          'fill-color': '#10b981',
          'fill-opacity': 0.0,
        },
      });
    }

    if (map.getSource('city-boundary-laser-src')) {
      (map.getSource('city-boundary-laser-src') as maplibregl.GeoJSONSource).setData(emptyLineGeoJSON);
    } else {
      map.addSource('city-boundary-laser-src', {
        type: 'geojson',
        data: emptyLineGeoJSON,
      });
      map.addLayer({
        id: 'city-boundary-laser-glow',
        type: 'line',
        source: 'city-boundary-laser-src',
        paint: {
          'line-color': '#34d399',
          'line-width': 4.5,
          'line-blur': 4,
          'line-opacity': 0.85,
        },
      });
      map.addLayer({
        id: 'city-boundary-laser-core',
        type: 'line',
        source: 'city-boundary-laser-src',
        paint: {
          'line-color': '#ffffff',
          'line-width': 1.8,
          'line-opacity': 0.95,
        },
      });
    }

    if (map.getSource('city-boundary-head-src')) {
      (map.getSource('city-boundary-head-src') as maplibregl.GeoJSONSource).setData(emptyPointGeoJSON);
    } else {
      map.addSource('city-boundary-head-src', {
        type: 'geojson',
        data: emptyPointGeoJSON,
      });
      map.addLayer({
        id: 'city-boundary-head-glow',
        type: 'circle',
        source: 'city-boundary-head-src',
        paint: {
          'circle-radius': 6,
          'circle-color': '#34d399',
          'circle-blur': 3,
          'circle-opacity': 0.9,
        },
      });
      map.addLayer({
        id: 'city-boundary-head-core',
        type: 'circle',
        source: 'city-boundary-head-src',
        paint: {
          'circle-radius': 2.5,
          'circle-color': '#ffffff',
          'circle-opacity': 1.0,
        },
      });
    }

    // 聚焦特定城市行政辖区时隐藏沿航线巡航飞机，专注于官方行政辖区轮廓与风貌
    if (airplaneMarkerRef.current) {
      const planeEl = airplaneMarkerRef.current.getElement();
      if (planeEl) {
        planeEl.style.opacity = '0';
        planeEl.style.pointerEvents = 'none';
        planeEl.style.transition = 'opacity 0.4s ease';
      }
    }

    const totalPts = fullRing.length;
    let currentIdx = 0;
    const ptsPerFrame = Math.max(1, Math.floor(totalPts / 60));

    const animateLaserDraw = () => {
      currentIdx = Math.min(totalPts, currentIdx + ptsPerFrame);
      const drawnCoords = fullRing.slice(0, currentIdx);

      const laserSource = map.getSource('city-boundary-laser-src') as maplibregl.GeoJSONSource;
      const headSource = map.getSource('city-boundary-head-src') as maplibregl.GeoJSONSource;

      if (laserSource && drawnCoords.length > 1) {
        laserSource.setData({
          type: 'Feature',
          properties: {},
          geometry: { type: 'LineString', coordinates: drawnCoords },
        });
      }

      if (headSource && drawnCoords.length > 0) {
        const headPt = drawnCoords[drawnCoords.length - 1];
        headSource.setData({
          type: 'Feature',
          properties: {},
          geometry: { type: 'Point', coordinates: headPt },
        });
      }

      if (currentIdx < totalPts) {
        laserAnimFrameRef.current = requestAnimationFrame(animateLaserDraw);
      } else {
        if (headSource) {
          headSource.setData({
            type: 'Feature',
            properties: {},
            geometry: { type: 'Point', coordinates: [0, 0] },
          });
        }
        map.setPaintProperty('city-boundary-fill-layer', 'fill-opacity', 0.22);

        // 挂载真实行政区划官方全称悬浮微标 (Administrative Region Badge)
        if (boundaryBadgeMarkerRef.current) {
          boundaryBadgeMarkerRef.current.remove();
          boundaryBadgeMarkerRef.current = null;
        }

        const badgeEl = document.createElement('div');
        badgeEl.className =
          'pointer-events-none select-none transition-all duration-700 animate-in fade-in zoom-in-95';
        badgeEl.innerHTML = `
          <div class="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-black/85 dark:bg-[#06080e]/90 border border-emerald-500/50 backdrop-blur-2xl shadow-[0_4px_30px_rgba(16,185,129,0.35)] text-white">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span class="text-[11px] font-mono tracking-wider font-bold text-emerald-300">${boundaryData.administrativeTitle}</span>
          </div>
        `;

        const badgeMarker = new maplibregl.Marker({
          element: badgeEl,
          anchor: 'bottom',
        })
          .setLngLat([city.lon, city.lat + 0.12])
          .addTo(map);

        boundaryBadgeMarkerRef.current = badgeMarker;
      }
    };

    laserAnimFrameRef.current = requestAnimationFrame(animateLaserDraw);
  }, []);

  // 清理城市行政边界与恢复巡航飞机
  const clearCityBoundary = useCallback(() => {
    const map = mapRef.current;
    if (laserAnimFrameRef.current) {
      cancelAnimationFrame(laserAnimFrameRef.current);
      laserAnimFrameRef.current = null;
    }
    if (boundaryBadgeMarkerRef.current) {
      boundaryBadgeMarkerRef.current.remove();
      boundaryBadgeMarkerRef.current = null;
    }
    if (map && map.isStyleLoaded()) {
      const emptyGeoJSON: any = {
        type: 'Feature',
        properties: {},
        geometry: { type: 'LineString', coordinates: [] },
      };
      const emptyPolygon: any = {
        type: 'Feature',
        properties: {},
        geometry: { type: 'Polygon', coordinates: [] },
      };
      const emptyPoint: any = {
        type: 'Feature',
        properties: {},
        geometry: { type: 'Point', coordinates: [0, 0] },
      };

      if (map.getSource('city-boundary-laser-src')) {
        (map.getSource('city-boundary-laser-src') as maplibregl.GeoJSONSource).setData(emptyGeoJSON);
      }
      if (map.getSource('city-boundary-head-src')) {
        (map.getSource('city-boundary-head-src') as maplibregl.GeoJSONSource).setData(emptyPoint);
      }
      if (map.getSource('city-boundary-fill-src')) {
        (map.getSource('city-boundary-fill-src') as maplibregl.GeoJSONSource).setData(emptyPolygon);
      }
    }
    // 恢复巡航客机显示
    if (airplaneMarkerRef.current) {
      const planeEl = airplaneMarkerRef.current.getElement();
      if (planeEl) {
        planeEl.style.opacity = '1';
        planeEl.style.pointerEvents = 'auto';
      }
    }
  }, []);

  // 监听选中城市取消时清理行政边界
  useEffect(() => {
    if (!selectedCity) {
      clearCityBoundary();
    }
  }, [selectedCity, clearCityBoundary]);

  // 6. 渲染城市发光雷达信标点与高定悬停名片
  const updateCityMarkers = useCallback(
    (map: maplibregl.Map) => {
      cityMarkersRef.current.forEach((m) => m.remove());
      cityMarkersRef.current = [];

      citiesData.forEach((city) => {
        const el = document.createElement('div');
        el.className = 'group/marker relative flex items-center cursor-pointer select-none';

        const iata = getCityIataCode(city.city);
        const enName = CITY_ENGLISH_MAP[city.city] || city.city;
        const year = (city.startDate || city.createdAt || '2025').slice(0, 4);

        let distFromOrigin = 0;
        if (citiesData.length > 0) {
          const origin = citiesData[0];
          const toRad = (d: number) => (d * Math.PI) / 180;
          const R = 6371;
          const dLat = toRad(city.lat - origin.lat);
          const dLon = toRad(city.lon - origin.lon);
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(origin.lat)) *
              Math.cos(toRad(city.lat)) *
              Math.sin(dLon / 2) *
              Math.sin(dLon / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          distFromOrigin = Math.round(R * c);
        }
        const distLabel = distFromOrigin > 0 ? `航程 ${distFromOrigin.toLocaleString()} KM` : '起航始发港';

        const coverHtml = city.cover
          ? `<div class="w-full h-20 rounded-xl overflow-hidden mb-2 bg-slate-100 dark:bg-neutral-800">
               <img src="${city.cover}" alt="${city.city}" class="w-full h-full object-cover group-hover/marker:scale-105 transition-transform duration-300" />
             </div>`
          : '';

        el.innerHTML = `
          <div class="relative flex items-center">
            <div class="absolute -inset-2.5 rounded-full bg-emerald-400/35 animate-ping pointer-events-none"></div>
            <div class="relative w-4 h-4 rounded-full bg-emerald-400 border-2 border-white dark:border-black shadow-[0_0_14px_#10b981] group-hover/marker:scale-125 transition-transform duration-200"></div>
            <div class="ml-2.5 px-2.5 py-1 rounded-xl bg-white/95 dark:bg-[#06080e]/95 text-slate-900 dark:text-white border border-slate-200/90 dark:border-emerald-500/40 backdrop-blur-md shadow-xl text-[11px] font-mono flex items-center gap-1.5 whitespace-nowrap transform group-hover/marker:translate-x-1 transition-transform duration-200">
              <span class="font-bold text-emerald-600 dark:text-emerald-400">${city.city}</span>
              <span class="text-[9px] text-slate-500 dark:text-white/60 bg-slate-100 dark:bg-white/10 px-1 py-0.5 rounded font-mono">${iata}</span>
            </div>

            <!-- 悬停高定名片 -->
            <div class="absolute left-0 bottom-full mb-3 w-68 p-3 rounded-2xl bg-white/95 dark:bg-[#080c14]/95 border border-slate-200/90 dark:border-emerald-500/40 backdrop-blur-2xl shadow-2xl text-slate-900 dark:text-white pointer-events-none opacity-0 group-hover/marker:opacity-100 transform translate-y-2 group-hover/marker:translate-y-0 transition-all duration-300 z-50">
              ${coverHtml}
              <div class="flex items-center justify-between gap-1 mb-1">
                <div class="flex items-center gap-1.5 min-w-0">
                  <span class="text-xs font-bold text-slate-900 dark:text-white truncate">${city.city}</span>
                  <span class="text-[10px] text-slate-500 dark:text-white/60 font-mono truncate">(${enName})</span>
                  <span class="text-[9px] font-mono px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold shrink-0">${iata}</span>
                </div>
                <span class="text-[9px] font-mono text-slate-500 dark:text-white/60 shrink-0 font-medium">${year} · ${city.country}</span>
              </div>
              <div class="text-[11px] font-medium text-slate-700 dark:text-white/80 line-clamp-1 mb-1.5">
                ${city.title}
              </div>
              <div class="pt-1.5 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-[9px] font-mono text-emerald-600 dark:text-emerald-400">
                <span class="font-bold flex items-center gap-1">✨ ${distLabel}</span>
                <span class="font-bold flex items-center gap-0.5">点击登机 ➔</span>
              </div>
            </div>
          </div>
        `;

        el.addEventListener('click', (ev) => {
          ev.stopPropagation();
          onSelectCity(city);
        });

        const marker = new maplibregl.Marker({
          element: el,
          anchor: 'left',
        })
          .setLngLat([city.lon, city.lat])
          .addTo(map);

        cityMarkersRef.current.push(marker);
      });
    },
    [citiesData, onSelectCity]
  );

  // 7. 初始化巡航客机标记
  const initAirplaneMarker = useCallback((map: maplibregl.Map) => {
    if (airplaneMarkerRef.current) {
      airplaneMarkerRef.current.remove();
    }

    const planeEl = document.createElement('div');
    planeEl.className = 'relative w-12 h-12 flex items-center justify-center cursor-pointer pointer-events-auto';
    planeEl.innerHTML = `
      <div class="jet-rotator relative w-full h-full flex items-center justify-center pointer-events-none transition-transform duration-75">
        <!-- 平流层双发微光尾迹云 (Stratospheric Contrails) -->
        <div class="absolute top-[26px] left-[15px] w-[3px] h-12 bg-gradient-to-b from-cyan-300/80 via-cyan-400/30 to-transparent blur-[1px] rounded-full origin-top"></div>
        <div class="absolute top-[26px] right-[15px] w-[3px] h-12 bg-gradient-to-b from-cyan-300/80 via-cyan-400/30 to-transparent blur-[1px] rounded-full origin-top"></div>
        <!-- 引擎高温微光喷口 -->
        <div class="absolute top-[25px] left-[15px] w-1 h-1.5 bg-white rounded-full shadow-[0_0_8px_#38bdf8]"></div>
        <div class="absolute top-[25px] right-[15px] w-1 h-1.5 bg-white rounded-full shadow-[0_0_8px_#38bdf8]"></div>
        <!-- 巡航客机 -->
        <svg class="w-8 h-8 text-white filter drop-shadow-[0_0_12px_rgba(56,189,248,0.9)]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
        </svg>
      </div>
    `;

    const initialCoord: [number, number] =
      flightLegs.length > 0
        ? [flightLegs[0].fromCity.lon, flightLegs[0].fromCity.lat]
        : [106.55, 29.56];

    const marker = new maplibregl.Marker({
      element: planeEl,
      rotationAlignment: 'map',
      pitchAlignment: 'map',
    })
      .setLngLat(initialCoord)
      .addTo(map);

    airplaneMarkerRef.current = marker;
  }, [flightLegs]);

  // 8. 巡航客机大圆沿线飞行仿真
  useEffect(() => {
    if (flightLegs.length === 0) return;
    const leg = flightLegs[activeLegIndex];
    if (!leg) return;

    currentArcPointsRef.current = getGreatCircleInterpolation(
      [leg.fromCity.lon, leg.fromCity.lat],
      [leg.toCity.lon, leg.toCity.lat],
      120
    );

    let lastTime = performance.now();
    const updateFlightAnimation = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      if (!isUserScrubbingRef.current) {
        // 巡航平滑推演 (约 22 秒飞越一条航段)
        flightProgressRef.current += dt * 0.045;
        if (flightProgressRef.current > 1.0) {
          flightProgressRef.current = 0;
        }
        onProgressChange(Math.round(flightProgressRef.current * 100));
      }

      const points = currentArcPointsRef.current;
      if (points.length > 1 && airplaneMarkerRef.current) {
        const floatIdx = flightProgressRef.current * (points.length - 1);
        const idx = Math.floor(floatIdx);
        const nextIdx = Math.min(points.length - 1, idx + 1);
        const t = floatIdx - idx;

        const p1 = points[idx];
        const p2 = points[nextIdx];

        const curLng = p1[0] + (p2[0] - p1[0]) * t;
        const curLat = p1[1] + (p2[1] - p1[1]) * t;

        airplaneMarkerRef.current.setLngLat([curLng, curLat]);

        const heading = calculateHeadingBearing(p1, p2);
        const rotatorEl = airplaneMarkerRef.current.getElement().querySelector('.jet-rotator') as HTMLElement;
        if (rotatorEl) {
          rotatorEl.style.transform = `rotate(${heading}deg)`;
        }
      }

      animFrameIdRef.current = requestAnimationFrame(updateFlightAnimation);
    };

    animFrameIdRef.current = requestAnimationFrame(updateFlightAnimation);

    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [flightLegs, activeLegIndex, onProgressChange]);

  // 9. 城市 3D 优雅环绕运镜控制器
  const stopOrbit = useCallback(() => {
    if (orbitFrameIdRef.current) {
      cancelAnimationFrame(orbitFrameIdRef.current);
      orbitFrameIdRef.current = null;
    }
    isOrbitingRef.current = false;
    onOrbitStateChange?.(false);
  }, [onOrbitStateChange]);

  const startOrbit = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    if (map.getPitch() < 30) {
      map.easeTo({ pitch: 52, duration: 800 });
    }

    isOrbitingRef.current = true;
    onOrbitStateChange?.(true);

    const orbitLoop = () => {
      if (!isOrbitingRef.current) return;
      const currentBearing = map.getBearing();
      map.setBearing((currentBearing + 0.18) % 360);
      orbitFrameIdRef.current = requestAnimationFrame(orbitLoop);
    };

    orbitFrameIdRef.current = requestAnimationFrame(orbitLoop);
  }, [onOrbitStateChange]);

  const toggleOrbit = useCallback(() => {
    if (isOrbitingRef.current) {
      stopOrbit();
    } else {
      startOrbit();
    }
  }, [startOrbit, stopOrbit]);

  // 10. 响应外部控制句柄注册
  useEffect(() => {
    if (!onRegisterControls) return;

    onRegisterControls({
      flyToCity: (city: CityFootprint) => {
        const map = mapRef.current;
        if (!map) return;
        stopOrbit();
        drawCityBoundary(city);
        const boundaryData = getCityBoundaryData(city.city, city.lat, city.lon);

        // 视口黄金分割留白：右侧留出登机牌坞，左侧留出航站索引面板
        const isDesktop = typeof window !== 'undefined' && window.innerWidth > 960;
        map.flyTo({
          center: [city.lon, city.lat],
          zoom: boundaryData.optimalZoom,
          pitch: 42,
          bearing: 15,
          padding: {
            top: 60,
            bottom: 60,
            left: isDesktop ? 320 : 20,
            right: isDesktop ? 460 : 20,
          },
          duration: 2200,
          essential: true,
        });
      },
      changeLeg: (idx: number) => {
        if (idx < 0 || idx >= flightLegs.length) return;
        stopOrbit();
        onLegChange(idx);
        flightProgressRef.current = 0;
        const leg = flightLegs[idx];
        const map = mapRef.current;
        if (map && leg) {
          map.flyTo({
            center: [leg.fromCity.lon, leg.fromCity.lat],
            zoom: 4.8,
            pitch: 42,
            bearing: 0,
            duration: 2000,
            essential: true,
          });
        }
      },
      setScrubProgress: (p: number) => {
        isUserScrubbingRef.current = true;
        flightProgressRef.current = Math.max(0, Math.min(1, p));
        onProgressChange(Math.round(p * 100));

        setTimeout(() => {
          isUserScrubbingRef.current = false;
        }, 300);
      },
      zoomIn: () => {
        const map = mapRef.current;
        if (map) map.zoomIn({ duration: 300 });
      },
      zoomOut: () => {
        const map = mapRef.current;
        if (map) map.zoomOut({ duration: 300 });
      },
      resetNorth: () => {
        const map = mapRef.current;
        if (map) {
          stopOrbit();
          map.resetNorthPitch({ duration: 1000 });
        }
      },
      toggle3DTilt: () => {
        const map = mapRef.current;
        if (map) {
          const currentPitch = map.getPitch();
          map.easeTo({
            pitch: currentPitch > 20 ? 0 : 58,
            duration: 1000,
          });
        }
      },
      toggleOrbit: () => {
        toggleOrbit();
      },
      toggleOverviewCloseUp: () => {
        const map = mapRef.current;
        if (!map) return;
        stopOrbit();
        clearCityBoundary();
        const currentZoom = map.getZoom();
        const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
        const isTablet = typeof window !== 'undefined' && window.innerWidth < 1024;

        if (currentZoom >= 1.7) {
          // 当前为空间站近地特写 -> 切换到深空宏观全景 (对标图 1, Zoom 1.25)
          map.flyTo({
            center: [108.0, 32.0],
            zoom: isMobile ? 1.05 : 1.25,
            pitch: 30,
            bearing: 0,
            duration: 2200,
            essential: true,
          });
        } else {
          // 当前为深空宏观全景 -> 切换到近地空间站特写 (对标图 2, Zoom 2.40)
          const targetZoom = isMobile ? 1.85 : isTablet ? 2.10 : 2.40;
          map.flyTo({
            center: [109.5, 31.0],
            zoom: targetZoom,
            pitch: 38,
            bearing: 0,
            duration: 2400,
            essential: true,
          });
        }
      },
    });
  }, [
    onRegisterControls,
    flightLegs,
    onLegChange,
    onProgressChange,
    toggleOrbit,
    stopOrbit,
    drawCityBoundary,
    clearCityBoundary,
  ]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-transparent">
      <div ref={containerRef} className="w-full h-full outline-none bg-transparent" />
    </div>
  );
}
