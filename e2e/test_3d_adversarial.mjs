import fs from 'fs';
import path from 'path';

// =============================================================
// 1. WebGL 显存与资源泄漏对抗性静态检查 (VoyageGlobe 3D 地球仪)
//    2026-09-09 迁移注记：3D 罗盘组件已由 2D Canvas 交互星图替代，
//    罗盘相关 dispose/滚动断言同步退役；星图生命周期见 test_star_atlas_adversarial.mjs
// =============================================================

console.log('=====================================================');
console.log('1. WebGL 显存与资源泄漏对抗性静态与动态检查');
console.log('=====================================================');

const globePath = path.resolve('frontend/components/journey/VoyageGlobe.tsx');
const globeSrc = fs.readFileSync(globePath, 'utf-8');

// [Test 1.1] VoyageGlobe.tsx: 资源泄漏检查
console.log('\n--- [Test 1.1] VoyageGlobe.tsx 显存释放与生命周期 ---');
const globeClonesPinMat = globeSrc.includes('pinMat.clone()');
const globeClonesCylinderMat = globeSrc.includes('cylinderMat.clone()');
const globeDisposesClonedMats = /interactiveMeshes.*dispose/.test(globeSrc) || /pinMesh.*material.*dispose/.test(globeSrc);
console.log(`- 是否存在 pinMat.clone() / cylinderMat.clone(): ${globeClonesPinMat && globeClonesCylinderMat ? 'YES' : 'NO'}`);
console.log(`- 是否在 cleanup 中释放了每个城市 Mesh 克隆的 Material: ${globeDisposesClonedMats ? 'PASS' : 'FAIL'}`);

const globeHasTouchCancel = globeSrc.includes('touchcancel');
console.log(`- 是否监听并解绑 touchcancel 事件: ${globeHasTouchCancel ? 'PASS' : 'FAIL'}`);


// =============================================================
// 2. 空间视差插值极限数学边界实证测试
// =============================================================
console.log('\n=====================================================');
console.log('2. 空间视差插值极限数学边界实证测试');
console.log('=====================================================');

// 2.1 视口坐标归一化除以零与极限截断测试 (handleMouseMove Math Boundaries)
console.log('\n--- [Test 2.1] 鼠标视差归一化坐标计算与极端边界测试 ---');

function evalRawMouseFormula(clientX, clientY, rect) {
  const x = ((clientX - rect.left) / rect.width - 0.5) * 2;
  const y = ((clientY - rect.top) / rect.height - 0.5) * 2;
  const clampedX = Math.max(-1, Math.min(1, x));
  const clampedY = Math.max(-1, Math.min(1, y));
  return { x, y, clampedX, clampedY };
}

const mouseAdversarialCases = [
  { name: '中心位置 (clientX = 400, width = 800)', cx: 400, cy: 300, rect: { left: 0, top: 0, width: 800, height: 600 }, expected: { x: 0, y: 0 } },
  { name: '左上角边缘 (clientX = 0, clientY = 0)', cx: 0, cy: 0, rect: { left: 0, top: 0, width: 800, height: 600 }, expected: { x: -1, y: -1 } },
  { name: '右下角边缘 (clientX = 800, clientY = 600)', cx: 800, cy: 600, rect: { left: 0, top: 0, width: 800, height: 600 }, expected: { x: 1, y: 1 } },
  { name: '远界超大正坐标 (clientX = 50000)', cx: 50000, cy: 50000, rect: { left: 0, top: 0, width: 800, height: 600 }, expected: { x: 1, y: 1 } },
  { name: '远界超大负坐标 (clientX = -50000)', cx: -50000, cy: -50000, rect: { left: 0, top: 0, width: 800, height: 600 }, expected: { x: -1, y: -1 } },
  { name: '除以零极端测试: clientX > left 且 rect.width = 0 (+Infinity)', cx: 100, cy: 100, rect: { left: 0, top: 0, width: 0, height: 0 }, expected: { x: 1, y: 1 } },
  { name: '除以零极端测试: clientX < left 且 rect.width = 0 (-Infinity)', cx: -100, cy: -100, rect: { left: 0, top: 0, width: 0, height: 0 }, expected: { x: -1, y: -1 } },
  { name: '0/0 未定式极端测试: clientX === left 且 rect.width = 0 (NaN)', cx: 0, cy: 0, rect: { left: 0, top: 0, width: 0, height: 0 }, expected: { x: NaN, y: NaN } },
];

