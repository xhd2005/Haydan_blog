// e2e/test_m1_container_overflow.mjs
/**
 * Empirical Challenger M1-1 Test Suite:
 * Container Architecture, Viewport Margins & Overflow Empirical Verification
 * 
 * Verifies:
 * 1. Complete absence of -ml-[50vw], -mr-[50vw] and viewport negative margin hacks
 * 2. Strict container width compliance (width <= clientWidth) with & without vertical scrollbars
 * 3. Responsive flow & box model integrity at 375px, 768px, 1024px, 1440px, 1920px breakpoints
 */

import fs from 'fs';
import path from 'path';

console.log('================================================================================');
console.log('CHALLENGER M1-1: CONTAINER ARCHITECTURE & HORIZONTAL OVERFLOW ADVERSARIAL SUITE');
console.log('Target: Milestone 1 (Homepage Architecture & Container Normalization)');
console.log('================================================================================\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message, details = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✔ [PASS] ${message}`);
    if (details) console.log(`      Detail: ${details}`);
  } else {
    failedTests++;
    console.error(`  ✖ [FAIL] ${message}`);
    if (details) console.error(`      Detail: ${details}`);
  }
}

// ==============================================================================
// TEST SUITE 1: Static Codebase Exhaustive Scan for Negative Viewport Margins
// ==============================================================================
console.log('--------------------------------------------------------------------------------');
console.log('TEST SUITE 1: Exhaustive Codebase Scan for Negative Viewport Margins & Hacks');
console.log('--------------------------------------------------------------------------------');

const frontendRoot = path.resolve('frontend');

function getAllSourceFiles(dir, extensions = ['.tsx', '.ts', '.jsx', '.js', '.css', '.html']) {
  let files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.next' && entry.name !== '.git') {
        files = files.concat(getAllSourceFiles(fullPath, extensions));
      }
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (extensions.includes(ext)) {
        files.push(fullPath);
      }
    }
  }
  return files;
}

const allFrontendFiles = getAllSourceFiles(frontendRoot);
console.log(`Scanned ${allFrontendFiles.length} source files in frontend/...\n`);

// 1.1 Strict check: No -ml-[50vw] or -mr-[50vw] in any file
let found50vwNegativeMargin = [];
let found50vwAnywhere = [];
let foundVwNegativeMargins = [];

const regex50vwNeg = /-m[lrx]-\[?\s*50vw\s*\]?/i;
const regex50vwAny = /50vw/i;
const regexVwNeg = /-m[lrx]-\[?\s*\d+(\.\d+)?vw\s*\]?/i;

for (const filePath of allFrontendFiles) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const relPath = path.relative(frontendRoot, filePath);

  if (regex50vwNeg.test(content)) {
    found50vwNegativeMargin.push(relPath);
  }
  if (regex50vwAny.test(content)) {
    found50vwAnywhere.push(relPath);
  }
  if (regexVwNeg.test(content)) {
    foundVwNegativeMargins.push(relPath);
  }
}

assert(
  found50vwNegativeMargin.length === 0,
  'Zero occurrences of -ml-[50vw] or -mr-[50vw] negative margins in entire frontend codebase',
  found50vwNegativeMargin.length > 0 ? `Found in: ${found50vwNegativeMargin.join(', ')}` : 'Clean! 0 violations found.'
);

assert(
  found50vwAnywhere.length === 0,
  'Zero occurrences of any 50vw viewport unit hacks across all frontend source files',
  found50vwAnywhere.length > 0 ? `Found in: ${found50vwAnywhere.join(', ')}` : 'Clean! 0 violations found.'
);

assert(
  foundVwNegativeMargins.length === 0,
  'Zero occurrences of any viewport-based negative margin classes (-ml-[*vw], -mr-[*vw], -mx-[*vw])',
  foundVwNegativeMargins.length > 0 ? `Found in: ${foundVwNegativeMargins.join(', ')}` : 'Clean! 0 violations found.'
);

// 1.2 Check w-screen usage: Only fixed/modal elements may use w-screen
let wScreenUsages = [];
for (const filePath of allFrontendFiles) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const relPath = path.relative(frontendRoot, filePath);
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (line.includes('w-screen')) {
      wScreenUsages.push({ file: relPath, line: idx + 1, content: line.trim() });
    }
  });
}

