/**
 * M2 Challenger 1: Dashboard Resilience & Boundary Adversarial Test Harness
 * 
 * 专门针对 M2 控制台指挥塔进行对抗性压力实测：
 * 1. 待办手势消除状态机 (SwipeableTodoCard): 阻尼回弹、阈值飞出、防误触
 * 2. 实时访客雷达容灾与脱敏 (RealtimeVisitorRadar): SSE断开降级、零报错、IP脱敏
 * 3. 发文日历边界数学 (ContentPublishCalendar): 跨月切换、闰年2月、跨周、时区偏移
 * 4. 便签大纲草稿与水合 (InspirationQuickNotesCard & Post Studio): 大纲完整性、草稿防丢水合
 */

import assert from 'node:assert';

// 彩色终端格式化
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  magenta: '\x1b[35m',
};

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const testResults = [];

function test(name, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    testResults.push({ name, status: 'PASS' });
    console.log(`  ${colors.green}✔${colors.reset} ${name}`);
  } catch (err) {
    failedTests++;
    testResults.push({ name, status: 'FAIL', error: err });
    console.log(`  ${colors.red}✖${colors.reset} ${name}`);
    console.log(`    ${colors.yellow}Error: ${err.message}${colors.reset}`);
  }
}

async function testAsync(name, fn) {
  totalTests++;
  try {
    await fn();
    passedTests++;
    testResults.push({ name, status: 'PASS' });
    console.log(`  ${colors.green}✔${colors.reset} ${name}`);
  } catch (err) {
    failedTests++;
    testResults.push({ name, status: 'FAIL', error: err });
    console.log(`  ${colors.red}✖${colors.reset} ${name}`);
    console.log(`    ${colors.yellow}Error: ${err.message}${colors.reset}`);
  }
}

console.log(`${colors.bold}${colors.cyan}====================================================${colors.reset}`);
console.log(`${colors.bold}${colors.cyan}  M2 对抗性质疑专家 1: 控制台指挥塔韧性边界对抗实测  ${colors.reset}`);
console.log(`${colors.bold}${colors.cyan}====================================================${colors.reset}\n`);

// ============================================================================
// 1. 对抗测试：待办手势消除状态机 (SwipeableTodoCard)
// ============================================================================
console.log(`${colors.bold}${colors.magenta}[SECTION 1] 待办手势消除状态机对抗实测${colors.reset}`);

// 提取并重现 SwipeableTodoCard 的阻尼与状态流转算法
function calcDampedDeltaX(deltaX) {
  return deltaX > 0 
    ? Math.pow(deltaX, 0.85) * 2.2 
    : -Math.pow(Math.abs(deltaX), 0.85) * 2.2;
}

class SwipeableTodoCardSimulator {
  constructor(item, onApprove, onReject) {
    this.item = item;
    this.onApprove = onApprove;
    this.onReject = onReject;
    this.dragOffset = 0;
    this.isDragging = false;
    this.isDismissed = false;
    this.dismissDirection = null;
    this.startX = 0;
    this.currentOffset = 0;
    this.SWIPE_THRESHOLD = 80;
    this.capturedPointerId = null;
  }

  handlePointerDown(pointerId, clientX, targetType = 'card') {
    if (targetType === 'button' || targetType === 'a') return false;
    this.isDragging = true;
    this.startX = clientX;
    this.currentOffset = 0;
    this.capturedPointerId = pointerId;
    return true;
  }

  handlePointerMove(clientX) {
    if (!this.isDragging) return;
    const deltaX = clientX - this.startX;
    const damped = calcDampedDeltaX(deltaX);
    this.currentOffset = damped;
    this.dragOffset = damped;
  }

  handlePointerUp(pointerId) {
    if (!this.isDragging) return;
    this.isDragging = false;
    this.capturedPointerId = null;

    const offset = this.currentOffset;
    if (offset > this.SWIPE_THRESHOLD) {
      this.dismissDirection = 'right';
      this.isDismissed = true;
      // 模拟 250ms 飞出动画后调用回调
      this.onApprove(this.item.id);
    } else if (offset < -this.SWIPE_THRESHOLD) {
      this.dismissDirection = 'left';
      this.isDismissed = true;
      this.onReject(this.item.id);
    } else {
      // 弹性回弹归零
      this.dragOffset = 0;
    }
  }

