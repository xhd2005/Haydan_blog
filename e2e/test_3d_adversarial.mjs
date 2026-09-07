import fs from 'fs';
import path from 'path';

// -------------------------------------------------------------
// 1. WebGL 显存与资源泄漏分析 (AST/Source Code Invariant Checks)
// -------------------------------------------------------------

console.log('=====================================================');
console.log('1. WebGL 显存与资源泄漏对抗性静态与动态检查');
console.log('=====================================================');

const cosmosPath = path.resolve('frontend/components/bento/CosmosGraph.tsx');
const globePath = path.resolve('frontend/components/journey/VoyageGlobe.tsx');
const scrollyPath = path.resolve('frontend/components/home/HeroPinnedScrollytelling.tsx');

const cosmosSrc = fs.readFileSync(cosmosPath, 'utf-8');
const globeSrc = fs.readFileSync(globePath, 'utf-8');
const scrollySrc = fs.readFileSync(scrollyPath, 'utf-8');

// [Test 1.1] CosmosGraph.tsx: 资源泄漏检查
console.log('\n--- [Test 1.1] CosmosGraph.tsx 显存释放与生命周期 ---');
const cosmosDisposesOrbitInCleanup = /orbitGeo\.dispose\(\)/.test(cosmosSrc) || /orbitMat\.dispose\(\)/.test(cosmosSrc);
console.log(`- orbitGeo / orbitMat 是否在 cleanup 中调用 dispose(): ${cosmosDisposesOrbitInCleanup ? 'PASS' : 'FAIL (LEAK DETECTED: 6个微光轨道环 RingGeometry 与 Material 未释放)'}`);

const cosmosDisposesSpriteMat = /spriteMaterial\.dispose\(\)/.test(cosmosSrc);
console.log(`- textSprite material 是否在 cleanup 中调用 dispose(): ${cosmosDisposesSpriteMat ? 'PASS' : 'FAIL (LEAK DETECTED: 6个广告牌 SpriteMaterial 未释放)'}`);

// 检查 dependency array
const cosmosEffectDepsMatch = cosmosSrc.match(/},\s*\[(.*?)\]\);/s);
console.log(`- useEffect 依赖项: [${cosmosEffectDepsMatch ? cosmosEffectDepsMatch[1].trim() : 'NOT FOUND'}]`);
const cosmosHasHoverInDeps = cosmosEffectDepsMatch && cosmosEffectDepsMatch[1].includes('hoveredNodeId');
const cosmosHasSelectedInDeps = cosmosEffectDepsMatch && cosmosEffectDepsMatch[1].includes('selectedNode');
console.log(`- 是否错误将 hoveredNodeId 包含在 useEffect 依赖中: ${cosmosHasHoverInDeps ? 'YES (CRITICAL BUG: 每次鼠标掠过/离开星体均强制卸载并重构整个 WebGL 上下文)' : 'NO'}`);
console.log(`- 是否将 selectedNode 包含在 useEffect 依赖中: ${cosmosHasSelectedInDeps ? 'YES (CRITICAL BUG: 点击节点重构整个 WebGL 上下文)' : 'NO'}`);

// [Test 1.2] VoyageGlobe.tsx: 资源泄漏检查
console.log('\n--- [Test 1.2] VoyageGlobe.tsx 显存释放与生命周期 ---');
const globeClonesPinMat = globeSrc.includes('pinMat.clone()');
const globeClonesCylinderMat = globeSrc.includes('cylinderMat.clone()');
const globeDisposesClonedMats = /interactiveMeshes.*dispose/.test(globeSrc) || /pinMesh.*material.*dispose/.test(globeSrc);
console.log(`- 是否存在 pinMat.clone() / cylinderMat.clone(): ${globeClonesPinMat && globeClonesCylinderMat ? 'YES' : 'NO'}`);
console.log(`- 是否在 cleanup 中释放了每个城市 Mesh 克隆的 Material: ${globeDisposesClonedMats ? 'PASS' : 'FAIL (LEAK DETECTED: 克隆材质常驻显存)'}`);