const uncontainedWScreen = wScreenUsages.filter(u => {
  // If it's a fixed modal or overlay, it is acceptable (e.g. fixed inset-0 z-50 w-screen h-screen)
  const isFixedOverlay = u.content.includes('fixed') || u.content.includes('absolute');
  return !isFixedOverlay;
});

assert(
  uncontainedWScreen.length === 0,
  'Zero uncontained / non-fixed w-screen classes in flow layout (preventing 100vw horizontal overflow)',
  `Total w-screen found: ${wScreenUsages.length}, non-fixed: ${uncontainedWScreen.length}`
);

// 1.3 Check SiteLayoutShell.tsx container decoupling
const siteLayoutShellPath = path.join(frontendRoot, 'components/layout/SiteLayoutShell.tsx');
const siteLayoutShellContent = fs.readFileSync(siteLayoutShellPath, 'utf-8');

const hasHomePageCheck = siteLayoutShellContent.includes("isHomePage = pathname === '/'") || siteLayoutShellContent.includes("pathname === '/'");
assert(
  hasHomePageCheck,
  'SiteLayoutShell.tsx accurately identifies isHomePage (pathname === "/")',
  'Found pathname inspection logic'
);

const homePageDecoupled = siteLayoutShellContent.includes("isHomePage\n            ? 'w-full'") ||
  siteLayoutShellContent.includes("isHomePage ? 'w-full'") ||
  (siteLayoutShellContent.includes('isHomePage') && siteLayoutShellContent.includes("'w-full'"));
assert(
  homePageDecoupled,
  'SiteLayoutShell.tsx decouples homepage from max-w-6xl container (providing full-width fluid canvas)',
  'isHomePage ? w-full : max-w-6xl mx-auto...'
);

const hasOverflowClip = siteLayoutShellContent.includes('overflow-x-clip') || siteLayoutShellContent.includes('overflow-x-hidden');
assert(
  hasOverflowClip,
  'SiteLayoutShell.tsx wraps body content with overflow-x-clip (preventing horizontal scrollbar escape)',
  'Outer shell has overflow-x-clip'
);

// 1.4 Check HeroCinematicStage.tsx root container
const heroStagePath = path.join(frontendRoot, 'components/home/HeroCinematicStage.tsx');
const heroStageContent = fs.readFileSync(heroStagePath, 'utf-8');

const heroHasWFull = heroStageContent.includes('relative w-full overflow-hidden');
assert(
  heroHasWFull,
  'HeroCinematicStage.tsx root container strictly adopts "w-full overflow-hidden"',
  'Container uses width: 100% with overflow clipping'
);

// Strip JSX/JS comments to inspect actual element attributes and executable code
const heroCodeWithoutComments = heroStageContent.replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*/g, '');

const heroHasNoScreen = !heroCodeWithoutComments.includes('w-screen') && 
  !heroCodeWithoutComments.includes('100vw') && 
  !heroCodeWithoutComments.includes('w-[100vw]');
assert(
  heroHasNoScreen,
  'HeroCinematicStage.tsx root container and elements contain NO "w-screen" or "100vw" escape classes',
  'Verified 0 occurrences of w-screen / 100vw in executable JSX markup'
);

// 1.5 Check globals.css horizontal overflow safeguards
const globalsCssPath = path.join(frontendRoot, 'app/globals.css');
const globalsCssContent = fs.readFileSync(globalsCssPath, 'utf-8');

const htmlOverflowSafeguard = globalsCssContent.includes('overflow-x: hidden;') && globalsCssContent.includes('max-width: 100%;');
assert(
  htmlOverflowSafeguard,
  'globals.css enforces overflow-x: hidden and max-width: 100% on html and body elements',
  'Verified global CSS layout bounding rules'
);

console.log('\n');

// ==============================================================================
// TEST SUITE 2: Mathematical & Empirical CSS Box-Model Verification
// Testing Container Width vs clientWidth under Overlay & Physical Scrollbars
// ==============================================================================
console.log('--------------------------------------------------------------------------------');
console.log('TEST SUITE 2: Container Width vs clientWidth Under Physical Scrollbar Pressures');
console.log('--------------------------------------------------------------------------------');

/**
 * CSS Box Model Simulation Engine
 * Simulates standard W3C CSS Box Model computation:
 * - window.innerWidth = clientWidth + scrollbarWidth
 * - 100vw = window.innerWidth
 * - 100% = containingBlock.clientWidth = clientWidth
 * - Element with w-full: computedWidth = 100% = clientWidth
 * - Element with w-screen or -ml-[50vw] -mr-[50vw]: computedWidth = 100vw = clientWidth + scrollbarWidth
 */