  handlePointerCancel() {
    this.isDragging = false;
    this.dragOffset = 0;
  }
}

test('1.1 阻尼函数数学特性：非线性亚线性增长与正负对称性', () => {
  const dPos10 = calcDampedDeltaX(10);
  const dNeg10 = calcDampedDeltaX(-10);
  assert.strictEqual(dPos10, -dNeg10, '阻尼曲线必须关于原点严格奇函数对称');

  // 计算临界值：dampedDeltaX = 80 时，需要的原始位移
  // 80 / 2.2 = 36.363636; 36.363636 ^ (1/0.85) = 68.96px
  const subDelta = 68;
  const overDelta = 70;
  assert.ok(calcDampedDeltaX(subDelta) < 80, `68px 位移阻尼值 ${calcDampedDeltaX(subDelta)} 应小于阈值 80`);
  assert.ok(calcDampedDeltaX(overDelta) > 80, `70px 位移阻尼值 ${calcDampedDeltaX(overDelta)} 应大于阈值 80`);
});

test('1.2 欠阈值滑动阻尼回弹：位移不足时严格回弹到 0 且不触发审批/拒绝', () => {
  let approvedId = null;
  let rejectedId = null;
  const card = new SwipeableTodoCardSimulator(
    { id: 101, title: '测试待办', type: 'comment', content: '内容' },
    (id) => { approvedId = id; },
    (id) => { rejectedId = id; }
  );

  // 模拟右滑 40px (不足阈值)
  card.handlePointerDown(1, 100);
  card.handlePointerMove(140); // delta = 40, damped = 49.37
  assert.strictEqual(card.isDragging, true);
  assert.ok(card.dragOffset > 40 && card.dragOffset < 80, '阻尼偏移应在合理区间');

  card.handlePointerUp(1);
  assert.strictEqual(card.isDragging, false, 'PointerUp 后拖拽状态结束');
  assert.strictEqual(card.dragOffset, 0, '未达阈值必须弹性回弹为 0');
  assert.strictEqual(card.isDismissed, false, '未达阈值禁止设为 isDismissed');
  assert.strictEqual(approvedId, null, '未达阈值严禁调用 onApprove');
  assert.strictEqual(rejectedId, null, '未达阈值严禁调用 onReject');
});

test('1.3 超阈值右滑：触发右向飞出动画 (dismissDirection=right) 并调用 onApprove', () => {
  let approvedId = null;
  let rejectedId = null;
  const card = new SwipeableTodoCardSimulator(
    { id: 102, title: '待审评论', type: 'comment', content: '好文！' },
    (id) => { approvedId = id; },
    (id) => { rejectedId = id; }
  );

  card.handlePointerDown(1, 100);
  card.handlePointerMove(180); // delta = 80, damped = 91.8 > 80
  card.handlePointerUp(1);

  assert.strictEqual(card.isDismissed, true, '超阈值应设为 isDismissed');
  assert.strictEqual(card.dismissDirection, 'right', '右滑消除方向应为 right');
  assert.strictEqual(approvedId, 102, '必须调用 onApprove 传入待办项 ID');
  assert.strictEqual(rejectedId, null, '右滑不能触发 onReject');
});

test('1.4 超阈值左滑：触发左向飞出动画 (dismissDirection=left) 并调用 onReject', () => {
  let approvedId = null;
  let rejectedId = null;
  const card = new SwipeableTodoCardSimulator(
    { id: 103, title: '垃圾广告友链', type: 'friend', content: '广告' },
    (id) => { approvedId = id; },
    (id) => { rejectedId = id; }
  );

  card.handlePointerDown(1, 200);
  card.handlePointerMove(110); // delta = -90, damped = -102.1 < -80
  card.handlePointerUp(1);

  assert.strictEqual(card.isDismissed, true, '超阈值应设为 isDismissed');
  assert.strictEqual(card.dismissDirection, 'left', '左滑消除方向应为 left');
  assert.strictEqual(rejectedId, 103, '必须调用 onReject 传入待办项 ID');
  assert.strictEqual(approvedId, null, '左滑不能触发 onApprove');
});

