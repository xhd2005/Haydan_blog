// frontend/tests/m1_real_runtime_verify.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Mock localStorage for node environment to test storage fallback
class MockLocalStorage {
  constructor() {
    this.store = new Map();
  }
  getItem(key) {
    return this.store.get(key) || null;
  }
  setItem(key, value) {
    this.store.set(key, String(value));
  }
  removeItem(key) {
    this.store.delete(key);
  }
  clear() {
    this.store.clear();
  }
  get length() {
    return this.store.size;
  }
  key(index) {
    return Array.from(this.store.keys())[index] || null;
  }
}

globalThis.window = {
  localStorage: new MockLocalStorage(),
};

async function runM1Verification() {
  console.log('===============================================================');
  console.log('▶ [M1 TEST SUITE] 实时真实逻辑验证与契约合规断言');
  console.log('===============================================================\n');

  let passed = 0;
  let total = 0;

  function test(name, fn) {
    total++;
    try {
      fn();
      console.log(`  ✔ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✘ [FAIL] ${name}:`, err.message);
      throw err;
    }
  }

  async function asyncTest(name, fn) {
    total++;
    try {
      await fn();
      console.log(`  ✔ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✘ [FAIL] ${name}:`, err.message);
      throw err;
    }
  }

  // -------------------------------------------------------------
  // 1. WebGL 安全销毁真实模块验证 (frontend/lib/webglCleanup.ts)
  // -------------------------------------------------------------
  console.log('--- 1. WebGL 资源释放与上下文主动销毁 ---');
  const { 
    safelyDisposeWebGL, 
    registerWebGLDisposer, 
    triggerRouteWebGLCleanup 
  } = await import('../lib/webglCleanup.ts');

  test('safelyDisposeWebGL 传入 null / undefined 不崩溃', () => {
    assert.doesNotThrow(() => safelyDisposeWebGL(null));
    assert.doesNotThrow(() => safelyDisposeWebGL(undefined));
    assert.doesNotThrow(() => safelyDisposeWebGL({}));
    assert.doesNotThrow(() => safelyDisposeWebGL(123));
  });

  test('safelyDisposeWebGL 能够正确触发对象的 loseContext 方法', () => {
    let called = false;
    const mockCtx = {
      loseContext() {
        called = true;
      },
    };
    safelyDisposeWebGL(mockCtx);
    assert.equal(called, true, 'loseContext 必须被真实调用');
  });

  test('safelyDisposeWebGL 能够解包嵌套 gl 属性并销毁', () => {
    let called = false;
    const mockWrapper = {
      gl: {
        loseContext() {
          called = true;
        }
      }
    };
    safelyDisposeWebGL(mockWrapper);
    assert.equal(called, true, '嵌套 gl.loseContext 必须被真实调用');
  });

  test('registerWebGLDisposer 与 triggerRouteWebGLCleanup 路由生命周期联动', () => {
    let graphCleaned = false;
    let journeyCleaned = false;

    const unregGraph = registerWebGLDisposer('/admin/graph', () => {
      graphCleaned = true;
    });
    registerWebGLDisposer('/admin/journey', () => {
      journeyCleaned = true;
    });

    triggerRouteWebGLCleanup('/admin/graph');
    assert.equal(graphCleaned, true, '图谱页清理钩子必须被触发');
    assert.equal(journeyCleaned, false, '未关闭的航图页面不应被误触发');

    // 注销后不重复触发
    graphCleaned = false;
    unregGraph();
    triggerRouteWebGLCleanup('/admin/graph');
    assert.equal(graphCleaned, false, '注销后不应被触发');
  });

  // -------------------------------------------------------------
  // 2. IndexedDB 沙盒存储真实模块验证 (frontend/lib/storage/indexedDbSandbox.ts)
  // -------------------------------------------------------------
  console.log('\n--- 2. 表单与光标状态沙盒恢复引擎 ---');
  const {
    saveFormSnapshot,
    getFormSnapshot,
    clearFormSnapshot,
    getAllFormSnapshots,
    pruneExpiredSnapshots,
  } = await import('../lib/storage/indexedDbSandbox.ts');

  await asyncTest('saveFormSnapshot 与 getFormSnapshot 正确存储并恢复数据与光标', async () => {
    const route = '/admin/posts/edit/42';
    const data = { title: '空间流光重塑实录', content: '测试正文内容与草稿', isTop: true };
    const cursor = { start: 12, end: 18 };
    const scroll = 480;

    await saveFormSnapshot(route, data, cursor, scroll);
    const retrieved = await getFormSnapshot(route);

    assert.ok(retrieved, '快照必须能被恢复');
    assert.equal(retrieved.route, route);
    assert.equal(retrieved.formData.title, '空间流光重塑实录');
    assert.equal(retrieved.cursorPosition.start, 12);
    assert.equal(retrieved.cursorPosition.end, 18);
    assert.equal(retrieved.scrollOffset, 480);
  });

  await asyncTest('不同路由之间的表单快照相互隔离不串扰', async () => {
    await saveFormSnapshot('/admin/posts/create', { title: '新建文章草稿' });
    await saveFormSnapshot('/admin/settings', { siteName: 'Hayden Studio' });

    const snap1 = await getFormSnapshot('/admin/posts/create');
    const snap2 = await getFormSnapshot('/admin/settings');

    assert.equal(snap1.formData.title, '新建文章草稿');
    assert.equal(snap2.formData.siteName, 'Hayden Studio');
  });

  await asyncTest('clearFormSnapshot 彻底清理指定路由的快照', async () => {
    const route = '/admin/posts/edit/42';
    await clearFormSnapshot(route);
    const retrieved = await getFormSnapshot(route);
    assert.equal(retrieved, null, '清除后必须返回 null');
  });

  // -------------------------------------------------------------
  // 3. 三向合并真实算法验证 (frontend/lib/threeWayMerge.ts)
  // -------------------------------------------------------------
  console.log('\n--- 3. 离线三向合并与冲突仲裁逻辑 ---');
  const { computeThreeWayMerge } = await import('../lib/threeWayMerge.ts');

  test('三端内容完全一致时无冲突', () => {
    const res = computeThreeWayMerge('Base text', 'Base text', 'Base text');
    assert.equal(res.hasConflict, false);
    assert.equal(res.mergedContent, 'Base text');
  });

  test('仅云端更新（本地未改动）自动采用云端修改', () => {
    const res = computeThreeWayMerge('Base', 'Base', 'Cloud Updated');
    assert.equal(res.hasConflict, false);
    assert.equal(res.mergedContent, 'Cloud Updated');
  });

  test('仅本地沙盒更新（云端未改动）自动采用本地修改', () => {
    const res = computeThreeWayMerge('Base', 'Local Updated', 'Base');
    assert.equal(res.hasConflict, false);
    assert.equal(res.mergedContent, 'Local Updated');
  });

  test('同一行在本地与云端发生不同修改，准确识别为冲突并标注行号', () => {
    const base = 'Line 1\nLine 2';
    const local = 'Line 1\nLocal Line 2';
    const cloud = 'Line 1\nCloud Line 2';

    const res = computeThreeWayMerge(base, local, cloud);
    assert.equal(res.hasConflict, true);
    assert.equal(res.conflicts.length, 1);
    assert.equal(res.conflicts[0].line, 2);
    assert.equal(res.conflicts[0].local, 'Local Line 2');
    assert.equal(res.conflicts[0].cloud, 'Cloud Line 2');
    assert.ok(res.mergedContent.includes('<<<<<<< 本地修改'));
    assert.ok(res.mergedContent.includes('>>>>>>> 云端修改'));
  });

  // -------------------------------------------------------------
  // 4. 静态合规与双主题景深审查
  // -------------------------------------------------------------
  console.log('\n--- 4. 静态设计令牌与代码纯正性审查 ---');

  test('layout.tsx 与 AdminSidebar.tsx 中彻底消除 #fcfcfd 杂色', () => {
    const layoutContent = fs.readFileSync(path.resolve('app/admin/layout.tsx'), 'utf-8');
    const sidebarContent = fs.readFileSync(path.resolve('components/admin/AdminSidebar.tsx'), 'utf-8');

    assert.equal(layoutContent.includes('#fcfcfd'), false, 'layout.tsx 严禁出现 #fcfcfd');
    assert.equal(sidebarContent.includes('#fcfcfd'), false, 'AdminSidebar.tsx 严禁出现 #fcfcfd');
    assert.ok(layoutContent.includes('#fbfbfd'), 'layout.tsx 必须使用纯正雪瓷白 #fbfbfd');
    assert.ok(layoutContent.includes('#090a0f'), 'layout.tsx 必须使用纯正深曜石黑 #090a0f');
  });

  test('FloatingAcrylicDock.tsx 严格遵守站长唯一姓名 Hayden Xue', () => {
    const dockContent = fs.readFileSync(path.resolve('components/admin/layout/FloatingAcrylicDock.tsx'), 'utf-8');
    assert.ok(dockContent.includes('Hayden Xue'), '必须包含站长姓名 Hayden Xue');
    assert.equal(dockContent.toLowerCase().includes('howard'), false, '严禁出现 howard 违规历史名称');
  });

  test('FloatingAcrylicDock.tsx 包含必需的 macOS 悬浮亚克力类名', () => {
    const dockContent = fs.readFileSync(path.resolve('components/admin/layout/FloatingAcrylicDock.tsx'), 'utf-8');
    assert.ok(dockContent.includes('backdrop-blur-2xl'), '必须具备 backdrop-blur-2xl');
    assert.ok(dockContent.includes('rounded-3xl'), '必须具备 rounded-3xl');
    assert.ok(dockContent.includes('shadow-2xl'), '必须具备 shadow-2xl');
  });

  console.log('\n===============================================================');
  console.log(`✔ [ALL PASSED] 全部 ${passed}/${total} 项真实逻辑单元与契约断言 100% 绿灯通过！`);
  console.log('===============================================================');
}

runM1Verification().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
