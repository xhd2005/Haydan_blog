'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useTheme } from 'next-themes';

/**
 * LiquidGlassFlowCanvas (ThreeUI Inspired WebGL 3D Flow Field)
 * 
 * 灵感来源于 ThreeUI (https://threeui.com/) 的 Advanced Glass Material 与 Flow Field。
 * 在背景最底层提供轻量级 WebGL 空间流体网格，随鼠标移动产生柔和水波荡漾与流体折射漫反射，
 * 透过上层的苹果 VisionOS 液体玻璃卡片映射出丰富的纵深感。
 */
export function LiquidGlassFlowCanvas() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 检查是否偏好减少动效
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // 1. Three.js 场景、相机与渲染器
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 35);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // 2. 液体流场网格几何体 (Plane with wavy dynamic vertex displacement)
    const planeWidth = 70;
    const planeHeight = 45;
    const segmentsW = 48;
    const segmentsH = 32;
    const geometry = new THREE.PlaneGeometry(planeWidth, planeHeight, segmentsW, segmentsH);

    // 记录顶点原始位置
    const posAttribute = geometry.attributes.position;
    const originalPositions = posAttribute.array.slice();

    // 材质：根据主题配置发光线框与流体点阵
    const isDark = resolvedTheme === 'dark' || document.documentElement.classList.contains('dark');

    const primaryColor = isDark ? 0x10b981 : 0x0ea5e9; // 祖母绿 vs 冰晶青
    const secondaryColor = isDark ? 0x06b6d4 : 0x6366f1; // 极光青 vs 靛蓝

    // A. 液体微光网格材质 (Wireframe/Mesh with soft opacity)
    const meshMaterial = new THREE.MeshBasicMaterial({
      color: primaryColor,
      wireframe: true,
      transparent: true,
      opacity: isDark ? 0.08 : 0.05,
      blending: THREE.AdditiveBlending,
    });
    const liquidMesh = new THREE.Mesh(geometry, meshMaterial);
    liquidMesh.position.set(0, -2, -8);
    liquidMesh.rotation.x = -0.35;
    scene.add(liquidMesh);

    // B. 漂浮流体粒子群 (Floating Iridescent Fluid Orbs)
    const particleCount = 60;
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleScales = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 60;
      particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 40;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 20 - 5;
      particleScales[i] = Math.random() * 2 + 1;
    }
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

    const particleMaterial = new THREE.PointsMaterial({
      color: secondaryColor,
      size: isDark ? 1.6 : 1.2,
      transparent: true,
      opacity: isDark ? 0.28 : 0.18,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // 3. 鼠标交互与插值平滑
    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    const handleMouseMove = (e: MouseEvent) => {
      mouse.targetX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.targetY = -(e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // 4. 窗口自适应
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // 5. 动画渲染循环 (Simplex wave flow)
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      // 阻尼缓动跟踪鼠标
      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;

      // 摄像机微视差倾斜
      camera.position.x = mouse.x * 2.5;
      camera.position.y = mouse.y * 1.8;
      camera.lookAt(0, 0, 0);

      // 液体网格顶点波动 (动态流体计算)
      if (!prefersReducedMotion) {
        const positions = geometry.attributes.position;
        const count = positions.count;

        for (let i = 0; i < count; i++) {
          const u = (i % (segmentsW + 1)) / segmentsW;
          const v = Math.floor(i / (segmentsW + 1)) / segmentsH;

          // 结合时间与鼠标位置的多频正弦水波
          const wave1 = Math.sin(u * 6 + elapsedTime * 0.8 + mouse.x * 1.5) * 1.2;
          const wave2 = Math.cos(v * 5 + elapsedTime * 0.6 + mouse.y * 1.5) * 1.0;
          const wave3 = Math.sin((u + v) * 8 + elapsedTime * 1.1) * 0.6;

          const originalZ = originalPositions[i * 3 + 2];
          positions.setZ(i, originalZ + wave1 + wave2 + wave3);
        }
        positions.needsUpdate = true;

        // 粒子缓缓旋转
        particles.rotation.y = elapsedTime * 0.03 + mouse.x * 0.1;
        particles.rotation.x = Math.sin(elapsedTime * 0.02) * 0.1 + mouse.y * 0.1;
      }

      renderer.render(scene, camera);
    };

    animate();

    // 清理资源
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      geometry.dispose();
      meshMaterial.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();
      renderer.dispose();
    };
  }, [resolvedTheme]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none opacity-90 transition-opacity duration-700"
    />
  );
}