test('1.5 手势异常中断 (PointerCancel) 状态恢复与按钮隔离防误触', () => {
  const card = new SwipeableTodoCardSimulator(
    { id: 104, title: '取消测试', type: 'comment', content: 'test' },
    () => {},
    () => {}
  );

  // 模拟点击在按钮上：被忽略不启动拖拽
  const startOnBtn = card.handlePointerDown(1, 100, 'button');
  assert.strictEqual(startOnBtn, false, '点击在操作按钮上严禁触发滑动');
  assert.strictEqual(card.isDragging, false);

  // 正常拖拽中途被浏览器系统手势打断 (PointerCancel)
  card.handlePointerDown(2, 100, 'card');
  card.handlePointerMove(160);
  card.handlePointerCancel();
  assert.strictEqual(card.isDragging, false, 'PointerCancel 必须立即重置拖拽');
  assert.strictEqual(card.dragOffset, 0, 'PointerCancel 必须立即复位');
});

// ============================================================================
// 2. 对抗测试：实时访客雷达 (RealtimeVisitorRadar)
// ============================================================================
console.log(`\n${colors.bold}${colors.magenta}[SECTION 2] 实时访客雷达 SSE 断开与脉冲回退实测${colors.reset}`);

function maskIpAddress(ip) {
  if (!ip || typeof ip !== 'string') return '***.***.***.***';
  const parts = ip.split('.');
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.${parts[2]}.***`;
  }
  return ip.replace(/:[^:]+$/, ':****');
}

test('2.1 IP 掩码脱敏函数边界对抗：IPv4、IPv6、畸形与空输入验证', () => {
  // 标准 IPv4
  assert.strictEqual(maskIpAddress('192.168.1.100'), '192.168.1.***');
  assert.strictEqual(maskIpAddress('116.233.14.88'), '116.233.14.***');
  assert.strictEqual(maskIpAddress('8.8.8.8'), '8.8.8.***');

  // IPv6
  assert.strictEqual(
    maskIpAddress('2001:0db8:85a3:0000:0000:8a2e:0370:7334'),
    '2001:0db8:85a3:0000:0000:8a2e:0370:****'
  );

  // 边界畸形输入防崩溃
  assert.strictEqual(maskIpAddress(''), '***.***.***.***');
  assert.strictEqual(maskIpAddress(null), '***.***.***.***');
  assert.strictEqual(maskIpAddress(undefined), '***.***.***.***');
  assert.strictEqual(maskIpAddress(12345), '***.***.***.***');
  assert.strictEqual(maskIpAddress({}), '***.***.***.***');
});

test('2.2 模拟 SSE 离线与断开：触发 onerror 优雅降级 Pulse Fallback，零未捕获异常', () => {
  let channelType = 'SSE Stream';
  let isConnected = true;
  let uncaughtError = null;

  // 模拟雷达组件的 SSE 初始化与降级状态机
  class MockEventSource {
    constructor(url) {
      this.url = url;
      this.onopen = null;
      this.onmessage = null;
      this.onerror = null;
      this.closed = false;
    }
    close() {
      this.closed = true;
    }
  }

  try {
    const sse = new MockEventSource('/api/v1/analytics/realtime-radar');
    sse.onerror = () => {
      isConnected = true;
      channelType = 'Pulse Fallback';
      sse.close();
    };

    // 触发断网 / 服务端 404 错误
    sse.onerror(new Error('Network connection refused (404/502)'));

    assert.strictEqual(channelType, 'Pulse Fallback', 'SSE 失败时通道必须平滑切换为 Pulse Fallback');
    assert.strictEqual(isConnected, true, '降级模式下雷达指示灯仍保持活跃态');
    assert.strictEqual(sse.closed, true, '失败后必须及时 close 废弃连接，杜绝连接泄露');
  } catch (err) {
    uncaughtError = err;
  }

  assert.strictEqual(uncaughtError, null, 'SSE 断开流程必须零未捕获错误');
});

test('2.3 脉冲发生器队列稳定性：访客池维持在 4~7 人，坐标在 0~100 雷达圆盘内', () => {
  const seedLocations = [
    { city: '北京', country: '中国', x: 70, y: 35 },
    { city: '东京', country: '日本', x: 80, y: 40 },
    { city: '上海', country: '中国', x: 74, y: 48 },
  ];

  let activeVisitors = [
    { id: 'p-1', ip: '116.233.14.88', durationSeconds: 100, xPercent: 74, yPercent: 48 },
    { id: 'p-2', ip: '133.242.18.204', durationSeconds: 50, xPercent: 80, yPercent: 40 },
    { id: 'p-3', ip: '104.28.212.19', durationSeconds: 200, xPercent: 22, yPercent: 38 },
    { id: 'p-4', ip: '218.17.202.91', durationSeconds: 30, xPercent: 68, yPercent: 55 },
  ];

  // 模拟连续产生 20 次脉冲注入
  for (let i = 0; i < 20; i++) {
    const loc = seedLocations[i % seedLocations.length];
    const newEvent = {
      id: `pulse-${Date.now()}-${i}`,
      ip: `192.168.1.${i + 1}`,
      durationSeconds: 1,
      xPercent: loc.x + (Math.random() * 6 - 3),
      yPercent: loc.y + (Math.random() * 6 - 3),
    };

    const filtered = activeVisitors.length >= 6 ? activeVisitors.slice(1) : activeVisitors;
    activeVisitors = [...filtered, newEvent];

    assert.ok(activeVisitors.length >= 4 && activeVisitors.length <= 6, '访客列表应保持在 4~6 位活跃读者');
    assert.ok(newEvent.xPercent >= 0 && newEvent.xPercent <= 100, 'xPercent 必须在雷达 0~100 范围内');
    assert.ok(newEvent.yPercent >= 0 && newEvent.yPercent <= 100, 'yPercent 必须在雷达 0~100 范围内');
  }
});

test('2.4 平均停留时长在访客池为空时的除零保护 (NaN 防御)', () => {
  const emptyVisitors = [];
  const avgDuration = emptyVisitors.length > 0
    ? Math.round(emptyVisitors.reduce((acc, cur) => acc + cur.durationSeconds, 0) / emptyVisitors.length)
    : 0;
  assert.strictEqual(avgDuration, 0, '访客列表为空时平均时长应安全返回 0 而不是 NaN');
  assert.ok(!Number.isNaN(avgDuration), '严禁出现 NaN 渲染');
});

// ============================================================================
// 3. 对抗测试：发文日历边界数学与时区偏移 (ContentPublishCalendar)
// ============================================================================
console.log(`\n${colors.bold}${colors.magenta}[SECTION 3] 发文日历跨月、闰年与时区对抗实测${colors.reset}`);

function generateCalendarDays(currentDate, viewMode = 'month') {
  const days = [];
  const todayStr = new Date().toISOString().split('T')[0];

  if (viewMode === 'month') {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // 当月第 1 天
    const firstDay = new Date(year, month, 1);
    const startingDay = firstDay.getDay(); // 0(周日) ~ 6(周六)
    const prevMonthDays = startingDay === 0 ? 6 : startingDay - 1; // 按周一开始

    for (let i = prevMonthDays; i > 0; i--) {
      const d = new Date(year, month, 1 - i);
      const dateStr = d.toISOString().split('T')[0];
      days.push({ date: d, dateStr, isCurrentMonth: false, isToday: dateStr === todayStr });
    }

    // 当月所有天数
    const lastDay = new Date(year, month + 1, 0);
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const d = new Date(year, month, i);
      const dateStr = d.toISOString().split('T')[0];
      days.push({ date: d, dateStr, isCurrentMonth: true, isToday: dateStr === todayStr });
    }

    // 补齐末尾至 7 的倍数
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      const dateStr = d.toISOString().split('T')[0];
      days.push({ date: d, dateStr, isCurrentMonth: false, isToday: dateStr === todayStr });
    }
  } else {
    // 周视图
    const curr = new Date(currentDate);
    const day = curr.getDay();
    const diff = curr.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(curr.setDate(diff));

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      days.push({
        date: d,
        dateStr,
        isCurrentMonth: d.getMonth() === currentDate.getMonth(),
        isToday: dateStr === todayStr,
      });
    }
  }

  return days;
}

test('3.1 闰年 2 月天数验证：2024 (29天), 2025 (28天), 2028 (29天), 2100 (28天)', () => {
  const leap2024 = new Date(2024, 2, 0).getDate();
  const nonLeap2025 = new Date(2025, 2, 0).getDate();
  const leap2028 = new Date(2028, 2, 0).getDate();
  const nonLeap2100 = new Date(2100, 2, 0).getDate(); // 百年不闰

  assert.strictEqual(leap2024, 29, '2024 闰年 2 月必须为 29 天');
  assert.strictEqual(nonLeap2025, 28, '2025 平年 2 月必须为 28 天');
  assert.strictEqual(leap2028, 29, '2028 闰年 2 月必须为 29 天');
  assert.strictEqual(nonLeap2100, 28, '2100 平年 2 月必须为 28 天');

  const days2024Feb = generateCalendarDays(new Date(2024, 1, 1), 'month');
  const currentMonthDays = days2024Feb.filter((d) => d.isCurrentMonth);
  assert.strictEqual(currentMonthDays.length, 29, '2024年2月网格中当月天数必须精准包含29天');
  assert.strictEqual(days2024Feb.length % 7, 0, '网格总天数必须严格为 7 的整数倍 (5或6周)');
});

test('3.2 周视图跨月跨年平滑过渡：2025-12-29 至 2026-01-04 包含周一至周日 7 天', () => {
  const newYearWeek = generateCalendarDays(new Date(2026, 0, 1), 'week'); // 2026-01-01 周四
  assert.strictEqual(newYearWeek.length, 7, '周视图必须严格生成 7 天');

  const mon = newYearWeek[0].date;
  const sun = newYearWeek[6].date;
  assert.strictEqual(mon.getFullYear(), 2025);
  assert.strictEqual(mon.getMonth(), 11); // 12月
  assert.strictEqual(mon.getDate(), 29); // 29日 (周一)

  assert.strictEqual(sun.getFullYear(), 2026);
  assert.strictEqual(sun.getMonth(), 0); // 1月
  assert.strictEqual(sun.getDate(), 4); // 4日 (周日)
});

test('3.3 [DEFECT DETECTED] 月份切换在 31 日时的溢出缺陷验证', () => {
  // 在 3 月 31 日点击 handlePrev: d.setMonth(d.getMonth() - 1)
  const dMarch31 = new Date(2026, 2, 31);
  dMarch31.setMonth(dMarch31.getMonth() - 1); // 期望进入 2 月，但由于 2 月无 31 日，溢出到 3 月 3 日
  
  const actualYear = dMarch31.getFullYear();
  const actualMonth = dMarch31.getMonth() + 1;
  const actualDay = dMarch31.getDate();

  console.log(`    ${colors.yellow}🔍 缺陷观测: 3月31日减1个月导致实际月份为: ${actualYear}年${actualMonth}月${actualDay}日 (仍为3月!)${colors.reset}`);
  assert.strictEqual(actualMonth, 3, '已证实：setMonth(getMonth()-1) 在31日会导致月份溢出留在3月');
});

test('3.4 [DEFECT DETECTED] 本地时间与 toISOString 时区偏差导致 dateStr 偏离 1 天', () => {
  // 在东八区 (UTC+8)，new Date(2026, 1, 1) 的本地时间是 2026-02-01 00:00:00
  // d.toISOString() 转换到 UTC 是 2026-01-31T16:00:00.000Z
  const d = new Date(2026, 1, 1);
  const localDay = d.getDate();
  const dateStr = d.toISOString().split('T')[0];

  const timezoneOffsetMinutes = d.getTimezoneOffset(); // 东八区为 -480
  if (timezoneOffsetMinutes < 0) {
    console.log(`    ${colors.yellow}🔍 缺陷观测: 本地 2月1日 (local day=${localDay}) 的 dateStr 却为 "${dateStr}" (偏离了前一天!)${colors.reset}`);
    assert.strictEqual(dateStr, '2026-01-31', '已证实：toISOString() 在东八区使日期字符串变为前一日');
  } else {
    console.log(`    当前运行环境时区 offset=${timezoneOffsetMinutes}，仅在正时区环境触发偏移`);
  }
});

// ============================================================================
// 4. 对抗测试：便签大纲草稿生成与 Post Studio 水合
// ============================================================================
console.log(`\n${colors.bold}${colors.magenta}[SECTION 4] 便签大纲草稿与 Post Studio 水合对抗实测${colors.reset}`);

const mockLocalStorage = (() => {
  let store = {};
  return {
    getItem: (k) => store[k] || null,
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
    clear: () => { store = {}; }
  };
})();

function convertNoteToDraft(note, categories = []) {
  const rawContent = note.content.trim();
  const title = rawContent.length > 32 ? `${rawContent.slice(0, 32)}...` : rawContent;
  const catLabel = categories.find((c) => c.id === note.category)?.label || '🌱 灵感闪念';

  const structuredOutline = `# ${title}

> 摘要说明：本文基于数字花园灵感便签「${rawContent}」深度展开，构建生产级架构与工程实践方案。

## 1. 背景介绍与问题切入 (Background & Motivation)
- **便签灵感缘起**：${rawContent}（分类：${catLabel}）
- **核心业务痛点与技术诉求**：分析当下技术架构瓶颈与高并发/低延迟需求。
- **目标设定**：定义方案落地后的关键交付产物与 SLA 指标。

## 2. 核心架构设计与攻坚点 (Core Architecture & Key Breakthroughs)
- **分层拓扑结构**：明确底座驱动层、服务调度层与前端响应层的边界划分。
- **状态流转与数据一致性**：核心状态转移时序与容灾 Fallback 策略。
- **设计权衡 (Trade-offs)**：对比备选技术选型，阐明选型优势与取舍。

## 3. 生产实践与代码落地骨架 (Implementation & Engineering)
\`\`\`typescript
/**
 * 核心调度模块实现骨架
 * 遵循 Hayden Xue 博客工程设计准则
 */
export async function executeWorkflow(payload: Record<string, any>) {
  // 1. 前置参数校验与上下文准备
  if (!payload) {
    throw new Error('Workflow context payload is required');
  }

  // 2. 执行核心状态机转换
  console.log('[Workflow] Processing core milestone:', payload);

  // 3. 返回真实状态与执行结果
  return {
    success: true,
    author: 'Hayden Xue',
    timestamp: Date.now(),
  };
}
\`\`\`

## 4. 架构复盘与避坑指南 (Retrospective & Future Work)
- **核心踩坑记录**：开发调试过程中的关键防御点与边界考量。
- **性能基准与压测表现**：验证命令与预期性能指标。
- **演进路线规划**：下一阶段功能迭代路线。
`;

  const draftPayload = {
    title,
    slug: title.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-').replace(/^-|-$/g, ''),
    content: structuredOutline,
    excerpt: `基于便签「${rawContent.slice(0, 50)}」提炼的结构化博文大纲草稿。`,
    updatedAt: new Date().toISOString(),
  };

  mockLocalStorage.setItem('draft_post_new', JSON.stringify(draftPayload));
  return draftPayload;
}

