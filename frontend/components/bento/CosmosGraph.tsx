'use client';

import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as THREE from 'three';
import { useTranslation } from '@/lib/i18n-client';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { Sparkles, ArrowRight, X, Compass, ExternalLink, GitFork } from 'lucide-react';

interface KnowledgeNodeData {
  id: string;
  nameZh: string;
  nameEn: string;
  category: 'core' | 'backend' | 'ai' | 'web' | 'voyage' | 'garden';
  color: number;
  hexColor: string;
  radius: number;
  basePos: [number, number, number];
  connections: string[];
  maturity: '🌱' | '🌿' | '🌲';
  maturityLabelZh: string;
  maturityLabelEn: string;
  articlesCount: number;
  tags: string[];
  summaryZh: string;
  summaryEn: string;
  link: string;
}

interface PhysicsNode {
  data: KnowledgeNodeData;
  basePosition: THREE.Vector3;
  currentPosition: THREE.Vector3;
  velocity: THREE.Vector3;
  meshGroup: THREE.Group;
  coreMesh: THREE.Mesh;
  haloMesh: THREE.Mesh;
  textSprite: THREE.Sprite;
}

interface Ripple {
  mesh: THREE.Mesh;
  mat: THREE.MeshBasicMaterial;
  age: number;
  maxAge: number;
}

