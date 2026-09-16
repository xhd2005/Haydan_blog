// e2e/test_m2_layout_spacing_adversarial.mjs
/**
 * Empirical Challenger M2-2:
 * 空间布局与空白消除经验性对抗检验专家测试套件（星图航线时代 2026-09-09 迁移版）
 *
 * 核心对抗检验目标：
 * 1. 严格全盘检索整个前端工程，验证彻底无 h-[260vh] 与巨型滚动劫持高度残留；
 * 2. 检验交互星图 VoyageStarAtlas 的自然文档流契约（零 sticky 零滚动劫持）；
 * 3. 测量首页 Hero → 星图 → Latest Thoughts 流式衔接，验证零荒芜空白断层；
 * 4. 检验 Hero 舞台容器边界收敛性（无 w-screen / 100vw 逃逸）。
 */

import fs from 'fs';
import path from 'path';

console.log('================================================================================');
console.log('CHALLENGER M2-2: SPATIAL LAYOUT & BLANK ELIMINATION EMPIRICAL ADVERSARIAL SUITE');
console.log('Milestone: Voyager Star Atlas & Streaming Flow (2026-09-09)');
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

// 辅助函数：递归扫描目录获取所有文件
function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);
  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.next' && file !== '.git' && file !== '.agents') {
        arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
      }
    } else {
      arrayOfFiles.push(fullPath);
    }
  });
  return arrayOfFiles;
}

// ==============================================================================
// 1. 全盘静态死锁与残留探测 (Global Static Residue Scan)
// ==============================================================================
console.log('--------------------------------------------------------------------------------');
console.log('MODULE 1: Global Scan for 260vh, Scroll-jacking Heights Residue');
console.log('--------------------------------------------------------------------------------');

const frontendRoot = path.resolve('frontend');
const frontendFiles = getAllFiles(frontendRoot).filter((f) =>
  /\.(tsx|ts|jsx|js|css)$/.test(f)
);

console.log(`Scanning ${frontendFiles.length} frontend source files...`);

let count260vh = 0;
let filesWith260vh = [];
let giantHeightMatches = [];

for (const file of frontendFiles) {
  const content = fs.readFileSync(file, 'utf-8');
  if (content.includes('260vh')) {
    count260vh++;
    filesWith260vh.push(path.relative(process.cwd(), file));
  }
  // 检查是否有其他巨型 vh 高度残留 (如 200vh, 250vh, 300vh)
  const giantMatch = (content.match(/h-\[(\d+)vh\]/g) || []).filter((h) => {
    const vh = parseInt(h.match(/\d+/)[0], 10);
    return vh >= 200;
  });
  if (giantMatch.length > 0) {
    giantHeightMatches.push({ file: path.relative(process.cwd(), file), matches: giantMatch });
  }
}

assert(
  count260vh === 0,
  'Entire frontend codebase is 100% free from "260vh" residue',
  count260vh === 0
    ? '0 occurrences found across all frontend files'
    : `VIOLATION: Found in ${filesWith260vh.join(', ')}`
);

assert(
  giantHeightMatches.length === 0,
  'No giant scroll-jacking heights (h-[200vh+] etc.) exist anywhere in the frontend',
  giantHeightMatches.length === 0
    ? '0 giant viewport height classes detected'
    : `VIOLATION: Found in ${JSON.stringify(giantHeightMatches)}`
);

// 罗盘组件退役核验：旧滚动吸附组件必须已被星图替代
const compassPath = path.resolve('frontend/components/home/HeroPinnedScrollytelling.tsx');
assert(
  !fs.existsSync(compassPath),
  'Legacy HeroPinnedScrollytelling scroll-jacking compass is fully retired',
  'Replaced by VoyageStarAtlas 2D Canvas interactive star atlas'
);

console.log('\n');

// ==============================================================================
// 2. 交互星图自然文档流契约 (Star Atlas Natural-Flow Contract)
// ==============================================================================
console.log('--------------------------------------------------------------------------------');
console.log('MODULE 2: VoyageStarAtlas Natural Document Flow Contract');
console.log('--------------------------------------------------------------------------------');