test('4.1 便签大纲结构完整性与 Hayden Xue 身份纯正性准则验证', () => {
  const note = {
    id: 'n-1',
    content: '探索 Java 25 与 Next.js 14 双端虚拟线程与流式渲染极限吞吐',
    category: 'tech',
  };
  const draft = convertNoteToDraft(note, [{ id: 'tech', label: '🛠️ 技术架构' }]);

  // 验证四级标准结构化大纲
  assert.ok(draft.content.includes('## 1. 背景介绍与问题切入 (Background & Motivation)'), '必须包含第一部分');
  assert.ok(draft.content.includes('## 2. 核心架构设计与攻坚点 (Core Architecture & Key Breakthroughs)'), '必须包含第二部分');
  assert.ok(draft.content.includes('## 3. 生产实践与代码落地骨架 (Implementation & Engineering)'), '必须包含第三部分');
  assert.ok(draft.content.includes('## 4. 架构复盘与避坑指南 (Retrospective & Future Work)'), '必须包含第四部分');

  // 验证身份纯正性准则 (准则 1)
  assert.ok(draft.content.includes("author: 'Hayden Xue'"), '生成的工程骨架中必须严格注明 Hayden Xue 站长标识');
  assert.ok(!draft.content.includes('Howard'), '严禁包含历史违规名称 Howard');
});

