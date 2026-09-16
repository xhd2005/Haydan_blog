'use client';

import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

interface JourneyStarfieldCanvasProps {
  mousePos?: { x: number; y: number };
  isDark?: boolean;
}

/**
 * 极简深空天体色温调色板 (遵循哈佛恒星光谱分类系统 O/B/A/F/G/K/M)
 */
const STAR_SPECTRAL_COLORS = [
  new THREE.Color('#ffffff'), // O/B 织女/天狼纯净钻石白
  new THREE.Color('#f0f9ff'), // B 型高亮冷白
  new THREE.Color('#e0f2fe'), // B 型冰蓝钻石星辉
  new THREE.Color('#bae6fd'), // B 型浅青蓝辉光
  new THREE.Color('#fef3c7'), // G 型太阳暖金
  new THREE.Color('#fde68a'), // G/K 型恒星淡金
  new THREE.Color('#ffedd5'), // K 型浅杏金
  new THREE.Color('#fed7aa'), // K/M 型微暖杏橙
  new THREE.Color('#fce7f3'), // M 型微弱星尘浅粉
];

/**
 * 生成微细针尖星芒纹理 (中心锐利晶莹 + 极柔渐隐，拒绝突兀大散景)
 */
function createPinpointStarTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 15);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.12, 'rgba(240, 249, 255, 0.95)');
    grad.addColorStop(0.35, 'rgba(224, 242, 254, 0.4)');
    grad.addColorStop(0.7, 'rgba(186, 230, 253, 0.08)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 32, 32);

    // 极细十字微芒 (4-point diffraction spike)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(16, 7);
    ctx.lineTo(16, 25);
    ctx.moveTo(7, 16);
    ctx.lineTo(25, 16);
    ctx.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

/**
 * 生成前景亮星十字衍射光芒纹理 (Bright Star with Prominent Diffraction Spikes)
 */
function createBrightStarTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 30);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.1, 'rgba(240, 249, 255, 0.9)');
    grad.addColorStop(0.3, 'rgba(186, 230, 253, 0.35)');
    grad.addColorStop(0.65, 'rgba(125, 211, 252, 0.08)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);

    // 极细且优雅的十字星芒
    const spikeH = ctx.createLinearGradient(0, 32, 64, 32);
    spikeH.addColorStop(0, 'rgba(255,255,255,0)');
    spikeH.addColorStop(0.5, 'rgba(255,255,255,0.85)');
    spikeH.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.strokeStyle = spikeH;
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(3, 32);
    ctx.lineTo(61, 32);
    ctx.stroke();

    const spikeV = ctx.createLinearGradient(32, 0, 32, 64);
    spikeV.addColorStop(0, 'rgba(255,255,255,0)');
    spikeV.addColorStop(0.5, 'rgba(255,255,255,0.85)');
    spikeV.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.strokeStyle = spikeV;
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(32, 3);
    ctx.lineTo(32, 61);
    ctx.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

/**
 * 生成真实深空星云与宇宙尘埃柔和纹理 (Deep Space Nebula Glow)
 * 拒绝突兀绿斑，采用深蓝、靛青、微夜紫的深空漫射
 */
function createNebulaTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 63);
    grad.addColorStop(0, 'rgba(224, 242, 254, 0.45)');
    grad.addColorStop(0.25, 'rgba(56, 189, 248, 0.18)');
    grad.addColorStop(0.55, 'rgba(99, 102, 241, 0.1)');
    grad.addColorStop(0.85, 'rgba(30, 27, 75, 0.03)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

/** 近似高斯随机数 (Box-Muller) */
function gaussianRandom(sigma: number): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v) * sigma;
}

/**
 * 天文摄影级深空星域画布 v3 (Deep Space Astrophotography Starfield)
 * 1. 5200 颗全场深空色温微细恒星点阵 (微晶闪烁，极致细腻)
 * 2. 倾斜银河带：3400 颗高密度带状微星 + Great Rift 真实尘埃暗隙
 * 3. 真实天文摄影星云：深蓝/深靛/夜紫/微青漫射，彻底告别粗暴绿斑
 * 4. 前景精选亮星层：60 颗高定十字衍射光芒星
 * 5. 偶尔掠过的超逼真流星
 * 6. 视差引力阻尼平滑漫游
 */