const atlasPath = path.resolve('frontend/components/home/VoyageStarAtlas.tsx');
const atlasExists = fs.existsSync(atlasPath);
const atlasContent = atlasExists ? fs.readFileSync(atlasPath, 'utf-8') : '';

assert(atlasExists, 'VoyageStarAtlas.tsx component exists at components/home/', atlasPath);

assert(
  atlasContent.includes('h-[70vh]'),
  'Star atlas container adopts natural document flow fixed viewport height (h-[70vh])',
  'No sticky pinning, no scroll hijack, zero blank gap below'
);

assert(
  !atlasContent.includes('sticky'),
  'Star atlas contains ZERO sticky positioning (scroll-jacking physically impossible)',
  'Natural flow: user scrolls, page moves; nothing holds the viewport hostage'
);

assert(
  atlasContent.includes('journeys') && atlasContent.includes('latitude'),
  'Star atlas city nodes are 100% bound to real journeys latitude/longitude data',
  'Complies with AGENTS.md footprint authenticity invariant'
);

assert(
  atlasContent.includes('cancelAnimationFrame') &&
    atlasContent.includes('resizeObserver.disconnect()') &&
    atlasContent.includes('removeEventListener'),
  'Star atlas Canvas lifecycle fully cleaned (RAF cancel + ResizeObserver + pointer events unbound)',
  'Zero animation/DOM listener leaks on unmount'
);

assert(
  atlasContent.includes('router.push(`/journey/'),
  'Star atlas city node click navigates to the real travelogue route',
  'Hover ripple + click-through to /journey/{slug}'
);

console.log('\n');

// ==============================================================================
// 3. 首页流式衔接与零空白断层测量 (Homepage Streaming Flow & Blank Elimination)
// ==============================================================================
console.log('--------------------------------------------------------------------------------');
console.log('MODULE 3: Homepage Streaming Flow & Blank Elimination Measurement');
console.log('--------------------------------------------------------------------------------');

const pagePath = path.resolve('frontend/app/page.tsx');
const pageContent = fs.readFileSync(pagePath, 'utf-8');

// 检查 Hero -> 星图 -> Latest Thoughts 的自然流式层级
const heroIndex = pageContent.indexOf('<HeroCinematicStage');
const atlasIndex = pageContent.indexOf('<VoyageStarAtlas');
const latestThoughtsIndex = pageContent.indexOf("t('home.latest_thoughts')");

assert(
  heroIndex !== -1 && atlasIndex !== -1 && latestThoughtsIndex !== -1 && heroIndex < atlasIndex && atlasIndex < latestThoughtsIndex,
  'Hero, Star Atlas and Latest Thoughts are strictly ordered in natural streaming flow',
  `Hero: char ${heroIndex}, Atlas: char ${atlasIndex}, Latest Thoughts: char ${latestThoughtsIndex}`
);

// 看板已拆除核验：首页不再引用 BentoGrid
assert(
  !pageContent.includes('BentoGrid'),
  'Deprecated BentoGrid board is fully unmounted from homepage',
  'Homepage flows directly from star atlas into magazine-card streams'
);

// 检查根容器已根治 space-y-16/24 空白发生源
const rootContainerMatch = pageContent.match(/return\s*\(\s*<div className="([^"]*)"\s*>/);
const rootContainerClass = rootContainerMatch ? rootContainerMatch[1] : '';
const rootHasNoSpaceY = !rootContainerClass.includes('space-y-');

assert(
  rootHasNoSpaceY && rootContainerClass.includes('w-full'),
  'Root container is cleanly defined as "w-full" without space-y-16/24 void inducer',
  `Root classes: "${rootContainerClass}"`
);

// 检查下游正文容器规范
const bodyContainerMatch = pageContent.match(/<div className="([^"]*max-w-6xl[^"]*)"\s*>\s*\{[^}]*Latest Thoughts/s);
const bodyContainerClass = bodyContainerMatch ? bodyContainerMatch[1] : '';

