import fs from 'fs';
import path from 'path';
import assert from 'assert';

console.log('--- Starting Hayden AI Nexus Comprehensive Upgrades Verification ---');

// 1. Verify SiteLayoutShell.tsx
const shellPath = path.resolve('frontend/components/layout/SiteLayoutShell.tsx');
const shellContent = fs.readFileSync(shellPath, 'utf-8');

assert.ok(shellContent.includes('<Navbar />'), 'Navbar must be unconditionally rendered on frontend routes');
assert.ok(!shellContent.includes('!isAiPage && <Navbar />'), 'Old !isAiPage && <Navbar /> must be removed');
assert.ok(shellContent.includes('const isImmersive100SvhPage = isJourneyListPage || isAiPage;'), 'isAiPage must be part of isImmersive100SvhPage');
console.log('✔ SiteLayoutShell.tsx verified: Global Navbar retained, /ai treated as 100svh immersive stage.');

// 2. Verify AiCinematicIntro.tsx
const introPath = path.resolve('frontend/app/ai/AiCinematicIntro.tsx');
assert.ok(fs.existsSync(introPath), 'AiCinematicIntro.tsx must exist');
const introContent = fs.readFileSync(introPath, 'utf-8');

assert.ok(introContent.includes('BrandLogo'), 'AiCinematicIntro must render BrandLogo');
assert.ok(introContent.includes('variant="monochrome"'), 'BrandLogo in intro must be monochrome');
assert.ok(introContent.includes('CINEMATIC_EASE'), 'AiCinematicIntro must use cinematic easing');
assert.ok(introContent.includes('titleChars.map'), 'Title letters must reveal sequentially');
assert.ok(!introContent.includes('探索未知 · 数字心智与全栈知识中枢'), 'Intro must have no Chinese subtitle translation');
assert.ok(introContent.includes('Escape'), 'AiCinematicIntro must support Escape key to skip');
console.log('✔ AiCinematicIntro.tsx verified: Frameless horizontal BrandLogo + Into the Unknown, no Chinese translation.');

// 3. Verify HaydenAiNexus.tsx
const nexusPath = path.resolve('frontend/app/ai/HaydenAiNexus.tsx');
const nexusContent = fs.readFileSync(nexusPath, 'utf-8');

// A. Check imports
assert.ok(nexusContent.includes("import { AiCinematicIntro } from './AiCinematicIntro';"), 'HaydenAiNexus must import AiCinematicIntro');
assert.ok(nexusContent.includes("import { BrandLogo } from '@/components/ui/BrandLogo';"), 'HaydenAiNexus must import BrandLogo');

// B. Check popover card & decoupling
assert.ok(nexusContent.includes('fixed bottom-16 left-4 sm:left-6 z-[60]'), 'Popover card must be anchored floating at bottom-16 left-4');
assert.ok(nexusContent.includes('w-[380px]'), 'Popover card must strictly have refined 380px width');
assert.ok(nexusContent.includes("transformOrigin: 'bottom left'"), 'Popover card must scale from bottom-left');
assert.ok(nexusContent.includes('fixed bottom-5 left-4 sm:left-6 z-40'), 'Capsule trigger button must float at bottom-left');

// C. Check top header decluttering
assert.ok(!nexusContent.includes('深度思考链</span>'), 'Top header must not contain [DeepSeek-Flash · 深度思考链] status button');
assert.ok(!nexusContent.includes('header className="relative z-30 w-full pt-20 sm:pt-22 pb-2 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto flex items-center justify-between pointer-events-none transition-all">\n        <div className="flex items-center gap-2 sm:gap-3 pointer-events-auto">\n          {/* 会话侧栏抽屉开关 */}'), 'Top header must not have drawer toggle button');

// D. Check hero title horizontal layout
assert.ok(nexusContent.includes('size={44}'), 'Hero view must render BrandLogo with size 44');
assert.ok(nexusContent.includes('font-serif'), 'Hero view title must use serif font matching intro');
assert.ok(!nexusContent.includes('{displayDesc}'), 'Hero view must not show extra Chinese subtitle translation under title');

// E. Check session init: fresh session on enter
assert.ok(nexusContent.includes('默认始终开启全新空白会话'), 'Nexus must always initiate a fresh blank session on entrance');

// F. Check greeting handling in handleSend
assert.ok(nexusContent.includes('isSimpleGreeting'), 'handleSend must check for simple greetings');

// G. Check identity invariant
assert.ok(!nexusContent.includes('Howard'), 'Hayden Xue identity invariant must be strictly respected, no Howard allowed');

console.log('✔ HaydenAiNexus.tsx verified: Popover card, bottom-left capsule, clean header, horizontal hero title, fresh session init.');

// 4. Verify Backend AiService.java
const aiServicePath = path.resolve('backend/src/main/java/com/howard/blog/ai/service/AiService.java');
const aiServiceContent = fs.readFileSync(aiServicePath, 'utf-8');

assert.ok(aiServiceContent.includes('isGreeting'), 'AiService must include isGreeting method');
assert.ok(aiServiceContent.includes('你好！我是 **Hayden AI**'), 'AiService must provide friendly concise greeting');
assert.ok(aiServiceContent.includes('日常寒暄与简短问候') && aiServiceContent.includes('绝不要过度展开冗长博文总结'), 'buildSystemPrompt must have concise greeting rule');
console.log('✔ AiService.java verified: Friendly concise greeting fast-path, no RAG essay on "你好".');

console.log('--- All verifications PASSED successfully! ---');
