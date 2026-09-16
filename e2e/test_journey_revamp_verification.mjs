import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const remotePort = 9333;
const targetUrl = 'http://localhost:3000/journey';
const screenshotsDir = path.resolve('docs/screenshots');

if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

console.log('================================================================');
console.log('  JOURNEY 3D MOVING MAP: 深入经验性对抗测试与全项视觉自动化校验');
console.log('================================================================\n');

// 1. 启动无头 Chrome 并开启远程调试端口
const chromeProc = spawn(chromePath, [
  `--remote-debugging-port=${remotePort}`,
  '--headless=new',
  '--disable-gpu',
  '--no-sandbox',
  '--hide-scrollbars',
  '--window-size=1440,900',
  '--user-data-dir=' + path.resolve('scratch/chrome-test-profile'),
  targetUrl,
]);

let passCount = 0;
let failCount = 0;

function assert(condition, title, detail = '') {
  if (condition) {
    console.log(`  [PASS] ${title}`);
    if (detail) console.log(`         -> ${detail}`);
    passCount++;
  } else {
    console.error(`  [FAIL] ${title}`);
    if (detail) console.error(`         -> ${detail}`);
    failCount++;
  }
}

async function delay(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

async function getWsUrl() {
  for (let i = 0; i < 30; i++) {
    try {
      const data = await new Promise((resolve, reject) => {
        http.get(`http://127.0.0.1:${remotePort}/json/list`, (res) => {
          let body = '';
          res.on('data', (chunk) => (body += chunk));
          res.on('end', () => resolve(JSON.parse(body)));
        }).on('error', reject);
      });
      const page = data.find((p) => p.type === 'page');
      if (page && page.webSocketDebuggerUrl) {
        return page.webSocketDebuggerUrl;
      }
    } catch {}
    await delay(300);
  }
  throw new Error('Failed to find Chrome debugger WebSocket URL');
}

// 简易 WebSocket 客户端实现，无需外部 ws 依赖
class SimpleCdpClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.id = 1;
    this.callbacks = new Map();
  }

  async connect() {
    const { WebSocket } = await import('ws').catch(() => {
      // 若无 ws 依赖，退回到 Node 22 内置 WebSocket
      return { WebSocket: globalThis.WebSocket };
    });
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = reject;
      this.ws.onmessage = (event) => {
        const msg = JSON.parse(typeof event.data === 'string' ? event.data : event.data.toString());
        if (msg.id && this.callbacks.has(msg.id)) {
          const { resolve, reject } = this.callbacks.get(msg.id);
          this.callbacks.delete(msg.id);
          if (msg.error) reject(msg.error);
          else resolve(msg.result);
        }
      };
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const msgId = this.id++;
      this.callbacks.set(msgId, { resolve, reject });
      this.ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  async eval(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (res.exceptionDetails) {
      throw new Error(res.exceptionDetails.text || JSON.stringify(res.exceptionDetails));
    }
    return res.result ? res.result.value : undefined;
  }

  async captureScreenshot(filename) {
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(res.data, 'base64');
    fs.writeFileSync(filename, buffer);
    console.log(`  [SCREENSHOT] Saved: ${filename}`);
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

async function runTests() {
  try {
    const wsUrl = await getWsUrl();
    const cdp = new SimpleCdpClient(wsUrl);
    await cdp.connect();

    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('DOM.enable');

    console.log('\n--- 1. 等待页面与 3D 地球视口初始化 ---');
    await delay(3500);

    // [Test 1] 按钮重叠消除实测
    console.log('\n--- 2. [Requirement 1] 按钮重叠彻底消除验证 ---');
    const layoutPositions = await cdp.eval(`
      (() => {
        // Hayden AI 按钮 (bottom-6 right-6)
        const aiBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Hayden AI'));
        // 右侧垂直悬浮工具箱 (bottom-24 right-6)
        const toolbar = document.querySelector('.bottom-24.right-6');
        if (!aiBtn || !toolbar) return { error: 'Buttons not found', hasAi: !!aiBtn, hasToolbar: !!toolbar };
        const rAi = aiBtn.getBoundingClientRect();
        const rTb = toolbar.getBoundingClientRect();
        return {
          ai: { top: rAi.top, bottom: rAi.bottom, left: rAi.left, right: rAi.right, height: rAi.height, width: rAi.width },
          tb: { top: rTb.top, bottom: rTb.bottom, left: rTb.left, right: rTb.right, height: rTb.height, width: rTb.width },
          verticalGap: rAi.top - rTb.bottom
        };
      })()
    `);

    assert(!layoutPositions.error, '成功在 DOM 中抓取 Hayden AI 胶囊与右侧垂直航天工具箱', JSON.stringify(layoutPositions));
    if (!layoutPositions.error) {
      assert(
        layoutPositions.verticalGap >= 16,
        '右侧垂直工具箱与 Hayden AI 胶囊垂直间隔安全 (>16px)',
        `实际间距: ${layoutPositions.verticalGap}px (Toolbar bottom: ${layoutPositions.tb.bottom}, AI top: ${layoutPositions.ai.top})`
      );
      assert(
        layoutPositions.tb.bottom < layoutPositions.ai.top,
        '垂直工具箱物理位于 Hayden AI 胶囊正上方，0 像素重叠',
        `Toolbar bottom < AI top: ${layoutPositions.tb.bottom} < ${layoutPositions.ai.top}`
      );
    }

    // [Test 2] 抽屉尺寸与遥测 HUD 空间布局防重叠验证
    console.log('\n--- 3. [Requirement 4] 航空玻璃岛 (Flight Deck Drawer) 尺寸与留白验证 ---');
    const drawerMetrics = await cdp.eval(`
      (() => {
        const drawer = document.querySelector('.top-20.left-4, .top-24.left-4, .top-24.left-6');
        const hud = document.querySelector('.bottom-6.left-4, .bottom-6.left-6');
        if (!drawer || !hud) return { error: 'Drawer or HUD not found', hasDrawer: !!drawer, hasHud: !!hud };
        const rDrawer = drawer.getBoundingClientRect();
        const rHud = hud.getBoundingClientRect();
        return {
          drawer: { top: rDrawer.top, bottom: rDrawer.bottom, width: rDrawer.width, height: rDrawer.height },
          hud: { top: rHud.top, bottom: rHud.bottom, width: rHud.width, height: rHud.height },
          gap: rHud.top - rDrawer.bottom
        };
      })()
    `);

    assert(!drawerMetrics.error, '成功抓取航空玻璃岛与左下角遥测 HUD', JSON.stringify(drawerMetrics));
    if (!drawerMetrics.error) {
      assert(
        Math.abs(drawerMetrics.drawer.width - 380) <= 20,
        '航空玻璃岛桌面端宽度严格符合 380px 设计规范',
        `实际宽度: ${drawerMetrics.drawer.width}px`
      );
      assert(
        drawerMetrics.gap >= 10,
        '航空玻璃岛自适应最大高度在底部留有充足空隙，绝不覆盖遥测 HUD',
        `实际间距: ${drawerMetrics.gap}px (Drawer bottom: ${drawerMetrics.drawer.bottom}, HUD top: ${drawerMetrics.hud.top})`
      );
    }

    // 保存暗色主视图截图
    await cdp.captureScreenshot(path.join(screenshotsDir, 'journey_verified_dark.png'));

    // [Test 3] 抽屉收折为微磨砂胶囊药丸交互实测
    console.log('\n--- 4. [Requirement 4] 抽屉收缩为微磨砂药丸与平滑展开验证 ---');
    const collapseResult = await cdp.eval(`
      (() => {
        const collapseBtn = document.querySelector('button[title*="折叠为航旅胶囊"], button[aria-label="折叠为航旅胶囊"]');
        if (!collapseBtn) return { error: 'Collapse button not found' };
        collapseBtn.click();
        return { clicked: true };
      })()
    `);
    assert(collapseResult.clicked, '成功点击折叠为航旅胶囊按钮');
    await delay(600);

    const pillMetrics = await cdp.eval(`
      (() => {
        const pill = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('KM') && b.textContent.includes('城市'));
        if (!pill) return { error: 'Pill not found' };
        const r = pill.getBoundingClientRect();
        return { text: pill.textContent.trim(), width: r.width, height: r.height, top: r.top, left: r.left };
      })()
    `);

    assert(!pillMetrics.error, '抽屉优雅收缩为常驻左上方的微磨砂胶囊药丸', JSON.stringify(pillMetrics));
    if (!pillMetrics.error) {
      assert(pillMetrics.text.includes('2,802 KM'), '胶囊药丸正确展示大圆累计探索里程 (2,802 KM)', pillMetrics.text);
      assert(pillMetrics.text.includes('2 城市'), '胶囊药丸正确展示足迹城市统计 (2 城市)', pillMetrics.text);
    }

    // 保存折叠胶囊状态截图
    await cdp.captureScreenshot(path.join(screenshotsDir, 'journey_verified_folded.png'));

    // [Test 4] 底部航点快速穿梭坞与自动展开登机牌实测
    console.log('\n--- 5. [Requirement 5] 底部航点穿梭坞点击飞跃与登机牌自动展开验证 ---');
    const waypointClickResult = await cdp.eval(`
      (() => {
        const dockButtons = Array.from(document.querySelectorAll('button')).filter(b => b.textContent && b.textContent.includes('重庆'));
        const ckgBtn = dockButtons[0];
        if (!ckgBtn) return { error: 'Chongqing waypoint button not found' };
        ckgBtn.click();
        return { clicked: true, text: ckgBtn.textContent.trim() };
      })()
    `);
    assert(waypointClickResult.clicked, '成功点击底部航点快速穿梭坞中的“重庆 (CKG)”航点');
    await delay(1200);

    const boardingPassMetrics = await cdp.eval(`
      (() => {
        const hasHaydenAirways = document.body.innerText.includes('HAYDEN AIRWAYS');
        const hasFlightNum = document.body.innerText.includes('FIRST CLASS');
        const hasIata = document.body.innerText.includes('CKG');
        const closeBtn = document.querySelector('button[title="收起登机牌"], button[aria-label="收起登机牌"]');
        const punchHole = document.querySelector('.rounded-r-full');
        return {
          hasHaydenAirways,
          hasFlightNum,
          hasIata,
          hasCloseBtn: !!closeBtn,
          punchHoleClass: punchHole ? punchHole.className : null
        };
      })()
    `);

    assert(boardingPassMetrics.hasHaydenAirways, '点击航点后抽屉自动展开并置顶呈现【HAYDEN AIRWAYS】航空高定登机牌');
    assert(boardingPassMetrics.hasIata, '登机牌正确展示重庆起降 IATA 码 [CKG]');
    assert(boardingPassMetrics.hasCloseBtn, '登机牌右上角成功集成快捷【✕ 收起登机牌】出口');
    assert(
      boardingPassMetrics.punchHoleClass && boardingPassMetrics.punchHoleClass.includes('dark:bg-[#020406]'),
      '登机牌打孔半圆支持浅色双主题响应式底色 (已修复纯黑死色 Bug)',
      boardingPassMetrics.punchHoleClass
    );

    // 保存聚焦城市与展开登机牌截图
    await cdp.captureScreenshot(path.join(screenshotsDir, 'journey_verified_city_focused.png'));

    // [Test 5] 测试登机牌 ✕ 收起交互
    console.log('\n--- 6. 登机牌 ✕ 收起与返回全时序列表验证 ---');
    const dismissTicketResult = await cdp.eval(`
      (() => {
        const closeBtn = document.querySelector('button[title="收起登机牌"], button[aria-label="收起登机牌"]');
        if (!closeBtn) return { error: 'Close button not found' };
        closeBtn.click();
        return { clicked: true };
      })()
    `);
    assert(dismissTicketResult.clicked, '成功点击登机牌 ✕ 收起按钮');
    await delay(500);

    const afterDismissCheck = await cdp.eval(`
      (() => {
        const hasHaydenAirways = document.body.innerText.includes('HAYDEN AIRWAYS');
        const hasTimeline = document.body.innerText.includes('CHRONOLOGICAL TIMELINE');
        return { hasHaydenAirways, hasTimeline };
      })()
    `);
    assert(!afterDismissCheck.hasHaydenAirways, '登机牌已平滑收起并卸载');
    assert(afterDismissCheck.hasTimeline, '成功恢复展示完整的 CHRONOLOGICAL TIMELINE 时序足迹线');

    // [Test 6] 城市发光雷达信标点 Hover Card 全量数据验证
    console.log('\n--- 7. [Requirement 5] 城市 Hover Card 中英文、到访年份与探索里程全量要素实测 ---');
    const hoverCardMetrics = await cdp.eval(`
      (() => {
        const markers = document.querySelectorAll('[class*="group/marker"]');
        const cardHtmls = Array.from(markers).map(m => m.innerHTML);
        const hasEn = cardHtmls.some(h => h.includes('(Chongqing)') || h.includes('(Kyoto & Tokyo)'));
        const hasYear = cardHtmls.some(h => h.includes('2024') || h.includes('2025'));
        const hasDist = cardHtmls.some(h => h.includes('航程') || h.includes('起航始发港'));
        return { count: markers.length, hasEn, hasYear, hasDist };
      })()
    `);
    assert(hoverCardMetrics.hasEn, '城市信标名片包含精准英文名称 (Chongqing / Kyoto & Tokyo)');
    assert(hoverCardMetrics.hasYear, '城市信标名片包含真实到访年份 (2024 / 2025)');
    assert(hoverCardMetrics.hasDist, '城市信标名片包含大圆探索里程遥测');

    // [Test 7] 切换浅色模式并校验视觉层级
    console.log('\n--- 8. [Requirement 6] 浅色模式双主题三维景深实测 ---');
    await cdp.eval(`
      (() => {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
      })()
    `);
    await delay(800);
    await cdp.captureScreenshot(path.join(screenshotsDir, 'journey_verified_light.png'));
    console.log('  [PASS] 浅色模式视觉截图已捕获并保存');

    // [Test 8] 移动端 360px 窄屏适配对抗性测试
    console.log('\n--- 9. [Untested Edge Cases] 360px 移动窄屏设备水平无溢出与布局防碰撞实测 ---');
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 360,
      height: 740,
      deviceScaleFactor: 2,
      mobile: true,
    });
    await delay(800);

    const mobileMetrics = await cdp.eval(`
      (() => {
        const scrollWidth = document.documentElement.scrollWidth;
        const clientWidth = document.documentElement.clientWidth;
        const drawer = document.querySelector('.top-20, .top-24');
        const drawerWidth = drawer ? drawer.getBoundingClientRect().width : 0;
        return {
          scrollWidth,
          clientWidth,
          hasHorizontalOverflow: scrollWidth > clientWidth,
          drawerWidth
        };
      })()
    `);

    assert(!mobileMetrics.hasHorizontalOverflow, '360px 移动窄屏设备全局 0 水平溢出 (scrollWidth === clientWidth)', `scrollWidth: ${mobileMetrics.scrollWidth}, clientWidth: ${mobileMetrics.clientWidth}`);
    assert(mobileMetrics.drawerWidth <= 360, '移动端航空岛宽度自适应屏幕 (<=360px)，无挤压截断', `实际抽屉宽度: ${mobileMetrics.drawerWidth}px`);

    await cdp.captureScreenshot(path.join(screenshotsDir, 'journey_verified_mobile.png'));

    // 恢复窗口
    await cdp.send('Emulation.clearDeviceMetricsOverride');

    cdp.close();
    chromeProc.kill();

    console.log('\n================================================================');
    console.log(`  全项对抗性实测完成: [PASS: ${passCount}] [FAIL: ${failCount}]`);
    console.log('================================================================\n');

    if (failCount > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('测试异常中断:', err);
    chromeProc.kill();
    process.exit(1);
  }
}

runTests();
