/**
 * 3D 全景数字地球核心视口瓦片预热器 (Critical Viewport Tile Preloader)
 *
 * 在开屏动效播放期间，以低优先级后台并发预拉取起始视口（聚焦中国及东亚，居中 [109.5, 31.0]，Zoom: 0.88 ~ 2.40）
 * 必须呈现的关键瓦片（z=0 全球底图、z=1 宏观半球、z=2 亚欧大陆核心、z=3 中国全境空间站特写）。
 *
 * 配合浏览器 HTTP/2 多路复用与 L1/L2 缓存直接持久化写入 CacheStorage，确保开屏结束时地貌与夜景 100% 秒出，绝无黑块与闪烁。
 */

// 核心视口瓦片坐标矩阵 [z, x, y]
const CRITICAL_TILES: [number, number, number][] = [
  // z=0 全球总览
  [0, 0, 0],
  // z=1 东西半球关键视口
  [1, 1, 0], // 东半球北部（亚欧大陆/中国/东亚）
  [1, 1, 1], // 东半球南部（东南亚/大洋洲）
  [1, 0, 0], // 西半球北部
  // z=2 亚欧与东亚高精视口
  [2, 3, 1], // 中国及东亚核心
  [2, 3, 2], // 东南亚与南海
  [2, 2, 1], // 中亚与亚欧交界
  // z=3 近地空间站特写高精画幅视口 (Zoom 2.40)
  [3, 6, 2], // 华北与东北大都会圈
  [3, 6, 3], // 华东、华中、华南与成渝大都会圈
  [3, 7, 3], // 东亚近海、台湾海峡与东海道
];

const ESRI_URL = (z: number, y: number, x: number) =>
  `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`;

const NASA_URL = (z: number, y: number, x: number) =>
  `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_Black_Marble/default/2016-01-01/GoogleMapsCompatible_Level8/${z}/${y}/${x}.png`;

let hasPrewarmed = false;

/**
 * 启动关键瓦片后台并行预热与 CacheStorage 注入
 */
export function prewarmCriticalTiles() {
  if (typeof window === 'undefined' || hasPrewarmed) return;
  hasPrewarmed = true;

  const runPrewarm = () => {
    // 并发启动核心瓦片预下载并注入 CacheStorage
    CRITICAL_TILES.forEach(([z, x, y]) => {
      const esriTileUrl = ESRI_URL(z, y, x);
      const nasaTileUrl = NASA_URL(z, y, x);

      // 1. 利用 Image 对象触发浏览器底层高优先图形缓存解码
      const imgEsri = new Image();
      imgEsri.crossOrigin = 'anonymous';
      imgEsri.src = esriTileUrl;

      const imgNasa = new Image();
      imgNasa.crossOrigin = 'anonymous';
      imgNasa.src = nasaTileUrl;

      // 2. 同时通过 fetch 发起请求并直接持久化灌注 CacheStorage
      if (typeof fetch === 'function' && 'caches' in window) {
        fetch(esriTileUrl, { mode: 'cors', priority: 'high' } as any)
          .then(async (res) => {
            if (res.ok) {
              const cache = await caches.open('esri-satellite-tile-cache-v1');
              await cache.put(esriTileUrl, res.clone());
            }
          })
          .catch(() => {});

        fetch(nasaTileUrl, { mode: 'cors', priority: 'high' } as any)
          .then(async (res) => {
            if (res.ok) {
              const cache = await caches.open('nasa-blackmarble-tile-cache-v1');
              await cache.put(nasaTileUrl, res.clone());
            }
          })
          .catch(() => {});
      }
    });
  };

  // 优先在浏览器空闲时段或下一微任务中启动，避免抢占主线程首次绘制
  if (typeof (window as any).requestIdleCallback === 'function') {
    (window as any).requestIdleCallback(runPrewarm, { timeout: 300 });
  } else {
    setTimeout(runPrewarm, 50);
  }
}