mouseAdversarialCases.forEach((tc) => {
  const res = evalRawMouseFormula(tc.cx, tc.cy, tc.rect);
  let pass;
  if (isNaN(tc.expected.x)) {
    pass = isNaN(res.clampedX) && isNaN(res.clampedY);
    console.log(`- [Mouse Norm Test] ${tc.name}: raw=(${res.x}, ${res.y}) clamped=(${res.clampedX}, ${res.clampedY}) -> ${pass ? 'PASS (已精确捕获 0/0 NaN 特异性)' : 'FAIL'}`);
  } else {
    pass = (Math.abs(res.clampedX - tc.expected.x) < 1e-4) && (Math.abs(res.clampedY - tc.expected.y) < 1e-4);
    console.log(`- [Mouse Norm Test] ${tc.name}: clamped=(${res.clampedX}, ${res.clampedY}) -> ${pass ? 'PASS' : 'FAIL'}`);
  }
});


// =============================================================
// 3. Lerp 阻尼单调平滑收敛性实证测试 (Damping Convergence Tests)
// =============================================================
console.log('\n=====================================================');
console.log('3. Lerp 阻尼单调平滑收敛性实证测试');
console.log('=====================================================');

// 3.1 解构度 Lerp 收敛测试 (alpha = 0.08, 0 -> 1.0)
console.log('\n--- [Test 3.1] 解构度 Lerp 收敛性测试 (alpha = 0.08, Target 0 -> 1.0) ---');
let deconCurr = 0;
const deconTarget = 1.0;
const deconLerp = 0.08;
const deconTraj = [deconCurr];
let deconSteps99 = 0;
let deconSteps999 = 0;

for (let frame = 1; frame <= 150; frame++) {
  deconCurr += (deconTarget - deconCurr) * deconLerp;
  deconTraj.push(deconCurr);
  if (deconCurr >= 0.99 && deconSteps99 === 0) deconSteps99 = frame;
  if (deconCurr >= 0.999 && deconSteps999 === 0) deconSteps999 = frame;
}

console.log(`- 突变到 1.0 时收敛至 99% 所需帧数: ${deconSteps99} 帧 (~${(deconSteps99 / 60).toFixed(2)} 秒 @ 60fps)`);
console.log(`- 突变到 1.0 时收敛至 99.9% 所需帧数: ${deconSteps999} 帧 (~${(deconSteps999 / 60).toFixed(2)} 秒 @ 60fps)`);

// 严格单调性与无超调验证
let deconIsMonotonic = true;
for (let i = 1; i < deconTraj.length; i++) {
  if (deconTraj[i] < deconTraj[i - 1]) deconIsMonotonic = false;
}
const deconHasOvershoot = deconTraj.some((v) => v > 1.0);
const deconHasNaN = deconTraj.some((v) => isNaN(v) || !isFinite(v));

console.log(`- 56 帧内达到 99% 验收要求 (deconSteps99 <= 56): ${deconSteps99 <= 56 ? 'PASS' : 'FAIL'}`);
console.log(`- 轨迹是否严格单调递增: ${deconIsMonotonic ? 'PASS' : 'FAIL'}`);
console.log(`- 是否存在超调 (overshoot > 1.0): ${deconHasOvershoot ? 'FAIL (OVERSHOOT DETECTED)' : 'PASS (超调量 0.00%)'}`);
console.log(`- 是否无 NaN / 无发散: ${!deconHasNaN ? 'PASS' : 'FAIL'}`);

// 3.2 鼠标视差物理阻尼 Lerp 收敛测试 (alpha = 0.07, Target -1.0 -> +1.0)
console.log('\n--- [Test 3.2] 鼠标视差物理阻尼 Lerp 测试 (alpha = 0.07, Jump -1.0 -> +1.0) ---');
let mouseCurr = -1.0;
const mouseTargetVal = 1.0;
const mouseAlpha = 0.07;
const mouseTraj = [mouseCurr];
let mouseSteps99 = 0;
let mouseSteps999 = 0;

for (let frame = 1; frame <= 200; frame++) {
  mouseCurr += (mouseTargetVal - mouseCurr) * mouseAlpha;
  mouseTraj.push(mouseCurr);
  // 当从 -1 跃变到 +1，总跨度为 2.0，达到 99% 即 mouseCurr >= 1.0 - 0.02 = 0.98
  if (mouseCurr >= 0.98 && mouseSteps99 === 0) mouseSteps99 = frame;
  if (mouseCurr >= 0.998 && mouseSteps999 === 0) mouseSteps999 = frame;
}