const NODES_DATA: KnowledgeNodeData[] = [
  {
    id: 'center',
    nameZh: 'Hayden 数字花园',
    nameEn: 'Hayden Digital Garden',
    category: 'core',
    color: 0x10b981, // Emerald
    hexColor: '#10b981',
    radius: 4.8,
    basePos: [0, 0, 0],
    connections: ['backend', 'ai', 'web', 'voyage', 'garden'],
    maturity: '🌲',
    maturityLabelZh: '常青体系 (Evergreen Hub)',
    maturityLabelEn: 'Evergreen Hub',
    articlesCount: 28,
    tags: ['Full-Stack', 'System Architecture', 'Cognitive Garden', 'AI Native'],
    summaryZh: '以 Java 21、Next.js 14 与前沿大模型代理为技术基石的个人数字花园枢纽。',
    summaryEn: 'Central hub of personal digital garden founded on Java 21, Next.js 14, and Agentic AI.',
    link: '/blog',
  },
  {
    id: 'backend',
    nameZh: 'Java 21 & 并发架构',
    nameEn: 'Java 21 & Concurrency',
    category: 'backend',
    color: 0x06b6d4, // Cyan
    hexColor: '#06b6d4',
    radius: 3.5,
    basePos: [-36, 16, 8],
    connections: ['center', 'ai'],
    maturity: '🌲',
    maturityLabelZh: '常青基石 (Evergreen Core)',
    maturityLabelEn: 'Evergreen Core',
    articlesCount: 14,
    tags: ['Java 21', 'Virtual Threads', 'Spring Boot 3', 'High Concurrency'],
    summaryZh: 'Project Loom 虚拟线程、Spring Boot 3 响应式微服务与百万级高并发高吞吐基石。',
    summaryEn: 'Project Loom virtual threads, Spring Boot 3 reactive microservices, and enterprise concurrency.',
    link: '/blog?tag=Java21',
  },
  {
    id: 'ai',
    nameZh: 'AI 智能体 & RAG 体系',
    nameEn: 'AI Agents & RAG System',
    category: 'ai',
    color: 0xa855f7, // Violet/Purple
    hexColor: '#a855f7',
    radius: 3.6,
    basePos: [38, 18, -6],
    connections: ['center', 'backend', 'web'],
    maturity: '🌿',
    maturityLabelZh: '充实演进 (Budding & Growing)',
    maturityLabelEn: 'Budding & Growing',
    articlesCount: 11,
    tags: ['SenseNova', 'DeepSeek', 'Agentic Workflow', 'RAG', 'Prompt Eng'],
    summaryZh: '商汤日日新与 DeepSeek 双引擎驱动的自主智能体、多模态研讨与知识图谱融合。',
    summaryEn: 'Autonomous agents, multimodal co-pilots, and RAG driven by SenseNova and DeepSeek engines.',
    link: '/blog?tag=AI',
  },
  {
    id: 'web',
    nameZh: 'Next.js 14 & 3D WebGL',
    nameEn: 'Next.js 14 & 3D WebGL',
    category: 'web',
    color: 0x3b82f6, // Blue
    hexColor: '#3b82f6',
    radius: 3.4,
    basePos: [30, -22, 12],
    connections: ['center', 'ai'],
    maturity: '🌿',
    maturityLabelZh: '充实演进 (Budding & Growing)',
    maturityLabelEn: 'Budding & Growing',
    articlesCount: 9,
    tags: ['Next.js 14', 'Three.js', 'TailwindCSS', 'Shaders', 'App Router'],
    summaryZh: 'App Router 现代全栈、Three.js 深度视差动效、无缝响应式空间美学体验。',
    summaryEn: 'Modern full-stack App Router, Three.js spatial visual depth, and responsive aesthetics.',
    link: '/blog?tag=Nextjs',
  },
  {
    id: 'voyage',
    nameZh: '全球探索足迹',
    nameEn: 'Global Footprints',
    category: 'voyage',
    color: 0xf59e0b, // Amber
    hexColor: '#f59e0b',
    radius: 3.2,
    basePos: [-32, -24, 6],
    connections: ['center', 'garden'],
    maturity: '🌱',
    maturityLabelZh: '生机萌芽 (Seedling Wander)',
    maturityLabelEn: 'Seedling Wander',
    articlesCount: 7,
    tags: ['Digital Nomad', 'Kyoto', 'Tokyo', 'Photography', 'Life Logs'],
    summaryZh: '记录穿梭东京、京都、杭州等各大城市的高清胶片随笔、咖啡香气与代码灵感。',
    summaryEn: 'Film photography, city walks across Tokyo, Kyoto, and digital nomad field notes.',
    link: '/journey',
  },
  {
    id: 'garden',
    nameZh: '思想成熟度 🌱/🌿/🌲',
    nameEn: 'Maturity Metaphor',
    category: 'garden',
    color: 0x10b981, // Emerald light
    hexColor: '#34d399',
    radius: 3.3,
    basePos: [2, -34, -10],
    connections: ['center'],
    maturity: '🌲',
    maturityLabelZh: '常青心智 (Evergreen Thinking)',
    maturityLabelEn: 'Evergreen Thinking',
    articlesCount: 16,
    tags: ['Mental Models', 'Second Brain', 'Zettelkasten', 'Knowledge Graph'],
    summaryZh: '从萌芽随想 (Seedling) 到持续浇灌 (Budding) 再到经久沉淀 (Evergreen) 的心智模型。',
    summaryEn: 'Organic knowledge synthesis tracing thoughts from raw seedlings to evergreen mental models.',
    link: '/blog?category=thought',
  },
];

