/**
 * M2 Challenger 2: Analytics Edge Cases & Security Adversarial Test Harness
 * 
 * 针对 M2 访问分析看板 (Analytics) 进行全维度对抗性质疑与压力实测：
 * 1. 阅读滚动深度漏斗数学约束与逆序归一化防溢出测试
 * 2. IP 掩码脱敏函数安全性对抗测试 (IPv4, IPv6, 极端格式, 畸形串, 空串与泄露风险)
 * 3. 双轴财务级图表与时间滑块对抗测试 (7d/30d/实时切换, 全零/单点/空/NaN 除零防御, 十字准星吸附)
 * 4. 站长身份 100% Hayden Xue 纯正性与双主题三维景深物理层级审计
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

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
const findings = [];

function test(name, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ${colors.green}✔${colors.reset} ${name}`);
  } catch (err) {
    failedTests++;
    console.log(`  ${colors.red}✖${colors.reset} ${name}`);
    console.log(`    ${colors.yellow}Error: ${err.message}${colors.reset}`);
  }
}

function recordFinding(category, title, detail, severity = 'MEDIUM') {
  findings.push({ category, title, detail, severity });
  console.log(`    ${colors.magenta}🔍 [DEFECT/OBSERVATION] (${severity}) ${title}: ${detail}${colors.reset}`);
}

console.log(`${colors.bold}${colors.cyan}========================================================================${colors.reset}`);
console.log(`${colors.bold}${colors.cyan}  M2 对抗性质疑专家 2: 访问分析看板极端边界与安全对抗检验  ${colors.reset}`);
console.log(`${colors.bold}${colors.cyan}========================================================================${colors.reset}\n`);

// ============================================================================
// [SECTION 1] 阅读滚动深度漏斗数学约束与逆序数据对抗实测
// ============================================================================
console.log(`${colors.bold}[SECTION 1] 阅读滚动深度漏斗单调性与逆序归一化实测${colors.reset}`);

// 提取并模拟 ReadingDepthFunnelCard 内部核心数学计算逻辑
const defaultFunnelDataset = [
  { id: 'all', title: '全站博文综合阅读深度', views: 12480, depths: { d25: 94, d50: 76, d75: 56, d100: 42 } },
  { id: 1, title: 'Next.js 14 空间流光与 3D WebGL 架构实录', views: 3420, depths: { d25: 96, d50: 82, d75: 64, d100: 51 } },
  { id: 2, title: 'Java 21 虚拟线程在百万长连接中的落地演进', views: 2890, depths: { d25: 92, d50: 71, d75: 49, d100: 36 } },
  { id: 3, title: '从零构建沉浸式数字花园与引力星系图谱', views: 2150, depths: { d25: 95, d50: 78, d75: 58, d100: 44 } },
  { id: 4, title: '深入浅出 MinIO 与云原生对象存储实战', views: 1860, depths: { d25: 91, d50: 73, d75: 53, d100: 38 } },
  { id: 99, title: '外部补充文章', views: 800, depths: { d25: 93, d50: 74, d75: 54, d100: 40 } },
];

test('1.1 内置全量博文与全站综合样本严格满足单调性递减约束 (d25 >= d50 >= d75 >= d100)', () => {
  defaultFunnelDataset.forEach((item) => {
    const { d25, d50, d75, d100 } = item.depths;
    assert.ok(d25 >= d50, `文章 [${item.title}] d25 (${d25}) 必须 >= d50 (${d50})`);
    assert.ok(d50 >= d75, `文章 [${item.title}] d50 (${d50}) 必须 >= d75 (${d75})`);
    assert.ok(d75 >= d100, `文章 [${item.title}] d75 (${d75}) 必须 >= d100 (${d100})`);
    assert.ok(d25 <= 100 && d100 >= 0, `文章 [${item.title}] 深度百分比必须在 [0, 100] 闭区间内`);
  });
});

test('1.2 单调递减漏斗阶段流失率计算非负性检验 (dropOff >= 0)', () => {
  defaultFunnelDataset.forEach((item) => {
    const { d25, d50, d75, d100 } = item.depths;
    const dropOff0to25 = 100 - d25;
    const dropOff25to50 = d25 - d50;
    const dropOff50to75 = d50 - d75;
    const dropOff75to100 = d75 - d100;

    assert.ok(dropOff0to25 >= 0, `首段流失率不可为负: ${dropOff0to25}`);
    assert.ok(dropOff25to50 >= 0, `25%~50% 流失率不可为负: ${dropOff25to50}`);
    assert.ok(dropOff50to75 >= 0, `50%~75% 流失率不可为负: ${dropOff50to75}`);
    assert.ok(dropOff75to100 >= 0, `75%~100% 流失率不可为负: ${dropOff75to100}`);
    
    // 总流失之和必然为 100 - d100
    const totalDrop = dropOff0to25 + dropOff25to50 + dropOff50to75 + dropOff75to100;
    assert.strictEqual(totalDrop, 100 - d100, `各阶段流失之和 (${totalDrop}) 必须精确等于全量流失 (100 - ${d100})`);
  });
});

test('1.3 [ADVERSARIAL] 异常逆序数据注入：验证负流失率渲染与 CSS 宽度溢出风险', () => {
  // 注入对抗性异常逆序数据（例如某采集器上报：d25=30, d50=80, d75=40, d100=90, 或 d25=130 超限）
  const adversarialDepths = { d25: 30, d50: 80, d75: 40, d100: 90 };
  
  const dropOff25to50 = adversarialDepths.d25 - adversarialDepths.d50; // 30 - 80 = -50
  const dropOff75to100 = adversarialDepths.d75 - adversarialDepths.d100; // 40 - 90 = -50

  assert.strictEqual(dropOff25to50, -50, '逆序时未防护的数学差值变为负数');
  
  // 模拟当前组件在负流失时的文字渲染
  const renderedBadge = `流失 -${dropOff25to50}%`;
  assert.strictEqual(renderedBadge, '流失 --50%', '组件前端将呈现异常双负号 "流失 --50%"');

  recordFinding(
    'FUNNEL_ANOMALY',
    '逆序遥测数据未经过防御性单调归一化截断',
    `当遥测上报逆序异常数据 (d25=${adversarialDepths.d25}, d50=${adversarialDepths.d50}) 时，组件会计算出负流失率 (${dropOff25to50}%)，导致 UI 显示 "流失 --50%" 双减号。此外若数据超过 100% (如 130%)，style.width: 130% 会发生 CSS 物理溢出。建议引入 Math.min(100, Math.max(0, ...)) 与单调截断保护。`,
    'MEDIUM'
  );
});

test('1.4 归一化防溢出保护模型算法验证 (Monotonic Clamping Algorithm)', () => {
  // 验证推荐的防溢出与单调性保护函数
  function normalizeFunnelDepths(raw) {
    // 1. 边界限制在 [0, 100]
    const c25 = Math.min(100, Math.max(0, Number(raw.d25) || 0));
    // 2. 保证单调递减：后一阶段不大于前一阶段
    const c50 = Math.min(c25, Math.max(0, Number(raw.d50) || 0));
    const c75 = Math.min(c50, Math.max(0, Number(raw.d75) || 0));
    const c100 = Math.min(c75, Math.max(0, Number(raw.d100) || 0));

    return {
      d25: c25,
      d50: c50,
      d75: c75,
      d100: c100,
      dropOff0to25: 100 - c25,
      dropOff25to50: c25 - c50,
      dropOff50to75: c50 - c75,
      dropOff75to100: c75 - c100,
    };
  }

  // 针对极端对抗输入的归一化测试
  const extremeInputs = [
    { d25: 150, d50: 180, d75: 90, d100: 200 }, // 严重超上限且逆序
    { d25: -20, d50: 50, d75: -10, d100: 10 },  // 负值且逆序
    { d25: NaN, d50: undefined, d75: 'invalid', d100: null }, // 非数值类型
  ];

  extremeInputs.forEach((input, i) => {
    const norm = normalizeFunnelDepths(input);
    assert.ok(norm.d25 >= norm.d50, `用例 ${i}: d25 (${norm.d25}) >= d50 (${norm.d50})`);
    assert.ok(norm.d50 >= norm.d75, `用例 ${i}: d50 (${norm.d50}) >= d75 (${norm.d75})`);
    assert.ok(norm.d75 >= norm.d100, `用例 ${i}: d75 (${norm.d75}) >= d100 (${norm.d100})`);
    assert.ok(norm.d25 <= 100 && norm.d100 >= 0, `用例 ${i}: 范围严格限制在 [0, 100]`);
    assert.ok(norm.dropOff25to50 >= 0, `用例 ${i}: dropOff 非负`);
  });
});


// ============================================================================
// [SECTION 2] IP 掩码脱敏函数安全性对抗测试 (IPv4, IPv6, 极端格式与防泄露)
// ============================================================================
console.log(`\n${colors.bold}[SECTION 2] IP 掩码脱敏安全性与极端格式实测${colors.reset}`);

// 引入组件中当前的脱敏实现
// 实现 A: VisitorMaskedDetailTable.tsx 与 oracle.mjs
function maskIpA(ip) {
  if (typeof ip !== 'string') return '***.***.***.***';
  const parts = ip.split('.');
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.${parts[2]}.***`;
  }
  return ip.replace(/:[^:]+$/, ':****');
}

// 实现 B: RealtimeVisitorRadar.tsx
function maskIpB(ip) {
  if (!ip || typeof ip !== 'string') return '***.***.***.***';
  const parts = ip.split('.');
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.${parts[2]}.***`;
  }
  return ip.replace(/:[^:]+$/, ':****');
}

test('2.1 标准与短段 IPv4 格式末位脱敏安全性检验', () => {
  const cases = [
    { input: '192.168.1.100', expected: '192.168.1.***', leak: '100' },
    { input: '10.0.0.1', expected: '10.0.0.***', leak: '1' },
    { input: '1.2.3.4', expected: '1.2.3.***', leak: '4' },
    { input: '255.255.255.255', expected: '255.255.255.***', leak: '255' },
    { input: '127.0.0.1', expected: '127.0.0.***', leak: '1' },
    { input: '0.0.0.0', expected: '0.0.0.***', leak: '0' },
  ];

  cases.forEach(({ input, expected, leak }) => {
    const resA = maskIpA(input);
    const resB = maskIpB(input);
    assert.strictEqual(resA, expected, `maskIpA(${input}) 应为 ${expected}`);
    assert.strictEqual(resB, expected, `maskIpB(${input}) 应为 ${expected}`);
    assert.ok(resA.endsWith('.***'), `结果必须以 .*** 结尾`);
  });
});

test('2.2 标准与压缩 IPv6 格式末位脱敏安全性检验', () => {
  const cases = [
    { input: '2001:0db8:85a3:0000:0000:8a2e:0370:7334', expected: '2001:0db8:85a3:0000:0000:8a2e:0370:****', sensitive: '7334' },
    { input: '2001:db8::1', expected: '2001:db8::****', sensitive: '1' },
    { input: 'fe80::1ff:fe23:4567:890a', expected: 'fe80::1ff:fe23:4567:****', sensitive: '890a' },
    { input: '::1', expected: '::****', sensitive: '1' },
  ];

  cases.forEach(({ input, expected, sensitive }) => {
    const resA = maskIpA(input);
    const resB = maskIpB(input);
    assert.strictEqual(resA, expected, `maskIpA(${input}) 应为 ${expected}`);
    assert.strictEqual(resB, expected, `maskIpB(${input}) 应为 ${expected}`);
    assert.ok(!resA.includes(`:${sensitive}`), `末段敏感数值 ${sensitive} 必须已被抹除替换为 :****`);
  });
});

test('2.3 非字符串与 Null/Undefined 防御性兜底检验', () => {
  const invalidInputs = [null, undefined, 12345, true, {}, [], Symbol('ip')];
  invalidInputs.forEach((input) => {
    const resA = maskIpA(input);
    const resB = maskIpB(input);
    assert.strictEqual(resA, '***.***.***.***', `maskIpA 非字符串应安全兜底为 ***.***.***.***`);
    assert.strictEqual(resB, '***.***.***.***', `maskIpB 非字符串应安全兜底为 ***.***.***.***`);
  });
});

test('2.4 [ADVERSARIAL] 极端边界：空串与空白字符在两处组件实现上的不一致性', () => {
  const emptyStr = '';
  const resA = maskIpA(emptyStr);
  const resB = maskIpB(emptyStr);

  // 观察：maskIpA 对空串返回 "" (因为 typeof '' === 'string'，没有匹配 4 段，且没有冒号，replace 返回原串 "")
  // 而 maskIpB 对空串返回 '***.***.***.***' (因为 !ip 拦截了空串)
  assert.strictEqual(resA, '', 'VisitorMaskedDetailTable maskIp 对空串原样返回空字符串 ""');
  assert.strictEqual(resB, '***.***.***.***', 'RealtimeVisitorRadar maskIpAddress 对空串兜底为 "***.***.***.***"');

  recordFinding(
    'IP_MASK_INCONSISTENCY',
    'VisitorMaskedDetailTable 与 RealtimeVisitorRadar 的 IP 脱敏函数对空串处理不一致',
    `VisitorMaskedDetailTable.maskIp 未校验 (!ip.trim())，传入空串 "" 时直接返回空串 ""；而 RealtimeVisitorRadar.maskIpAddress 具有 (!ip) 校验并返回 "***.***.***.***"。虽空串不含敏感数据，但建议统一安全防御契约。`,
    'LOW'
  );
});

test('2.5 [ADVERSARIAL] 畸形字符串与不规范 IP 导致原始敏感地址原样泄漏缺陷', () => {
  const malformedIps = [
    { raw: '10.0.1', desc: '短段三段式 IPv4 (非4段)' },
    { raw: '192.168.1', desc: '缺少末位段 IPv4' },
    { raw: '10.0.0.1.2', desc: '超长五段式 IP' },
    { raw: 'internal-node-10.0.0.1', desc: '带域名前缀内部地址' },
    { raw: '::', desc: 'IPv6 未指定地址 (以冒号结尾，无后随非冒号字符)' },
    { raw: '[2001:db8::1]:8080', desc: '带端口号的 IPv6' },
  ];

  malformedIps.forEach(({ raw, desc }) => {
    const resA = maskIpA(raw);
    
    if (raw === '::') {
      assert.strictEqual(resA, '::', '"::" 无法被 /:[^:]+$/ 匹配，返回原始 "::"');
      recordFinding(
        'IP_MASK_LEAK',
        `IPv6 未指定地址 "::" 未被脱敏`,
        `由于正则 /:[^:]+$/ 假定冒号后必有非冒号字符，当传入 IPv6 未指定地址 "::" 时脱敏失效，原样返回 "::"。`,
        'LOW'
      );
    } else if (raw === '[2001:db8::1]:8080') {
      // 抹除了 :8080，但保留了 [2001:db8::1]:****
      assert.strictEqual(resA, '[2001:db8::1]:****', '带端口 IPv6 抹除了端口而非真正末段 IP');
      recordFinding(
        'IP_MASK_PORT_LEAK',
        `带端口 IPv6 脱敏了端口号而非主机末位`,
        `传入 "[2001:db8::1]:8080" 时，replace 仅将 ":8080" 替换为 ":****"，导致原始完整 IPv6 地址 "2001:db8::1" 100% 暴露！`,
        'MEDIUM'
      );
    } else if (raw.split('.').length !== 4 && !raw.includes(':')) {
      // 畸形 IPv4 或域名
      assert.strictEqual(resA, raw, `由于 parts.length !== 4 且无冒号，原始输入 "${raw}" 原样输出！`);
      recordFinding(
        'IP_MASK_LEAK',
        `非 4 段畸形 IPv4 导致敏感原始字符串原样泄露 (${desc})`,
        `当后端或客户端传递如 "${raw}" 时，parts.length 不等于 4 且不含冒号，脱敏函数直接跳过并原样返回 "${raw}"，未起到任何掩码防护作用。`,
        'MEDIUM'
      );
    }
  });
});


// ============================================================================
// [SECTION 3] 双轴财务级图表与时间滑块对抗测试
// ============================================================================
console.log(`\n${colors.bold}[SECTION 3] 双轴图表时间滑块与除零/NaN/十字准星实测${colors.reset}`);

// 模拟 DualAxisFinanceChart 的数据构造与数学映射
function simulateChartCalculation(range, initialTrend = []) {
  // 1. 构造 chartData
  let chartData = [];
  if (range === '7d') {
    if (initialTrend && initialTrend.length > 0) {
      chartData = initialTrend.map((item) => ({
        label: (item.visit_date || '').slice(5),
        fullDate: item.visit_date || '',
        pv: Number(item.pv),
        uv: Number(item.uv),
      }));
    } else {
      chartData = [
        { label: '09-11', fullDate: '2026-09-11', pv: 420, uv: 180 },
        { label: '09-12', fullDate: '2026-09-12', pv: 510, uv: 230 },
        { label: '09-13', fullDate: '2026-09-13', pv: 680, uv: 310 },
        { label: '09-14', fullDate: '2026-09-14', pv: 590, uv: 260 },
        { label: '09-15', fullDate: '2026-09-15', pv: 750, uv: 340 },
        { label: '09-16', fullDate: '2026-09-16', pv: 890, uv: 410 },
        { label: '09-17', fullDate: '2026-09-17', pv: 960, uv: 460 },
      ];
    }
  } else if (range === '30d') {
    const days = [];
    const now = new Date('2026-09-17T10:00:00Z');
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      const dateStr = d.toISOString().split('T')[0];
      const dayIdx = 30 - i;
      const wave = Math.sin(dayIdx * 0.8) * 120 + Math.cos(dayIdx * 0.4) * 80;
      const pv = Math.max(280, Math.round(520 + wave + dayIdx * 14));
      const uv = Math.max(120, Math.round(pv * 0.44 + (Math.sin(dayIdx) * 30)));
      days.push({ label: dateStr.slice(5), fullDate: dateStr, pv, uv });
    }
    chartData = days;
  } else if (range === 'realtime') {
    const hours = [];
    const currentHour = 10;
    for (let i = 11; i >= 0; i--) {
      const h = (currentHour - i + 24) % 24;
      const hourStr = `${String(h).padStart(2, '0')}:00`;
      const hourPv = 65;
      const hourUv = 28;
      hours.push({ label: hourStr, fullDate: `今日 ${hourStr}`, pv: hourPv, uv: hourUv });
    }
    chartData = hours;
  }

  // 2. 计算极值 (maxPv 至少 100, maxUv 至少 50)
  const maxPv = Math.max(...chartData.map((d) => d.pv), 100);
  const maxUv = Math.max(...chartData.map((d) => d.uv), 50);

  // 3. 几何参数
  const svgWidth = 800;
  const svgHeight = 240;
  const paddingLeft = 50;
  const paddingRight = 50;
  const paddingTop = 20;
  const paddingBottom = 35;
  const chartInnerWidth = svgWidth - paddingLeft - paddingRight;
  const chartInnerHeight = svgHeight - paddingTop - paddingBottom;

  // 4. 坐标映射
  const len = chartData.length;
  const points = chartData.map((item, idx) => {
    const x = paddingLeft + (idx / Math.max(len - 1, 1)) * chartInnerWidth;
    const yPv = paddingTop + chartInnerHeight - (item.pv / maxPv) * chartInnerHeight;
    const yUv = paddingTop + chartInnerHeight - (item.uv / maxUv) * chartInnerHeight;
    return { x, yPv, yUv, data: item, idx };
  });

  // 5. 贝塞尔路径
  let pvPath = '';
  if (points.length > 0) {
    pvPath = `M ${points[0].x} ${points[0].yPv}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cpx1 = p0.x + (p1.x - p0.x) / 2;
      const cpy1 = p0.yPv;
      const cpx2 = p0.x + (p1.x - p0.x) / 2;
      const cpy2 = p1.yPv;
      pvPath += ` C ${cpx1} ${cpy1}, ${cpx2} ${cpy2}, ${p1.x} ${p1.yPv}`;
    }
  }

  // 6. 十字准星吸附算法
  const getClosestPoint = (mouseX) => {
    if (points.length === 0) return null;
    let closestIdx = 0;
    let minDiff = Infinity;
    points.forEach((pt, idx) => {
      const diff = Math.abs(pt.x - mouseX);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = idx;
      }
    });
    return points[closestIdx];
  };

  return { chartData, maxPv, maxUv, points, pvPath, getClosestPoint };
}

test('3.1 7天 / 30天 / 实时三态切换数据完整性与曲线生成检验', () => {
  const ranges = ['7d', '30d', 'realtime'];
  ranges.forEach((r) => {
    const res = simulateChartCalculation(r);
    assert.ok(res.chartData.length > 0, `范围 ${r} 数据不可为空`);
    assert.ok(res.points.length === res.chartData.length, `点数必须与数据量一致`);
    assert.ok(res.maxPv >= 100, `maxPv 必须满足保底 >= 100`);
    assert.ok(res.maxUv >= 50, `maxUv 必须满足保底 >= 50`);
    assert.ok(res.pvPath.startsWith('M '), `SVG 路径必须有效生成: ${res.pvPath.slice(0, 30)}`);
  });
});

test('3.2 [ADVERSARIAL] 全零流量注入 (pv: 0, uv: 0)：验证坐标轴除零防御', () => {
  const zeroTrend = [
    { visit_date: '2026-09-15', pv: 0, uv: 0 },
    { visit_date: '2026-09-16', pv: 0, uv: 0 },
    { visit_date: '2026-09-17', pv: 0, uv: 0 },
  ];

  const res = simulateChartCalculation('7d', zeroTrend);
  assert.strictEqual(res.maxPv, 100, '全零流量下 maxPv 优雅保底为 100');
  assert.strictEqual(res.maxUv, 50, '全零流量下 maxUv 优雅保底为 50');

  res.points.forEach((pt) => {
    assert.ok(!isNaN(pt.x), 'X 坐标不可为 NaN');
    assert.ok(!isNaN(pt.yPv), 'yPv 坐标不可为 NaN');
    assert.ok(!isNaN(pt.yUv), 'yUv 坐标不可为 NaN');
    assert.strictEqual(pt.yPv, 205, 'pv=0 时 Y 坐标应精准对齐底轴 (paddingTop + chartInnerHeight = 20 + 185 = 205)');
  });

  // 验证 PV/UV 比值计算除零保护
  const activePoint = res.points[0];
  const ratio = (activePoint.data.pv / Math.max(activePoint.data.uv, 1)).toFixed(2);
  assert.strictEqual(ratio, '0.00', 'UV=0 时 PV/UV 比值优雅输出 0.00，无 Infinity/NaN 崩溃');
});

test('3.3 [ADVERSARIAL] 单一数据点注入 (len = 1)：验证 X 轴间距除零防御', () => {
  const singlePointTrend = [
    { visit_date: '2026-09-17', pv: 500, uv: 200 },
  ];

  const res = simulateChartCalculation('7d', singlePointTrend);
  assert.strictEqual(res.points.length, 1);
  const pt = res.points[0];
  
  // (idx / Math.max(len - 1, 1)) -> 0 / 1 = 0
  assert.strictEqual(pt.x, 50, '单一数据点时 X 轴分母受 Math.max(len-1, 1) 保护，精准定位于 paddingLeft 50px');
  assert.ok(!isNaN(pt.x), 'X 轴不可为 NaN');
  assert.ok(!isNaN(pt.yPv), 'yPv 不可为 NaN');
  assert.strictEqual(res.pvPath, 'M 50 20', '单点 SVG 贝塞尔路径安全降级为起始点 (paddingTop=20)，无多余曲线');
});

test('3.4 [ADVERSARIAL] NaN 脏数据注入：验证 NaN 传染效应检测', () => {
  const dirtyTrend = [
    { visit_date: '2026-09-17', pv: NaN, uv: 100 },
  ];

  const res = simulateChartCalculation('7d', dirtyTrend);
  const isNanContaminated = isNaN(res.maxPv);
  
  assert.strictEqual(isNanContaminated, true, 'JavaScript 中 Math.max(NaN, 100) 会被 NaN 传染');
  assert.strictEqual(isNaN(res.points[0].yPv), true, 'maxPv 为 NaN 时 yPv 也被污染为 NaN');

  recordFinding(
    'CHART_NAN_DEFENSE',
    '后端趋势数据若返回 null/NaN 会触发 Math.max 的 NaN 传染',
    `在 DualAxisFinanceChart 中，maxPv = Math.max(...chartData.map(d => d.pv), 100)。若接口返回的某一项 pv 为 NaN 或非数字，Math.max 会被 NaN 传染导致 maxPv 变为 NaN，进而使 SVG path 变成 "M 50 NaN"，图表无法渲染。建议前端使用 (Number(d.pv) || 0) 进行数值清洗。`,
    'MEDIUM'
  );
});

test('3.5 十字准星标尺 (Crosshair Cursor) 平滑吸附与最近邻数学验证', () => {
  const res = simulateChartCalculation('7d');
  
  // 模拟鼠标在画布内从 0 到 800px 连续滑动
  const testMouseXCoords = [0, 50, 100, 166.6, 280, 400, 550, 740, 800, 999];
  testMouseXCoords.forEach((mx) => {
    const snapped = res.getClosestPoint(mx);
    assert.ok(snapped !== null, `吸附结果不可为空`);
    assert.ok(snapped.idx >= 0 && snapped.idx < res.points.length, `吸附索引合法`);
    
    // 验证吸附点确实是欧氏距离最近的点
    const currentDist = Math.abs(snapped.x - mx);
    res.points.forEach((otherPt) => {
      const otherDist = Math.abs(otherPt.x - mx);
      assert.ok(currentDist <= otherDist + 1e-6, `吸附点 (${snapped.x}) 必须是距离鼠标位置 (${mx}) 最近的数据点`);
    });
  });
});


// ============================================================================
// [SECTION 4] 站长姓名 100% Hayden Xue 纯正性与双主题三维景深审计
// ============================================================================
console.log(`\n${colors.bold}[SECTION 4] 站长姓名身份纯正性与双主题三维景深物理审计${colors.reset}`);

const TARGET_ANALYTICS_FILES = [
  'frontend/app/admin/analytics/page.tsx',
  'frontend/components/admin/analytics/DualAxisFinanceChart.tsx',
  'frontend/components/admin/analytics/ReadingDepthFunnelCard.tsx',
  'frontend/components/admin/analytics/InteractiveConversionRadar.tsx',
  'frontend/components/admin/analytics/VisitorMaskedDetailTable.tsx',
];

test('4.1 访问分析看板组件绝对禁止任何历史违规名称 (Howard/howard 0 残留)', () => {
  TARGET_ANALYTICS_FILES.forEach((relPath) => {
    const fullPath = path.resolve('e:/work2026/mon9/Haydan_blog', relPath);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`目标文件不存在: ${relPath}`);
    }
    const content = fs.readFileSync(fullPath, 'utf-8');
    const matches = content.match(/\bhoward\b/gi) || [];
    assert.strictEqual(
      matches.length,
      0,
      `文件 ${relPath} 严禁包含历史违规名称 howard (发现 ${matches.length} 处)`
    );
  });
});

test('4.2 访客明细样本数据中站长身份纯正性检验 (关于页标题必须为 Hayden Xue)', () => {
  const visitorTablePath = path.resolve('e:/work2026/mon9/Haydan_blog', 'frontend/components/admin/analytics/VisitorMaskedDetailTable.tsx');
  const content = fs.readFileSync(visitorTablePath, 'utf-8');
  assert.ok(content.includes('Hayden Xue'), '访客明细中受访关于页标题必须使用 Hayden Xue');
  assert.ok(!content.includes('Howard'), '访客明细中严禁出现 Howard');
});

test('4.3 双主题三维物理景深设计契约全量组件覆盖审计', () => {
  // 必须具备：
  // 1. 浅色瓷感底色层 / 深曜石黑底色
  // 2. 内容卡片层：bg-white/80, dark:bg-neutral-900/60, backdrop-blur
  // 3. 悬浮交互层：border-slate-200/80, dark:border-white/[0.08], shadow-sm
  TARGET_ANALYTICS_FILES.forEach((relPath) => {
    const fullPath = path.resolve('e:/work2026/mon9/Haydan_blog', relPath);
    const content = fs.readFileSync(fullPath, 'utf-8');

    // 针对每个卡片组件检查是否使用了符合准则 3 的深度三维景深 Token
    const hasBackdropBlur = content.includes('backdrop-blur');
    const hasLightSurface = content.includes('bg-white/80') || content.includes('bg-slate-50') || content.includes('bg-white');
    const hasDarkSurface = content.includes('dark:bg-neutral-900/60') || content.includes('dark:bg-black/30') || content.includes('dark:bg-neutral');
    const hasBorderDepth = content.includes('border-slate-200') || content.includes('dark:border-white');

    assert.ok(hasBackdropBlur, `文件 ${relPath} 必须具备毛玻璃三维物理景深 (backdrop-blur)`);
    assert.ok(hasLightSurface, `文件 ${relPath} 必须具备高定白瓷感表面 (bg-white/80 等)`);
    assert.ok(hasDarkSurface, `文件 ${relPath} 必须具备深曜石黑材质 (dark:bg-neutral-900/60 等)`);
    assert.ok(hasBorderDepth, `文件 ${relPath} 必须具备 1px 微光边界景深 (border-slate-200 / dark:border-white)`);
  });
});

console.log(`\n${colors.bold}${colors.cyan}========================================================================${colors.reset}`);
console.log(`${colors.bold}对抗实测统计: 共 ${totalTests} 项, 通过 ${passedTests} 项, 失败 ${failedTests} 项${colors.reset}`);
console.log(`${colors.bold}挖掘缺陷与安全观测总数: ${findings.length} 项${colors.reset}`);
console.log(`${colors.bold}${colors.cyan}========================================================================${colors.reset}\n`);

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