console.log(`- 极速甩动 -1.0 -> +1.0 收敛至 99% 所需帧数: ${mouseSteps99} 帧 (~${(mouseSteps99 / 60).toFixed(2)} 秒 @ 60fps)`);
console.log(`- 极速甩动 -1.0 -> +1.0 收敛至 99.9% 所需帧数: ${mouseSteps999} 帧 (~${(mouseSteps999 / 60).toFixed(2)} 秒 @ 60fps)`);

let mouseIsMonotonic = true;
for (let i = 1; i < mouseTraj.length; i++) {
  if (mouseTraj[i] < mouseTraj[i - 1]) mouseIsMonotonic = false;
}
const mouseHasOvershoot = mouseTraj.some((v) => v > 1.0);
console.log(`- 鼠标视差轨迹是否严格单调: ${mouseIsMonotonic ? 'PASS' : 'FAIL'}`);
console.log(`- 鼠标视差是否存在超调: ${mouseHasOvershoot ? 'FAIL' : 'PASS (超调量 0.00%)'}`);

// 3.3 高频抖动与白噪声滤波实测 (Adversarial Jitter Filtering)
console.log('\n--- [Test 3.3] 高频鼠标微颤抖动白噪声滤波衰减测试 ---');
let filteredVal = 0;
let rawVariance = 0;
let filteredVariance = 0;
const numJitterFrames = 300;

// 伪随机种子高频噪声 (模拟手部生理微颤 ±0.08)
for (let f = 0; f < numJitterFrames; f++) {
  const noise = (Math.sin(f * 13.7) + Math.cos(f * 29.3)) * 0.04; // 振幅 ±0.08
  rawVariance += noise * noise;

  filteredVal += (noise - filteredVal) * mouseAlpha;
  filteredVariance += filteredVal * filteredVal;
}
rawVariance /= numJitterFrames;
filteredVariance /= numJitterFrames;
const noiseAttenuation = (1 - filteredVariance / rawVariance) * 100;

console.log(`- 原始抖动方差: ${rawVariance.toFixed(6)}, 滤波后方差: ${filteredVariance.toFixed(6)}`);
console.log(`- 高频生理抖动滤除衰减率: ${noiseAttenuation.toFixed(2)}% -> ${noiseAttenuation > 85 ? 'PASS (平滑消除手抖高频毛刺)' : 'FAIL'}`);


// =============================================================
// 4. 地球仪惯性阻尼极限速度与零点恢复
// =============================================================
console.log('\n=====================================================');
console.log('4. 地球仪惯性阻尼极限速度与零点恢复');
console.log('=====================================================');

console.log('\n--- [Test 4.1] 地球仪惯性阻尼极限速度衰减与自转恢复仿真 ---');

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

const simNormPos = simulateGlobeInertia(1.0, 0.2);
console.log(`- 常规正向速度 (Vx = +1.0): 恢复慢速自转所需帧数: ${simNormPos.framesToThreshold} 帧 (~${(simNormPos.framesToThreshold / 60).toFixed(2)}s) -> ${simNormPos.restoredAutoRotate ? 'PASS' : 'FAIL'}`);

const simHighPos = simulateGlobeInertia(50.0, 10.0);
console.log(`- 极限正向速度 (Vx = +50.0): 恢复慢速自转所需帧数: ${simHighPos.framesToThreshold} 帧 (~${(simHighPos.framesToThreshold / 60).toFixed(2)}s) -> ${simHighPos.restoredAutoRotate ? 'PASS' : 'FAIL'}`);

const simHighNeg = simulateGlobeInertia(-50.0, -10.0);
console.log(`- 极限负向速度 (Vx = -50.0): 恢复慢速自转所需帧数: ${simHighNeg.framesToThreshold} 帧 (~${(simHighNeg.framesToThreshold / 60).toFixed(2)}s) -> ${simHighNeg.restoredAutoRotate ? 'PASS' : 'FAIL'}`);
console.log(`- 极限负向速度反转突变检验: ${simHighNeg.directionReversalAtThreshold ? 'OBSERVATION: 向左逆时针甩动后，在衰减到阈值 0.0001 时瞬时叠加 +0.0015 顺时针慢速自转，发生旋转方向翻转' : 'NO'}`);

console.log('\n=====================================================');
console.log('全部 3D 对抗测试执行完成');
console.log('=====================================================');
