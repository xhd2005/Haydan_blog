'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { Friend } from '@/lib/types';
import { useI18n } from '@/lib/i18n';
import { toast } from '@/lib/toast';
import { FriendApplyModal } from '@/components/links/FriendApplyModal';
import {
  Sparkles,
  Compass,
  Shuffle,
  Plus,
  ExternalLink,
  Layers,
  Globe,
  Radio,
  Search,
  X
} from 'lucide-react';
import Image from 'next/image';

interface OrbitalWebverse3DProps {
  initialFriends: Friend[];
}

export function OrbitalWebverse3D({ initialFriends }: OrbitalWebverse3DProps) {
  const { locale } = useI18n();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [friends] = useState<Friend[]>(initialFriends);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'3D' | '2D'>('3D');

  // 当前悬停的星球信息（透镜投影卡片）
  const [hoveredFriend, setHoveredFriend] = useState<{
    friend: Friend;
    screenX: number;
    screenY: number;
  } | null>(null);

  // 提取真实分类
  const categories = useMemo(() => {
    const set = new Set<string>();
    friends.forEach((f) => {
      if (f.category) set.add(f.category);
    });
    return ['ALL', ...Array.from(set)];
  }, [friends]);

  // 过滤后的友邻列表
  const filteredFriends = useMemo(() => {
    return friends.filter((f) => {
      const matchCat = selectedCategory === 'ALL' || f.category === selectedCategory;
      const matchQuery =
        !searchQuery ||
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (f.description && f.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchQuery;
    });
  }, [friends, selectedCategory, searchQuery]);

  // 随机曲率穿梭
  const handleRandomTeleport = () => {
    if (friends.length === 0) {
      toast.error(locale === 'en' ? 'No celestial nodes found' : '暂无可穿梭的友邻星球');
      return;
    }
    const target = friends[Math.floor(Math.random() * friends.length)];
    toast.success(
      locale === 'en'
        ? `Warp jump to ${target.name}...`
        : `正在启动曲率引擎，跃迁至：${target.name}...`
    );
    window.open(target.url, '_blank', 'noopener,noreferrer');
  };

  // Three.js 核心逻辑
  useEffect(() => {
    if (viewMode !== '3D' || !canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    let width = container.clientWidth;
    let height = container.clientHeight;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x06080e, 0.0018);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 2000);
    camera.position.set(0, 220, 480);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // 2. 深空粒子星海 (1600+ 微星粒子)
    const starCount = 1600;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const radius = 300 + Math.random() * 800;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      starPos[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      starPos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      starPos[i * 3 + 2] = radius * Math.cos(phi);

      const colorVariance = 0.7 + Math.random() * 0.3;
      starColors[i * 3] = colorVariance;
      starColors[i * 3 + 1] = colorVariance * 0.95;
      starColors[i * 3 + 2] = 1.0;
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    const starMat = new THREE.PointsMaterial({
      size: 2,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true,
    });
    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    // 3. 核心恒星：Hayden Xue 博客核心能量星核 (The Hearth)
    const sunGroup = new THREE.Group();
    const sunGeo = new THREE.IcosahedronGeometry(22, 4);
    const sunMat = new THREE.MeshBasicMaterial({
      color: 0x60a5fa,
      wireframe: true,
      transparent: true,
      opacity: 0.65,
    });
    const sunCoreMesh = new THREE.Mesh(
      new THREE.SphereGeometry(18, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    const sunWireMesh = new THREE.Mesh(sunGeo, sunMat);
    sunGroup.add(sunCoreMesh);
    sunGroup.add(sunWireMesh);
    scene.add(sunGroup);

    // 核心恒星环境光源
    const pointLight = new THREE.PointLight(0x38bdf8, 2.5, 1200);
    scene.add(pointLight);
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    // 4. 生成公转星轨与真实友邻行星
    const planetMeshes: Array<{
      mesh: THREE.Mesh;
      friend: Friend;
      orbitRadius: number;
      speed: number;
      angle: number;
    }> = [];

    // 光谱调色板
    const spectralColors = [
      0x38bdf8, // 科技冷蓝
      0xa855f7, // 神经暗紫
      0x10b981, // 极光翡翠
      0xf59e0b, // 琥珀暖金
      0xf43f5e, // 玫瑰霓虹
      0x06b6d4, // 深空海蓝
      0xe2e8f0, // 皓石银白
    ];

    // 绘制 3 条发光星轨环
    const orbitRadii = [110, 190, 280];
    orbitRadii.forEach((radius) => {
      const ringGeo = new THREE.RingGeometry(radius - 0.5, radius + 0.5, 96);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.08,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = Math.PI / 2;
      scene.add(ringMesh);
    });

    // 遍历真实友邻并生成星体
    friends.forEach((friend, idx) => {
      const orbitIdx = idx % 3;
      const baseRadius = orbitRadii[orbitIdx];
      const orbitRadius = baseRadius + ((idx * 17) % 25) - 12;
      const initialAngle = (idx / Math.max(friends.length, 1)) * Math.PI * 2;
      const speed = 0.002 + (0.003 / (orbitIdx + 1));
      const color = spectralColors[idx % spectralColors.length];

      const planetGeo = new THREE.SphereGeometry(7, 24, 24);
      const planetMat = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.3,
        metalness: 0.7,
        emissive: color,
        emissiveIntensity: 0.3,
      });
      const planetMesh = new THREE.Mesh(planetGeo, planetMat);

      // 部分行星带光环
      if (idx % 2 === 0) {
        const pRingGeo = new THREE.RingGeometry(9, 13, 32);
        const pRingMat = new THREE.MeshBasicMaterial({
          color,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.4,
        });
        const pRingMesh = new THREE.Mesh(pRingGeo, pRingMat);
        pRingMesh.rotation.x = Math.PI / 3;
        planetMesh.add(pRingMesh);
      }

      scene.add(planetMesh);
      planetMeshes.push({
        mesh: planetMesh,
        friend,
        orbitRadius,
        speed,
        angle: initialAngle,
      });
    });

    // 5. 交互：Raycaster 鼠标悬停拾取与点击跃迁
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(-999, -999);
    let currentHoveredMesh: THREE.Mesh | null = null;

    const onPointerMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(planetMeshes.map((p) => p.mesh));

      if (intersects.length > 0) {
        const hit = intersects[0].object as THREE.Mesh;
        const hitData = planetMeshes.find((p) => p.mesh === hit);
        if (hitData) {
          currentHoveredMesh = hit;
          setHoveredFriend({
            friend: hitData.friend,
            screenX: e.clientX,
            screenY: e.clientY,
          });
          document.body.style.cursor = 'pointer';
          return;
        }
      }

      currentHoveredMesh = null;
      setHoveredFriend(null);
      document.body.style.cursor = 'default';
    };

    const onCanvasClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(planetMeshes.map((p) => p.mesh));

      if (intersects.length > 0) {
        const hit = intersects[0].object as THREE.Mesh;
        const hitData = planetMeshes.find((p) => p.mesh === hit);
        if (hitData) {
          toast.success(
            locale === 'en'
              ? `Warping to ${hitData.friend.name}...`
              : `曲率跃迁启航：${hitData.friend.name}...`
          );
          window.open(hitData.friend.url, '_blank', 'noopener,noreferrer');
        }
      }
    };

    window.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('click', onCanvasClick);

    // 窗口尺寸自适应
    const onResize = () => {
      if (!containerRef.current) return;
      width = containerRef.current.clientWidth;
      height = containerRef.current.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', onResize);

    // 6. Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // 核心恒星缓慢自转与微脉冲
      sunGroup.rotation.y = elapsedTime * 0.15;
      sunWireMesh.rotation.x = elapsedTime * 0.1;
      const pulse = 1 + Math.sin(elapsedTime * 2) * 0.05;
      sunCoreMesh.scale.set(pulse, pulse, pulse);

      // 星球公转与自转
      planetMeshes.forEach((p) => {
        // 如果被悬停，公转减速便于点击，尺寸微放大
        const isHovered = currentHoveredMesh === p.mesh;
        const currentSpeed = isHovered ? p.speed * 0.2 : p.speed;
        p.angle += currentSpeed;

        p.mesh.position.x = Math.cos(p.angle) * p.orbitRadius;
        p.mesh.position.z = Math.sin(p.angle) * p.orbitRadius;
        p.mesh.position.y = Math.sin(elapsedTime * 1.2 + p.orbitRadius) * 6; // 微波浪浮动
        p.mesh.rotation.y += 0.02;

        const targetScale = isHovered ? 1.4 : 1.0;
        p.mesh.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
      });

      // 星空整体极慢旋转
      starField.rotation.y = elapsedTime * 0.01;

      renderer.render(scene, camera);
    };

    animate();

    // 7. Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('click', onCanvasClick);
      window.removeEventListener('resize', onResize);
      document.body.style.cursor = 'default';

      starGeo.dispose();
      starMat.dispose();
      sunGeo.dispose();
      sunMat.dispose();
      renderer.dispose();
    };
  }, [viewMode, friends, locale]);

  return (
    <div
      ref={containerRef}
      className="w-full h-[100svh] relative overflow-hidden select-none bg-[#05060a] text-slate-100"
    >
      {/* 3D WebGL Canvas 渲染层 */}
      {viewMode === '3D' && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full block z-0"
        />
      )}

      {/* 2D 平面星图视图（兼顾极客查找效率） */}
      {viewMode === '2D' && (
        <div className="absolute inset-0 z-10 overflow-y-auto pt-28 pb-20 px-6 max-w-7xl mx-auto space-y-6">
          <div className="text-center sm:text-left space-y-2">
            <h2 className="text-2xl font-bold font-mono text-white flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-400" />
              <span>ORBITAL MATRIX 2D</span>
            </h2>
            <p className="text-xs font-mono text-slate-400">
              {friends.length} AUTHENTIC WEB CREATORS CONNECTED TO HAYDEN XUE
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredFriends.map((friend) => (
              <a
                key={friend.id}
                href={friend.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 rounded-2xl bg-neutral-900/80 border border-white/10 hover:border-blue-400/50 hover:bg-neutral-800/80 transition-all duration-300 group flex items-start gap-3 shadow-lg"
              >
                <div className="w-10 h-10 rounded-full bg-blue-500/20 border border-blue-400/30 overflow-hidden relative shrink-0 flex items-center justify-center">
                  {friend.avatar ? (
                    <Image
                      src={friend.avatar}
                      alt={friend.name}
                      fill
                      className="object-cover"
                      sizes="40px"
                    />
                  ) : (
                    <span className="text-xs font-mono font-bold text-blue-300">
                      {friend.name.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-white group-hover:text-blue-400 transition-colors truncate">
                      {friend.name}
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition-colors shrink-0" />
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed font-sans">
                    {friend.description || '一位专注造物的真实友邻。'}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* 顶部 HUD 驾驶舱面板 */}
      <header className="absolute top-20 left-6 right-6 z-30 pointer-events-none flex items-center justify-between">
        {/* 左侧身份与星轨状态 */}
        <div className="pointer-events-auto bg-neutral-900/80 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/10 shadow-2xl flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-ping" />
          <div>
            <div className="text-xs font-mono font-bold tracking-widest text-white flex items-center gap-2">
              <Compass className="w-3.5 h-3.5 text-blue-400" />
              <span>ORBITAL WEBVERSE</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-blue-500/20 text-blue-300 rounded border border-blue-500/30">
                THREE.JS
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              {friends.length} AUTHENTIC CREATOR NODES // ZERO-FAKE
            </div>
          </div>
        </div>

        {/* 右侧 HUD 控制组 */}
        <div className="pointer-events-auto flex items-center gap-2 bg-neutral-900/80 backdrop-blur-xl p-1.5 rounded-2xl border border-white/10 shadow-2xl">
          {/* 3D / 2D 视图切换 */}
          <button
            onClick={() => setViewMode((m) => (m === '3D' ? '2D' : '3D'))}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition-all"
            title={viewMode === '3D' ? '切换为 2D 矩阵列表' : '切换为 3D 引力星系'}
          >
            <Layers className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">{viewMode === '3D' ? '2D 矩阵' : '3D 星系'}</span>
          </button>

          <div className="w-px h-4 bg-white/10" />

          {/* 随机漫游穿梭 */}
          <button
            onClick={handleRandomTeleport}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium rounded-xl bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition-all border border-blue-500/30"
            title="曲率随机跃迁至任一友邻站点"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">随机跃迁</span>
          </button>

          {/* 申请入轨 */}
          <button
            onClick={() => setIsApplyOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium rounded-xl bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 transition-all border border-emerald-500/30"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>申请入轨</span>
          </button>
        </div>
      </header>

      {/* 悬停引力透镜浮空名片 (Hologram Lens Card) */}
      {viewMode === '3D' && hoveredFriend && (
        <div
          className="fixed z-40 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-4 animate-in fade-in zoom-in-95 duration-200"
          style={{
            left: `${hoveredFriend.screenX}px`,
            top: `${hoveredFriend.screenY - 12}px`,
          }}
        >
          <div className="w-72 bg-neutral-900/95 backdrop-blur-2xl p-4 rounded-2xl border border-blue-400/40 shadow-[0_16px_40px_rgba(56,189,248,0.25)] space-y-2.5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 border border-blue-400/40 overflow-hidden relative shrink-0 flex items-center justify-center">
                {hoveredFriend.friend.avatar ? (
                  <Image
                    src={hoveredFriend.friend.avatar}
                    alt={hoveredFriend.friend.name}
                    fill
                    className="object-cover"
                    sizes="40px"
                  />
                ) : (
                  <span className="text-xs font-mono font-bold text-blue-300">
                    {hoveredFriend.friend.name.slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold text-white truncate flex items-center gap-1.5">
                  <span>{hoveredFriend.friend.name}</span>
                </div>
                {hoveredFriend.friend.category && (
                  <span className="text-[10px] font-mono px-1.5 py-0.2 bg-blue-500/20 text-blue-300 rounded border border-blue-500/30">
                    {hoveredFriend.friend.category}
                  </span>
                )}
              </div>
            </div>

            <p className="text-xs text-slate-300 font-sans line-clamp-3 leading-relaxed">
              {hoveredFriend.friend.description || '真实开放互联星系节点。'}
            </p>

            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-blue-400 font-bold">
              <span>CLICK PLANET TO WARP</span>
              <ExternalLink className="w-3 h-3" />
            </div>
          </div>
        </div>
      )}

      {/* 底部 HUD 快捷提示 */}
      <footer className="absolute bottom-6 left-6 right-6 z-30 pointer-events-none flex items-center justify-between text-xs font-mono text-slate-400">
        <div className="pointer-events-auto bg-neutral-900/80 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/10 flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>HOVER PLANET FOR LENS · CLICK TO WARP JUMP</span>
        </div>
        <div className="pointer-events-auto hidden md:flex items-center gap-2 bg-neutral-900/80 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/10">
          <span>HAYDEN XUE WEBVERSE</span>
          <span className="text-slate-600">•</span>
          <span>AUTHENTIC ECOSYSTEM</span>
        </div>
      </footer>

      {/* 申请友链弹窗 */}
      <FriendApplyModal
        isOpen={isApplyOpen}
        onClose={() => setIsApplyOpen(false)}
      />
    </div>
  );
}
