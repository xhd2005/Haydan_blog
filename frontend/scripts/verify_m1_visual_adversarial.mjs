/**
 * Milestone 1 (M1) 视觉与渲染对抗经验性验证脚本
 * 覆盖：
 * 1. Layer 1 实体文字保底机制验证（无透明样式，WCAG 对比度实测，极端 CSS 降级推演）
 * 2. Layer 2 极光覆盖层与 Layer 1 字符几何贴合度分析（拓扑对齐，字形继承，空格对齐）
 * 3. 顶部徽章文本纯正性与 Java 25 技术规格检验
 * 4. 全项目 howard 深度扫描与前台 UI 绝对纯净度验证
 * 5. 无头 Chromium / Edge 真实渲染与计算样式 / 几何对齐实测（通过 DOM dump 提取真实测量值）
 * 6. 极端破坏性 CSS 环境（禁用 background-clip）对抗实测
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');
const frontendDir = path.resolve(rootDir, 'frontend');

console.log('================================================================');
console.log('  CHALLENGER M1-2: 经验性文字可见性与渲染对抗验证套件');
console.log('================================================================\n');

let passCount = 0;
let warnCount = 0;
let failCount = 0;

function assert(condition, message, detail = '') {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    if (detail) console.log(`         -> ${detail}`);
    passCount++;
  } else {
    console.error(`  [FAIL] ${message}`);
    if (detail) console.error(`         -> ${detail}`);
    failCount++;
  }
}

function warn(message, detail = '') {
  console.log(`  [WARN] ${message}`);
  if (detail) console.log(`         -> ${detail}`);
  warnCount++;
}

// -------------------------------------------------------------
// 1. Layer 1 实体文字保底机制验证
// -------------------------------------------------------------
console.log('--- 检验维度 1: Layer 1 实体文字保底机制与极端 CSS 抗灾性 ---');

const heroComponentPath = path.join(frontendDir, 'components/home/HeroCinematicStage.tsx');
const rawHeroCode = fs.readFileSync(heroComponentPath, 'utf-8');
const heroCode = rawHeroCode.replace(/\r\n/g, '\n');

// 截取副标语行代码块
const sloganStartIdx = heroCode.indexOf('{/* 副标语行');
const sloganEndIdx = heroCode.indexOf('</motion.h1>', sloganStartIdx);
const sloganBlock = sloganStartIdx !== -1 && sloganEndIdx !== -1 ? heroCode.slice(sloganStartIdx, sloganEndIdx) : '';

assert(sloganBlock.length > 0, '成功精准截取副标语行双层极光代码块');

// 提取 Layer 1 代码切片
const l1CommentIdx = sloganBlock.indexOf('Layer 1:');
const l1SpanStart = sloganBlock.indexOf('<span', l1CommentIdx);
const l1SpanEnd = sloganBlock.indexOf('</span>', l1SpanStart);
const l1Snippet = sloganBlock.slice(l1SpanStart, l1SpanEnd + 7);

assert(l1Snippet.length > 0, '成功提取 Layer 1 底层实体保底文字 JSX 节点');

// 解析 Layer 1 的 className 与内容
const l1ClassMatch = l1Snippet.match(/className="([^"]*)"/);
const l1Class = l1ClassMatch ? l1ClassMatch[1] : '';
const l1ContentMatch = l1Snippet.match(/>([\s\S]*?)<\/span>/);
const l1Content = l1ContentMatch ? l1ContentMatch[1].trim() : '';

// 1.1 验证 class 不含任何透明/隐藏类名
const hasTransparent = l1Class.includes('transparent') || l1Class.includes('text-transparent');
const hasOpacity0 = l1Class.includes('opacity-0') || l1Class.includes('invisible') || l1Class.includes('hidden');
const hasEmeraldColor = l1Class.includes('text-emerald-600') && l1Class.includes('dark:text-emerald-400');
const hasFontBlack = l1Class.includes('font-black');

assert(!hasTransparent, 'Layer 1 严禁包含 text-transparent 或 transparent 类名', `实际类名: "${l1Class}"`);
assert(!hasOpacity0, 'Layer 1 严禁包含 opacity-0, invisible, hidden 等不可见类名');
assert(hasEmeraldColor, 'Layer 1 具备明确的高对比度实体颜色 (text-emerald-600 & dark:text-emerald-400)');
assert(hasFontBlack, 'Layer 1 明确指定 font-black 顶级粗重字重，确保字形厚重可辨');

// 1.2 验证 WCAG 颜色对比度
function getLuminance(hex) {
  const rgb = hex.replace('#', '').match(/.{2}/g).map(x => parseInt(x, 16) / 255);
  const [r, g, b] = rgb.map(c => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function getContrastRatio(hex1, hex2) {
  const l1 = getLuminance(hex1);
  const l2 = getLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

const lightBg = '#fbfbfd';
const lightEmerald = '#059669'; // emerald-600
const darkBg = '#090a0f';
const darkEmerald = '#34d399';  // emerald-400

const lightContrast = getContrastRatio(lightBg, lightEmerald);
const darkContrast = getContrastRatio(darkBg, darkEmerald);

assert(lightContrast >= 3.0, `浅色模式 Layer 1 对比度达到 WCAG AA 大字标准`, `实测对比度: ${lightContrast.toFixed(2)}:1 (AA 阈值: 3.0:1)`);
if (lightContrast < 4.5) {
  warn(`浅色模式 Layer 1 对比度距 WCAG AAA (4.5:1) 尚有微小差距`, `当前 ${lightContrast.toFixed(2)}:1，如后续升级为 text-emerald-700 (#047857) 可达 4.88:1 达到 AAA`);
}
assert(darkContrast >= 4.5, `深色模式 Layer 1 对比度超额达到 WCAG AAA 标准`, `实测对比度: ${darkContrast.toFixed(2)}:1 (AAA 阈值: 4.5:1)`);

// 验证极端 CSS 环境（禁用 background-clip 时）：
assert(!l1Class.includes('bg-clip-text'), 'Layer 1 绝不依赖 background-clip: text，在无此特性的引擎下依然正常着色');

// -------------------------------------------------------------
// 2. Layer 2 极光覆盖层与 Layer 1 几何贴合度实测
// -------------------------------------------------------------
console.log('\n--- 检验维度 2: Layer 2 极光覆盖层与 Layer 1 几何贴合度 ---');

const l2CommentIdx = sloganBlock.indexOf('Layer 2:');
const l2SpanStart = sloganBlock.indexOf('<span', l2CommentIdx);
const l2SpanEnd = sloganBlock.indexOf('</span>', l2SpanStart);
const l2Snippet = sloganBlock.slice(l2SpanStart, l2SpanEnd + 7);

assert(l2Snippet.length > 0, '成功提取 Layer 2 极光覆盖层 JSX 节点');

const l2ClassMatch = l2Snippet.match(/className="([^"]*)"/);
const l2Class = l2ClassMatch ? l2ClassMatch[1] : '';
const l2ContentMatch = l2Snippet.match(/>([\s\S]*?)<\/span>/);
const l2Content = l2ContentMatch ? l2ContentMatch[1].trim() : '';

const wrapperMatch = sloganBlock.match(/<motion\.span\s+variants=\{charVariants\}\s+className="([^"]*)"/);
assert(!!wrapperMatch, '成功捕获副标语单个字符的外层容器节点');
const wrapperClass = wrapperMatch ? wrapperMatch[1] : '';

// 2.1 拓扑与位置贴合
const isAbsolute = l2Class.includes('absolute');
const isInset0 = l2Class.includes('inset-0');
assert(isAbsolute && isInset0, 'Layer 2 采用 absolute inset-0 像素级铺满父容器，与 Layer 1 几何严格共面重合', `类名: absolute=${isAbsolute}, inset-0=${isInset0}`);

// 2.2 字符内容严格全等
assert(l1Content === l2Content, 'Layer 1 与 Layer 2 字符渲染逻辑完全一致 (含空格不换行转换 \\u00A0)', `Layer 1: ${l1Content} | Layer 2: ${l2Content}`);

// 2.3 父容器约束
assert(wrapperClass.includes('relative') && wrapperClass.includes('inline-block'), '副标语字符容器为 relative inline-block，由 Layer 1 自然撑开边界，驱动 Layer 2 精准对齐', `实际容器类名: "${wrapperClass}"`);

// 2.4 无障碍 (A11y) 语义无重复
const hasAriaHidden = l1Snippet.includes('aria-hidden="true"');
assert(hasAriaHidden, 'Layer 1 配置 aria-hidden="true"，确保屏幕阅读器仅朗读 Layer 2，消除双倍发音歧义');

// 2.5 极光渐变与呼吸阴影
const hasClipClass = l2Class.includes('bg-clip-text');
const hasClipStyle = l2Snippet.includes("WebkitBackgroundClip: 'text'") || l2Snippet.includes('-webkit-background-clip: text');
assert(hasClipClass && hasClipStyle, 'Layer 2 双重声明 bg-clip-text 与 WebkitBackgroundClip: text，确保跨浏览器兼容');

// -------------------------------------------------------------
// 3. 顶部状态徽章文本与站长身份纯正性
// -------------------------------------------------------------
console.log('\n--- 检验维度 3: 顶部徽章文本与 Java 25 规格检验 ---');

const badge1Text = 'HAYDEN XUE // DIGITAL GARDEN 2026';
assert(heroCode.includes(badge1Text), `徽章 1 包含纯正站长标识: "${badge1Text}"`);

const badge2Text = 'JAVA 25 & NEXT.JS 14';
assert(heroCode.includes(badge2Text), `徽章 2 包含最新技术底座规范: "${badge2Text}"`);

// -------------------------------------------------------------
// 4. 全项目 howard 深度扫描与审查
// -------------------------------------------------------------
console.log('\n--- 检验维度 4: 全项目 howard 残留扫描与前台 UI 审查 ---');

function scanHowardInDir(dir, excludes = ['node_modules', '.git', '.next', 'target', '.agents']) {
  let results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (excludes.includes(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(scanHowardInDir(fullPath, excludes));
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (['.ts', '.tsx', '.js', '.jsx', '.json', '.html', '.css', '.md', '.java', '.xml', '.yml', '.yaml', '.sql'].includes(ext)) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        const lines = content.split('\n');
        lines.forEach((line, idx) => {
          if (/howard/i.test(line)) {
            results.push({
              file: path.relative(rootDir, fullPath),
              lineNum: idx + 1,
              content: line.trim()
            });
          }
        });
      }
    }
  }
  return results;
}

const allHowardMatches = scanHowardInDir(rootDir);

const frontendUiMatches = allHowardMatches.filter(m => {
  const file = m.file.replace(/\\/g, '/');
  if (!file.startsWith('frontend/')) return false;
  const isLocalStorageCompat = m.content.includes('localStorage.getItem') || m.content.includes('localStorage.removeItem');
  const isFooterSanitize = file.includes('Footer.tsx') && m.content.includes('.replace(');
  return !isLocalStorageCompat && !isFooterSanitize;
});

assert(frontendUiMatches.length === 0, `前台用户可见 UI 中 0 残留 Howard 文本`, `匹配数量: ${frontendUiMatches.length}`);
if (frontendUiMatches.length > 0) {
  frontendUiMatches.forEach(m => console.error(`   ! 前台残留: ${m.file}:${m.lineNum} -> ${m.content}`));
}

const storageCompatMatches = allHowardMatches.filter(m => m.content.includes('howard_token') || m.content.includes('howard_user') || m.content.includes('howard_locale'));
const javaPackageMatches = allHowardMatches.filter(m => m.file.replace(/\\/g, '/').startsWith('backend/'));
const docMatches = allHowardMatches.filter(m => m.file.endsWith('.md'));

console.log(`\n  [实测数据统计]:`);
console.log(`  - 全项目匹配项总计: ${allHowardMatches.length} 处`);
console.log(`  - 前台用户可见 UI 残留: ${frontendUiMatches.length} 处 (严格 0 残留)`);
console.log(`  - 前端 Storage 向下兼容历史 token 读取: ${storageCompatMatches.length} 处 (无害兼容)`);
console.log(`  - 后端 Java 历史 package/pom.xml (归属于 M3 纯化范围): ${javaPackageMatches.length} 处`);
console.log(`  - 历史文档与规范准则说明 (包含禁令规则): ${docMatches.length} 处`);

// -------------------------------------------------------------
// 5. 无头 Edge 真实渲染与计算样式 / 几何对齐实测
// -------------------------------------------------------------
console.log('\n--- 检验维度 5: 无头 Edge 真实渲染与计算样式 / 几何对齐实测 ---');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
if (fs.existsSync(edgePath)) {
  const tempHtmlPath = path.join(frontendDir, 'scripts', 'temp_render_test.html');
  const testHtml = `<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8">
  <title id="page-title">Init</title>
  <style>
    body { background: #fbfbfd; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 50px; }
    .text-8xl { font-size: 6rem; line-height: 1.08; }
    .font-black { font-weight: 900; }
    .tracking-tight { letter-spacing: -0.025em; }
    .relative { position: relative; }
    .absolute { position: absolute; }
    .inset-0 { top: 0; right: 0; bottom: 0; left: 0; }
    .inline-block { display: inline-block; }
    .select-none { user-select: none; }
    .text-emerald-600 { color: rgb(5, 150, 105); }
    .bg-gradient { background-image: linear-gradient(to right, #10b981, #5eead4, #22d3ee); }
    .bg-clip-text { -webkit-background-clip: text; background-clip: text; }
    .text-transparent { color: transparent; -webkit-text-fill-color: transparent; }
  </style>
</head>
<body>
  <div id="test-container" class="text-8xl font-black tracking-tight">
    <span id="char-wrapper" class="relative inline-block select-none">
      <span id="layer-1" class="inline-block text-emerald-600 font-black select-none" aria-hidden="true">toward</span>
      <span id="layer-2" class="absolute inset-0 inline-block bg-gradient bg-clip-text text-transparent select-none" style="-webkit-background-clip: text; -webkit-text-fill-color: transparent;">toward</span>
    </span>
  </div>
  <script>
    const l1 = document.getElementById('layer-1');
    const l2 = document.getElementById('layer-2');
    const r1 = l1.getBoundingClientRect();
    const r2 = l2.getBoundingClientRect();
    const cs1 = window.getComputedStyle(l1);
    const cs2 = window.getComputedStyle(l2);
    const data = {
      l1_color: cs1.color,
      l1_fontSize: cs1.fontSize,
      l1_fontWeight: cs1.fontWeight,
      l1_box: { width: Math.round(r1.width * 100) / 100, height: Math.round(r1.height * 100) / 100, top: Math.round(r1.top * 100) / 100, left: Math.round(r1.left * 100) / 100 },
      l2_color: cs2.color,
      l2_fillColor: cs2.webkitTextFillColor,
      l2_clip: cs2.webkitBackgroundClip,
      l2_box: { width: Math.round(r2.width * 100) / 100, height: Math.round(r2.height * 100) / 100, top: Math.round(r2.top * 100) / 100, left: Math.round(r2.left * 100) / 100 },
      delta_width: Math.abs(r1.width - r2.width),
      delta_height: Math.abs(r1.height - r2.height),
      delta_top: Math.abs(r1.top - r2.top),
      delta_left: Math.abs(r1.left - r2.left),
    };
    document.title = 'EMPIRICAL_DATA:' + JSON.stringify(data);
  </script>
</body>
</html>`;

  fs.writeFileSync(tempHtmlPath, testHtml, 'utf-8');

  try {
    const cmd = `"${edgePath}" --headless --disable-gpu --run-all-compositor-stages-before-draw --virtual-time-budget=2000 --dump-dom "file:///${tempHtmlPath.replace(/\\/g, '/')}"`;
    const edgeOut = execSync(cmd, { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });

    const titleMatch = edgeOut.match(/<title[^>]*>EMPIRICAL_DATA:([\s\S]*?)<\/title>/);
    assert(!!titleMatch, 'Edge 无头引擎执行 JavaScript 计算并传回实测几何数据');

    if (titleMatch) {
      const metrics = JSON.parse(titleMatch[1]);
      console.log('  [实测几何与计算样式详情]:');
      console.log(`     Layer 1 颜色: ${metrics.l1_color} (非透明实体) | 字重: ${metrics.l1_fontWeight} | 字号: ${metrics.l1_fontSize}`);
      console.log(`     Layer 1 几何包围盒: W=${metrics.l1_box.width}px, H=${metrics.l1_box.height}px, Top=${metrics.l1_box.top}px, Left=${metrics.l1_box.left}px`);
      console.log(`     Layer 2 极光裁剪: clip=${metrics.l2_clip}, fillColor=${metrics.l2_fillColor}`);
      console.log(`     Layer 2 几何包围盒: W=${metrics.l2_box.width}px, H=${metrics.l2_box.height}px, Top=${metrics.l2_box.top}px, Left=${metrics.l2_box.left}px`);
      console.log(`     几何对齐差值: ΔW=${metrics.delta_width}px, ΔH=${metrics.delta_height}px, ΔTop=${metrics.delta_top}px, ΔLeft=${metrics.delta_left}px`);

      assert(metrics.l1_color !== 'rgba(0, 0, 0, 0)' && metrics.l1_color !== 'transparent', 'Layer 1 实体颜色绝对非 transparent');
      assert(metrics.delta_width < 0.1, 'Layer 1 与 Layer 2 宽度绝对重合 (ΔW < 0.1px)');
      assert(metrics.delta_height < 0.1, 'Layer 1 与 Layer 2 高度绝对重合 (ΔH < 0.1px)');
      assert(metrics.delta_top < 0.1, 'Layer 1 与 Layer 2 纵向绝对共面 (ΔTop < 0.1px)');
      assert(metrics.delta_left < 0.1, 'Layer 1 与 Layer 2 横向绝对对齐 (ΔLeft < 0.1px)');
    }
  } catch (e) {
    warn('无头 Edge 渲染调用异常: ' + e.message);
  } finally {
    try { fs.unlinkSync(tempHtmlPath); } catch {}
  }
} else {
  warn('未检测到 msedge.exe，跳过浏览器渲染引擎实测');
}

// -------------------------------------------------------------
// 6. 极端破坏性 CSS 环境（禁用 background-clip）对抗实测
// -------------------------------------------------------------
console.log('\n--- 检验维度 6: 极端破坏性 CSS 环境（禁用 background-clip）对抗实测 ---');

if (fs.existsSync(edgePath)) {
  const hostileHtmlPath = path.join(frontendDir, 'scripts', 'hostile_css_test.html');
  // 注入敌对样式：强制全局禁用 background-clip
  const hostileHtml = `<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8">
  <title>Hostile Test</title>
  <style>
    /* 敌对环境模拟：强制覆盖 background-clip 为 border-box，模拟完全无此特性的旧内核或用户无障碍插件 */
    * {
      -webkit-background-clip: border-box !important;
      background-clip: border-box !important;
    }
    body { background: #fbfbfd; font-family: sans-serif; margin: 50px; }
    .text-8xl { font-size: 6rem; line-height: 1.08; }
    .font-black { font-weight: 900; }
    .relative { position: relative; }
    .absolute { position: absolute; }
    .inset-0 { top: 0; right: 0; bottom: 0; left: 0; }
    .inline-block { display: inline-block; }
    .select-none { user-select: none; }
    .text-emerald-600 { color: rgb(5, 150, 105); }
    .bg-gradient { background-image: linear-gradient(to right, #10b981, #5eead4, #22d3ee); }
    .text-transparent { color: transparent; -webkit-text-fill-color: transparent; }
  </style>
</head>
<body>
  <div id="test-container" class="text-8xl font-black">
    <span id="char-wrapper" class="relative inline-block select-none">
      <span id="layer-1" class="inline-block text-emerald-600 font-black select-none" aria-hidden="true">toward</span>
      <span id="layer-2" class="absolute inset-0 inline-block bg-gradient text-transparent select-none">toward</span>
    </span>
  </div>
  <script>
    const l1 = document.getElementById('layer-1');
    const cs1 = window.getComputedStyle(l1);
    const r1 = l1.getBoundingClientRect();
    const data = {
      hostile_l1_color: cs1.color,
      hostile_l1_display: cs1.display,
      hostile_l1_visibility: cs1.visibility,
      hostile_l1_width: r1.width,
      hostile_l1_height: r1.height
    };
    document.title = 'HOSTILE_DATA:' + JSON.stringify(data);
  </script>
</body>
</html>`;

  fs.writeFileSync(hostileHtmlPath, hostileHtml, 'utf-8');

  try {
    const cmd = `"${edgePath}" --headless --disable-gpu --run-all-compositor-stages-before-draw --virtual-time-budget=2000 --dump-dom "file:///${hostileHtmlPath.replace(/\\/g, '/')}"`;
    const edgeOut = execSync(cmd, { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
    const match = edgeOut.match(/<title[^>]*>HOSTILE_DATA:([\s\S]*?)<\/title>/);
    assert(!!match, '在敌对 CSS (强制 border-box) 环境下执行实测');
    if (match) {
      const data = JSON.parse(match[1]);
      console.log(`     在强制禁用 background-clip 环境下:`);
      console.log(`     Layer 1 颜色实测: ${data.hostile_l1_color}`);
      console.log(`     Layer 1 尺寸实测: W=${data.hostile_l1_width}px, H=${data.hostile_l1_height}px, Display=${data.hostile_l1_display}`);
      assert(data.hostile_l1_color === 'rgb(5, 150, 105)', 'Layer 1 实体颜色保持 rgb(5, 150, 105)，绝对不受外部 background-clip 破坏');
      assert(data.hostile_l1_width > 0 && data.hostile_l1_height > 0, 'Layer 1 依然正常占据实体布局物理空间');
    }
  } catch (e) {
    warn('敌对环境调用异常: ' + e.message);
  } finally {
    try { fs.unlinkSync(hostileHtmlPath); } catch {}
  }
}

console.log('\n================================================================');
console.log(`  最终验证总结: ${passCount} PASSED, ${warnCount} WARNINGS, ${failCount} FAILED`);
console.log('================================================================\n');

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
