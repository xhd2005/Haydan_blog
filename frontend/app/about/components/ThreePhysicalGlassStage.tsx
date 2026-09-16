'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { useTheme } from 'next-themes';
import { Journey, Timeline, SiteSetting } from '@/lib/types';

export type SpatialEntityId =
  | 'central-prism'
  | 'epoch-1'
  | 'epoch-2'
  | 'epoch-3'
  | 'epoch-4'
  | 'toolkit-arch'
  | 'toolkit-spatial'
  | 'journeys-ring';

interface ThreePhysicalGlassStageProps {
  selectedEntity: SpatialEntityId | null;
  onSelectEntity: (entityId: SpatialEntityId) => void;
  journeys?: Journey[];
  timelines?: Timeline[];
  settings?: SiteSetting | null;
  autoRotate?: boolean;
}

// 辅助：生成刻蚀在物理玻璃上的高分辨率纹理画布
function createEngravedGlassTexture(title: string, subtitle: string, isDark: boolean): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  ctx.clearRect(0, 0, 512, 512);

  // 极简圆环与网格刻度
  ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(15, 23, 42, 0.35)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(256, 256, 230, 0, Math.PI * 2);
  ctx.stroke();

  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(256, 256, 170, 0, Math.PI * 2);
  ctx.stroke();

  // 标题
  ctx.fillStyle = isDark ? '#ffffff' : '#090a0f';
  ctx.font = 'bold 36px "SF Mono", "Fira Code", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(title, 256, 230);

  // 副标题
  ctx.fillStyle = isDark ? '#10b981' : '#059669';
  ctx.font = '22px "SF Mono", "Fira Code", monospace';
  ctx.fillText(subtitle, 256, 280);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

