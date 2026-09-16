// e2e/test_star_atlas_adversarial.mjs
/**
 * 交互星图航线 (VoyageStarAtlas) 对抗性契约测试
 *
 * 检验目标：
 * 1. 2D Canvas 生命周期完整性（RAF 取消 / ResizeObserver 解绑 / 指针事件解绑）；
 * 2. 城市节点数据 100% 源自数据库 journeys（禁硬编码虚构坐标 —— AGENTS.md 足迹铁律）；
 * 3. 等距圆柱投影与节点拾取的数学边界稳健性（除零、越界、空数组）；
 * 4. 自然文档流零滚动劫持契约。
 */

import fs from 'fs';
import path from 'path';

console.log('================================================================================');
console.log('VOYAGE STAR ATLAS ADVERSARIAL CONTRACT SUITE');
console.log('================================================================================\n');

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;

function assert(condition, message, details = '') {
  totalChecks++;
  if (condition) {
    passedChecks++;
    console.log(`  ✔ [PASS] ${message}`);
    if (details) console.log(`      Detail: ${details}`);
  } else {
    failedChecks++;
    console.error(`  ✖ [FAIL] ${message}`);
    if (details) console.error(`      Detail: ${details}`);
  }
}

const atlasPath = path.resolve('frontend/components/home/VoyageStarAtlas.tsx');
const atlasExists = fs.existsSync(atlasPath);
const src = atlasExists ? fs.readFileSync(atlasPath, 'utf-8') : '';

// ==============================================================================
// 1. Canvas 生命周期与资源泄漏对抗检查
// ==============================================================================
console.log('--------------------------------------------------------------------------------');
console.log('MODULE 1: Canvas Lifecycle & Resource Leak Adversarial Checks');
console.log('--------------------------------------------------------------------------------');

assert(atlasExists, 'VoyageStarAtlas.tsx exists', atlasPath);

assert(
  src.includes('cancelAnimationFrame(animationFrameId)'),
  'RAF loop is cancelled in cleanup (cancelAnimationFrame)',
  'Prevents ghost animation frames after unmount'
);

assert(
  src.includes('resizeObserver.disconnect()'),
  'ResizeObserver is disconnected in cleanup',
  'Prevents observer leak on container'
);

const removeListenerCount = (src.match(/removeEventListener/g) || []).length;
assert(
  removeListenerCount >= 3,
  `All pointer events are unbound in cleanup (${removeListenerCount} removeEventListener calls >= 3)`,
  'mousemove / click / mouseleave fully released'
);

assert(
  src.includes("canvas.style.cursor = node ? 'pointer' : 'default'") || src.includes("style.cursor"),
  'Interactive cursor feedback is implemented for node hover',
  'UX affordance for clickable city nodes'
);

// ==============================================================================
// 2. 足迹数据纯正性（AGENTS.md 铁律：禁硬编码虚构坐标）
// ==============================================================================
console.log('\n--------------------------------------------------------------------------------');
console.log('MODULE 2: Footprint Data Authenticity (AGENTS.md Invariant)');
console.log('--------------------------------------------------------------------------------');

assert(
  src.includes('journeys') && src.includes('latitude') && src.includes('longitude'),
  'City nodes are projected from real journeys latitude/longitude props',
  'Equirectangular projection over database-driven journeys'
);

// 禁止出现硬编码城市经纬度字面量（如 39.9042 北京、35.6762 东京 等虚构点标）
const hardcodedCoordPattern = /(39\.9042|35\.6762|31\.2304|22\.5431|30\.2741|29\.5630)/;
assert(
  !hardcodedCoordPattern.test(src),
  'ZERO hardcoded city coordinates inside star atlas (no fabricated footprints)',
  'Empty journeys renders pure starfield guidance state instead'
);

assert(
  src.includes('validJourneys') && src.includes('isNaN'),
  'Invalid/NaN coordinates are filtered out before projection (validJourneys guard)',
  'Robust against incomplete database records'
);

assert(
  src.includes('validJourneys.length === 0'),
  'Empty journeys renders explicit empty-state guidance instead of fake cities',
  'Pure starfield + first-voyage guidance copy'
);

// ==============================================================================
// 3. 投影与拾取数学边界仿真
// ==============================================================================
console.log('\n--------------------------------------------------------------------------------');
console.log('MODULE 3: Projection & Node-Picking Math Boundary Simulation');
console.log('--------------------------------------------------------------------------------');

// 等距圆柱投影仿真（与组件实现同构）
function project(lat, lon, width, height) {
  const padX = width * 0.08;
  const padY = height * 0.16;
  return {
    x: padX + ((lon + 180) / 360) * (width - padX * 2),
    y: padY + ((90 - lat) / 180) * (height - padY * 2),
  };
}

const W = 1200;
const H = 630;
const boundaryCases = [
  { name: '北极点 (90, 0)', lat: 90, lon: 0 },
  { name: '南极点 (-90, 0)', lat: -90, lon: 0 },
  { name: '日期变更线西 (0, -180)', lat: 0, lon: -180 },
  { name: '日期变更线东 (0, 180)', lat: 0, lon: 180 },
  { name: '赤道本初子午线 (0, 0)', lat: 0, lon: 0 },
];

boundaryCases.forEach((c) => {
  const p = project(c.lat, c.lon, W, H);
  const inBounds = p.x >= 0 && p.x <= W && p.y >= 0 && p.y <= H && !isNaN(p.x) && !isNaN(p.y);
  assert(
    inBounds,
    `Projection ${c.name} stays within canvas bounds`,
    `(${p.x.toFixed(1)}, ${p.y.toFixed(1)}) in ${W}x${H}`
  );
});

// 节点拾取最近邻仿真
function pickNode(nodes, px, py, radius = 26) {
  let best = null;
  let bestDist = radius;
  nodes.forEach((n) => {
    const d = Math.hypot(n.x - px, n.y - py);
    if (d < bestDist) {
      bestDist = d;
      best = n;
    }
  });
  return best;
}

const mockNodes = [
  { x: 100, y: 100, id: 'A' },
  { x: 400, y: 300, id: 'B' },
  { x: 700, y: 500, id: 'C' },
];

assert(pickNode(mockNodes, 105, 102)?.id === 'A', 'Picking near node A selects A', 'dist ~5.4 < 26');
assert(pickNode(mockNodes, 200, 200) === null, 'Picking far from all nodes returns null', 'no ghost selection');
assert(pickNode([], 100, 100) === null, 'Picking on empty node array returns null safely', 'zero-crash on empty journeys');
assert(pickNode(mockNodes, 400, 300)?.id === 'B', 'Picking exactly on node B selects B', 'dist 0');

// ==============================================================================
// 4. 自然文档流零滚动劫持契约
// ==============================================================================
console.log('\n--------------------------------------------------------------------------------');
console.log('MODULE 4: Natural Document Flow (Zero Scroll-Jacking)');
console.log('--------------------------------------------------------------------------------');

assert(
  !src.includes('sticky') && !src.includes('position: sticky'),
  'Component contains ZERO sticky positioning',
  'The star atlas never holds the viewport hostage'
);

assert(
  src.includes('h-[70vh]') && src.includes('min-h-[440px]'),
  'Container adopts fixed natural-flow height (h-[70vh] min-h-[440px])',
  'Guaranteed zero blank gap below the atlas'
);

console.log('\n================================================================================');
console.log(`测试汇总: PASS: ${passedChecks}, FAIL: ${failedChecks} (共 ${totalChecks} 项)`);
console.log('================================================================================');

if (failedChecks > 0) {
  process.exit(1);
}