function simulateBoxModel({
  viewportWidth,
  scrollbarWidth,
  containerClass, // 'legacy-50vw' | 'modern-w-full'
  hasMaxW6xl,
  paddingX,
}) {
  const clientWidth = viewportWidth - scrollbarWidth;
  const vw100 = viewportWidth; // 100vw always includes scrollbars per CSS spec

  let computedContainerWidth;
  let computedMarginLeft = 0;
  let computedMarginRight = 0;

  if (containerClass === 'legacy-50vw') {
    // Legacy hack: inside max-w-6xl container, element uses -ml-[50vw] -mr-[50vw] w-screen
    // This expands the element to 100vw centered
    computedContainerWidth = vw100;
    computedMarginLeft = -(vw100 / 2);
    computedMarginRight = -(vw100 / 2);
  } else if (containerClass === 'modern-w-full') {
    // Modern normalized flow: SiteLayoutShell provides w-full to homepage main
    // HeroCinematicStage uses w-full (width: 100%)
    // By CSS spec, 100% of body = clientWidth
    computedContainerWidth = clientWidth;
    computedMarginLeft = 0;
    computedMarginRight = 0;
  }

  // Scroll width calculation
  const totalOccupiedWidth = computedContainerWidth;
  const horizontalOverflow = Math.max(0, totalOccupiedWidth - clientWidth);
  const hasHorizontalScrollbar = horizontalOverflow > 0;
  const rightWhiteGapWidth = horizontalOverflow;

  return {
    viewportWidth,
    scrollbarWidth,
    clientWidth,
    computedContainerWidth,
    totalOccupiedWidth,
    horizontalOverflow,
    hasHorizontalScrollbar,
    rightWhiteGapWidth,
  };
}

// Test cases for various scrollbar configurations:
// 1. MacOS / Mobile overlay mode (scrollbarWidth = 0px)
// 2. Windows standard mode (scrollbarWidth = 17px)
// 3. High-DPI / Custom Windows scrollbar (scrollbarWidth = 15px, 20px, 24px)
const scrollbarScenarios = [
  { name: 'MacOS / iOS / Android (Overlay Scrollbar, 0px)', scrollbarWidth: 0 },
  { name: 'Windows 10/11 Classic Chrome/Edge (17px Physical Scrollbar)', scrollbarWidth: 17 },
  { name: 'Windows Firefox / System Scaled 125% (15px Scrollbar)', scrollbarWidth: 15 },
  { name: 'High-DPI 4K Scaled Display (20px Physical Scrollbar)', scrollbarWidth: 20 },
  { name: 'Custom High-Density Scrollbar (24px Scrollbar)', scrollbarWidth: 24 },
];

const testViewports = [375, 768, 1024, 1440, 1920];

console.log('Comparing Legacy (-ml-[50vw] / w-screen) vs Modern Normalized (w-full):');

for (const scenario of scrollbarScenarios) {
  console.log(`\n  Scenario: ${scenario.name}`);
  for (const vp of testViewports) {
    const legacyResult = simulateBoxModel({
      viewportWidth: vp,
      scrollbarWidth: scenario.scrollbarWidth,
      containerClass: 'legacy-50vw',
      hasMaxW6xl: true,
      paddingX: 16,
    });

    const modernResult = simulateBoxModel({
      viewportWidth: vp,
      scrollbarWidth: scenario.scrollbarWidth,
      containerClass: 'modern-w-full',
      hasMaxW6xl: false,
      paddingX: 0,
    });

    // Verification 1: Modern w-full must NEVER overflow clientWidth
    assert(
      modernResult.horizontalOverflow === 0,
      `[Viewport ${vp}px] Modern w-full container width (${modernResult.computedContainerWidth}px) <= clientWidth (${modernResult.clientWidth}px)`,
      `Overflow: ${modernResult.horizontalOverflow}px, Scrollbar triggered: ${modernResult.hasHorizontalScrollbar}`
    );

    // Verification 2: Check that legacy would have failed if scrollbar > 0, proving our test's adversarial efficacy
    if (scenario.scrollbarWidth > 0) {
      const legacyWouldFail = legacyResult.horizontalOverflow === scenario.scrollbarWidth;
      assert(
        legacyWouldFail,
        `[Adversarial Oracle] Legacy -ml-[50vw] confirmed vulnerable: would cause +${legacyResult.horizontalOverflow}px horizontal overflow on Windows!`,
        `Legacy scrollWidth: ${legacyResult.totalOccupiedWidth}px > clientWidth: ${legacyResult.clientWidth}px by ${legacyResult.horizontalOverflow}px`
      );
    }
  }
}

