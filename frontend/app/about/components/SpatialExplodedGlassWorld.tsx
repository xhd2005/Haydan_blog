'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useTheme } from 'next-themes';
import { Journey } from '@/lib/types';

interface SpatialExplodedGlassWorldProps {
  progress: number; // 0.0 ~ 1.0 (实时滚轮时序解构总进度)
  journeys?: Journey[];
}

/**
 * SpatialExplodedGlassWorld
 * 
 * 苹果发布会级连续 3D WebGL 空间世界：
 * - 随滚轮时序 progress (0.0 ~ 1.0) 平滑驱动连续相机轨道与物理形态学演进
 * - Act 01 (0.00 ~ 0.25): 悬浮液体玻璃核心 (Liquid Lens Core) + 正弦流体微波与焦散弥散
 * - Act 02 (0.25 ~ 0.55): 苹果硬件爆炸图拆解 (3D Exploded View) -> 四枚全栈液体芯片向四维散开
 * - Act 03 (0.55 ~ 0.80): 芯片向两侧流光隐退，真实旅程胶片相框自深空飞向镜头 (Voyage Reel)
 * - Act 04 (0.80 ~ 1.00): 粒子流场汇聚，凝聚为第一性原理金石铭牌 (Axiom Monolith)
 */
export function SpatialExplodedGlassWorld({ progress, journeys = [] }: SpatialExplodedGlassWorldProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { resolvedTheme } = useTheme();

  // 内部保持对 progress 的最新引用，供 60fps 渲染循环读取
  const progressRef = useRef<number>(progress);
  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // 1. 初始化 Scene, Camera & WebGLRenderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 24);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.appendChild(renderer.domElement);

    const isDark = resolvedTheme === 'dark' || document.documentElement.classList.contains('dark');

    // 2. 空间光源系统 (Spatial Lighting Rig)
    const ambientLight = new THREE.AmbientLight(
      isDark ? 0x0f172a : 0xf8fafc,
      isDark ? 1.4 : 2.0
    );
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(isDark ? 0x10b981 : 0x0ea5e9, isDark ? 2.5 : 2.0);
    keyLight.position.set(15, 20, 25);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(isDark ? 0x06b6d4 : 0x6366f1, isDark ? 2.0 : 1.6);
    rimLight.position.set(-15, -10, -10);
    scene.add(rimLight);

    // 3. 构建 3D 物体群组 (Hierarchical Object Groups)

    // A. 悬浮液体透镜核心 (Act 1: Central Liquid Lens Core)
    const coreGroup = new THREE.Group();
    scene.add(coreGroup);

    // 核心玻璃几何体与折射材质
    const coreGeo = new THREE.IcosahedronGeometry(4.2, 5);
    const corePosArr = coreGeo.attributes.position.array.slice(); // 保存原始顶点
    const coreMat = new THREE.MeshPhysicalMaterial({
      color: isDark ? 0x10b981 : 0x38bdf8,
      emissive: isDark ? 0x042f2e : 0x0369a1,
      emissiveIntensity: isDark ? 0.35 : 0.15,
      metalness: 0.1,
      roughness: 0.12,
      transmission: 0.92,
      thickness: 1.8,
      ior: 1.48,
      wireframe: true,
      transparent: true,
      opacity: isDark ? 0.65 : 0.45,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    coreGroup.add(coreMesh);

    // 外围全息环 (Refraction Ring)
    const ringGeo = new THREE.TorusGeometry(5.4, 0.08, 16, 100);
    const ringMat = new THREE.MeshStandardMaterial({
      color: isDark ? 0x34d399 : 0x0284c7,
      emissive: isDark ? 0x10b981 : 0x0ea5e9,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    coreGroup.add(ringMesh);

    // B. 四枚 3D 架构芯片 (Act 2: 4 Exploded Architectural Chips)
    const chipsGroup = new THREE.Group();
    scene.add(chipsGroup);

    const chipGeo = new THREE.BoxGeometry(4.8, 3.2, 0.4);
    const chipMat = new THREE.MeshPhysicalMaterial({
      color: isDark ? 0x064e3b : 0xe0f2fe,
      emissive: isDark ? 0x065f46 : 0x0284c7,
      emissiveIntensity: isDark ? 0.4 : 0.2,
      roughness: 0.15,
      metalness: 0.2,
      transmission: 0.88,
      transparent: true,
      opacity: 0.8,
    });

    const chipEdgesGeo = new THREE.EdgesGeometry(chipGeo);
    const chipEdgesMat = new THREE.LineBasicMaterial({
      color: isDark ? 0x34d399 : 0x0ea5e9,
      linewidth: 1.5,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
    });

    // 4 枚芯片的目标偏移位置（爆炸图分布）
    const chipTargets = [
      { x: -7.5, y: 4.0, z: 2, rx: 0.15, ry: 0.25 },  // Top-Left: 后端底座
      { x: 7.5, y: 4.0, z: 2, rx: 0.15, ry: -0.25 },  // Top-Right: 前端架构
      { x: -7.5, y: -4.0, z: 2, rx: -0.15, ry: 0.25 }, // Bottom-Left: AI 智能体
      { x: 7.5, y: -4.0, z: 2, rx: -0.15, ry: -0.25 }, // Bottom-Right: 云原生底座
    ];

    const chips: THREE.Group[] = [];
    chipTargets.forEach(() => {
      const singleChipGroup = new THREE.Group();
      const cMesh = new THREE.Mesh(chipGeo, chipMat.clone());
      const cEdges = new THREE.LineSegments(chipEdgesGeo, chipEdgesMat.clone());
      singleChipGroup.add(cMesh);
      singleChipGroup.add(cEdges);
      chipsGroup.add(singleChipGroup);
      chips.push(singleChipGroup);
    });

    // C. 3D 旅程相框组 (Act 3: Spatial Voyage Frames)
    const voyageGroup = new THREE.Group();
    scene.add(voyageGroup);

    const frameGeo = new THREE.BoxGeometry(4.2, 3.0, 0.15);
    const frameEdgesGeo = new THREE.EdgesGeometry(frameGeo);
    const frameMat = new THREE.MeshStandardMaterial({
      color: isDark ? 0x0f172a : 0xf1f5f9,
      roughness: 0.2,
      metalness: 0.5,
      transparent: true,
      opacity: 0.85,
    });
    const frameEdgeMat = new THREE.LineBasicMaterial({
      color: isDark ? 0x10b981 : 0x0284c7,
      transparent: true,
      opacity: 0.8,
    });

    const frames: THREE.Group[] = [];
    const frameConfigs = [
      { initZ: -45, targetZ: -2, targetX: -6.0, targetY: 1.5, rotY: 0.2 },
      { initZ: -60, targetZ: 3, targetX: 6.5, targetY: 2.5, rotY: -0.25 },
      { initZ: -75, targetZ: 8, targetX: -5.0, targetY: -2.5, rotY: 0.15 },
      { initZ: -90, targetZ: 12, targetX: 5.5, targetY: -1.8, rotY: -0.2 },
    ];

    frameConfigs.forEach((cfg) => {
      const fGroup = new THREE.Group();
      const fMesh = new THREE.Mesh(frameGeo, frameMat.clone());
      const fEdges = new THREE.LineSegments(frameEdgesGeo, frameEdgeMat);
      fGroup.add(fMesh);
      fGroup.add(fEdges);
      fGroup.position.set(cfg.targetX, cfg.targetY, cfg.initZ);
      fGroup.rotation.y = cfg.rotY;
      voyageGroup.add(fGroup);
      frames.push(fGroup);
    });

    // D. 第一性原理金石铭牌 (Act 4: Axiom Monolith)
    const monolithGroup = new THREE.Group();
    scene.add(monolithGroup);

    const monolithGeo = new THREE.BoxGeometry(7.0, 9.0, 0.6);
    const monolithEdgesGeo = new THREE.EdgesGeometry(monolithGeo);
    const monolithMat = new THREE.MeshPhysicalMaterial({
      color: isDark ? 0x090a0f : 0xffffff,
      emissive: isDark ? 0x10b981 : 0x0284c7,
      emissiveIntensity: 0.2,
      roughness: 0.1,
      metalness: 0.3,
      transmission: 0.9,
      transparent: true,
      opacity: 0.85,
    });
    const monolithEdgeMat = new THREE.LineBasicMaterial({
      color: isDark ? 0x34d399 : 0x0284c7,
      linewidth: 2,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
    });
    const monolithMesh = new THREE.Mesh(monolithGeo, monolithMat);
    const monolithEdges = new THREE.LineSegments(monolithEdgesGeo, monolithEdgeMat);
    monolithGroup.add(monolithMesh);
    monolithGroup.add(monolithEdges);
    monolithGroup.position.set(0, 0, -20);
    monolithGroup.visible = false;

    // E. 漂浮粒子场 (Ambient Fluid Particle Cloud)
    const particleCount = 75;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleBasePositions: number[] = [];

    for (let i = 0; i < particleCount; i++) {
      const px = (Math.random() - 0.5) * 50;
      const py = (Math.random() - 0.5) * 35;
      const pz = (Math.random() - 0.5) * 40;
      particlePositions[i * 3] = px;
      particlePositions[i * 3 + 1] = py;
      particlePositions[i * 3 + 2] = pz;
      particleBasePositions.push(px, py, pz);
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

    const particleMat = new THREE.PointsMaterial({
      color: isDark ? 0x34d399 : 0x0284c7,
      size: isDark ? 1.5 : 1.2,
      transparent: true,
      opacity: isDark ? 0.35 : 0.22,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // 4. 鼠标视差微平滑跟踪 (Mouse Parallax)
    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    const handleMouseMove = (e: MouseEvent) => {
      mouse.targetX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.targetY = -(e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // 5. 窗口自适应
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // 6. 核心渲染与状态插值动画循环 (60fps Scrollytelling Animation Loop)
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();
      const p = progressRef.current; // 0.0 ~ 1.0

      // 阻尼缓动跟踪鼠标
      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;

      // ==============================================================
      // 连续 3D 相机轨道时序推演 (Continuous 3D Camera Rig by Progress)
      // ==============================================================
      let targetCamX = mouse.x * 1.6;
      let targetCamY = mouse.y * 1.2;
      let targetCamZ = 24;

      if (p < 0.25) {
        // Act 1: 镜头平缓靠近中央液体透镜
        const t = p / 0.25;
        targetCamZ = 24 - t * 4; // 24 -> 20
      } else if (p < 0.55) {
        // Act 2: 镜头深入下潜，迎合 3D 硬件爆炸图
        const t = (p - 0.25) / 0.30;
        targetCamZ = 20 - t * 3; // 20 -> 17
        targetCamY += Math.sin(t * Math.PI) * 0.5;
      } else if (p < 0.80) {
        // Act 3: 镜头推向深空穿透相框
        const t = (p - 0.55) / 0.25;
        targetCamZ = 17 + t * 4; // 17 -> 21
      } else {
        // Act 4: 镜头略微拉远，凝视第一性原理金石铭牌
        const t = (p - 0.80) / 0.20;
        targetCamZ = 21 + t * 3; // 21 -> 24
      }

      camera.position.x += (targetCamX - camera.position.x) * 0.06;
      camera.position.y += (targetCamY - camera.position.y) * 0.06;
      camera.position.z += (targetCamZ - camera.position.z) * 0.06;
      camera.lookAt(0, 0, 0);

      // ==============================================================
      // 阶段 1：中央液体透镜核心形态解构 (Act 1 -> Act 2 爆炸)
      // ==============================================================
      if (p < 0.30) {
        coreGroup.visible = true;
        const fadeOut = p > 0.20 ? 1 - (p - 0.20) / 0.10 : 1;
        coreMesh.material.opacity = (isDark ? 0.65 : 0.45) * Math.max(0, fadeOut);
        ringMesh.material.opacity = 0.5 * Math.max(0, fadeOut);

        // 正弦波水纹动态位移
        if (!prefersReducedMotion) {
          const positions = coreGeo.attributes.position;
          const count = positions.count;
          for (let i = 0; i < count; i++) {
            const ox = corePosArr[i * 3];
            const oy = corePosArr[i * 3 + 1];
            const oz = corePosArr[i * 3 + 2];
            const wave = Math.sin(ox * 2 + oy * 2 + elapsedTime * 2.5) * 0.18;
            positions.setXYZ(i, ox + wave, oy + wave, oz + wave);
          }
          positions.needsUpdate = true;
        }

        coreGroup.rotation.y = elapsedTime * 0.25 + mouse.x * 0.3;
        coreGroup.rotation.x = Math.sin(elapsedTime * 0.3) * 0.15 + mouse.y * 0.2;
        ringMesh.rotation.z = elapsedTime * 0.5;
      } else {
        coreGroup.visible = false;
      }

      // ==============================================================
      // 阶段 2：四枚 3D 架构芯片物理爆炸图解构 (Act 2: Exploded View)
      // ==============================================================
      if (p >= 0.18 && p < 0.65) {
        chipsGroup.visible = true;
        // 0.20 开始从中心点 (0,0,0) 爆炸飞出到目标位置，在 0.52 开始向两侧散开隐退
        let explodeFactor = 0;
        if (p < 0.35) {
          explodeFactor = (p - 0.18) / 0.17; // 0 -> 1
        } else if (p < 0.52) {
          explodeFactor = 1;
        } else {
          // 向外侧飞掠退场
          const dismissT = (p - 0.52) / 0.13;
          explodeFactor = 1 + dismissT * 1.5;
        }

        const chipAlpha = p < 0.52 ? Math.min(1, (p - 0.18) / 0.12) : Math.max(0, 1 - (p - 0.52) / 0.13);

        chips.forEach((chip, idx) => {
          const target = chipTargets[idx];
          chip.position.x += (target.x * explodeFactor - chip.position.x) * 0.15;
          chip.position.y += (target.y * explodeFactor - chip.position.y) * 0.15;
          chip.position.z += (target.z - chip.position.z) * 0.15;

          chip.rotation.x = target.rx + Math.sin(elapsedTime * 1.2 + idx) * 0.05 + mouse.y * 0.1;
          chip.rotation.y = target.ry + Math.cos(elapsedTime * 1.0 + idx) * 0.05 + mouse.x * 0.1;

          (chip.children[0] as THREE.Mesh<any, THREE.MeshPhysicalMaterial>).material.opacity = 0.8 * chipAlpha;
          (chip.children[1] as THREE.LineSegments<any, THREE.LineBasicMaterial>).material.opacity = 0.7 * chipAlpha;
        });
      } else {
        chipsGroup.visible = false;
      }

      // ==============================================================
      // 阶段 3：空间旅程胶片相框自深空穿越 (Act 3: Spatial Voyage Reel)
      // ==============================================================
      if (p >= 0.48 && p < 0.85) {
        voyageGroup.visible = true;
        const voyageT = Math.min(1, Math.max(0, (p - 0.48) / 0.32)); // 0.48 -> 0.80

        frames.forEach((frame, idx) => {
          const cfg = frameConfigs[idx];
          // 相框自深空向前飞向镜头并穿过
          const currentZ = cfg.initZ + voyageT * 75;
          frame.position.z = currentZ;

          // 距离较近时渐显，越过相机时淡出
          let fAlpha = 1;
          if (currentZ < -25) {
            fAlpha = (currentZ + 45) / 20;
          } else if (currentZ > 15) {
            fAlpha = Math.max(0, 1 - (currentZ - 15) / 10);
          }
          fAlpha = Math.max(0, Math.min(1, fAlpha));

          (frame.children[0] as THREE.Mesh<any, THREE.MeshStandardMaterial>).material.opacity = 0.85 * fAlpha;
          (frame.children[1] as THREE.LineSegments<any, THREE.LineBasicMaterial>).material.opacity = 0.8 * fAlpha;

          frame.rotation.y = cfg.rotY + Math.sin(elapsedTime * 0.8 + idx) * 0.08 + mouse.x * 0.1;
          frame.rotation.x = Math.cos(elapsedTime * 0.6 + idx) * 0.05 + mouse.y * 0.08;
        });
      } else {
        voyageGroup.visible = false;
      }

      // ==============================================================
      // 阶段 4：第一性原理金石铭牌凝聚汇聚 (Act 4: Axiom Monolith)
      // ==============================================================
      if (p >= 0.75) {
        monolithGroup.visible = true;
        const monolithT = Math.min(1, Math.max(0, (p - 0.75) / 0.20)); // 0.75 -> 0.95
        monolithGroup.position.z = THREE.MathUtils.lerp(-18, 0, monolithT);
        monolithGroup.rotation.y = (1 - monolithT) * 0.8 + mouse.x * 0.15;
        monolithGroup.rotation.x = mouse.y * 0.1;

        monolithMat.opacity = 0.85 * monolithT;
        monolithEdgeMat.opacity = 0.9 * monolithT;
      } else {
        monolithGroup.visible = false;
      }

      // ==============================================================
      // 全局微粒场漂浮
      // ==============================================================
      particles.rotation.y = elapsedTime * 0.02 + mouse.x * 0.08;
      particles.rotation.x = Math.sin(elapsedTime * 0.03) * 0.05 + mouse.y * 0.05;

      renderer.render(scene, camera);
    };

    animate();

    // 7. 清理全部 WebGL 资源
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      coreGeo.dispose();
      coreMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      chipGeo.dispose();
      chipMat.dispose();
      chipEdgesGeo.dispose();
      chipEdgesMat.dispose();
      frameGeo.dispose();
      frameEdgesGeo.dispose();
      frameMat.dispose();
      frameEdgeMat.dispose();
      monolithGeo.dispose();
      monolithEdgesGeo.dispose();
      monolithMat.dispose();
      monolithEdgeMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      renderer.dispose();
    };
  }, [resolvedTheme]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none"
    />
  );
}