export function JourneyStarfieldCanvas({
  mousePos = { x: 0, y: 0 },
  isDark = true,
}: JourneyStarfieldCanvasProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const materialsRef = useRef<{
    stars?: THREE.PointsMaterial;
    bright?: THREE.PointsMaterial;
    milkyWay?: THREE.PointsMaterial;
    nebula?: THREE.PointsMaterial;
  }>({});

  // 监听明暗模式切换，实时调整宇宙背景透光度（浅色模式保持晶莹高透，绝不抹除星空）
  useEffect(() => {
    const m = materialsRef.current;
    if (m.stars) {
      m.stars.opacity = isDark ? 0.95 : 0.85;
      m.stars.needsUpdate = true;
    }
    if (m.bright) {
      m.bright.opacity = isDark ? 0.88 : 0.80;
      m.bright.needsUpdate = true;
    }
    if (m.milkyWay) {
      m.milkyWay.opacity = isDark ? 0.52 : 0.42;
      m.milkyWay.needsUpdate = true;
    }
    if (m.nebula) {
      m.nebula.opacity = isDark ? 0.32 : 0.22;
      m.nebula.needsUpdate = true;
    }
  }, [isDark]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let width = container.clientWidth || window.innerWidth;
    let height = container.clientHeight || window.innerHeight;

    // 1. 场景与透视相机
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 1400);
    camera.position.z = 54;

    // 2. 渲染器
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    container.appendChild(renderer.domElement);

    // 3. 纹理
    const starTexture = createPinpointStarTexture();
    const brightStarTexture = createBrightStarTexture();
    const nebulaTexture = createNebulaTexture();

    // ============================================================
    // 第一层：天体摄影真实深空星云漫射 (深蓝/靛青/暗夜微紫/暗青)
    // 彻底告别突兀的大块纯绿！呈现深邃如哈勃深场的宇宙底蕴
    // ============================================================
    const NEBULA_CLUMPS: { center: [number, number, number]; hue: THREE.Color; count: number }[] = [
      { center: [-85, -28, -45], hue: new THREE.Color('#0369a1'), count: 70 }, // 深邃天体海蓝
      { center: [-35, -12, -42], hue: new THREE.Color('#1e1b4b'), count: 80 }, // 深空暗夜靛青
      { center: [18, 12, -38], hue: new THREE.Color('#2e1065'), count: 65 },   // 暗紫微尘星云
      { center: [68, 32, -32], hue: new THREE.Color('#0e7490'), count: 65 },   // 深夜极光青蓝
      { center: [105, 48, -28], hue: new THREE.Color('#1e3a8a'), count: 50 },  // 靛蓝深空外缘
    ];

    const nebulaCount = NEBULA_CLUMPS.reduce((s, c) => s + c.count, 0);
    const nebulaGeo = new THREE.BufferGeometry();
    const nebulaPos = new Float32Array(nebulaCount * 3);
    const nebulaColors = new Float32Array(nebulaCount * 3);

    let nebulaIdx = 0;
    NEBULA_CLUMPS.forEach((clump) => {
      for (let i = 0; i < clump.count; i++, nebulaIdx++) {
        const i3 = nebulaIdx * 3;
        nebulaPos[i3] = clump.center[0] + gaussianRandom(24);
        nebulaPos[i3 + 1] = clump.center[1] + gaussianRandom(16);
        nebulaPos[i3 + 2] = clump.center[2] + gaussianRandom(12);

        const fade = 0.25 + Math.random() * 0.45;
        nebulaColors[i3] = clump.hue.r * fade;
        nebulaColors[i3 + 1] = clump.hue.g * fade;
        nebulaColors[i3 + 2] = clump.hue.b * fade;
      }
    });

    nebulaGeo.setAttribute('position', new THREE.BufferAttribute(nebulaPos, 3));
    nebulaGeo.setAttribute('color', new THREE.BufferAttribute(nebulaColors, 3));

    const nebulaMaterial = new THREE.PointsMaterial({
      size: 48,
      map: nebulaTexture,
      vertexColors: true,
      transparent: true,
      opacity: isDark ? 0.32 : 0.22,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    materialsRef.current.nebula = nebulaMaterial;
    const nebulaMesh = new THREE.Points(nebulaGeo, nebulaMaterial);
    scene.add(nebulaMesh);

    // ============================================================
    // 第二层：深空微晶星沙恒星群 (5200 颗微细点阵，哈佛色温光谱)
    // ============================================================
    const starCount = 5200;
    const starsGeo = new THREE.BufferGeometry();
    const starsPositions = new Float32Array(starCount * 3);
    const starsColors = new Float32Array(starCount * 3);
    const starsBaseColors = new Float32Array(starCount * 3);
    const starsPhases = new Float32Array(starCount);

    for (let i = 0; i < starCount; i++) {
      const i3 = i * 3;
      const x = (Math.random() - 0.5) * 280;
      const y = (Math.random() - 0.5) * 180;
      const z = (Math.random() - 0.5) * 140 - 20;

      starsPositions[i3] = x;
      starsPositions[i3 + 1] = y;
      starsPositions[i3 + 2] = z;

      const color = STAR_SPECTRAL_COLORS[Math.floor(Math.random() * STAR_SPECTRAL_COLORS.length)];
      starsColors[i3] = color.r;
      starsColors[i3 + 1] = color.g;
      starsColors[i3 + 2] = color.b;

      starsBaseColors[i3] = color.r;
      starsBaseColors[i3 + 1] = color.g;
      starsBaseColors[i3 + 2] = color.b;

      starsPhases[i] = Math.random() * Math.PI * 2;
    }

    starsGeo.setAttribute('position', new THREE.BufferAttribute(starsPositions, 3));
    starsGeo.setAttribute('color', new THREE.BufferAttribute(starsColors, 3));

    const starsMaterial = new THREE.PointsMaterial({
      size: 0.72,
      map: starTexture,
      vertexColors: true,
      transparent: true,
      opacity: isDark ? 0.95 : 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    materialsRef.current.stars = starsMaterial;
    const starsMesh = new THREE.Points(starsGeo, starsMaterial);
    scene.add(starsMesh);

    // ============================================================
    // 第三层：倾斜银河带 (Milky Way Band, 3400 颗高密带状微星 + Great Rift)
    // ============================================================
    const milkyCount = 3400;
    const milkyGeo = new THREE.BufferGeometry();
    const milkyPositions = new Float32Array(milkyCount * 3);
    const milkyColors = new Float32Array(milkyCount * 3);
    const milkyBaseColors = new Float32Array(milkyCount * 3);
    const milkyPhases = new Float32Array(milkyCount);

    const bandSlope = 0.42;

    for (let i = 0; i < milkyCount; i++) {
      const i3 = i * 3;
      const u = (Math.random() - 0.5) * 320;
      const perp = Math.random() < 0.72 ? gaussianRandom(6.5) : gaussianRandom(20);

      // Great Rift 真实尘埃暗隙
      if (Math.abs(perp) < 3.0 && Math.random() < 0.65) {
        milkyPhases[i] = -1;
        milkyPositions[i3] = 0;
        milkyPositions[i3 + 1] = 0;
        milkyPositions[i3 + 2] = -600;
        continue;
      }

      const x = u;
      const y = u * bandSlope + perp;
      const z = -32 + gaussianRandom(8);

      milkyPositions[i3] = x;
      milkyPositions[i3 + 1] = y;
      milkyPositions[i3 + 2] = z;

      const warmCore = Math.abs(perp) < 8;
      const color =
        warmCore && Math.random() < 0.35
          ? new THREE.Color('#fef3c7')
          : STAR_SPECTRAL_COLORS[Math.floor(Math.random() * STAR_SPECTRAL_COLORS.length)];
      const dim = 0.35 + Math.random() * 0.55;

      milkyColors[i3] = color.r * dim;
      milkyColors[i3 + 1] = color.g * dim;
      milkyColors[i3 + 2] = color.b * dim;
      milkyBaseColors[i3] = color.r * dim;
      milkyBaseColors[i3 + 1] = color.g * dim;
      milkyBaseColors[i3 + 2] = color.b * dim;

      milkyPhases[i] = Math.random() * Math.PI * 2;
    }

    milkyGeo.setAttribute('position', new THREE.BufferAttribute(milkyPositions, 3));
    milkyGeo.setAttribute('color', new THREE.BufferAttribute(milkyColors, 3));

    const milkyMaterial = new THREE.PointsMaterial({
      size: 0.54,
      map: starTexture,
      vertexColors: true,
      transparent: true,
      opacity: isDark ? 0.52 : 0.42,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    materialsRef.current.milkyWay = milkyMaterial;
    const milkyMesh = new THREE.Points(milkyGeo, milkyMaterial);
    scene.add(milkyMesh);

    // ============================================================
    // 第四层：精选前景亮星 (60 颗极细十字芒线，天文望远镜质感)
    // ============================================================
    const brightCount = 60;
    const brightGeo = new THREE.BufferGeometry();
    const brightPositions = new Float32Array(brightCount * 3);
    const brightColors = new Float32Array(brightCount * 3);
    const brightBaseColors = new Float32Array(brightCount * 3);
    const brightPhases = new Float32Array(brightCount);

    for (let i = 0; i < brightCount; i++) {
      const i3 = i * 3;
      brightPositions[i3] = (Math.random() - 0.5) * 240;
      brightPositions[i3 + 1] = (Math.random() - 0.5) * 140;
      brightPositions[i3 + 2] = (Math.random() - 0.5) * 50 - 5;

      const color = STAR_SPECTRAL_COLORS[Math.floor(Math.random() * STAR_SPECTRAL_COLORS.length)];
      brightColors[i3] = color.r;
      brightColors[i3 + 1] = color.g;
      brightColors[i3 + 2] = color.b;
      brightBaseColors[i3] = color.r;
      brightBaseColors[i3 + 1] = color.g;
      brightBaseColors[i3 + 2] = color.b;
      brightPhases[i] = Math.random() * Math.PI * 2;
    }

    brightGeo.setAttribute('position', new THREE.BufferAttribute(brightPositions, 3));
    brightGeo.setAttribute('color', new THREE.BufferAttribute(brightColors, 3));

    const brightMaterial = new THREE.PointsMaterial({
      size: 2.0,
      map: brightStarTexture,
      vertexColors: true,
      transparent: true,
      opacity: isDark ? 0.88 : 0.80,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    materialsRef.current.bright = brightMaterial;
    const brightMesh = new THREE.Points(brightGeo, brightMaterial);
    scene.add(brightMesh);

    // ============================================================
    // 第五层：超逼真掠空流星 (Celestial Meteor)
    // ============================================================
    const meteorCount = 24;
    const meteorGeo = new THREE.BufferGeometry();
    const meteorPositions = new Float32Array(meteorCount * 3);
    const meteorColors = new Float32Array(meteorCount * 3);

    for (let i = 0; i < meteorCount; i++) {
      const i3 = i * 3;
      meteorPositions[i3] = 0;
      meteorPositions[i3 + 1] = 0;
      meteorPositions[i3 + 2] = 0;

      const alpha = Math.pow(1.0 - i / meteorCount, 1.6);
      meteorColors[i3] = alpha;
      meteorColors[i3 + 1] = alpha * 0.95;
      meteorColors[i3 + 2] = alpha * 1.1;
    }

    meteorGeo.setAttribute('position', new THREE.BufferAttribute(meteorPositions, 3));
    meteorGeo.setAttribute('color', new THREE.BufferAttribute(meteorColors, 3));

    const meteorMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      linewidth: 1.2,
    });

    const meteorLine = new THREE.Line(meteorGeo, meteorMaterial);
    scene.add(meteorLine);

    let isMeteorActive = false;
    let meteorStartX = 0;
    let meteorStartY = 0;
    let meteorSpeedX = 0;
    let meteorSpeedY = 0;
    let meteorProgress = 0;
    let nextMeteorTime = 5 + Math.random() * 7;

    const triggerMeteor = () => {
      isMeteorActive = true;
      meteorProgress = 0;
      meteorStartX = (Math.random() - 0.25) * 120;
      meteorStartY = 40 + Math.random() * 20;
      const angle = (Math.PI / 4) + (Math.random() - 0.5) * 0.25;
      const speed = 80 + Math.random() * 30;
      meteorSpeedX = -Math.cos(angle) * speed;
      meteorSpeedY = -Math.sin(angle) * speed;
      meteorMaterial.opacity = 0.85;
    };

    // ============================================================
    // 渲染循环：多相位混频闪烁 + 微呼吸 + 视差
    // ============================================================
    let animationFrameId: number;
    const clock = new THREE.Clock();
    let targetCameraX = 0;
    let targetCameraY = 0;

    const twinkle = (
      geo: THREE.BufferGeometry,
      base: Float32Array,
      phases: Float32Array,
      count: number,
      step: number,
      amp: number,
      time: number
    ) => {
      const colorAttr = geo.attributes.color as THREE.BufferAttribute;
      const colorArr = colorAttr.array as Float32Array;
      for (let i = 0; i < count; i += step) {
        if (phases[i] < 0) continue;
        const i3 = i * 3;
        const factor = 0.88 + Math.sin(time * 1.5 + phases[i] * 3) * amp;
        colorArr[i3] = Math.min(1.0, base[i3] * factor);
        colorArr[i3 + 1] = Math.min(1.0, base[i3 + 1] * factor);
        colorArr[i3 + 2] = Math.min(1.0, base[i3 + 2] * factor);
      }
      colorAttr.needsUpdate = true;
    };

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // 1. 恒星真实分层闪烁
      twinkle(starsGeo, starsBaseColors, starsPhases, starCount, 3, 0.38, time);
      twinkle(milkyGeo, milkyBaseColors, milkyPhases, milkyCount, 4, 0.25, time);
      twinkle(brightGeo, brightBaseColors, brightPhases, brightCount, 2, 0.45, time);

      // 2. 星云极其缓慢的呼吸脉动
      nebulaMaterial.size = 48 * (1 + Math.sin(time * 0.18) * 0.05);
      nebulaMesh.rotation.z = time * 0.0015;
      starsMesh.rotation.y = time * 0.0025;
      milkyMesh.rotation.z = Math.sin(time * 0.015) * 0.003;

      // 3. 流星物理移动
      if (!isMeteorActive && time > nextMeteorTime) {
        triggerMeteor();
        nextMeteorTime = time + 14 + Math.random() * 16;
      }

      if (isMeteorActive) {
        meteorProgress += delta * 1.6;
        const curX = meteorStartX + meteorSpeedX * meteorProgress;
        const curY = meteorStartY + meteorSpeedY * meteorProgress;

        const posAttr = meteorGeo.attributes.position as THREE.BufferAttribute;
        const posArr = posAttr.array as Float32Array;

        for (let i = 0; i < meteorCount; i++) {
          const i3 = i * 3;
          const trailLag = i * 0.012;
          posArr[i3] = curX - meteorSpeedX * trailLag;
          posArr[i3 + 1] = curY - meteorSpeedY * trailLag;
          posArr[i3 + 2] = 4;
        }
        posAttr.needsUpdate = true;

        if (meteorProgress > 0.8) {
          meteorMaterial.opacity = Math.max(0, 1 - (meteorProgress - 0.8) / 0.2);
        }

        if (meteorProgress >= 1.0) {
          isMeteorActive = false;
          meteorMaterial.opacity = 0;
        }
      }

      // 4. 鼠标微视差平滑阻尼
      targetCameraX = mousePos.x * 0.06;
      targetCameraY = -mousePos.y * 0.06;

      camera.position.x += (targetCameraX - camera.position.x) * 0.035;
      camera.position.y += (targetCameraY - camera.position.y) * 0.035;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      width = container.clientWidth || window.innerWidth;
      height = container.clientHeight || window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      starsGeo.dispose();
      starsMaterial.dispose();
      milkyGeo.dispose();
      milkyMaterial.dispose();
      brightGeo.dispose();
      brightMaterial.dispose();
      nebulaGeo.dispose();
      nebulaMaterial.dispose();
      starTexture.dispose();
      brightStarTexture.dispose();
      nebulaTexture.dispose();
      meteorGeo.dispose();
      meteorMaterial.dispose();
      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      materialsRef.current = {};
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 z-0 pointer-events-none overflow-hidden transition-opacity duration-1000"
      aria-hidden="true"
    />
  );
}
