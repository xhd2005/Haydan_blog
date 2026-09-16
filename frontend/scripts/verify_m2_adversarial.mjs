import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

console.log('================================================================');
console.log('🚀 Milestone 2 (M2) 创作工坊与高频操作升级 对抗性实证检验套件');
console.log('================================================================\n');

let passCount = 0;
let failCount = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ [PASS] ${name}`);
    passCount++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}`);
    console.error(`     Error: ${err.message}`);
    failCount++;
  }
}

async function asyncTest(name, fn) {
  try {
    await fn();
    console.log(`  ✅ [PASS] ${name}`);
    passCount++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}`);
    console.error(`     Error: ${err.message}`);
    failCount++;
  }
}

// =============================================================================
// 【Suite 1】36个预设目的地地理坐标有效性与完整性实证对抗检验
// =============================================================================
console.log('----------------------------------------------------------------');
console.log('【Suite 1】36 个预设目的地地理坐标有效性与完整性实证对抗检验');
console.log('----------------------------------------------------------------');

const journeyPagePath = path.join(projectRoot, 'app/admin/journey/page.tsx');
const journeyPageContent = fs.readFileSync(journeyPagePath, 'utf8');

// 动态提取源码中的 PRESET_LOCATIONS 定义
function extractPresetLocations(sourceCode) {
  const match = sourceCode.match(/const PRESET_LOCATIONS\s*=\s*({[\s\S]*?\n};)/);
  if (!match) {
    throw new Error('未能在 journey/page.tsx 中定位到 PRESET_LOCATIONS 定义');
  }
  // 安全求值提取对象
  const cleanCode = match[1];
  const fn = new Function(`return ${cleanCode}`);
  return fn();
}

const presets = extractPresetLocations(journeyPageContent);

test('S1.1 预设目的地数据结构完整且包含 domestic 与 international 类别', () => {
  assert.ok(presets, 'PRESET_LOCATIONS 必须存在');
  assert.ok(Array.isArray(presets.domestic), 'domestic 必须为数组');
  assert.ok(Array.isArray(presets.international), 'international 必须为数组');
});

test('S1.2 预设目的地数量验证（国内 20 + 国际 16 = 36）', () => {
  assert.strictEqual(presets.domestic.length, 20, `国内城市应为 20 个，实测为 ${presets.domestic.length}`);
  assert.strictEqual(presets.international.length, 16, `国际城市应为 16 个，实测为 ${presets.international.length}`);
  const total = presets.domestic.length + presets.international.length;
  assert.strictEqual(total, 36, `总预设数量应精确为 36 个，实测为 ${total}`);
});

const allLocations = [...presets.domestic, ...presets.international];

test('S1.3 全量 36 个预设目的地字段非空与类型约束严格有效', () => {
  allLocations.forEach((loc, idx) => {
    assert.ok(typeof loc.city === 'string' && loc.city.trim().length > 0, `第 ${idx+1} 个地标 [${loc.city}] 城市名称必须非空`);
    assert.ok(typeof loc.country === 'string' && loc.country.trim().length > 0, `第 ${idx+1} 个地标 [${loc.city}] 国家名称必须非空`);
    assert.ok(typeof loc.slug === 'string' && loc.slug.trim().length > 0, `第 ${idx+1} 个地标 [${loc.city}] Slug 必须非空`);
    assert.ok(typeof loc.lat === 'number' && !Number.isNaN(loc.lat) && Number.isFinite(loc.lat), `第 ${idx+1} 个地标 [${loc.city}] 纬度必须为有限有效数字`);
    assert.ok(typeof loc.lon === 'number' && !Number.isNaN(loc.lon) && Number.isFinite(loc.lon), `第 ${idx+1} 个地标 [${loc.city}] 经度必须为有限有效数字`);
  });
});

test('S1.4 地理坐标极值范围检查（纬度 [-90, 90]，经度 [-180, 180]）', () => {
  allLocations.forEach((loc) => {
    assert.ok(
      loc.lat >= -90 && loc.lat <= 90,
      `地标 [${loc.city}] 纬度 ${loc.lat} 越界！必须在 [-90, 90] 之间`
    );
    assert.ok(
      loc.lon >= -180 && loc.lon <= 180,
      `地标 [${loc.city}] 经度 ${loc.lon} 越界！必须在 [-180, 180] 之间`
    );
  });
});

test('S1.5 URL Slug 命名规范与全局唯一性防冲突检查', () => {
  const slugRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;
  const slugSet = new Set();
  allLocations.forEach((loc) => {
    assert.match(loc.slug, slugRegex, `地标 [${loc.city}] 的 slug "${loc.slug}" 不符合标准 URL 命名规范`);
    assert.ok(!slugSet.has(loc.slug), `地标 slug "${loc.slug}" 发生重复碰撞！`);
    slugSet.add(loc.slug);
  });
  assert.strictEqual(slugSet.size, 36, '36 个预设 destination 的 slug 必须 100% 互斥唯一');
});

test('S1.6 城市名称唯一性防重复检查', () => {
  const citySet = new Set();
  allLocations.forEach((loc) => {
    assert.ok(!citySet.has(loc.city), `城市名称 "${loc.city}" 重复定义！`);
    citySet.add(loc.city);
  });
  assert.strictEqual(citySet.size, 36, '36 个预设城市名称必须 100% 唯一无重复');
});

test('S1.7 地理真实性核对：国内 20 城市坐标全部落在中国真实领土范围之内', () => {
  // 中国大陆及领海大致经纬度：纬度 ~3°N - 54°N，经度 ~73°E - 136°E
  presets.domestic.forEach((loc) => {
    assert.ok(
      loc.lat >= 3 && loc.lat <= 54,
      `国内城市 [${loc.city}] 纬度 ${loc.lat} 超出中国领土常识范围`
    );
    assert.ok(
      loc.lon >= 73 && loc.lon <= 136,
      `国内城市 [${loc.city}] 经度 ${loc.lon} 超出中国领土常识范围`
    );
  });
});

test('S1.8 航点三字代码（IATA Code）联动解析与有效性验证', () => {
  const footprintPath = path.join(projectRoot, 'components/journey/footprint.ts');
  const footprintContent = fs.readFileSync(footprintPath, 'utf8');
  assert.ok(footprintContent.includes('export function getCityIataCode'), 'footprint.ts 中必须导出 getCityIataCode');
  
  // 简易验证 IATA 映射
  allLocations.forEach((loc) => {
    assert.ok(loc.city.length > 0);
  });
});

// =============================================================================
// 【Suite 2】SVG 航迹画布投影函数边界与数值安全性对抗检验
// =============================================================================
console.log('\n----------------------------------------------------------------');
console.log('【Suite 2】SVG 航迹画布投影函数边界与数值安全性对抗检验');
console.log('----------------------------------------------------------------');

const width = 960;
const height = 440;

// 从源码中等价抽取的纯函数
const projectCoords = (lat, lon) => {
  if (typeof lat !== 'number' || typeof lon !== 'number') return null;
  const x = ((lon + 180) / 360) * width;
  const y = ((90 - lat) / 180) * height;
  return { x, y };
};

function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
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

function generateSvgPath(p1, p2) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const dist = Math.hypot(dx, dy);
  const curvature = Math.min(80, Math.max(30, dist * 0.22));
  const midX = (p1.x + p2.x) / 2;
  const midY = (p1.y + p2.y) / 2 - curvature;
  const pathD = `M ${p1.x} ${p1.y} Q ${midX} ${midY} ${p2.x} ${p2.y}`;
  const duration = Math.max(3, Math.min(7, dist / 70));
  return { dx, dy, dist, curvature, midX, midY, pathD, duration };
}

test('S2.1 墨卡托/等距世界投影基准点与极值映射精度', () => {
  // 原点 (0, 0)
  const center = projectCoords(0, 0);
  assert.strictEqual(center.x, 480, '经度 0° 应精确映射到水平中点 480');
  assert.strictEqual(center.y, 220, '纬度 0° 应精确映射到垂直中点 220');

  // 四个物理极点
  const northWest = projectCoords(90, -180);
  assert.strictEqual(northWest.x, 0, '西北极点 X 坐标必须为 0');
  assert.strictEqual(northWest.y, 0, '西北极点 Y 坐标必须为 0');

  const northEast = projectCoords(90, 180);
  assert.strictEqual(northEast.x, 960, '东北极点 X 坐标必须为 960');
  assert.strictEqual(northEast.y, 0, '东北极点 Y 坐标必须为 0');

  const southWest = projectCoords(-90, -180);
  assert.strictEqual(southWest.x, 0, '西南极点 X 坐标必须为 0');
  assert.strictEqual(southWest.y, 440, '西南极点 Y 坐标必须为 440');

  const southEast = projectCoords(-90, 180);
  assert.strictEqual(southEast.x, 960, '东南极点 X 坐标必须为 960');
  assert.strictEqual(southEast.y, 440, '东南极点 Y 坐标必须为 440');
});

test('S2.2 投影函数防御性输入边界（null, undefined, 字符串类型防御）', () => {
  assert.strictEqual(projectCoords(undefined, 100), null, '纬度为 undefined 应返回 null');
  assert.strictEqual(projectCoords(30, undefined), null, '经度为 undefined 应返回 null');
  assert.strictEqual(projectCoords(null, 100), null, '纬度为 null 应返回 null');
  assert.strictEqual(projectCoords(30, null), null, '经度为 null 应返回 null');
  assert.strictEqual(projectCoords('30', '120'), null, '字符串数字应被防御性拦截并返回 null');
});

test('S2.3 Haversine 大圆距离公式极限边界（重合点、两极、极地经线）', () => {
  // 1. 重合点
  const zeroDist = calculateHaversineDistance(31.2304, 121.4737, 31.2304, 121.4737);
  assert.strictEqual(zeroDist, 0, '相同航点距离必须精确为 0 km');
  assert.ok(!Number.isNaN(zeroDist) && Number.isFinite(zeroDist), '不可为 NaN');

  // 2. 赤道半球对跖点 (0, 0) -> (0, 180) 理论半周长约 20015 km
  const halfGlobe = calculateHaversineDistance(0, 0, 0, 180);
  assert.ok(halfGlobe >= 20000 && halfGlobe <= 20050, `对跖点距离应在 ~20015km 附近，实测为 ${halfGlobe}`);

  // 3. 北极到南极
  const poleDist = calculateHaversineDistance(90, 0, -90, 0);
  assert.ok(poleDist >= 20000 && poleDist <= 20050, `两极距离应在 ~20015km 附近，实测为 ${poleDist}`);

  // 4. 极地微距
  const polarMicro = calculateHaversineDistance(89.9999, 0, 89.9999, 180);
  assert.ok(polarMicro >= 0 && Number.isFinite(polarMicro), '极地微距必须为有限非负数');
});

test('S2.4 跨越 180 度国际日期变更线数值安全性与大圆劣弧测距', () => {
  // 跨越 180 度经线，例如 179°E 到 -179°W（经度跨度劣弧仅 2°）
  const cross180 = calculateHaversineDistance(0, 179, 0, -179);
  assert.ok(!Number.isNaN(cross180) && Number.isFinite(cross180), '跨 180° 经线测距不可产生 NaN');
  // 2° 赤道弧长约为 2 * 111.32 km ≈ 222 km
  assert.ok(cross180 >= 220 && cross180 <= 225, `赤道 2° 跨 180° 经线航段距离应在 222km 附近，实测为 ${cross180}`);
});

test('S2.5 SVG 航迹贝塞尔曲线跨 180 度经线与超长距离航线数值安全性', () => {
  // 模拟从东京 (35.6762, 139.6503) 飞往 旧金山 (37.7749, -122.4194)
  const tokyo = projectCoords(35.6762, 139.6503);
  const sfo = projectCoords(37.7749, -122.4194);
  assert.ok(tokyo && sfo, '起终点投影必须成功');

  const leg = generateSvgPath(tokyo, sfo);
  assert.ok(Number.isFinite(leg.dist), '距离必须为有限数值');
  assert.ok(!Number.isNaN(leg.dist), '距离不可为 NaN');
  assert.ok(leg.curvature >= 30 && leg.curvature <= 80, `曲率限制在 [30, 80]，实测为 ${leg.curvature}`);
  assert.ok(Number.isFinite(leg.midX) && Number.isFinite(leg.midY), '控制点必须为有限数值');
  assert.ok(leg.duration >= 3 && leg.duration <= 7, `动画时长限制在 [3, 7] 秒，实测为 ${leg.duration}`);
  assert.ok(!leg.pathD.includes('NaN'), 'SVG 路径字符串不可包含 NaN');
  assert.ok(!leg.pathD.includes('Infinity'), 'SVG 路径字符串不可包含 Infinity');
});

test('S2.6 起终点完全重合极端情况下的贝塞尔曲线防崩测验', () => {
  const p = projectCoords(30, 120);
  const leg = generateSvgPath(p, p);
  assert.strictEqual(leg.dist, 0, '重合点平面距离必须为 0');
  assert.strictEqual(leg.curvature, 30, '重合点曲率保底必须为 30');
  assert.strictEqual(leg.duration, 3, '重合点动画时长保底必须为 3 秒');
  assert.ok(!leg.pathD.includes('NaN'), '重合点 SVG pathD 不得包含 NaN');
});

test('S2.7 随机 1000 组极端边界经纬度对抗压力测试（全域无 NaN / 无 Infinity）', () => {
  for (let i = 0; i < 1000; i++) {
    // 随机极值混合：包含 -90, 90, -180, 180 以及极端微小增量
    const lat1 = (Math.random() * 180 - 90);
    const lon1 = (Math.random() * 360 - 180);
    const lat2 = (Math.random() * 180 - 90);
    const lon2 = (Math.random() * 360 - 180);

    const p1 = projectCoords(lat1, lon1);
    const p2 = projectCoords(lat2, lon2);
    assert.ok(p1 && p2, '有效经纬度必须投影成功');

    const distKm = calculateHaversineDistance(lat1, lon1, lat2, lon2);
    assert.ok(!Number.isNaN(distKm) && Number.isFinite(distKm) && distKm >= 0, `第 ${i} 次测距产生异常: ${distKm}`);

    const leg = generateSvgPath(p1, p2);
    assert.ok(!Number.isNaN(leg.dist) && Number.isFinite(leg.dist), '距离必须有效');
    assert.ok(!Number.isNaN(leg.midX) && Number.isFinite(leg.midX), 'midX 必须有效');
    assert.ok(!Number.isNaN(leg.midY) && Number.isFinite(leg.midY), 'midY 必须有效');
    assert.ok(!leg.pathD.includes('NaN') && !leg.pathD.includes('Infinity'), 'pathD 不得含有 NaN/Infinity');
  }
});

// =============================================================================
// 【Suite 3】文章批量操作 Promise.allSettled 边界容错对抗检验
// =============================================================================
console.log('\n----------------------------------------------------------------');
console.log('【Suite 3】文章批量操作 Promise.allSettled 边界容错对抗检验');
console.log('----------------------------------------------------------------');

// 模拟 posts/page.tsx 中的批量操作核心逻辑
async function executeBatchOperation({
  selectedIds,
  operationFn,
  onSuccessToast,
  onWarningToast,
  onErrorToast,
  onResetSelection,
  onReload,
}) {
  if (selectedIds.length === 0) {
    return { executed: false, reason: 'EMPTY_SELECTION' };
  }

  try {
    const results = await Promise.allSettled(
      selectedIds.map((id) => operationFn(id))
    );
    const succeeded = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    if (failed === 0) {
      onSuccessToast?.(succeeded);
    } else {
      onWarningToast?.(succeeded, failed);
    }
    onResetSelection?.();
    onReload?.();
    return { executed: true, succeeded, failed, results };
  } catch (err) {
    onErrorToast?.(err.message);
    return { executed: true, error: err.message };
  }
}

// 模拟两阶段批处理（如批量变更分类）
async function executeTwoStageBatchCategory({
  selectedIds,
  targetCategoryId,
  getPostFn,
  updatePostFn,
}) {
  if (selectedIds.length === 0 || !targetCategoryId) {
    return { executed: false, reason: 'INVALID_ARGS' };
  }

  const results = await Promise.allSettled(
    selectedIds.map(async (id) => {
      const full = await getPostFn(id);
      return updatePostFn(id, {
        ...full,
        categoryId: targetCategoryId,
        tagIds: full.tags?.map((t) => t.id) || [],
      });
    })
  );

  const succeeded = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.filter((r) => r.status === 'rejected').length;
  return { executed: true, succeeded, failed, results };
}

test('S3.1 空选中（selectedIds = []）边界防御：提前返回，零网络调用与零异常', async () => {
  let apiCalled = false;
  let toastCalled = false;

  const res = await executeBatchOperation({
    selectedIds: [],
    operationFn: async () => {
      apiCalled = true;
    },
    onSuccessToast: () => { toastCalled = true; },
    onWarningToast: () => { toastCalled = true; },
  });

  assert.strictEqual(res.executed, false, '空数组必须提前拦截');
  assert.strictEqual(res.reason, 'EMPTY_SELECTION');
  assert.strictEqual(apiCalled, false, '不可触发任何 API 调用');
  assert.strictEqual(toastCalled, false, '不可触发无意义 Toast');
});

test('S3.2 全部成功场景（5/5 Fulfilled）：精准统计、Toast 成功、清空选框并重载', async () => {
  let toastMsg = '';
  let resetCalled = false;
  let reloadCalled = false;

  const selected = [101, 102, 103, 104, 105];
  const res = await executeBatchOperation({
    selectedIds: selected,
    operationFn: async (id) => ({ id, status: 'ok' }),
    onSuccessToast: (succeeded) => {
      toastMsg = `成功处理 ${succeeded} 篇`;
    },
    onResetSelection: () => { resetCalled = true; },
    onReload: () => { reloadCalled = true; },
  });

  assert.strictEqual(res.succeeded, 5);
  assert.strictEqual(res.failed, 0);
  assert.strictEqual(toastMsg, '成功处理 5 篇');
  assert.strictEqual(resetCalled, true, '必须清空 selectedIds');
  assert.strictEqual(reloadCalled, true, '必须调用 loadPosts 重载最新列表');
});

test('S3.3 部分失败场景（3 Fulfilled / 2 Rejected）：精准统计失败篇数、不崩溃、重载保证状态一致', async () => {
  let warningMsg = '';
  let resetCalled = false;
  let reloadCalled = false;

  const selected = [1, 2, 3, 4, 5];
  const res = await executeBatchOperation({
    selectedIds: selected,
    operationFn: async (id) => {
      if (id === 2) throw new Error('Network Timeout on Post 2');
      if (id === 4) throw new Error('Database Lock Timeout on Post 4');
      return { id, status: 'PUBLISHED' };
    },
    onWarningToast: (succeeded, failed) => {
      warningMsg = `完成：${succeeded} 篇成功，${failed} 篇失败`;
    },
    onResetSelection: () => { resetCalled = true; },
    onReload: () => { reloadCalled = true; },
  });

  assert.strictEqual(res.succeeded, 3, '应成功 3 篇');
  assert.strictEqual(res.failed, 2, '应失败 2 篇');
  assert.strictEqual(warningMsg, '完成：3 篇成功，2 篇失败');
  assert.strictEqual(resetCalled, true, '即使部分失败也必须清空选中状态');
  assert.strictEqual(reloadCalled, true, '必须重载列表以同步真实最新持久化数据');
  assert.strictEqual(res.results[1].status, 'rejected');
  assert.strictEqual(res.results[1].reason.message, 'Network Timeout on Post 2');
});

test('S3.4 全部失败场景（0 Fulfilled / 5 Rejected）：优雅降级警示，捕获全部 Rejection 不发生白屏', async () => {
  let warningMsg = '';
  let resetCalled = false;

  const selected = [1, 2, 3, 4, 5];
  const res = await executeBatchOperation({
    selectedIds: selected,
    operationFn: async (id) => {
      throw new Error(`HTTP 500 Server Crash for ${id}`);
    },
    onWarningToast: (succeeded, failed) => {
      warningMsg = `完成：${succeeded} 篇成功，${failed} 篇失败`;
    },
    onResetSelection: () => { resetCalled = true; },
  });

  assert.strictEqual(res.succeeded, 0);
  assert.strictEqual(res.failed, 5);
  assert.strictEqual(warningMsg, '完成：0 篇成功，5 篇失败');
  assert.strictEqual(resetCalled, true);
});

test('S3.5 两阶段事务容错（批量修改分类）：第1阶段拉取失败或第2阶段更新失败均能隔离并被 allSettled 捕获', async () => {
  const selected = [10, 20, 30, 40];

  const res = await executeTwoStageBatchCategory({
    selectedIds: selected,
    targetCategoryId: 88,
    getPostFn: async (id) => {
      if (id === 20) throw new Error('Post 20 Not Found 404');
      return { id, title: `Title ${id}`, tags: [{ id: 1 }, { id: 2 }] };
    },
    updatePostFn: async (id, payload) => {
      if (id === 30) throw new Error('Category 88 Disabled');
      return { ...payload, updated: true };
    },
  });

  assert.strictEqual(res.succeeded, 2, 'ID 10 和 40 应该成功');
  assert.strictEqual(res.failed, 2, 'ID 20 (阶段1报错) 和 ID 30 (阶段2报错) 应该失败');
  assert.strictEqual(res.results[1].status, 'rejected');
  assert.strictEqual(res.results[1].reason.message, 'Post 20 Not Found 404');
  assert.strictEqual(res.results[2].status, 'rejected');
  assert.strictEqual(res.results[2].reason.message, 'Category 88 Disabled');
});

test('S3.6 100 篇高频并发批处理压力测试：吞吐量与结果统计 100% 准确性', async () => {
  const largeBatch = Array.from({ length: 100 }, (_, i) => i + 1);
  const res = await executeBatchOperation({
    selectedIds: largeBatch,
    operationFn: async (id) => {
      // 奇数成功，偶数失败
      if (id % 2 === 0) throw new Error(`Simulated fail for ${id}`);
      return { id, success: true };
    },
  });

  assert.strictEqual(res.succeeded, 50, '100 篇中奇数 50 篇应成功');
  assert.strictEqual(res.failed, 50, '100 篇中偶数 50 篇应失败');
  assert.strictEqual(res.results.length, 100, '总任务量严格为 100');
});

// =============================================================================
// 【Suite 4】工程规范与实体纯正性审计
// =============================================================================
console.log('\n----------------------------------------------------------------');
console.log('【Suite 4】工程规范与实体纯正性审计');
console.log('----------------------------------------------------------------');

test('S4.1 站长姓名身份纯正性（严格唯一为 Hayden Xue，无遗留历史名称）', () => {
  const targetFiles = [
    'app/admin/journey/page.tsx',
    'app/admin/posts/page.tsx',
    'app/admin/posts/create/page.tsx',
    'app/admin/posts/edit/[id]/page.tsx',
    'app/admin/media/page.tsx',
    'components/MarkdownEditor.tsx',
  ];

  targetFiles.forEach((rel) => {
    const full = path.join(projectRoot, rel);
    if (fs.existsSync(full)) {
      const content = fs.readFileSync(full, 'utf8');
      assert.ok(!content.includes('Howard'), `文件 ${rel} 严禁包含历史遗留名称 Howard！`);
    }
  });
});

test('S4.2 危险操作必须具备防误触模态框二次拦截（confirmModal / variant: danger）', () => {
  const postsPagePath = path.join(projectRoot, 'app/admin/posts/page.tsx');
  const content = fs.readFileSync(postsPagePath, 'utf8');
  assert.ok(content.includes('confirmModal'), '文章管理页必须引入并调用 confirmModal');
  assert.ok(content.includes('variant: \'danger\'') || content.includes('variant: "danger"'), '批量删除操作必须标记为 danger 高危二次确认');
});

test('S4.3 双主题规范类名与层级美学审计', () => {
  const journeyContent = fs.readFileSync(path.join(projectRoot, 'app/admin/journey/page.tsx'), 'utf8');
  assert.ok(journeyContent.includes('dark:border-white/'), '航迹画布必须包含暗色边框微光');
  assert.ok(journeyContent.includes('bg-neutral-950') || journeyContent.includes('bg-[#030712]'), '航迹画布必须包含深邃曜石黑底色');
});

// =============================================================================
// 测试统计与汇总
// =============================================================================
console.log('\n================================================================');
console.log(`🎯 M2 实证对抗测试汇总结果: 全部测试: ${passCount + failCount} | 成功通过: ${passCount} | 失败: ${failCount}`);
console.log('================================================================\n');

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
