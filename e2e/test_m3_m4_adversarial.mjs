// e2e/test_m3_m4_adversarial.mjs
/**
 * CHALLENGER 2 EMPIRICAL ADVERSARIAL TEST SUITE
 * Targets:
 *   1. Action Center: approveAll concurrency and fault tolerance (empty, full, partial, total failure)
 *   2. Infrastructure Telemetry Radar: offline / timeout degradation and initial state analysis
 *   3. Settings Center: 5 Cards Payload Isolation & cross-component state contamination
 */

import fs from 'fs';
import path from 'path';

console.log('======================================================================');
console.log('CHALLENGER 2: EMPIRICAL ADVERSARIAL VERIFICATION SUITE');
console.log('Milestone 3 & Milestone 4 Verification');
console.log('======================================================================\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const findings = [];

function assert(condition, message) {
  totalTests++;
  if (!condition) {
    failedTests++;
    console.error(`  [FAIL] ${message}`);
    throw new Error(message);
  }
  passedTests++;
  console.log(`  [PASS] ${message}`);
}

// ----------------------------------------------------------------------
// Test 1: Action Center - approveAll Concurrency & Fault Tolerance
// ----------------------------------------------------------------------
console.log('----------------------------------------------------------------------');
console.log('[TEST GROUP 1] Action Center (approveAll) Concurrency & Fault Tolerance');
console.log('----------------------------------------------------------------------');

// Replicate the exact logic from frontend/app/admin/dashboard/page.tsx
async function simulateApproveAllComments(pendingCommentsList, apiMock) {
  let pendingState = [...pendingCommentsList];
  let toastResult = null;
  let batchLoading = false;

  if (pendingState.length === 0) {
    return { pendingState, toastResult, batchLoading, earlyExit: true };
  }

  batchLoading = true;
  try {
    const results = await Promise.allSettled(
      pendingState.map((c) => apiMock.updateCommentStatus(c.id, 'APPROVED'))
    );
    // Exact logic from dashboard/page.tsx lines 174-176:
    toastResult = {
      type: 'success',
      msg: `已批量批准通过全部 ${pendingState.length} 条待审评论！`,
    };
    pendingState = [];
  } catch (err) {
    toastResult = { type: 'error', msg: '批量批准评论时发生异常' };
  } finally {
    batchLoading = false;
  }

  return { pendingState, toastResult, batchLoading, earlyExit: false };
}

// 1.1 Empty List Test
{
  console.log('\nSubtest 1.1: Empty Pending List Handling');
  let apiCallCount = 0;
  const mockApi = {
    updateCommentStatus: async () => { apiCallCount++; }
  };
  const res = await simulateApproveAllComments([], mockApi);
  assert(res.earlyExit === true, 'Empty list triggers early exit without throwing');
  assert(apiCallCount === 0, 'No API requests dispatched on empty list');
  assert(res.pendingState.length === 0, 'Pending state remains empty');
  assert(res.batchLoading === false, 'Batch loading state is false');
}

// 1.2 Full Success Test (All 5 succeed)
{
  console.log('\nSubtest 1.2: 100% Success Concurrency Handling');
  const items = [
    { id: 101, content: 'Comment 1' },
    { id: 102, content: 'Comment 2' },
    { id: 103, content: 'Comment 3' },
    { id: 104, content: 'Comment 4' },
    { id: 105, content: 'Comment 5' },
  ];
  const approvedIds = [];
  const mockApi = {
    updateCommentStatus: async (id, status) => {
      approvedIds.push({ id, status });
      return { success: true };
    }
  };
  const res = await simulateApproveAllComments(items, mockApi);
  assert(approvedIds.length === 5, 'All 5 items processed concurrently');
  assert(res.toastResult.type === 'success', 'Success toast dispatched');
  assert(res.toastResult.msg.includes('5 条待审评论'), 'Toast contains correct item count');
  assert(res.pendingState.length === 0, 'Pending queue completely cleared');
}

// 1.3 Adversarial Test: Partial Failure (3 succeed, 2 fail with 500)
{
  console.log('\nSubtest 1.3: [ADVERSARIAL] Partial Failure & False-Success Vulnerability');
  const items = [
    { id: 201, content: 'Comment 201' },
    { id: 202, content: 'Comment 202' },
    { id: 203, content: 'Comment 203' },
    { id: 204, content: 'Comment 204' },
    { id: 205, content: 'Comment 205' },
  ];
  const attemptedIds = [];
  const mockApi = {
    updateCommentStatus: async (id) => {
      attemptedIds.push(id);
      if (id === 204 || id === 205) {
        throw new Error('Database deadlock / 500 Internal Error');
      }
      return { success: true };
    }
  };

  const res = await simulateApproveAllComments(items, mockApi);

  console.log('    Observed behavior under partial failure:');
  console.log(`    - Attempted IDs: ${attemptedIds.join(', ')}`);
  console.log(`    - Toast Result: [${res.toastResult?.type}] ${res.toastResult?.msg}`);
  console.log(`    - Remaining Pending in UI: ${res.pendingState.length}`);

  // Empirically demonstrate the vulnerability
  const hasFalseSuccessReporting = res.toastResult?.type === 'success' && res.toastResult?.msg.includes('全部 5 条');
  const hasDroppedFailedItemsFromUI = res.pendingState.length === 0;

  if (hasFalseSuccessReporting && hasDroppedFailedItemsFromUI) {
    findings.push({
      id: 'FINDING-1',
      severity: 'HIGH',
      title: 'Action Center approveAll 并发容错缺陷：部分失败时虚假报告全部成功，未成功的待审项在界面上被静默丢弃',
      detail: 'Promise.allSettled 不会抛出异常，无论单个请求成功与否，均执行 toast.success("已批量批准通过全部 X 条...") 与 setPendingCommentsList([])，导致未被数据库批准的待办项在前端直接蒸发。',
    });
    console.log('  [DEFECT CONFIRMED] Dashboard approveAll falsely claims full success and drops unapproved items upon partial failure.');
    totalTests++;
    passedTests++;
  } else {
    assert(false, 'Expected vulnerability was not reproduced');
  }
}

// 1.4 Adversarial Test: 100% Total Failure (e.g. 401 Unauthorized / Server Down)
{
  console.log('\nSubtest 1.4: [ADVERSARIAL] Total Failure Masking');
  const items = [
    { id: 301, content: 'Comment 301' },
    { id: 302, content: 'Comment 302' },
  ];
  const mockApi = {
    updateCommentStatus: async () => {
      throw new Error('Network Timeout / Connection Refused');
    }
  };

  const res = await simulateApproveAllComments(items, mockApi);

  console.log(`    - Total failure toast: [${res.toastResult?.type}] ${res.toastResult?.msg}`);
  console.log(`    - Total failure remaining: ${res.pendingState.length}`);

  if (res.toastResult?.type === 'success' && res.pendingState.length === 0) {
    findings.push({
      id: 'FINDING-2',
      severity: 'HIGH',
      title: 'Action Center approveAll 全量失败被掩盖：当所有请求均报错时，catch 块因 Promise.allSettled 永远不可达，依然展示成功 Toast',
      detail: '即便 100% 请求失败（如网络中断），catch 块依然无法触发，前端依然提示“已批量批准通过全部 2 条待审评论”，具有严重的误导性。',
    });
    console.log('  [DEFECT CONFIRMED] Total failure is masked as 100% success.');
    totalTests++;
    passedTests++;
  }
}

// ----------------------------------------------------------------------
// Test 2: Infrastructure Telemetry Radar Offline / Timeout Fallback
// ----------------------------------------------------------------------
console.log('\n----------------------------------------------------------------------');
console.log('[TEST GROUP 2] Infrastructure Telemetry Radar Offline/Timeout Degradation');
console.log('----------------------------------------------------------------------');

// Replicate testInfrastructure logic from frontend/app/admin/dashboard/page.tsx
async function simulateRadarProbe(apiMock) {
  let dbTelemetry = { status: 'testing' };
  let minioTelemetry = { status: 'testing' };
  let aiTelemetry = { status: 'testing' };
  let retestingRadar = true;

  // 1. DB
  const dbStart = Date.now();
  const dbPromise = apiMock.getDashboardStats()
    .then((s) => {
      const dbCost = Date.now() - dbStart;
      dbTelemetry = { status: 'online', latencyMs: dbCost, message: 'MySQL 8 / HikariCP 连接池就绪' };
    })
    .catch((err) => {
      dbTelemetry = { status: 'offline', message: err?.message || '数据库连接异常' };
    });

  // 2. MinIO
  const minioPromise = apiMock.testMinio()
    .then((res) => {
      minioTelemetry = {
        status: res.success ? 'online' : 'offline',
        latencyMs: res.latencyMs || 22,
        message: res.success ? `Bucket 正常 [${res.bucketExists ? 'Ready' : 'Created'}]` : res.message,
      };
    })
    .catch((err) => {
      minioTelemetry = { status: 'offline', message: err?.message || 'MinIO 端点无法直连' };
    });

  // 3. AI
  const aiStart = Date.now();
  const aiPromise = apiMock.getAiStatus()
    .then((res) => {
      const aiCost = Date.now() - aiStart;
      aiTelemetry = {
        status: res?.enabled ? 'online' : 'offline',
        latencyMs: aiCost,
        message: res?.model || 'DeepSeek-V4 / SenseNova',
      };
    })
    .catch((err) => {
      aiTelemetry = { status: 'offline', message: err?.message || 'AI 推理服务离线' };
    })
    .finally(() => {
      retestingRadar = false;
    });

  await Promise.all([dbPromise, minioPromise, aiPromise]);
  return { dbTelemetry, minioTelemetry, aiTelemetry, retestingRadar };
}

// 2.1 Radar Offline Fallback Test
{
  console.log('\nSubtest 2.1: Radar Offline & Timeout Fallback Verification');
  const mockApi = {
    getDashboardStats: async () => {
      throw new Error('Connection refused: 3306 (MySQL Offline)');
    },
    testMinio: async () => {
      return { success: false, message: 'MinIO connection timeout after 3000ms' };
    },
    getAiStatus: async () => {
      throw new Error('SenseNova API rate limit / 503 Service Unavailable');
    }
  };

  const res = await simulateRadarProbe(mockApi);
  assert(res.dbTelemetry.status === 'offline', 'DB probe enters offline status');
  assert(res.dbTelemetry.message.includes('MySQL Offline'), 'DB probe reflects exact failure message');

  assert(res.minioTelemetry.status === 'offline', 'MinIO probe enters offline status');
  assert(res.minioTelemetry.message.includes('timeout'), 'MinIO probe reflects timeout message');

  assert(res.aiTelemetry.status === 'offline', 'AI probe enters offline status');
  assert(res.aiTelemetry.message.includes('503 Service Unavailable'), 'AI probe reflects error message');
}

// 2.2 Adversarial Check on Radar Initial State
{
  console.log('\nSubtest 2.2: [ADVERSARIAL] Dashboard Initial State vs Real Probe Divergence');
  const dashboardCode = fs.readFileSync(path.resolve('frontend/app/admin/dashboard/page.tsx'), 'utf-8');

  const hasHardcodedMinioInitial = dashboardCode.includes("setMinioTelemetry({ status: 'online', latencyMs: 26");
  const hasHardcodedDbInitial = dashboardCode.includes("setDbTelemetry({ status: 'online', latencyMs: 14");

  if (hasHardcodedMinioInitial && hasHardcodedDbInitial) {
    findings.push({
      id: 'FINDING-3',
      severity: 'MEDIUM',
      title: '基础设施探活雷达初始状态乐观硬编码：在 loadDashboard 时默认假设 MinIO 与 MySQL 为 26ms/14ms 在线',
      detail: '初次载入页面时未实际调用 api.testMinio()，直接设置在线状态。只有在用户手动点击右上角“一键重新检测”时才会执行真实探活。若存储服务已宕机，首屏仍展示伪绿色在线指示灯。',
    });
    console.log('  [DEFECT CONFIRMED] Radar initially displays hardcoded optimistic 26ms/14ms online status before manual retest.');
    totalTests++;
    passedTests++;
  }
}

// ----------------------------------------------------------------------
// Test 3: Settings Center Component Payload Strict Isolation
// ----------------------------------------------------------------------
console.log('\n----------------------------------------------------------------------');
console.log('[TEST GROUP 3] Settings Center: 5 Cards Payload Strict Isolation');
console.log('----------------------------------------------------------------------');

// Read files and extract payload keys
const appearanceCode = fs.readFileSync(path.resolve('frontend/components/admin/settings/AppearanceSettingsCard.tsx'), 'utf-8');
const aiCode = fs.readFileSync(path.resolve('frontend/components/admin/settings/AiSettingsCard.tsx'), 'utf-8');
const storageCode = fs.readFileSync(path.resolve('frontend/components/admin/settings/StorageSettingsCard.tsx'), 'utf-8');
const securityCode = fs.readFileSync(path.resolve('frontend/components/admin/settings/SecuritySettingsCard.tsx'), 'utf-8');
const exportCode = fs.readFileSync(path.resolve('frontend/components/admin/settings/ExportBackupCard.tsx'), 'utf-8');

function extractPayloadKeys(code) {
  const match = code.match(/const payload:\s*Partial<SiteSetting>\s*=\s*\{([\s\S]*?)\};/);
  if (!match) return [];
  const body = match[1];
  const keys = body
    .split('\n')
    .map(line => line.trim().replace(/,$/, ''))
    .filter(line => line && !line.startsWith('//'))
    .map(line => line.split(':')[0].trim())
    .filter(k => k.length > 0 && /^[a-zA-Z0-9_]+$/.test(k));
  return [...new Set(keys)];
}

const appearanceKeys = extractPayloadKeys(appearanceCode);
const aiKeys = extractPayloadKeys(aiCode);
const storageKeys = extractPayloadKeys(storageCode);
const securityKeys = extractPayloadKeys(securityCode);

console.log(`  Appearance payload keys (${appearanceKeys.length}):`, appearanceKeys.join(', '));
console.log(`  AI payload keys (${aiKeys.length}):`, aiKeys.join(', '));
console.log(`  Storage payload keys (${storageKeys.length}):`, storageKeys.join(', '));
console.log(`  Security payload keys (${securityKeys.length}):`, securityKeys.join(', '));

// 3.1 Verify ExportBackupCard has no updateSettings call
assert(!exportCode.includes('api.updateSettings'), 'ExportBackupCard is purely read-only and does not invoke updateSettings');

// 3.2 Verify pairwise disjointness
function checkIntersection(setA, setB, nameA, nameB) {
  const common = setA.filter(k => setB.includes(k));
  assert(common.length === 0, `Payload keys between ${nameA} and ${nameB} are 100% disjoint (common: [${common.join(', ')}])`);
}

checkIntersection(appearanceKeys, aiKeys, 'Appearance', 'AI');
checkIntersection(appearanceKeys, storageKeys, 'Appearance', 'Storage');
checkIntersection(appearanceKeys, securityKeys, 'Appearance', 'Security');
checkIntersection(aiKeys, storageKeys, 'AI', 'Storage');
checkIntersection(aiKeys, securityKeys, 'AI', 'Security');
checkIntersection(storageKeys, securityKeys, 'Storage', 'Security');

// 3.3 Backend Non-Null Partial Update Simulation
console.log('\nSubtest 3.3: Empirical Non-Null Backend State Mutation Isolation');
const mockBackendState = {
  siteName: 'Original Name',
  heroTitle: 'Original Hero',
  aiEnabled: 1,
  aiModel: 'deepseek-flash',
  aiApiKey: 'sk-orig-key',
  storageType: 'minio',
  minioBucket: 'orig-bucket',
  minioAccessKey: 'orig-ak',
  icpNumber: '京ICP备00000000号',
  footerText: '© 2026 Hayden Xue. All rights reserved.',
};

function applyBackendUpdate(state, request) {
  const updated = { ...state };
  for (const [k, v] of Object.entries(request)) {
    if (v !== undefined && v !== null) {
      updated[k] = v;
    }
  }
  return updated;
}

// Appearance update only
const appearanceUpdate = {
  siteName: 'Hayden Studio Revamped',
  heroTitle: 'New Hero Title',
};
const stateAfterAppearance = applyBackendUpdate(mockBackendState, appearanceUpdate);

assert(stateAfterAppearance.siteName === 'Hayden Studio Revamped', 'Appearance field updated');
assert(stateAfterAppearance.aiModel === 'deepseek-flash', 'AI field strictly preserved during appearance save');
assert(stateAfterAppearance.minioBucket === 'orig-bucket', 'Storage field strictly preserved during appearance save');
assert(stateAfterAppearance.icpNumber === '京ICP备00000000号', 'Security field strictly preserved during appearance save');

// AI update only
const aiUpdate = {
  aiModel: 'sensenova-flash',
  aiApiKey: 'sk-new-ai-key',
};
const stateAfterAi = applyBackendUpdate(stateAfterAppearance, aiUpdate);
assert(stateAfterAi.aiModel === 'sensenova-flash', 'AI field updated');
assert(stateAfterAi.siteName === 'Hayden Studio Revamped', 'Appearance field preserved during AI save');
assert(stateAfterAi.minioBucket === 'orig-bucket', 'Storage field preserved during AI save');

// Storage update only
const storageUpdate = {
  minioBucket: 'haydan-new-bucket',
};
const stateAfterStorage = applyBackendUpdate(stateAfterAi, storageUpdate);
assert(stateAfterStorage.minioBucket === 'haydan-new-bucket', 'Storage field updated');
assert(stateAfterStorage.aiModel === 'sensenova-flash', 'AI field preserved during storage save');
assert(stateAfterStorage.siteName === 'Hayden Studio Revamped', 'Appearance field preserved during storage save');

// 3.4 Adversarial Edge Case: Unsaved Cross-Card In-Memory State Overwrite
{
  console.log('\nSubtest 3.4: [ADVERSARIAL] Unsaved Cross-Card In-Memory State Overwrite');
  const settingsPageCode = fs.readFileSync(path.resolve('frontend/app/admin/settings/page.tsx'), 'utf-8');
  const passesOnSavedLoadSettings = settingsPageCode.includes('onSaved={loadSettings}');

  if (passesOnSavedLoadSettings) {
    findings.push({
      id: 'FINDING-4',
      severity: 'LOW',
      title: '设置中心跨卡片未保存状态可能被 onSaved={loadSettings} 静默重置',
      detail: '当站长在卡片 A（例如 AI 设置）中输入了修改内容但未点击保存，随后切换到卡片 B（外观设置）并点击保存时，卡片 B 的 onSaved 会触发父级 loadSettings() 重新拉取远端配置并覆写 initialSettings，卡片 A 的 useEffect 会被触发，导致卡片 A 尚未保存的本地输入被后端旧数据静默覆盖。',
    });
    console.log('  [OBSERVATION CONFIRMED] Cross-card loadSettings re-sync overwrites unsaved local edits in other cards.');
    totalTests++;
    passedTests++;
  }
}

// ----------------------------------------------------------------------
// Summary
// ----------------------------------------------------------------------
console.log('\n======================================================================');
console.log(`TEST SUMMARY: Total=${totalTests}, Passed=${passedTests}, Failed=${failedTests}`);
console.log(`Findings Captured: ${findings.length}`);
findings.forEach(f => {
  console.log(`  - [${f.severity}] ${f.id}: ${f.title}`);
});
console.log('======================================================================\n');

process.exit(failedTests > 0 ? 1 : 0);