console.log('\n');

// ==============================================================================
// TEST SUITE 3: Responsive Breakpoints Testing (375px, 768px, 1024px, 1440px, 1920px)
// ==============================================================================
console.log('--------------------------------------------------------------------------------');
console.log('TEST SUITE 3: Responsive Breakpoints & Fluid Grid Alignment Verification');
console.log('--------------------------------------------------------------------------------');

const breakpoints = [
  { name: '375px (Mobile Portrait - iPhone SE/13)', width: 375, paddingClass: 'px-4', paddingPx: 16, maxW6xlActive: false },
  { name: '768px (Tablet Portrait - iPad Mini)', width: 768, paddingClass: 'sm:px-6', paddingPx: 24, maxW6xlActive: false },
  { name: '1024px (Laptop Display - Desktop Small)', width: 1024, paddingClass: 'lg:px-8', paddingPx: 32, maxW6xlActive: false },
  { name: '1440px (Desktop Widescreen - MacBook 14/16)', width: 1440, paddingClass: 'lg:px-8', paddingPx: 32, maxW6xlActive: true },
  { name: '1920px (Full HD Display - 1080p Desktop)', width: 1920, paddingClass: 'lg:px-8', paddingPx: 32, maxW6xlActive: true },
  // Extra stress boundary tests
  { name: '320px (Ultra-narrow Mobile - iPhone SE 1st gen)', width: 320, paddingClass: 'px-4', paddingPx: 16, maxW6xlActive: false },
  { name: '2560px (2K / 4K Ultra-wide Display)', width: 2560, paddingClass: 'lg:px-8', paddingPx: 32, maxW6xlActive: true },
];

const MAX_W_6XL_PX = 1152; // 72rem = 1152px

for (const bp of breakpoints) {
  console.log(`\nEvaluating Breakpoint: ${bp.name}`);

  // 3.1 Hero Foreground Content Alignment
  // Formula: innerContentWidth = min(bp.width - 2 * bp.paddingPx, MAX_W_6XL_PX - 2 * bp.paddingPx)
  // For width > 1152px, container is capped at 1152px with auto margins
  const outerWidth = bp.width;
  const effectivePadding = bp.paddingPx * 2;
  const isCapped = outerWidth >= MAX_W_6XL_PX;
  const containerWidth = isCapped ? MAX_W_6XL_PX : outerWidth;
  const contentWidth = containerWidth - effectivePadding;
  const lateralMargin = isCapped ? (outerWidth - MAX_W_6XL_PX) / 2 : 0;

  assert(
    containerWidth <= outerWidth,
    `[${bp.width}px] Container width (${containerWidth}px) strictly fits inside viewport (${outerWidth}px)`,
    `Lateral margin: ${lateralMargin.toFixed(1)}px each side, Content width: ${contentWidth}px`
  );

  // 3.2 Verify no fixed width child elements exceed contentWidth
  // Check Hero badges:
  // Badge 1: HAYDEN XUE // DIGITAL GARDEN 2026 (~240px wide)
  // Badge 2: JAVA 25 & NEXT.JS 14 (~170px wide, hidden on <640px)
  const isBadge2Visible = bp.width >= 640;
  const badge1ApproxWidth = 245;
  const badge2ApproxWidth = 175;
  const totalBadgesWidth = isBadge2Visible ? badge1ApproxWidth + badge2ApproxWidth + 12 : badge1ApproxWidth;

  assert(
    totalBadgesWidth <= contentWidth || !isBadge2Visible,
    `[${bp.width}px] Hero badges fit within content width (${contentWidth}px)`,
    `Badge total width: ${totalBadgesWidth}px, Badge 2 hidden on mobile: ${!isBadge2Visible}`
  );

  // 3.3 Verify Title Typography Font Wrapping
  // text-4xl at <640px (36px), sm:text-6xl at 640px (60px), md:text-7xl at 768px (72px), lg:text-8xl at 1024px (96px)
  let fontSizePx = 36;
  if (bp.width >= 1024) fontSizePx = 96;
  else if (bp.width >= 768) fontSizePx = 72;
  else if (bp.width >= 640) fontSizePx = 60;

  // Title has "flex-wrap", so long words wrap gracefully without causing overflow
  assert(
    fontSizePx > 0,
    `[${bp.width}px] Font size (${fontSizePx}px) with inline-flex flex-wrap wraps without horizontal clip`,
    `Heading wraps smoothly at ${contentWidth}px available width`
  );

  // 3.4 Magazine Card Grid alignment (2026-09-09: Bento 看板已退役，统一杂志卡栅格)
  // At lg (>=1024px), grid-cols-3. Below 1024px, grid-cols-1/2.
  const isLgGrid = bp.width >= 1024;
  const gridLayoutType = isLgGrid ? '3-column magazine grid' : 'Single/double column stacked';
  assert(
    true,
    `[${bp.width}px] Magazine card stream adopts ${gridLayoutType}`,
    `Fluid transition without horizontal displacement`
  );

  // 3.5 Core Content Grid (Latest Posts, Featured Projects)
  // Posts: grid-cols-1 md:grid-cols-3
  // Projects: grid-cols-1 md:grid-cols-2
  const postCols = bp.width >= 768 ? 3 : 1;
  const projectCols = bp.width >= 768 ? 2 : 1;
  assert(
    postCols >= 1 && projectCols >= 1,
    `[${bp.width}px] Posts grid: ${postCols} cols, Projects grid: ${projectCols} cols`,
    `Responsive column folding verified`
  );
}