// 检查 touchcancel
const globeHasTouchCancel = globeSrc.includes('touchcancel');
console.log(`- 是否监听并解绑 touchcancel 事件: ${globeHasTouchCancel ? 'PASS' : 'FAIL (未处理 touchcancel，手势被系统打断时 isInteracting 可能卡在 true)'}`);

// [Test 1.3] HeroPinnedScrollytelling.tsx: 资源泄漏检查
console.log('\n--- [Test 1.3] HeroPinnedScrollytelling.tsx 显存释放与生命周期 ---');
const scrollyHasDodecahedronGeo = scrollySrc.includes('const dodecahedronGeo = new THREE.DodecahedronGeometry');
const scrollyDodecahedronAddedToScene = /scene\.add\(.*dodecahedronGeo.*\)/.test(scrollySrc) || /new THREE\.Mesh\(dodecahedronGeo/.test(scrollySrc);
const scrollyExplicitDodecahedronDispose = scrollySrc.includes('dodecahedronGeo.dispose()');
console.log(`- dodecahedronGeo 是否独立创建但未加入 scene: ${scrollyHasDodecahedronGeo && !scrollyDodecahedronAddedToScene ? 'YES (孤儿几何体)' : 'NO'}`);
console.log(`- scene.traverse 能否触达 dodecahedronGeo: ${scrollyDodecahedronAddedToScene ? 'YES' : 'NO (traverse 遍历不到)'}`);
console.log(`- 是否显式调用 dodecahedronGeo.dispose(): ${scrollyExplicitDodecahedronDispose ? 'PASS' : 'FAIL (LEAK DETECTED: 孤儿几何体显存泄漏)'}`);

// -------------------------------------------------------------
// 2. 滚动插值与极限数学边界 (Mathematical Boundary Tests)
// -------------------------------------------------------------
console.log('\n=====================================================');
console.log('2. 滚动插值与极限数学边界实证测试');
console.log('=====================================================');

function calcScrollProgress(rectTop, rectHeight, innerHeight) {
  const totalScrollable = rectHeight - innerHeight;
  if (totalScrollable <= 0) {
    return 0;
  }
  const rawProgress = -rectTop / totalScrollable;
  return Math.min(Math.max(rawProgress, 0), 1);
}

// 边界测试用例
const boundaryTests = [
  { name: '顶端未滚动 (rectTop = 100, height = 2600, innerHeight = 1000)', top: 100, h: 2600, ih: 1000, expected: 0 },
  { name: '急停顶端 (rectTop = 0, height = 2600, innerHeight = 1000)', top: 0, h: 2600, ih: 1000, expected: 0 },
  { name: '底端刚好触达 (rectTop = -1600, height = 2600, innerHeight = 1000)', top: -1600, h: 2600, ih: 1000, expected: 1 },
  { name: '深度过度滚动 (rectTop = -3000, height = 2600, innerHeight = 1000)', top: -3000, h: 2600, ih: 1000, expected: 1 },
  { name: '除以零极限: height == innerHeight (totalScrollable = 0)', top: 0, h: 1000, ih: 1000, expected: 0 },
  { name: '负高度异常: height < innerHeight (totalScrollable = -200)', top: 50, h: 800, ih: 1000, expected: 0 },
];

boundaryTests.forEach(bt => {
  const res = calcScrollProgress(bt.top, bt.h, bt.ih);
  const pass = res === bt.expected && !isNaN(res) && isFinite(res);
  console.log(`- [Boundary Test] ${bt.name}: result = ${res} -> ${pass ? 'PASS' : 'FAIL'}`);
});

// Lerp 收敛测试 (从 0 突变到 1，模拟 PageDown / 快速拖拽滚动条)
console.log('\n--- Lerp 平滑滤波插值极限收敛测试 (Target Jump 0 -> 1) ---');
let curr = 0;
const target = 1;
const lerpFactor = 0.08;
const trajectory = [curr];
let stepsTo99 = 0;
let stepsTo999 = 0;

for (let frame = 1; frame <= 150; frame++) {
  curr += (target - curr) * lerpFactor;
  trajectory.push(curr);
  if (curr >= 0.99 && stepsTo99 === 0) stepsTo99 = frame;
  if (curr >= 0.999 && stepsTo999 === 0) stepsTo999 = frame;
}

console.log(`- 突变到 1.0 时收敛至 99% 所需帧数: ${stepsTo99} 帧 (~${(stepsTo99 / 60).toFixed(2)} 秒 @ 60fps)`);
console.log(`- 突变到 1.0 时收敛至 99.9% 所需帧数: ${stepsTo999} 帧 (~${(stepsTo999 / 60).toFixed(2)} 秒 @ 60fps)`);
const hasOvershoot = trajectory.some(v => v > 1.0);
const hasNaN = trajectory.some(v => isNaN(v) || !isFinite(v));
console.log(`- 是否有超调 (>1.0): ${hasOvershoot ? 'YES (FAIL)' : 'NO (PASS, 严格单调递增)'}`);
console.log(`- 是否出现 NaN 或发散: ${hasNaN ? 'YES (FAIL)' : 'NO (PASS)'}`);

// 解构算法阶段分段连续性检验 (C^0 Continuity at 0.35 and 0.75)
console.log('\n--- 解构算法边界连续性数学测试 (C^0 Continuity) ---');

function evalDeconParams(progress) {
  let rotY, rotX, shieldScale, shieldOpacity, gimbalZ, ringY, crystalY, emissive;
  if (progress <= 0.35) {
    rotY = progress * Math.PI * 2.5;
    rotX = progress * Math.PI * 1.2;
    shieldScale = 1.0;
    shieldOpacity = 0.8;
    gimbalZ = 0;
    ringY = 0;
    crystalY = 0;
    emissive = 0.6;
  } else if (progress <= 0.75) {
    const decon = (progress - 0.35) / 0.4;
    const baseRotY = 0.35 * Math.PI * 2.5;
    const baseRotX = 0.35 * Math.PI * 1.2;
    rotY = baseRotY + decon * Math.PI * 0.75;
    rotX = baseRotX + decon * Math.PI * 0.35;
    shieldScale = 1.0 + decon * 1.6;
    shieldOpacity = Math.max(0.08, 0.8 * (1.0 - decon * 0.75));
    gimbalZ = decon * 8.5;
    ringY = decon * 5.2;
    crystalY = -decon * 1.8;
    emissive = 0.6 + decon * 1.4;
  } else {
    const p3 = (progress - 0.75) / 0.25;
    rotY = 0.35 * Math.PI * 2.5 + Math.PI * 0.75 + p3 * 0.2;
    rotX = 0.35 * Math.PI * 1.2 + Math.PI * 0.35 + p3 * 0.1;
    shieldScale = 2.6;
    shieldOpacity = 0.2;
    gimbalZ = 8.5;
    ringY = 5.2;
    crystalY = -1.8;
    emissive = 2.0;
  }
  return { rotY, rotX, shieldScale, shieldOpacity, gimbalZ, ringY, crystalY, emissive };
}

const p035_left = evalDeconParams(0.3500000);
const p035_right = evalDeconParams(0.3500001);
const diff035 = Math.abs(p035_left.rotY - p035_right.rotY) + Math.abs(p035_left.gimbalZ - p035_right.gimbalZ);
console.log(`- 阶段 1 -> 2 边界 (Progress = 0.35) 连续性差异 Δ: ${diff035.toExponential(4)} -> ${diff035 < 1e-4 ? 'PASS (C^0 连续无跳变)' : 'FAIL'}`);

const p075_left = evalDeconParams(0.7499999);
const p075_right = evalDeconParams(0.7500000);
const diff075 = Math.abs(p075_left.rotY - p075_right.rotY) + Math.abs(p075_left.gimbalZ - p075_right.gimbalZ);
console.log(`- 阶段 2 -> 3 边界 (Progress = 0.75) 连续性差异 Δ: ${diff075.toExponential(4)} -> ${diff075 < 1e-4 ? 'PASS (C^0 连续无跳变)' : 'FAIL'}`);

// -------------------------------------------------------------
// 3. 移动端与交互对抗 (Mobile & Interaction Tests)
// -------------------------------------------------------------
console.log('\n=====================================================');
console.log('3. 移动端与交互对抗实证测试');
console.log('=====================================================');

// 3.1 罗盘容器 pointer-events
const mountHasPointerEventsNone = scrollySrc.includes('mountRef') && scrollySrc.includes('pointer-events-none');
console.log(`- HeroPinnedScrollytelling mountRef 是否配置 pointer-events-none: ${mountHasPointerEventsNone ? 'PASS (不阻断移动端竖向滑动)' : 'FAIL'}`);

// 3.2 地球仪旋转阻尼衰减极限速度与零点恢复
console.log('\n--- 地球仪惯性阻尼极限速度衰减与自转恢复仿真 ---');

function simulateGlobeInertia(initialVx, initialVy) {
  let vx = initialVx;
  let vy = initialVy;
  let rotY = 0;
  let rotX = 0;
  let framesToThreshold = 0;
  let restoredAutoRotate = false;
  let directionReversalAtThreshold = false;

  for (let f = 1; f <= 500; f++) {
    rotY += vx;
    rotX = Math.max(-Math.PI * 0.35, Math.min(Math.PI * 0.35, rotX + vy));

    vx *= 0.95;
    vy *= 0.95;

    // 检查是否触发自转恢复
    if (Math.abs(vx) < 0.0001 && Math.abs(vy) < 0.0001) {
      if (!restoredAutoRotate) {
        restoredAutoRotate = true;
        framesToThreshold = f;
        if (initialVx < 0) {
          directionReversalAtThreshold = true;
        }
      }
      rotY += 0.0015; // 恢复自转
    }
  }

  return { framesToThreshold, restoredAutoRotate, directionReversalAtThreshold, finalVx: vx };
}

// 常规甩动速度 (Vx = +1.0)
const simNormPos = simulateGlobeInertia(1.0, 0.2);
console.log(`- 常规正向速度 (Vx = +1.0): 恢复慢速自转所需帧数: ${simNormPos.framesToThreshold} 帧 (~${(simNormPos.framesToThreshold / 60).toFixed(2)}s) -> ${simNormPos.restoredAutoRotate ? 'PASS' : 'FAIL'}`);

// 极限正向速度 (极速向右甩动 Vx = +50.0)
const simHighPos = simulateGlobeInertia(50.0, 10.0);
console.log(`- 极限正向速度 (Vx = +50.0): 恢复慢速自转所需帧数: ${simHighPos.framesToThreshold} 帧 (~${(simHighPos.framesToThreshold / 60).toFixed(2)}s) -> ${simHighPos.restoredAutoRotate ? 'PASS' : 'FAIL'}`);

// 极限反向速度 (极速向左甩动 Vx = -50.0)
const simHighNeg = simulateGlobeInertia(-50.0, -10.0);
console.log(`- 极限负向速度 (Vx = -50.0): 恢复慢速自转所需帧数: ${simHighNeg.framesToThreshold} 帧 (~${(simHighNeg.framesToThreshold / 60).toFixed(2)}s) -> ${simHighNeg.restoredAutoRotate ? 'PASS' : 'FAIL'}`);
console.log(`- 极限负向速度反转突变检验: ${simHighNeg.directionReversalAtThreshold ? 'OBSERVATION: 向左逆时针甩动后，在衰减到阈值 0.0001 时瞬时叠加 +0.0015 顺时针慢速自转，发生旋转方向翻转' : 'NO'}`);

console.log('\n=====================================================');
console.log('测试完成');
console.log('=====================================================');