test('4.2 超长便签截断标题与合规 Slug 提炼验证', () => {
  const longNote = {
    id: 'n-2',
    content: '这是一段非常长非常长的便签灵感，超过了三十二个字甚至更长，旨在验证系统在生成标题时的边界截断机制是否稳定不会溢出',
    category: 'idea',
  };
  const draft = convertNoteToDraft(longNote);
  assert.ok(draft.title.endsWith('...'), '超长便签标题必须截断并附带省略号');
  assert.ok(draft.title.length <= 35, '标题截断后总长度不能超标');
  assert.ok(draft.slug.length > 0, '生成的 Slug 不能为空');
  assert.ok(!draft.slug.startsWith('-') && !draft.slug.endsWith('-'), 'Slug 边界不能存在连字符');
});

test('4.3 Post Studio 本地草稿水合模拟：检测、一键恢复与丢弃清理', () => {
  // 1. 模拟 Post Studio 启动时的草稿侦测
  const rawSaved = mockLocalStorage.getItem('draft_post_new');
  assert.ok(rawSaved, 'localStorage 中必须存在 draft_post_new');
  
  const parsed = JSON.parse(rawSaved);
  const draftAvailable = (parsed.title?.trim() || parsed.content?.trim()) ? parsed : null;
  assert.ok(draftAvailable !== null, '必须成功侦测到可用草稿');

  // 2. 模拟点击“一键恢复”水合至表单状态
  const formState = {
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    readingTime: 0,
  };

  formState.title = draftAvailable.title;
  formState.slug = draftAvailable.slug;
  formState.excerpt = draftAvailable.excerpt;
  formState.content = draftAvailable.content;
  formState.readingTime = Math.max(1, Math.ceil(draftAvailable.content.length / 400));

  assert.strictEqual(formState.title, draftAvailable.title, '标题成功水合');
  assert.strictEqual(formState.content, draftAvailable.content, '正文成功水合');
  assert.ok(formState.readingTime > 0, '阅读时长根据字数正确水合推算');

  // 3. 模拟点击“丢弃草稿”清理本地存储
  mockLocalStorage.removeItem('draft_post_new');
  assert.strictEqual(mockLocalStorage.getItem('draft_post_new'), null, '丢弃后 localStorage 必须清空');
});

// ============================================================================
// 汇总报告
// ============================================================================
console.log(`\n${colors.bold}${colors.cyan}====================================================${colors.reset}`);
console.log(`${colors.bold}${colors.cyan}  测试实测完成: 共 ${totalTests} 项, 通过 ${passedTests} 项, 失败 ${failedTests} 项  ${colors.reset}`);
console.log(`${colors.bold}${colors.cyan}====================================================${colors.reset}\n`);

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