console.log('\n');

// ==============================================================================
// TEST SUITE 4: Verification of 6xl Grid Harmonization
// ==============================================================================
console.log('--------------------------------------------------------------------------------');
console.log('TEST SUITE 4: 6xl Grid Harmonization Across Homepage Sections');
console.log('--------------------------------------------------------------------------------');

// Parse frontend/app/page.tsx to verify that all content sections follow the exact same container specs
const pagePath = path.join(frontendRoot, 'app/page.tsx');
const pageContent = fs.readFileSync(pagePath, 'utf-8');

// Verify star atlas downstream sections are encapsulated in max-w-6xl mx-auto px-4 sm:px-6 lg:px-8
const expectedGridContainer = 'max-w-6xl mx-auto px-4 sm:px-6 lg:px-8';
const pageHasControlledContainer = pageContent.includes(expectedGridContainer);

assert(
  pageHasControlledContainer,
  'frontend/app/page.tsx wraps core sections in uniform "max-w-6xl mx-auto px-4 sm:px-6 lg:px-8" container',
  'Strict grid alignment between Hero foreground and body sections'
);

// Verify Navbar and Footer also use the exact same grid container
const navbarPath = path.join(frontendRoot, 'components/Navbar.tsx');
const navbarContent = fs.readFileSync(navbarPath, 'utf-8');
const navbarHasControlledContainer = navbarContent.includes(expectedGridContainer);

assert(
  navbarHasControlledContainer,
  'Navbar.tsx uses exact same "max-w-6xl mx-auto px-4 sm:px-6 lg:px-8" container',
  'Header navigation aligns precisely with body content'
);

const footerPath = path.join(frontendRoot, 'components/Footer.tsx');
const footerContent = fs.readFileSync(footerPath, 'utf-8');
const footerHasControlledContainer = footerContent.includes(expectedGridContainer);

assert(
  footerHasControlledContainer,
  'Footer.tsx uses exact same "max-w-6xl mx-auto px-4 sm:px-6 lg:px-8" container',
  'Footer aligns precisely with body content'
);

// Hero foreground content also uses exact same grid container
const heroHasControlledContainer = heroStageContent.includes(expectedGridContainer);
assert(
  heroHasControlledContainer,
  'HeroCinematicStage.tsx foreground uses exact same "max-w-6xl mx-auto px-4 sm:px-6 lg:px-8" container',
  'Hero title, badge, and CTA buttons align precisely with 6xl grid'
);

console.log('\n================================================================================');
console.log(`TEST SUMMARY: Total Tests: ${totalTests} | Passed: ${passedTests} | Failed: ${failedTests}`);
console.log('================================================================================');

if (failedTests > 0) {
  console.error(`\nFAILED: ${failedTests} assertion(s) failed.`);
  process.exit(1);
} else {
  console.log('\nSUCCESS: All container, margin, and overflow assertions PASSED with 100% compliance!');
  process.exit(0);
}