export function ThreePhysicalGlassStage({
  selectedEntity,
  onSelectEntity,
  journeys = [],
  autoRotate = true,
}: ThreePhysicalGlassStageProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { resolvedTheme } = useTheme();

  const selectedEntityRef = useRef<SpatialEntityId | null>(selectedEntity);
  useEffect(() => {
    selectedEntityRef.current = selectedEntity;
  }, [selectedEntity]);

  const onSelectEntityRef = useRef(onSelectEntity);
  useEffect(() => {
    onSelectEntityRef.current = onSelectEntity;
  }, [onSelectEntity]);

  const autoRotateRef = useRef(autoRotate);
  useEffect(() => {
    autoRotateRef.current = autoRotate;
  }, [autoRotate]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const isDark = resolvedTheme === 'dark' || document.documentElement.classList.contains('dark');

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      42,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    const initialCamPos = new THREE.Vector3(0, 2, 28);
    camera.position.copy(initialCamPos);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = isDark ? 1.4 : 1.2;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // 2. 空间光源系统 (Spatial Lighting Rig)
    const ambientLight = new THREE.AmbientLight(
      isDark ? 0x0a0f1d : 0xffffff,
      isDark ? 1.2 : 2.2
    );
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(isDark ? 0x10b981 : 0x0ea5e9, isDark ? 3.0 : 2.5);
    keyLight.position.set(16, 24, 20);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(isDark ? 0x6366f1 : 0x38bdf8, isDark ? 2.0 : 1.5);
    fillLight.position.set(-20, -12, 10);
    scene.add(fillLight);

    // 随鼠标移动的动态焦散点光源
    const causticPointLight = new THREE.PointLight(isDark ? 0x34d399 : 0x0284c7, isDark ? 5.0 : 3.5, 50);
    causticPointLight.position.set(0, 0, 10);
    scene.add(causticPointLight);

    // 3. 真正 WebGL 物理折射玻璃材质 (Physical Glass Material)
    const physicalGlassMaterial = new THREE.MeshPhysicalMaterial({
      color: isDark ? 0xffffff : 0xf8fafc,
      transmission: 0.96, // 极致透光
      opacity: 1.0,
      transparent: true,
      roughness: isDark ? 0.06 : 0.08,
      ior: 1.52, // 典型光学冕牌玻璃折射率
      thickness: 2.2, // 物理厚度引发真实折射焦散
      specularIntensity: 1.0,
      specularColor: new THREE.Color(isDark ? 0xffffff : 0x090a0f),
      metalness: 0.0,
      clearcoat: 1.0,
      clearcoatRoughness: 0.04,
      envMapIntensity: 1.5,
    });

    // 4. 实体对象容器
    const interactiveObjects: {
      mesh: THREE.Object3D;
      id: SpatialEntityId;
      originalPos: THREE.Vector3;
      originalScale: THREE.Vector3;
      phase: number;
    }[] = [];

    // --- 实体 A: 中心多面折射透镜 (Architect Prism) ---
    const prismGroup = new THREE.Group();
    prismGroup.position.set(0, 0, 0);

    // 外层折射多面体晶体 (切角八面/二十面)
    const prismGeo = new THREE.IcosahedronGeometry(3.6, 0);
    const prismMesh = new THREE.Mesh(prismGeo, physicalGlassMaterial);
    prismGroup.add(prismMesh);

    // 内部发光能量核心 (Nucleus Core)
    const coreGeo = new THREE.OctahedronGeometry(1.6, 2);
    const coreMat = new THREE.MeshStandardMaterial({
      color: isDark ? 0x10b981 : 0x0ea5e9,
      emissive: isDark ? 0x10b981 : 0x0ea5e9,
      emissiveIntensity: isDark ? 1.6 : 1.0,
      roughness: 0.2,
      wireframe: true,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    prismGroup.add(coreMesh);

    scene.add(prismGroup);
    interactiveObjects.push({
      mesh: prismGroup,
      id: 'central-prism',
      originalPos: prismGroup.position.clone(),
      originalScale: new THREE.Vector3(1, 1, 1),
      phase: 0,
    });

    // --- 实体 B: 四枚环绕时空纪元黑胶晶片 (Epoch Discs) ---
    const epochData = [
      { id: 'epoch-1' as SpatialEntityId, title: '2018 GENESIS', sub: '代码萌芽', angle: 0 },
      { id: 'epoch-2' as SpatialEntityId, title: '2021 ARCH', sub: '分布式高并发', angle: Math.PI * 0.5 },
      { id: 'epoch-3' as SpatialEntityId, title: '2023 WILD', sub: '旷野胶片', angle: Math.PI * 1.0 },
      { id: 'epoch-4' as SpatialEntityId, title: '2026 SANCTUARY', sub: '数字花园', angle: Math.PI * 1.5 },
    ];

    const orbitRadiusX = 10.5;
    const orbitRadiusZ = 6.5;

    epochData.forEach((ep, i) => {
      const discGroup = new THREE.Group();
      const x = Math.cos(ep.angle) * orbitRadiusX;
      const z = Math.sin(ep.angle) * orbitRadiusZ;
      const y = Math.sin(i * 1.5) * 1.2;
      discGroup.position.set(x, y, z);

      // 圆盘玻璃几何体
      const discGeo = new THREE.CylinderGeometry(2.0, 2.0, 0.2, 32);
      discGeo.rotateX(Math.PI * 0.5);

      // 上表面刻蚀纹理贴图
      const engravedTexture = createEngravedGlassTexture(ep.title, ep.sub, isDark);
      const discMat = physicalGlassMaterial.clone();
      discMat.map = engravedTexture;

      const discMesh = new THREE.Mesh(discGeo, discMat);
      discGroup.add(discMesh);

      // 唱片外缘微光线圈
      const ringGeo = new THREE.TorusGeometry(2.1, 0.04, 16, 64);
      const ringMat = new THREE.MeshBasicMaterial({
        color: isDark ? 0x34d399 : 0x0284c7,
        transparent: true,
        opacity: 0.6,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      discGroup.add(ringMesh);

      scene.add(discGroup);
      interactiveObjects.push({
        mesh: discGroup,
        id: ep.id,
        originalPos: discGroup.position.clone(),
        originalScale: new THREE.Vector3(1, 1, 1),
        phase: ep.angle,
      });
    });

    // --- 实体 C: 悬浮技术栈微晶芯片 (Toolkit Chips) ---
    const techData = [
      { id: 'toolkit-arch' as SpatialEntityId, title: 'JAVA 21 & SPRING', sub: 'VIRTUAL THREADS', pos: new THREE.Vector3(-9, 5, 2) },
      { id: 'toolkit-spatial' as SpatialEntityId, title: 'NEXT.JS & THREE.JS', sub: 'SPATIAL WEB', pos: new THREE.Vector3(9, -5, 2) },
    ];

    techData.forEach((t) => {
      const chipGroup = new THREE.Group();
      chipGroup.position.copy(t.pos);

      const boxGeo = new THREE.BoxGeometry(3.2, 1.8, 0.35);
      const chipMat = physicalGlassMaterial.clone();
      chipMat.map = createEngravedGlassTexture(t.title, t.sub, isDark);
      const chipMesh = new THREE.Mesh(boxGeo, chipMat);
      chipGroup.add(chipMesh);

      // 边框微光线框
      const edgeGeo = new THREE.EdgesGeometry(boxGeo);
      const edgeMat = new THREE.LineBasicMaterial({
        color: isDark ? 0x10b981 : 0x0284c7,
        transparent: true,
        opacity: 0.4,
      });
      const edgeLines = new THREE.LineSegments(edgeGeo, edgeMat);
      chipGroup.add(edgeLines);

      scene.add(chipGroup);
      interactiveObjects.push({
        mesh: chipGroup,
        id: t.id,
        originalPos: chipGroup.position.clone(),
        originalScale: new THREE.Vector3(1, 1, 1),
        phase: Math.random() * Math.PI,
      });
    });

    // --- 实体 D: 深空旷野足迹发光粒子星轨 (Footprint Halo) ---
    const haloParticleCount = 180;
    const haloPositions = new Float32Array(haloParticleCount * 3);
    for (let p = 0; p < haloParticleCount; p++) {
      const angle = (p / haloParticleCount) * Math.PI * 2;
      const r = 13.5 + (Math.random() - 0.5) * 1.5;
      haloPositions[p * 3] = Math.cos(angle) * r;
      haloPositions[p * 3 + 1] = (Math.random() - 0.5) * 2.5;
      haloPositions[p * 3 + 2] = Math.sin(angle) * (r * 0.7);
    }
    const haloGeo = new THREE.BufferGeometry();
    haloGeo.setAttribute('position', new THREE.BufferAttribute(haloPositions, 3));
    const haloMat = new THREE.PointsMaterial({
      color: isDark ? 0x6ee7b7 : 0x0284c7,
      size: 0.22,
      transparent: true,
      opacity: 0.75,
      blending: isDark ? THREE.AdditiveBlending : THREE.NormalBlending,
    });
    const haloPoints = new THREE.Points(haloGeo, haloMat);
    scene.add(haloPoints);

    // 5. 鼠标交互、视差与射线检测
    const mouse = new THREE.Vector2(-999, -999);
    const targetCamOffset = new THREE.Vector2(0, 0);
    const raycaster = new THREE.Raycaster();
    let hoveredEntityId: SpatialEntityId | null = null;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      mouse.set(x, y);

      // 平滑倾角视差范围
      targetCamOffset.x = x * 4.0;
      targetCamOffset.y = y * 2.5;

      // 移动焦散光源
      causticPointLight.position.x = x * 15;
      causticPointLight.position.y = y * 10;
    };

    const handleClick = () => {
      if (hoveredEntityId) {
        onSelectEntityRef.current(hoveredEntityId);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('click', handleClick);

    // 6. 动画渲染循环 (60fps Animation Loop)
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const render = () => {
      animationFrameId = requestAnimationFrame(render);
      const elapsed = clock.getElapsedTime();

      // (A) 自转与浮动
      if (autoRotateRef.current) {
        prismGroup.rotation.y = elapsed * 0.35;
        prismGroup.rotation.x = Math.sin(elapsed * 0.25) * 0.15;
        coreMesh.rotation.y = -elapsed * 0.6;
        haloPoints.rotation.y = elapsed * 0.08;
      }

      // (B) 环绕实体正弦浮动波浪
      interactiveObjects.forEach((obj) => {
        if (obj.id !== 'central-prism') {
          obj.mesh.position.y = obj.originalPos.y + Math.sin(elapsed * 1.5 + obj.phase) * 0.45;
          obj.mesh.rotation.y += 0.005;
        }
      });

      // (C) 射线检测 (Raycasting)
      raycaster.setFromCamera(mouse, camera);
      const checkMeshes: THREE.Object3D[] = [];
      interactiveObjects.forEach((o) => {
        o.mesh.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            checkMeshes.push(child);
          }
        });
      });

      const intersects = raycaster.intersectObjects(checkMeshes, false);
      let foundId: SpatialEntityId | null = null;

      if (intersects.length > 0) {
        const hit = intersects[0].object;
        for (const item of interactiveObjects) {
          let hasChild = false;
          item.mesh.traverse((c) => {
            if (c === hit) hasChild = true;
          });
          if (hasChild) {
            foundId = item.id;
            break;
          }
        }
      }

      hoveredEntityId = foundId;
      container.style.cursor = foundId ? 'pointer' : 'default';

      // (D) 悬浮微动效缓动 (Scale & Levitation Lerp)
      interactiveObjects.forEach((item) => {
        const isHovered = item.id === hoveredEntityId;
        const isSelected = item.id === selectedEntityRef.current;

        const targetScale = isSelected ? 1.25 : isHovered ? 1.15 : 1.0;
        item.mesh.scale.lerp(
          new THREE.Vector3(targetScale, targetScale, targetScale),
          0.1
        );
      });

      // (E) 相机运镜追踪 (Camera Dolly & Parallax)
      // 根据选中的实体平滑运镜聚焦点
      let targetCameraPos = initialCamPos.clone();
      let targetLookAt = new THREE.Vector3(0, 0, 0);

      const activeEntity = interactiveObjects.find((o) => o.id === selectedEntityRef.current);
      if (activeEntity && selectedEntityRef.current !== 'central-prism') {
        // 相机推近到对应实体附近
        targetCameraPos = activeEntity.mesh.position.clone().add(new THREE.Vector3(0, 1, 9));
        targetLookAt = activeEntity.mesh.position.clone();
      } else {
        targetCameraPos.x += targetCamOffset.x;
        targetCameraPos.y += targetCamOffset.y;
      }

      camera.position.lerp(targetCameraPos, 0.05);
      camera.lookAt(targetLookAt);

      renderer.render(scene, camera);
    };

    render();

    // 7. 响应窗口自适应
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('click', handleClick);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (renderer.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [resolvedTheme]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[88vh] sm:h-[92vh] overflow-hidden select-none"
    />
  );
}
