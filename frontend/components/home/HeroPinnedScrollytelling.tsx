'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { useTheme } from 'next-themes';
import { useI18n } from '@/lib/i18n';
import Link from 'next/link';
import {
  Cpu,
  Layers,
  Bot,
  Sparkles,
  ArrowUpRight,
  ChevronDown,
} from 'lucide-react';

export function HeroPinnedScrollytelling() {
  const { locale } = useI18n();
  const { resolvedTheme } = useTheme();
  const isEn = locale === 'en';

  const containerRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);

  // 卡片 DOM 引用以实现 120fps 无开销直接样式变换
  const pillar1Ref = useRef<HTMLDivElement>(null);
  const pillar2Ref = useRef<HTMLDivElement>(null);
  const pillar3Ref = useRef<HTMLDivElement>(null);
  const stageIndicatorRef = useRef<HTMLDivElement>(null);

  // 状态仅用于辅助展示当前进度百分比及阶段文本
  const [activeStage, setActiveStage] = useState<number>(1);
  const [smoothProgressDisplay, setSmoothProgressDisplay] = useState<number>(0);

  // 唤起全局 AI 伴读助手
  const handleSummonAi = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('open-hayden-ai', {
          detail: {
            selectedText: isEn
              ? 'SenseNova / DeepSeek AI Multi-agent Architecture and Digital Garden RAG'
              : '商汤 SenseNova / DeepSeek AI 智能体体系与数字花园 RAG 架构',
          },
        })
      );
    }
  }, [isEn]);

  useEffect(() => {
    const mountEl = mountRef.current;
    const containerEl = containerRef.current;
    if (!mountEl || !containerEl) return;

    let animationFrameId: number;
    let targetProgress = 0;
    let currentProgress = 0;

    // 1. 初始化 Three.js 场景与渲染器
    const width = mountEl.clientWidth || window.innerWidth;
    const height = mountEl.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 42);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    mountEl.appendChild(renderer.domElement);

    // 2. 光照系统（支持根据暗黑/明亮主题自适应）
    const isDark = resolvedTheme !== 'light';
    const ambientLight = new THREE.AmbientLight(
      isDark ? 0x64748b : 0xffffff,
      isDark ? 1.0 : 1.8
    );
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x38bdf8, isDark ? 2.5 : 2.0);
    dirLight1.position.set(25, 30, 25);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x10b981, isDark ? 2.0 : 1.5);
    dirLight2.position.set(-25, -20, 20);
    scene.add(dirLight2);

    const centerPointLight = new THREE.PointLight(0x10b981, isDark ? 4.0 : 3.0, 50);
    centerPointLight.position.set(0, 0, 0);
    scene.add(centerPointLight);

    // 3. 构建 3D 几何罗盘装配体系 (Compass Assembly)
    const compassGroup = new THREE.Group();
    scene.add(compassGroup);

    // --- Layer 1: 核心能量晶体 (Core Energy Crystal) ---
    const crystalGroup = new THREE.Group();
    compassGroup.add(crystalGroup);

    // 外层八面体高金属微光晶体
    const crystalGeo = new THREE.OctahedronGeometry(4, 0);
    const crystalMat = new THREE.MeshStandardMaterial({
      color: isDark ? 0x10b981 : 0x059669,
      roughness: 0.15,
      metalness: 0.8,
      emissive: 0x10b981,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.92,
      wireframe: false,
    });
    const crystalMesh = new THREE.Mesh(crystalGeo, crystalMat);
    crystalGroup.add(crystalMesh);

    // 晶体晶格边缘线框微光
    const crystalWireGeo = new THREE.WireframeGeometry(crystalGeo);
    const crystalWireMat = new THREE.LineBasicMaterial({
      color: 0x6ee7b7,
      transparent: true,
      opacity: 0.7,
    });
    const crystalWire = new THREE.LineSegments(crystalWireGeo, crystalWireMat);
    crystalGroup.add(crystalWire);

    // 内嵌微型二十面体闪烁核
    const innerCoreGeo = new THREE.IcosahedronGeometry(2.1, 0);
    const innerCoreMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.8,
      roughness: 0.2,
      metalness: 0.9,
    });
    const innerCoreMesh = new THREE.Mesh(innerCoreGeo, innerCoreMat);
    crystalGroup.add(innerCoreMesh);

    // 核心微光能量粒子环 (Pulse Energy Ring Particles)
    const particleCount = 72;
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const radius = 5.2 + Math.sin(i * 4) * 0.4;
      particlePositions[i * 3] = Math.cos(angle) * radius;
      particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 0.8;
      particlePositions[i * 3 + 2] = Math.sin(angle) * radius;
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x34d399,
      size: 0.45,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });
    const energyParticles = new THREE.Points(particleGeo, particleMat);
    crystalGroup.add(energyParticles);

    // --- Layer 2: 内层同轴刻度环 (Inner Astrolabe Scale Ring) ---
    const innerRingGroup = new THREE.Group();
    compassGroup.add(innerRingGroup);

    const innerTorusGeo = new THREE.TorusGeometry(7, 0.15, 16, 64);
    const innerTorusMat = new THREE.MeshStandardMaterial({
      color: isDark ? 0x0284c7 : 0x0369a1,
      metalness: 0.85,
      roughness: 0.25,
      emissive: 0x0284c7,
      emissiveIntensity: 0.35,
    });
    const innerTorusMesh = new THREE.Mesh(innerTorusGeo, innerTorusMat);
    innerRingGroup.add(innerTorusMesh);

    // 经纬刻度线 (Scale Ticks)
    const tickPositions: number[] = [];
    const tickCount = 36;
    for (let i = 0; i < tickCount; i++) {
      const theta = (i / tickCount) * Math.PI * 2;
      const rInner = 6.6;
      const rOuter = i % 3 === 0 ? 7.5 : 7.2;
      tickPositions.push(
        Math.cos(theta) * rInner,
        Math.sin(theta) * rInner,
        0,
        Math.cos(theta) * rOuter,
        Math.sin(theta) * rOuter,
        0
      );
    }
    const tickGeo = new THREE.BufferGeometry();
    tickGeo.setAttribute('position', new THREE.Float32BufferAttribute(tickPositions, 3));
    const tickMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.75,
    });
    const tickLines = new THREE.LineSegments(tickGeo, tickMat);
    innerRingGroup.add(tickLines);

    // --- Layer 3: 中层双轴方位罗盘星轨 (Gimbal Compass Rings) ---
    const gimbalGroup = new THREE.Group();
    compassGroup.add(gimbalGroup);

    // Gimbal Ring 1 (X-axis aligned)
    const gimbal1Geo = new THREE.TorusGeometry(10.5, 0.2, 16, 64);
    const gimbalMat1 = new THREE.MeshStandardMaterial({
      color: isDark ? 0x14b8a6 : 0x0f766e,
      metalness: 0.9,
      roughness: 0.2,
      emissive: 0x0d9488,
      emissiveIntensity: 0.3,
    });
    const gimbal1 = new THREE.Mesh(gimbal1Geo, gimbalMat1);
    gimbalGroup.add(gimbal1);

    // Gimbal Ring 2 (Y-axis aligned, perpendicular)
    const gimbal2Geo = new THREE.TorusGeometry(10.5, 0.2, 16, 64);
    const gimbalMat2 = new THREE.MeshStandardMaterial({
      color: isDark ? 0x06b6d4 : 0x0891b2,
      metalness: 0.9,
      roughness: 0.2,
      emissive: 0x0891b2,
      emissiveIntensity: 0.3,
    });
    const gimbal2 = new THREE.Mesh(gimbal2Geo, gimbalMat2);
    gimbal2.rotation.x = Math.PI / 2;
    gimbalGroup.add(gimbal2);

    // 辅助金属刻度外圈
    const gimbalOuterGeo = new THREE.TorusGeometry(11.2, 0.08, 12, 64);
    const gimbalOuterMat = new THREE.MeshBasicMaterial({
      color: 0x22d3ee,
      wireframe: true,
      transparent: true,
      opacity: 0.45,
    });
    const gimbalOuter = new THREE.Mesh(gimbalOuterGeo, gimbalOuterMat);
    gimbalGroup.add(gimbalOuter);

    // --- Layer 4: 外层立体多面体线框护盾 (Outer Dodecahedron Cage) ---
    const shieldGroup = new THREE.Group();
    compassGroup.add(shieldGroup);

    const dodecahedronGeo = new THREE.DodecahedronGeometry(14, 0);
    const shieldWireGeo = new THREE.WireframeGeometry(dodecahedronGeo);
    const shieldWireMat = new THREE.LineBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.8,
    });
    const shieldWire = new THREE.LineSegments(shieldWireGeo, shieldWireMat);
    shieldGroup.add(shieldWire);

    // 护盾顶点微光球 (Shield Vertex Orbs)
    const orbGeo = new THREE.SphereGeometry(0.35, 8, 8);
    const orbMat = new THREE.MeshBasicMaterial({ color: 0x67e8f9 });
    const posAttr = dodecahedronGeo.attributes.position;
    const orbPositions = new Set<string>();
    for (let i = 0; i < posAttr.count; i++) {
      const x = parseFloat(posAttr.getX(i).toFixed(2));
      const y = parseFloat(posAttr.getY(i).toFixed(2));
      const z = parseFloat(posAttr.getZ(i).toFixed(2));
      const key = `${x},${y},${z}`;
      if (!orbPositions.has(key)) {
        orbPositions.add(key);
        const orb = new THREE.Mesh(orbGeo, orbMat);
        orb.position.set(x, y, z);
        shieldGroup.add(orb);
      }
    }

    // 4. 滚动监听与进度计算函数
    const updateScrollProgress = () => {
      if (!containerEl) return;
      const rect = containerEl.getBoundingClientRect();
      const totalScrollable = rect.height - window.innerHeight;
      if (totalScrollable <= 0) {
        targetProgress = 0;
        return;
      }
      const rawProgress = -rect.top / totalScrollable;
      targetProgress = Math.min(Math.max(rawProgress, 0), 1);
    };

    window.addEventListener('scroll', updateScrollProgress, { passive: true });
    window.addEventListener('resize', updateScrollProgress, { passive: true });
    updateScrollProgress();

    // 5. 窗口自适应调整
    const handleResize = () => {
      if (!mountEl) return;
      const w = mountEl.clientWidth || window.innerWidth;
      const h = mountEl.clientHeight || window.innerHeight;
      camera.aspect = w / h;

      // 移动端拉远相机以保证罗盘与卡片完美共存
      if (w < 768) {
        camera.position.set(0, 3, 56);
      } else {
        camera.position.set(0, 0, 42);
      }
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    // 6. RAF 动画与解构循环 (核心解构算法)
    let lastReportTime = 0;

    const renderLoop = (time: number) => {
      animationFrameId = requestAnimationFrame(renderLoop);

      // (1) RAF 平滑去噪滤波插值 (Lerp Smoothing Filter)
      currentProgress += (targetProgress - currentProgress) * 0.08;

      // 少量节流更新 React 状态供数字指示器展示 (约 100ms 刷新一次以防频繁 re-render)
      if (time - lastReportTime > 100) {
        lastReportTime = time;
        setSmoothProgressDisplay(Math.round(currentProgress * 100));
        if (currentProgress < 0.35) {
          setActiveStage(1);
        } else if (currentProgress < 0.75) {
          setActiveStage(2);
        } else {
          setActiveStage(3);
        }
      }

      // 常规微量自转（时间驱动）
      const t = time * 0.001;
      energyParticles.rotation.y = t * 0.8;
      innerCoreMesh.rotation.x = t * 0.6;
      innerCoreMesh.rotation.z = t * 0.5;

      // (2) 阶段 1 [0.00 ~ 0.35]：空间 360° 轴向翻转
      if (currentProgress <= 0.35) {
        compassGroup.rotation.y = currentProgress * Math.PI * 2.5;
        compassGroup.rotation.x = currentProgress * Math.PI * 1.2;
        compassGroup.rotation.z = Math.sin(t * 0.5) * 0.05;

        // 紧凑未解构状态重置
        shieldGroup.scale.set(1, 1, 1);
        shieldWireMat.opacity = 0.8;
        gimbal1.position.set(0, 0, 0);
        gimbal2.position.set(0, 0, 0);
        gimbal1.rotation.set(0, 0, 0);
        gimbal2.rotation.set(Math.PI / 2, 0, 0);
        innerRingGroup.position.set(0, 0, 0);
        innerRingGroup.rotation.set(0, 0, 0);
        crystalGroup.position.set(0, 0, 0);
        crystalMat.emissiveIntensity = 0.6;
        centerPointLight.intensity = isDark ? 4.0 : 3.0;
      }
      // (3) 阶段 2 [0.35 ~ 0.75]：悬浮向外分层解构拆开 (Exploded View)
      else if (currentProgress <= 0.75) {
        const decon = (currentProgress - 0.35) / 0.4; // 0.0 -> 1.0

        // 空间翻转在阶段 1 基础上自然缓动延续
        const baseRotY = 0.35 * Math.PI * 2.5;
        const baseRotX = 0.35 * Math.PI * 1.2;
        compassGroup.rotation.y = baseRotY + decon * Math.PI * 0.75;
        compassGroup.rotation.x = baseRotX + decon * Math.PI * 0.35;

        // Layer 4 外层立体多面体线框护盾：沿径向剧烈扩张并淡出
        const shieldScale = 1.0 + decon * 1.6;
        shieldGroup.scale.set(shieldScale, shieldScale, shieldScale);
        shieldWireMat.opacity = Math.max(0.08, 0.8 * (1.0 - decon * 0.75));

        // Layer 3 中层双轴星轨：沿 Z 轴左右错位拉开分层
        const gimbalOffsetZ = decon * 8.5;
        gimbal1.position.z = gimbalOffsetZ;
        gimbal2.position.z = -gimbalOffsetZ;
        gimbal1.rotation.x = decon * Math.PI * 0.6;
        gimbal2.rotation.y = Math.PI / 2 + decon * Math.PI * 0.5;

        // Layer 2 内层同轴刻度环：沿 Y 轴向上倾斜偏转抬升
        innerRingGroup.position.y = decon * 5.2;
        innerRingGroup.rotation.x = decon * (Math.PI / 3.8);
        innerRingGroup.rotation.z = decon * 0.4;

        // Layer 1 核心能量晶体：升腾至几何中心，自转加速且发光强度翻倍
        crystalGroup.position.y = -decon * 1.8;
        crystalMesh.rotation.y += 0.02 + decon * 0.08;
        crystalMesh.rotation.x += 0.015 + decon * 0.05;
        const targetEmissive = 0.6 + decon * 1.4; // 0.6 -> 2.0
        crystalMat.emissiveIntensity = targetEmissive;
        centerPointLight.intensity = (isDark ? 4.0 : 3.0) + decon * 8.0;

        // 释放能量环扩展
        energyParticles.scale.setScalar(1.0 + decon * 1.4);
      }
      // (4) 阶段 3 [0.75 ~ 1.00]：解构稳定定格，随滚动准备无缝交接
      else {
        const p3 = (currentProgress - 0.75) / 0.25;

        compassGroup.rotation.y = 0.35 * Math.PI * 2.5 + Math.PI * 0.75 + p3 * 0.2;
        compassGroup.rotation.x = 0.35 * Math.PI * 1.2 + Math.PI * 0.35 + p3 * 0.1;

        // 定格状态维持
        shieldGroup.scale.set(2.6, 2.6, 2.6);
        shieldWireMat.opacity = 0.2;
        gimbal1.position.z = 8.5;
        gimbal2.position.z = -8.5;
        gimbal1.rotation.x = Math.PI * 0.6;
        gimbal2.rotation.y = Math.PI / 2 + Math.PI * 0.5;
        innerRingGroup.position.y = 5.2;
        innerRingGroup.rotation.x = Math.PI / 3.8;
        crystalGroup.position.y = -1.8;
        crystalMesh.rotation.y += 0.1;
        crystalMat.emissiveIntensity = 2.0;
        centerPointLight.intensity = isDark ? 12.0 : 10.0;
      }

      // (5) 三大技术支柱卡片 DOM 矩阵联动 (Direct DOM Transform, 120fps)
      const p1El = pillar1Ref.current;
      const p2El = pillar2Ref.current;
      const p3El = pillar3Ref.current;

      if (p1El && p2El && p3El) {
        if (currentProgress < 0.35) {
          // 阶段 1：卡片隐藏
          const hiddenStyle = 'opacity: 0; transform: scale(0.85); pointer-events: none;';
          p1El.style.cssText = hiddenStyle;
          p2El.style.cssText = hiddenStyle;
          p3El.style.cssText = hiddenStyle;
        } else {
          // 阶段 2 & 3：伴随解构向外飞入展开 (0.35 ~ 0.70 渐变展开至 100%)
          const cardFactor = Math.min(Math.max((currentProgress - 0.35) / 0.32, 0), 1);
          const invCard = 1 - cardFactor;

          // 桌面端左侧卡片：从左侧 -50px 平滑滑入
          p1El.style.opacity = `${cardFactor}`;
          p1El.style.transform = `translateX(${-invCard * 45}px) scale(${0.88 + cardFactor * 0.12})`;
          p1El.style.pointerEvents = cardFactor > 0.4 ? 'auto' : 'none';

          // 桌面端右上卡片：从右侧 +50px 平滑滑入
          p2El.style.opacity = `${cardFactor}`;
          p2El.style.transform = `translateX(${invCard * 45}px) scale(${0.88 + cardFactor * 0.12})`;
          p2El.style.pointerEvents = cardFactor > 0.4 ? 'auto' : 'none';

          // 桌面端右下/底侧卡片：从底部 +40px 升起
          p3El.style.opacity = `${cardFactor}`;
          p3El.style.transform = `translateY(${invCard * 40}px) scale(${0.88 + cardFactor * 0.12})`;
          p3El.style.pointerEvents = cardFactor > 0.4 ? 'auto' : 'none';
        }
      }

      renderer.render(scene, camera);
    };

    animationFrameId = requestAnimationFrame(renderLoop);

    // 7. 彻底清理所有 Three.js 几何体、材质与渲染上下文 (Dispose Strategy)
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('scroll', updateScrollProgress);
      window.removeEventListener('resize', updateScrollProgress);
      window.removeEventListener('resize', handleResize);

      // 显式释放未挂载在场景树中的基底几何体
      dodecahedronGeo.dispose();

      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.LineSegments || obj instanceof THREE.Points) {
          if (obj.geometry) obj.geometry.dispose();
          if (obj.material) {
            if (Array.isArray(obj.material)) {
              obj.material.forEach((m) => m.dispose());
            } else {
              obj.material.dispose();
            }
          }
        }
      });

      renderer.dispose();
      if (mountEl.contains(renderer.domElement)) {
        mountEl.removeChild(renderer.domElement);
      }
    };
  }, [resolvedTheme, isEn]);

  return (
    <section
      ref={containerRef}
      aria-label={isEn ? '3D Architecture Scrollytelling' : '3D 空间罗盘滚动解构展台'}
      className="relative h-[260vh] -mt-8 md:-mt-12 z-20 select-none"
    >
      {/* 吸附固定视口 (Sticky Stage) */}
      <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center">
        {/* 背景轻微暗角与流光光晕 */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] md:w-[850px] md:h-[850px] bg-gradient-to-tr from-emerald-500/10 via-cyan-500/10 to-transparent rounded-full blur-3xl opacity-60 dark:opacity-40" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,var(--background)_90%)]" />
        </div>

        {/* 顶部阶段导航胶囊指示器 */}
        <div
          ref={stageIndicatorRef}
          className="absolute top-20 md:top-24 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 px-4 py-1.5 rounded-full bg-background/80 dark:bg-zinc-900/80 backdrop-blur-md border border-border/80 shadow-lg text-xs font-mono transition-all duration-300 pointer-events-none"
        >
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                activeStage === 1
                  ? 'bg-emerald-500 animate-pulse'
                  : activeStage === 2
                  ? 'bg-cyan-500 animate-pulse'
                  : 'bg-indigo-500 animate-pulse'
              }`}
            />
            <span className="text-foreground font-semibold">
              {activeStage === 1
                ? isEn
                  ? 'STAGE 01 // 360° GEOMETRIC ALIGNMENT'
                  : '阶段 01 // 360° 几何核心校准'
                : activeStage === 2
                ? isEn
                  ? 'STAGE 02 // EXPLODED DECONSTRUCTION'
                  : '阶段 02 // 悬浮分层解构拆开'
                : isEn
                ? 'STAGE 03 // FULL ARCHITECTURE STABILIZED'
                : '阶段 03 // 全栈技术架构定格'}
            </span>
          </div>
          <span className="text-muted-foreground/60">|</span>
          <span className="text-emerald-500 font-bold">{smoothProgressDisplay}%</span>
        </div>

        {/* 原生 Three.js 挂载容器 (Canvas Container) - pointer-events-none 避免吞噬原生滚动 */}
        <div
          ref={mountRef}
          className="absolute inset-0 w-full h-full pointer-events-none z-10 flex items-center justify-center"
        />

        {/* 底部向下滚动提示指引 */}
        <div
          className={`absolute bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-1 text-[11px] font-mono text-muted-foreground transition-opacity duration-500 pointer-events-none ${
            smoothProgressDisplay > 88 ? 'opacity-0' : 'opacity-80'
          }`}
        >
          <span className="tracking-wider uppercase">
            {isEn ? 'Scroll down to deconstruct' : '向下滚动解构 3D 架构'}
          </span>
          <ChevronDown className="w-4 h-4 animate-bounce text-emerald-500" />
        </div>

        {/* 三大核心技术支柱卡片 (Three Pillars) - 浮动于吸附舞台两侧 */}
        <div className="relative w-full max-w-6xl h-full mx-auto px-4 sm:px-6 lg:px-8 pointer-events-none z-20 flex flex-col justify-between py-24 md:py-28">
          {/* 上半部分：桌面端左右分布 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 items-start pointer-events-none">
            {/* ① 左侧卡片：Java 21 企业级并发 */}
            <div
              ref={pillar1Ref}
              style={{ opacity: 0 }}
              className="pointer-events-none transition-transform will-change-transform max-w-sm md:max-w-md"
            >
              <div className="group relative p-5 md:p-6 rounded-2xl bg-card/85 dark:bg-zinc-900/85 backdrop-blur-xl border border-emerald-500/30 shadow-xl hover:border-emerald-500/60 transition-all duration-300">
                <div className="absolute -top-3 left-6 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-[10px] font-mono font-semibold uppercase tracking-wider flex items-center gap-1">
                  <Cpu className="w-3 h-3" />
                  <span>{isEn ? 'CONCURRENCY CORE' : '高并发高吞吐底座'}</span>
                </div>

                <div className="flex items-start justify-between gap-3 pt-1">
                  <div>
                    <h3 className="text-base md:text-lg font-bold text-foreground group-hover:text-emerald-500 transition-colors flex items-center gap-2">
                      <span>{isEn ? 'Java 21 Enterprise Concurrency' : 'Java 21 企业级并发'}</span>
                    </h3>
                    <p className="text-xs font-mono text-emerald-500/90 mt-1">
                      {isEn
                        ? 'Project Loom · Virtual Threads · Reactive'
                        : 'Project Loom · 虚拟线程 · 响应式吞吐'}
                    </p>
                  </div>
                  <Link
                    href="/blog?tag=Java21"
                    className="p-2 rounded-xl bg-secondary/80 text-foreground hover:bg-emerald-500 hover:text-white transition-all shadow-sm flex-shrink-0"
                    title={isEn ? 'Explore Java 21 Posts' : '探索 Java 21 架构博文'}
                  >
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>
                </div>

                <p className="text-xs md:text-sm text-muted-foreground leading-relaxed mt-3">
                  {isEn
                    ? 'Engineered with lightweight virtual threads and structured concurrency, delivering millions of concurrent task schedules with rock-solid resilience.'
                    : '基于 Project Loom 虚拟线程与结构化并发调度，突破传统平台线程开销，以轻量级架构支撑百万级吞吐与微服务低延迟。'}
                </p>

                <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-border/60">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    Spring Boot 3.3
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-secondary text-muted-foreground">
                    Virtual Threads
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-secondary text-muted-foreground">
                    Zero-Blocking
                  </span>
                </div>
              </div>
            </div>

            {/* ② 右上卡片：Next.js 14 现代响应式空间美学 */}
            <div
              ref={pillar2Ref}
              style={{ opacity: 0 }}
              className="pointer-events-none transition-transform will-change-transform max-w-sm md:max-w-md md:ml-auto"
            >
              <div className="group relative p-5 md:p-6 rounded-2xl bg-card/85 dark:bg-zinc-900/85 backdrop-blur-xl border border-cyan-500/30 shadow-xl hover:border-cyan-500/60 transition-all duration-300">
                <div className="absolute -top-3 left-6 px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-500 text-[10px] font-mono font-semibold uppercase tracking-wider flex items-center gap-1">
                  <Layers className="w-3 h-3" />
                  <span>{isEn ? 'SPATIAL EXPERIENCE' : '流体空间美学'}</span>
                </div>

                <div className="flex items-start justify-between gap-3 pt-1">
                  <div>
                    <h3 className="text-base md:text-lg font-bold text-foreground group-hover:text-cyan-500 transition-colors flex items-center gap-2">
                      <span>
                        {isEn
                          ? 'Next.js 14 Spatial Aesthetics'
                          : 'Next.js 14 现代响应式空间美学'}
                      </span>
                    </h3>
                    <p className="text-xs font-mono text-cyan-500/90 mt-1">
                      {isEn
                        ? 'App Router · Three.js Parallax · ISR'
                        : 'App Router · Three.js 视差 · ISR'}
                    </p>
                  </div>
                  <Link
                    href="/blog?tag=Nextjs"
                    className="p-2 rounded-xl bg-secondary/80 text-foreground hover:bg-cyan-500 hover:text-white transition-all shadow-sm flex-shrink-0"
                    title={isEn ? 'Explore Next.js Posts' : '探索 Next.js 空间博文'}
                  >
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>
                </div>

                <p className="text-xs md:text-sm text-muted-foreground leading-relaxed mt-3">
                  {isEn
                    ? 'Seamlessly combining server-side streaming rendering with client-side GPU WebGL deconstruction, creating an immersive, fluid digital garden.'
                    : '服务端流式 SSR 搭配客户端原生 WebGL 视差粒子与吸附解构，毫秒级响应速度与次世代空间流体微交互完美并存。'}
                </p>

                <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-border/60">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-cyan-500/10 text-cyan-500 border border-cyan-500/20">
                    App Router
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-secondary text-muted-foreground">
                    Native Three.js
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-secondary text-muted-foreground">
                    120fps Smooth
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 下半部分：偏右或底部 ③ 商汤 SenseNova / DeepSeek AI 智能体体系 */}
          <div className="flex justify-start md:justify-end pointer-events-none mt-auto">
            <div
              ref={pillar3Ref}
              style={{ opacity: 0 }}
              className="pointer-events-none transition-transform will-change-transform w-full max-w-sm md:max-w-lg"
            >
              <div className="group relative p-5 md:p-6 rounded-2xl bg-card/85 dark:bg-zinc-900/85 backdrop-blur-xl border border-indigo-500/30 shadow-xl hover:border-indigo-500/60 transition-all duration-300">
                <div className="absolute -top-3 left-6 px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-500 text-[10px] font-mono font-semibold uppercase tracking-wider flex items-center gap-1">
                  <Bot className="w-3 h-3" />
                  <span>{isEn ? 'AI CO-PILOT AGENT' : '混合专家智能体体系'}</span>
                </div>

                <div className="flex items-start justify-between gap-3 pt-1">
                  <div>
                    <h3 className="text-base md:text-lg font-bold text-foreground group-hover:text-indigo-500 transition-colors flex items-center gap-2">
                      <span>
                        {isEn
                          ? 'SenseNova / DeepSeek AI Agents'
                          : '商汤 SenseNova / DeepSeek AI 体系'}
                      </span>
                    </h3>
                    <p className="text-xs font-mono text-indigo-500/90 mt-1">
                      {isEn
                        ? 'Digital Garden RAG · Stream Reasoning · Co-pilot'
                        : '数字花园 RAG · 流式推理 · 伴读协作'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSummonAi}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500 text-white hover:bg-indigo-600 text-xs font-medium transition-all shadow-sm pointer-events-auto cursor-pointer"
                      title={isEn ? 'Summon Hayden AI Assistant' : '唤起 Hayden AI 伴读'}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{isEn ? 'Summon' : '唤起伴读'}</span>
                    </button>
                    <Link
                      href="/blog?tag=AI"
                      className="p-2 rounded-xl bg-secondary/80 text-foreground hover:bg-indigo-500 hover:text-white transition-all shadow-sm flex-shrink-0 pointer-events-auto"
                      title={isEn ? 'Explore AI Posts' : '探索 AI 技术博文'}
                    >
                      <ArrowUpRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>

                <p className="text-xs md:text-sm text-muted-foreground leading-relaxed mt-3">
                  {isEn
                    ? 'Harnessing SenseNova and DeepSeek MoE architecture with personal digital garden RAG retrieval, enabling contextual reading insights and intelligent code co-piloting.'
                    : '深度融合商汤 SenseNova 与 DeepSeek 混合专家大模型，基于站长数字花园知识库构建 RAG 语义切片，实现划词精讲与实时伴读流式对话。'}
                </p>

                <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-border/60">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                    DeepSeek MoE
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-secondary text-muted-foreground">
                    SenseNova V5.5
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-secondary text-muted-foreground">
                    Stream RAG
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