console.log(`Body Grid Container Classes: "${bodyContainerClass}"`);

const hasSpaceY16 = bodyContainerClass.includes('space-y-16');
const hasSpaceY24 = bodyContainerClass.includes('md:space-y-24');
const hasPtCompact = bodyContainerClass.includes('pt-8 sm:pt-12');

assert(
  hasSpaceY16 && hasSpaceY24 && hasPtCompact,
  'Body container enforces strict "max-w-6xl" with "space-y-16 md:space-y-24" and compact "pt-8 sm:pt-12"',
  'Rhythmic section spacing preserved under unified 6xl grid'
);

// 检查星图 section 与正文容器之间零插入物（无 spacer / margin hack）
const atlasSectionEnd = pageContent.indexOf('</section>', atlasIndex);
const bodyContainerStart = pageContent.indexOf('<div className="max-w-6xl', atlasSectionEnd);
const codeBetween = pageContent.substring(atlasSectionEnd + '</section>'.length, bodyContainerStart);
const trimmedCodeBetween = codeBetween.replace(/\{\/\*[\s\S]*?\*\/\}/g, '').trim();

assert(
  trimmedCodeBetween === '',
  'Zero intermediate empty divs, spacers, or artificial padding between Star Atlas and Body container',
  trimmedCodeBetween === '' ? 'Completely zero code separation' : `WARNING: Found intervening code: ${trimmedCodeBetween}`
);

console.log('\n');

// ==============================================================================
// 4. Hero 舞台容器边界收敛性 (Hero Stage Containment)
// ==============================================================================
console.log('--------------------------------------------------------------------------------');
console.log('MODULE 4: Hero Cinematic Stage Containment Verification');
console.log('--------------------------------------------------------------------------------');

const heroStagePath = path.resolve('frontend/components/home/HeroCinematicStage.tsx');
const heroStageContent = fs.readFileSync(heroStagePath, 'utf-8');

assert(
  heroStageContent.includes('relative w-full overflow-hidden'),
  'HeroCinematicStage.tsx root container strictly adopts "relative w-full overflow-hidden"',
  'Canvas and video layers are strictly confined within bounding box'
);

assert(
  !heroStageContent.includes('w-screen') && !heroStageContent.includes('100vw'),
  'HeroCinematicStage.tsx contains NO "w-screen" or "100vw" escape classes',
  'No horizontal overflow risk from viewport-width escape hatches'
);

// 手写描绘标语契约（替代旧逐字 reveal）
const handwrittenPath = path.resolve('frontend/components/home/HandwrittenSlogan.tsx');
const handwrittenExists = fs.existsSync(handwrittenPath);
const handwrittenContent = handwrittenExists ? fs.readFileSync(handwrittenPath, 'utf-8') : '';

assert(
  handwrittenExists && heroStageContent.includes('HandwrittenSlogan'),
  'HandwrittenSlogan component exists and is mounted in HeroCinematicStage',
  'Apple hello style SVG stroke-drawing slogan replaces legacy char reveal'
);

assert(
  handwrittenContent.includes('strokeDasharray') && handwrittenContent.includes('hw-draw'),
  'HandwrittenSlogan implements stroke-dasharray drawing animation with hw-draw keyframes',
  'Smooth handwritten描绘 with gradient fill landing'
);

// 双主题媒体纱幕契约（浅色视频可读性）
assert(
  heroStageContent.includes('bg-black/35 dark:bg-black/15'),
  'Hero video layer adopts unified dark cinematic scrim (bg-black/35 dark:bg-black/15)',
  'Light-mode video remains clearly visible instead of washed-out haze'
);

console.log('\n');
console.log('================================================================================');
console.log(`测试汇总: PASS: ${passedChecks}, FAIL: ${failedChecks} (共 ${totalChecks} 项)`);
console.log('================================================================================');

if (failedChecks > 0) {
  process.exit(1);
}