export function CosmosGraph() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { locale, t } = useTranslation();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme !== 'light';

  const [selectedNode, setSelectedNode] = useState<KnowledgeNodeData | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const selectedNodeRef = useRef<KnowledgeNodeData | null>(null);
  const hoveredNodeIdRef = useRef<string | null>(null);

  // 创建 2D Canvas 文字广告牌精灵
  const createTextSprite = (text: string, colorHex: string, isCenter: boolean = false) => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.font = isCenter ? 'bold 22px sans-serif' : 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = colorHex;
      ctx.shadowColor = colorHex;
      ctx.shadowBlur = 8;
      ctx.fillText(text, 128, 32);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const spriteMaterial = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
    });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(isCenter ? 18 : 15, isCenter ? 4.5 : 3.8, 1);
    return { sprite, texture, spriteMaterial };
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let width = container.clientWidth || 500;
    let height = container.clientHeight || 340;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 0, 85);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 2. 1200+ 星尘微粒点云 (Nebula Star Dust)
    const dustCount = 1350;
    const dustGeometry = new THREE.BufferGeometry();
    const dustPositions = new Float32Array(dustCount * 3);
    const dustColors = new Float32Array(dustCount * 3);

    const c1 = new THREE.Color(isDark ? 0x06b6d4 : 0x0284c7);
    const c2 = new THREE.Color(isDark ? 0xa855f7 : 0x7c3aed);
    const c3 = new THREE.Color(isDark ? 0x10b981 : 0x059669);
    const cWhite = new THREE.Color(isDark ? 0xffffff : 0x334155);

    for (let i = 0; i < dustCount; i++) {
      const idx = i * 3;
      dustPositions[idx] = (Math.random() - 0.5) * 190;
      dustPositions[idx + 1] = (Math.random() - 0.5) * 140;
      dustPositions[idx + 2] = (Math.random() - 0.5) * 120;

      const pick = Math.random();
      const chosenColor = pick < 0.25 ? c1 : pick < 0.5 ? c2 : pick < 0.7 ? c3 : cWhite;
      dustColors[idx] = chosenColor.r;
      dustColors[idx + 1] = chosenColor.g;
      dustColors[idx + 2] = chosenColor.b;
    }

    dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
    dustGeometry.setAttribute('color', new THREE.BufferAttribute(dustColors, 3));

    // 生成微发光圆形点纹理
    const pointCanvas = document.createElement('canvas');
    pointCanvas.width = 32;
    pointCanvas.height = 32;
    const pctx = pointCanvas.getContext('2d');
    if (pctx) {
      const grad = pctx.createRadialGradient(16, 16, 0, 16, 16, 16);
      grad.addColorStop(0, 'rgba(255,255,255,1)');
      grad.addColorStop(0.3, 'rgba(255,255,255,0.7)');
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      pctx.fillStyle = grad;
      pctx.fillRect(0, 0, 32, 32);
    }
    const pointTexture = new THREE.CanvasTexture(pointCanvas);

    const dustMaterial = new THREE.PointsMaterial({
      size: 1.4,
      vertexColors: true,
      transparent: true,
      opacity: isDark ? 0.65 : 0.45,
      map: pointTexture,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const dustPoints = new THREE.Points(dustGeometry, dustMaterial);
    scene.add(dustPoints);

    // 3. 构造 6 大核心物理节点
    const physicsNodes: PhysicsNode[] = [];
    const spriteTextures: THREE.Texture[] = [];
    const spriteMaterials: THREE.SpriteMaterial[] = [];
    const orbitGeos: THREE.RingGeometry[] = [];
    const orbitMats: THREE.MeshBasicMaterial[] = [];
    const raycastMeshes: THREE.Mesh[] = [];

    NODES_DATA.forEach((data) => {
      const group = new THREE.Group();
      const basePos = new THREE.Vector3(...data.basePos);
      group.position.copy(basePos);

      // 核心球体
      const coreGeo = new THREE.SphereGeometry(data.radius, 24, 24);
      const coreMat = new THREE.MeshBasicMaterial({
        color: data.color,
      });
      const coreMesh = new THREE.Mesh(coreGeo, coreMat);
      coreMesh.userData = { nodeId: data.id };
      group.add(coreMesh);
      raycastMeshes.push(coreMesh);

      // 外层发光光晕呼吸球
      const haloGeo = new THREE.SphereGeometry(data.radius * 1.55, 16, 16);
      const haloMat = new THREE.MeshBasicMaterial({
        color: data.color,
        transparent: true,
        opacity: isDark ? 0.22 : 0.15,
        wireframe: true,
      });
      const haloMesh = new THREE.Mesh(haloGeo, haloMat);
      group.add(haloMesh);

      // 围绕核心的微光倾斜轨道环
      const orbitGeo = new THREE.RingGeometry(data.radius * 1.6, data.radius * 1.75, 32);
      const orbitMat = new THREE.MeshBasicMaterial({
        color: data.color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: isDark ? 0.35 : 0.2,
      });
      orbitGeos.push(orbitGeo);
      orbitMats.push(orbitMat);
      const orbitMesh = new THREE.Mesh(orbitGeo, orbitMat);
      orbitMesh.rotation.x = Math.PI / 3;
      group.add(orbitMesh);

      // 文本广告牌标签
      const labelText = locale === 'en' ? data.nameEn : data.nameZh;
      const { sprite, texture, spriteMaterial } = createTextSprite(labelText, data.hexColor, data.id === 'center');
      spriteMaterials.push(spriteMaterial);
      sprite.position.set(0, -(data.radius + 3.8), 0);
      group.add(sprite);
      spriteTextures.push(texture);

      scene.add(group);

      physicsNodes.push({
        data,
        basePosition: basePos.clone(),
        currentPosition: basePos.clone(),
        velocity: new THREE.Vector3(0, 0, 0),
        meshGroup: group,
        coreMesh,
        haloMesh,
        textSprite: sprite,
      });
    });

    // 4. 节点间的发光连线与能量脉冲光子
    const linePairs: { n1: PhysicsNode; n2: PhysicsNode }[] = [];
    NODES_DATA.forEach((d) => {
      const n1 = physicsNodes.find((n) => n.data.id === d.id);
      if (!n1) return;
      d.connections.forEach((targetId) => {
        const n2 = physicsNodes.find((n) => n.data.id === targetId);
        if (!n2) return;
        // 避免重复连接对
        if (
          !linePairs.some(
            (p) =>
              (p.n1.data.id === n1.data.id && p.n2.data.id === n2.data.id) ||
              (p.n1.data.id === n2.data.id && p.n2.data.id === n1.data.id)
          )
        ) {
          linePairs.push({ n1, n2 });
        }
      });
    });

    // 连线几何体及脉冲微粒
    interface LineLink {
      line: THREE.Line;
      geom: THREE.BufferGeometry;
      mat: THREE.LineBasicMaterial;
      pulseMesh: THREE.Mesh;
      n1: PhysicsNode;
      n2: PhysicsNode;
    }
    const lineLinks: LineLink[] = [];
    const pulseGeo = new THREE.SphereGeometry(0.65, 8, 8);
    const pulseMat = new THREE.MeshBasicMaterial({
      color: 0x34d399,
      transparent: true,
      opacity: 0.9,
    });

    linePairs.forEach(({ n1, n2 }) => {
      const geom = new THREE.BufferGeometry();
      const positions = new Float32Array(6);
      geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));

      const mat = new THREE.LineBasicMaterial({
        color: 0x10b981,
        transparent: true,
        opacity: isDark ? 0.16 : 0.1,
      });
      const line = new THREE.Line(geom, mat);
      scene.add(line);

      const pulseMesh = new THREE.Mesh(pulseGeo, pulseMat);
      scene.add(pulseMesh);

      lineLinks.push({ line, geom, mat, pulseMesh, n1, n2 });
    });

    // 5. 鼠标交互与引力波纹扩散环管理
    const mouse2D = new THREE.Vector2(-999, -999);
    const mouseNorm = new THREE.Vector2(0, 0);
    const mouseWorld = new THREE.Vector3(0, 0, 0);
    let isMouseInside = false;

    const ripples: Ripple[] = [];
    let lastRippleTime = 0;

    const raycaster = new THREE.Raycaster();

    const spawnRipple = (pos: THREE.Vector3) => {
      const ringGeo = new THREE.RingGeometry(0.2, 1.2, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x10b981,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.position.copy(pos);
      ringMesh.position.z += 0.1;
      scene.add(ringMesh);
      ripples.push({
        mesh: ringMesh,
        mat: ringMat,
        age: 0,
        maxAge: 1.2,
      });
    };

    const onPointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      mouse2D.set(x, y);
      mouseNorm.x = (x / width) * 2 - 1;
      mouseNorm.y = -(y / height) * 2 + 1;
      isMouseInside = true;

      // 映射到 Z=0 平面的 3D 引力中心
      raycaster.setFromCamera(mouseNorm, camera);
      const ray = raycaster.ray;
      if (Math.abs(ray.direction.z) > 0.0001) {
        const t = -ray.origin.z / ray.direction.z;
        mouseWorld.copy(ray.origin).addScaledVector(ray.direction, t);
      }

      // 动态生成微波纹
      const now = performance.now();
      if (now - lastRippleTime > 180) {
        spawnRipple(mouseWorld);
        lastRippleTime = now;
      }

      // 悬停检测
      const intersects = raycaster.intersectObjects(raycastMeshes);
      if (intersects.length > 0) {
        const hitMesh = intersects[0].object as THREE.Mesh;
        const nodeId = hitMesh.userData.nodeId;
        hoveredNodeIdRef.current = nodeId;
        setHoveredNodeId(nodeId);
        container.style.cursor = 'pointer';
      } else {
        hoveredNodeIdRef.current = null;
        setHoveredNodeId(null);
        container.style.cursor = 'crosshair';
      }
    };

    const onPointerLeave = () => {
      isMouseInside = false;
      mouseNorm.set(0, 0);
      hoveredNodeIdRef.current = null;
      setHoveredNodeId(null);
      container.style.cursor = 'default';
    };

    const onClick = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      mouseNorm.x = (x / width) * 2 - 1;
      mouseNorm.y = -(y / height) * 2 + 1;

      raycaster.setFromCamera(mouseNorm, camera);
      const intersects = raycaster.intersectObjects(raycastMeshes);
      if (intersects.length > 0) {
        const hitMesh = intersects[0].object as THREE.Mesh;
        const node = NODES_DATA.find((n) => n.id === hitMesh.userData.nodeId);
        if (node) {
          selectedNodeRef.current = node;
          setSelectedNode(node);
          // 强化波纹
          const hitPhysics = physicsNodes.find((p) => p.data.id === node.id);
          if (hitPhysics) {
            spawnRipple(hitPhysics.currentPosition);
          }
        }
      }
    };

    container.addEventListener('mousemove', onPointerMove);
    container.addEventListener('mouseleave', onPointerLeave);
    container.addEventListener('click', onClick);

    // 6. 渲染循环与物理摄动模拟
    let animationId: number;
    let clock = new THREE.Clock();

    const render = () => {
      animationId = requestAnimationFrame(render);
      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();

      // (1) 视差景深平滑阻尼插值 (Mouse Parallax)
      const targetCamX = mouseNorm.x * 16;
      const targetCamY = mouseNorm.y * 11;
      camera.position.x += (targetCamX - camera.position.x) * 0.05;
      camera.position.y += (targetCamY - camera.position.y) * 0.05;
      camera.lookAt(0, 0, 0);

      // (2) 星尘缓慢自转与正弦呼吸
      dustPoints.rotation.y += 0.0006;
      dustPoints.rotation.x += 0.0003;
      dustMaterial.opacity = (isDark ? 0.6 : 0.4) + Math.sin(elapsedTime * 1.5) * 0.12;

      // (3) 物理弹簧-引力摄动模拟
      physicsNodes.forEach((node) => {
        // 自然太空微浮动
        const floatOffset = new THREE.Vector3(
          Math.sin(elapsedTime * 0.8 + node.data.radius) * 0.06,
          Math.cos(elapsedTime * 0.9 + node.data.radius) * 0.06,
          Math.sin(elapsedTime * 0.7 + node.data.radius) * 0.04
        );
        node.currentPosition.add(floatOffset);

        // 鼠标 3D 引力扰动 (靠近排斥与弹性弹回)
        if (isMouseInside) {
          const toMouse = node.currentPosition.clone().sub(mouseWorld);
          toMouse.z *= 0.5; // 限制 z 轴位移幅度
          const dist = toMouse.length();
          const perturbRadius = 45;

          if (dist < perturbRadius && dist > 0.001) {
            const force = (1 - dist / perturbRadius) * 1.8;
            const perturbAcc = toMouse.normalize().multiplyScalar(force);
            node.velocity.add(perturbAcc);
          }
        }

        // 弹簧复位拉力：向 basePosition 牵引
        const springForce = node.basePosition
          .clone()
          .sub(node.currentPosition)
          .multiplyScalar(0.045);
        node.velocity.add(springForce);

        // 速度阻尼衰减
        node.velocity.multiplyScalar(0.88);
        node.currentPosition.add(node.velocity);

        // 更新 Mesh 坐标与呼吸效果
        node.meshGroup.position.copy(node.currentPosition);

        // 光晕呼吸缩放
        const haloScale = 1.0 + Math.sin(elapsedTime * 2.2 + node.data.radius) * 0.15;
        node.haloMesh.scale.setScalar(haloScale);
      });

      // (4) 动态连线与能量脉冲光点更新
      lineLinks.forEach((link, idx) => {
        const p1 = link.n1.currentPosition;
        const p2 = link.n2.currentPosition;

        const posAttr = link.geom.getAttribute('position') as THREE.BufferAttribute;
        posAttr.setXYZ(0, p1.x, p1.y, p1.z);
        posAttr.setXYZ(1, p2.x, p2.y, p2.z);
        posAttr.needsUpdate = true;

        // 判断是否高亮（连线两端有被选中或悬停的节点）
        const isHighlight =
          selectedNodeRef.current?.id === link.n1.data.id ||
          selectedNodeRef.current?.id === link.n2.data.id ||
          hoveredNodeIdRef.current === link.n1.data.id ||
          hoveredNodeIdRef.current === link.n2.data.id;

        link.mat.opacity = isHighlight ? 0.75 : isDark ? 0.14 : 0.08;
        link.mat.color.setHex(isHighlight ? 0x34d399 : 0x10b981);

        // 能量光子沿连线往返穿梭
        const pulseT = (elapsedTime * 0.6 + idx * 0.22) % 1.0;
        link.pulseMesh.position.lerpVectors(p1, p2, pulseT);
        link.pulseMesh.visible = isHighlight || isDark;
      });

      // (5) 引力波纹扩散环推进与自动清理
      for (let i = ripples.length - 1; i >= 0; i--) {
        const ripple = ripples[i];
        ripple.age += delta;
        const progress = ripple.age / ripple.maxAge;
        if (progress >= 1.0) {
          scene.remove(ripple.mesh);
          ripple.mesh.geometry.dispose();
          ripple.mat.dispose();
          ripples.splice(i, 1);
        } else {
          const scale = 1.0 + progress * 42;
          ripple.mesh.scale.set(scale, scale, 1);
          ripple.mat.opacity = (1 - progress) * 0.75;
        }
      }

      renderer.render(scene, camera);
    };

    render();

    // 7. 窗口尺寸监听
    const handleResize = () => {
      if (!container) return;
      width = container.clientWidth;
      height = container.clientHeight || 340;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    // 8. 彻底清理显存与生命周期
    return () => {
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousemove', onPointerMove);
      container.removeEventListener('mouseleave', onPointerLeave);
      container.removeEventListener('click', onClick);
      cancelAnimationFrame(animationId);

      // 清理点云
      dustGeometry.dispose();
      dustMaterial.dispose();
      pointTexture.dispose();

      // 清理节点几何与材质
      physicsNodes.forEach((node) => {
        node.coreMesh.geometry.dispose();
        (node.coreMesh.material as THREE.Material).dispose();
        node.haloMesh.geometry.dispose();
        (node.haloMesh.material as THREE.Material).dispose();
      });

      // 清理轨道环几何与材质
      orbitGeos.forEach((orbitGeo) => orbitGeo.dispose());
      orbitMats.forEach((orbitMat) => orbitMat.dispose());

      // 清理文字广告牌材质与精灵纹理
      spriteMaterials.forEach((spriteMaterial) => spriteMaterial.dispose());
      spriteTextures.forEach((t) => t.dispose());

      // 清理连线
      lineLinks.forEach((link) => {
        link.geom.dispose();
        link.mat.dispose();
      });
      pulseGeo.dispose();
      pulseMat.dispose();

      // 清理剩余波纹
      ripples.forEach((r) => {
        scene.remove(r.mesh);
        r.mesh.geometry.dispose();
        r.mat.dispose();
      });

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [locale, isDark]);

  return (
    <div className="relative w-full h-[360px] flex flex-col justify-between overflow-hidden rounded-3xl bg-neutral-950/80 border border-border/80 backdrop-blur-xl p-5 shadow-2xl group select-none">
      {/* 头部元数据栏 */}
      <div className="relative z-10 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Sparkles className="w-4 h-4 animate-spin-slow" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground tracking-tight flex items-center gap-1.5">
              <span>{t('bento.cosmos_title')}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                3D 2.0
              </span>
            </h3>
            <p className="text-[11px] text-muted-foreground">
              {t('bento.cosmos_desc')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 animate-pulse hidden sm:inline-block">
            {t('bento.cosmos_explore')}
          </span>
        </div>
      </div>

      {/* Three.js 渲染容器 */}
      <div
        ref={containerRef}
        className="absolute inset-0 w-full h-full cursor-crosshair overflow-hidden"
      />

      {/* 底部交互状态与提示 */}
      <div className="relative z-10 text-[11px] text-muted-foreground flex items-center justify-between pointer-events-none pt-2 border-t border-border/20">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span>
            {hoveredNodeId
              ? `${locale === 'en' ? 'Click node to explore detail:' : '点击天体展开技术脉络：'} ${
                  NODES_DATA.find((n) => n.id === hoveredNodeId)?.[locale === 'en' ? 'nameEn' : 'nameZh']
                }`
              : locale === 'en'
              ? 'Move cursor to perturb gravity · Click stars for drawer'
              : '滑动探索引力扰动与星系微光 · 点击天体探索分支脉络'}
          </span>
        </span>
        <span className="font-mono text-[10px] opacity-60">GRAVITY_FIELD · THREE.JS</span>
      </div>

      {/* 玻璃拟态知识延伸脉络抽屉 (Glassmorphic Knowledge Drawer) */}
      {selectedNode && (
        <div className="absolute inset-y-2 right-2 w-[88%] sm:w-80 z-20 bg-neutral-900/90 dark:bg-neutral-950/95 border border-emerald-500/30 backdrop-blur-2xl rounded-2xl p-4 shadow-2xl flex flex-col justify-between animate-slide-left">
          <div>
            {/* 顶部标题栏与关闭 */}
            <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-border/40">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: selectedNode.hexColor }}
                  />
                  <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-emerald-400">
                    {selectedNode.category}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-foreground">
                  {locale === 'en' ? selectedNode.nameEn : selectedNode.nameZh}
                </h4>
              </div>
              <button
                onClick={() => {
                  selectedNodeRef.current = null;
                  setSelectedNode(null);
                }}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-neutral-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 思想成熟度指标 */}
            <div className="mt-3 flex items-center gap-2 p-2 rounded-xl bg-neutral-800/50 border border-border/50 text-xs">
              <span className="text-base">{selectedNode.maturity}</span>
              <div>
                <div className="text-[10px] font-mono text-muted-foreground">
                  {locale === 'en' ? 'Maturity Status' : '思想成熟度指标'}
                </div>
                <div className="font-semibold text-foreground text-[11px]">
                  {locale === 'en' ? selectedNode.maturityLabelEn : selectedNode.maturityLabelZh}
                </div>
              </div>
              <div className="ml-auto text-right">
                <div className="text-[10px] font-mono text-muted-foreground">
                  {locale === 'en' ? 'Articles' : '沉淀博文'}
                </div>
                <div className="font-mono font-bold text-emerald-400 text-xs">
                  {selectedNode.articlesCount}+
                </div>
              </div>
            </div>

            {/* 简介文案 */}
            <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
              {locale === 'en' ? selectedNode.summaryEn : selectedNode.summaryZh}
            </p>

            {/* 关联技术标签 */}
            <div className="mt-3.5 space-y-1.5">
              <div className="text-[10px] font-mono text-muted-foreground uppercase">
                {locale === 'en' ? 'Associated Technologies' : '关联技术与认知标签'}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {selectedNode.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-neutral-800/80 text-foreground/80 border border-border/60"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* 底部跳转操作 */}
          <div className="pt-3 border-t border-border/40 flex items-center justify-between">
            <button
              onClick={() => {
                selectedNodeRef.current = null;
                setSelectedNode(null);
              }}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {locale === 'en' ? 'Dismiss' : '收起星图'}
            </button>
            <Link
              href={selectedNode.link}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-neutral-950 shadow-lg shadow-emerald-500/20 transition-all"
            >
              <span>{locale === 'en' ? 'Explore Track' : '探索该技术脉络'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
