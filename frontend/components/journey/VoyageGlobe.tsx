'use client';

import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useTranslation } from '@/lib/i18n-client';
import { Journey } from '@/lib/types';
import Link from 'next/link';
import { SafeImage } from '@/components/SafeImage';
import { Compass, MapPin, ArrowRight, Sparkles, X, Globe } from 'lucide-react';

interface VoyageGlobeProps {
  journeys: Journey[];
}

// 射线相交测试多边形算法 (Point in Polygon)
function pointInPolygon(point: [number, number], vs: [number, number][]) {
  const x = point[1]; // lon
  const y = point[0]; // lat
  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const xi = vs[i][1];
    const yi = vs[i][0];
    const xj = vs[j][1];
    const yj = vs[j][0];
    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

// 高保真世界各大洲陆地多边形轮廓
const LAND_POLYGONS: [number, number][][] = [
  // 北美核心 (North America Main)
  [
    [15, -93], [20, -105], [30, -115], [34, -120], [40, -124], [48, -125], [54, -133],
    [60, -140], [65, -168], [71, -156], [71, -130], [68, -90], [58, -94], [52, -80],
    [45, -60], [43, -70], [35, -75], [25, -80], [20, -88], [15, -90]
  ],
  // 中美地峡 (Central America)
  [[15, -93], [15, -88], [9, -83], [8, -77], [10, -84], [14, -92]],
  // 格陵兰 (Greenland)
  [[60, -45], [65, -55], [75, -70], [83, -30], [80, -18], [70, -22], [60, -43]],
  // 南美 (South America)
  [
    [12, -72], [8, -60], [5, -50], [-2, -44], [-6, -35], [-18, -39], [-24, -46],
    [-35, -53], [-46, -65], [-55, -68], [-54, -73], [-42, -74], [-28, -71], [-18, -71],
    [-5, -81], [3, -77], [10, -75]
  ],
  // 欧洲主体 (Europe Main)
  [
    [36, -6], [43, -9], [46, -1], [49, 1], [53, 5], [55, 8], [55, 14], [54, 20],
    [48, 28], [44, 28], [41, 29], [38, 24], [36, 15], [38, 0], [36, -6]
  ],
  // 斯堪的纳维亚半岛 (Scandinavia)
  [[56, 12], [58, 6], [62, 5], [70, 20], [71, 28], [65, 30], [60, 25], [56, 14]],
  // 不列颠与爱尔兰 (British Isles)
  [[50, -10], [55, -10], [58, -6], [58, -2], [51, 2], [50, -5]],
  // 伊比利亚半岛 (Iberia)
  [[36, -9], [43, -9], [43, -2], [36, -2]],
  // 意大利半岛 (Italy)
  [[38, 12], [42, 12], [45, 12], [45, 14], [40, 18], [37, 15]],
  // 非洲主体 (Africa)
  [
    [36, -6], [37, 10], [32, 32], [28, 34], [15, 42], [11, 51], [2, 45], [-10, 40],
    [-26, 33], [-34, 18], [-34, 26], [-20, 12], [-5, 10], [4, 9], [5, 2], [5, -5],
    [15, -17], [28, -13], [35, -6]
  ],
  // 马达加斯加 (Madagascar)
  [[-12, 49], [-16, 50], [-25, 47], [-25, 43], [-16, 44]],
  // 阿拉伯半岛 (Arabian Peninsula)
  [[12, 44], [16, 53], [24, 60], [26, 56], [30, 48], [30, 35], [20, 39], [13, 44]],
  // 亚洲核心 (Asia Core)
  [
    [75, 40], [77, 105], [70, 175], [60, 165], [58, 140], [52, 142], [43, 132],
    [38, 120], [32, 122], [22, 114], [10, 106], [1, 104], [15, 96], [22, 90],
    [25, 62], [36, 40], [45, 50], [55, 60], [70, 60]
  ],
  // 印度次大陆 (India)
  [[8, 77], [16, 73], [22, 69], [28, 70], [30, 78], [26, 88], [20, 85], [15, 80], [8, 77]],
  // 东南亚中南半岛 (SE Asia)
  [[1, 104], [7, 100], [15, 100], [22, 105], [20, 108], [10, 106], [1, 104]],
  // 日本列岛 (Japan)
  [[31, 130], [35, 135], [44, 145], [45, 142], [35, 133], [32, 129]],
  // 印尼与菲律宾群岛 (Indonesia & Philippines)
  [[-8, 110], [-5, 105], [0, 100], [5, 100], [5, 118], [-5, 120], [-8, 115]],
  [[10, 120], [18, 120], [18, 125], [10, 126]],
  // 澳大利亚 (Australia)
  [
    [-12, 130], [-12, 136], [-15, 145], [-24, 153], [-37, 150], [-38, 140],
    [-35, 117], [-22, 114], [-17, 122], [-14, 129]
  ],
  // 新西兰 (New Zealand)
  [[-35, 173], [-41, 175], [-46, 168], [-46, 166], [-41, 172]]
];

export function VoyageGlobe({ journeys }: VoyageGlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { locale, t } = useTranslation();
  const [selectedJourney, setSelectedJourney] = useState<Journey | null>(null);

  // 默认足迹锚点（若后端经纬度未补齐则智能映射）
  const citiesData = journeys.map((j) => {
    let lat = j.latitude || 35.6762;
    let lon = j.longitude || 139.6503;
    const title = (j.title || '').toLowerCase();
    const city = (j.city || '').toLowerCase();

    if (city.includes('kyoto') || title.includes('京都')) {
      lat = 35.0116;
      lon = 135.7681;
    } else if (city.includes('tokyo') || title.includes('东京')) {
      lat = 35.6762;
      lon = 139.6503;
    } else if (city.includes('hangzhou') || title.includes('杭州')) {
      lat = 30.2741;
      lon = 120.1551;
    } else if (city.includes('beijing') || title.includes('北京')) {
      lat = 39.9042;
      lon = 116.4074;
    } else if (city.includes('shanghai') || title.includes('上海')) {
      lat = 31.2304;
      lon = 121.4737;
    } else if (city.includes('osaka') || title.includes('大阪')) {
      lat = 34.6937;
      lon = 135.5023;
    }
    return { ...j, lat, lon };
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let width = container.clientWidth || 600;
    let height = container.clientHeight || 460;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 14, 30);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 旋转总成群组
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    // 2. 地球核心球体 (深色深邃底质)
    const globeRadius = 10;
    const globeGeo = new THREE.SphereGeometry(globeRadius, 64, 64);
    const globeMat = new THREE.MeshBasicMaterial({
      color: 0x070b13,
    });
    const globeMesh = new THREE.Mesh(globeGeo, globeMat);
    globeGroup.add(globeMesh);

    // 经纬度网格线圈
    const wireframeGeo = new THREE.SphereGeometry(globeRadius + 0.02, 36, 18);
    const wireframeMat = new THREE.MeshBasicMaterial({
      color: 0x1e293b,
      wireframe: true,
      transparent: true,
      opacity: 0.25,
    });
    const wireframeMesh = new THREE.Mesh(wireframeGeo, wireframeMat);
    globeGroup.add(wireframeMesh);

    // 3. 大气层光晕 (Atmospheric Bloom - Custom Fresnel Shader)
    const atmosphereGeo = new THREE.SphereGeometry(globeRadius * 1.15, 64, 64);
    const atmosphereMat = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vView;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vView = normalize(-mvPosition.xyz);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        varying vec3 vView;
        void main() {
          float intensity = pow(0.65 - dot(vNormal, vView), 2.2);
          gl_FragColor = vec4(0.02, 0.71, 0.83, 1.0) * intensity * 0.95;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
    });
    const atmosphereMesh = new THREE.Mesh(atmosphereGeo, atmosphereMat);
    globeGroup.add(atmosphereMesh);

    // 4. 经纬度转三维笛卡尔坐标函数
    const latLonToVector3 = (lat: number, lon: number, radius: number) => {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lon + 180) * (Math.PI / 180);
      const x = -(radius * Math.sin(phi) * Math.cos(theta));
      const z = radius * Math.sin(phi) * Math.sin(theta);
      const y = radius * Math.cos(phi);
      return new THREE.Vector3(x, y, z);
    };

    // 5. 点阵发光大陆 (Dot-Matrix Continents via InstancedMesh)
    const landCoords: [number, number][] = [];
    for (let lat = -65; lat <= 75; lat += 2.5) {
      for (let lon = -180; lon < 180; lon += 2.5) {
        for (const poly of LAND_POLYGONS) {
          if (pointInPolygon([lat, lon], poly)) {
            landCoords.push([lat, lon]);
            break;
          }
        }
      }
    }

    const dotCount = landCoords.length;
    const dotGeo = new THREE.CircleGeometry(0.075, 6);
    const dotMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4, // Cyan luminescent
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    });
    const instancedLand = new THREE.InstancedMesh(dotGeo, dotMat, dotCount);

    const dummy = new THREE.Object3D();
    landCoords.forEach(([lat, lon], i) => {
      const pos = latLonToVector3(lat, lon, globeRadius + 0.05);
      dummy.position.copy(pos);
      // 让小圆片表面法线正对球心朝外
      dummy.lookAt(pos.clone().multiplyScalar(2));
      dummy.updateMatrix();
      instancedLand.setMatrixAt(i, dummy.matrix);
    });
    instancedLand.instanceMatrix.needsUpdate = true;
    globeGroup.add(instancedLand);

    // 6. 城市 Beacon 呼吸环、微光光柱与交互锚点
    interface BeaconRing {
      mesh: THREE.Mesh;
      mat: THREE.MeshBasicMaterial;
      phaseOffset: number;
    }
    const beaconRings: BeaconRing[] = [];
    const interactiveMeshes: THREE.Mesh[] = [];

    const pinGeo = new THREE.SphereGeometry(0.3, 16, 16);
    const pinMat = new THREE.MeshBasicMaterial({ color: 0x10b981 }); // Emerald bright
    const cylinderGeo = new THREE.CylinderGeometry(0.05, 0.12, 1.8, 12);
    const cylinderMat = new THREE.MeshBasicMaterial({
      color: 0x34d399,
      transparent: true,
      opacity: 0.65,
    });

    citiesData.forEach((city, index) => {
      const pos = latLonToVector3(city.lat, city.lon, globeRadius + 0.08);

      // (1) 城市发光锚球
      const pinMesh = new THREE.Mesh(pinGeo, pinMat);
      pinMesh.position.copy(pos);
      pinMesh.userData = { cityIndex: index };
      globeGroup.add(pinMesh);
      interactiveMeshes.push(pinMesh);

      // (2) 向上延伸微光探测光柱
      const beamMesh = new THREE.Mesh(cylinderGeo, cylinderMat);
      // 光柱中心置于球表面外侧
      const beamCenter = pos.clone().add(pos.clone().normalize().multiplyScalar(0.9));
      beamMesh.position.copy(beamCenter);
      beamMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), pos.clone().normalize());
      globeGroup.add(beamMesh);

      // (3) 双层同心动态呼吸光圈
      const ringGeo = new THREE.RingGeometry(0.35, 0.55, 32);
      for (let r = 0; r < 2; r++) {
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0x10b981,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.8,
        });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.position.copy(pos);
        ringMesh.lookAt(pos.clone().multiplyScalar(2));
        globeGroup.add(ringMesh);

        beaconRings.push({
          mesh: ringMesh,
          mat: ringMat,
          phaseOffset: r * 0.5 + index * 0.2,
        });
      }
    });

    // 7. 动态粒子流飞行航迹 (Flowing Particle Flight Trails)
    interface FlightTrail {
      curve: THREE.QuadraticBezierCurve3;
      speed: number;
      offset: number;
      particleMeshes: THREE.Mesh[];
    }
    const flightTrails: FlightTrail[] = [];
    const trailGeomPool: THREE.BufferGeometry[] = [];
    const trailMatPool: THREE.Material[] = [];

    const PARTICLE_TRAIL_LENGTH = 10;
    const cometGeo = new THREE.SphereGeometry(0.16, 8, 8);

    if (citiesData.length >= 2) {
      for (let i = 0; i < citiesData.length - 1; i++) {
        const p1 = latLonToVector3(citiesData[i].lat, citiesData[i].lon, globeRadius + 0.1);
        const p2 = latLonToVector3(citiesData[i + 1].lat, citiesData[i + 1].lon, globeRadius + 0.1);

        // 空间向上凸起的控制点
        const mid = p1.clone().add(p2).multiplyScalar(0.5);
        mid.normalize().multiplyScalar(globeRadius + 3.2);

        const curve = new THREE.QuadraticBezierCurve3(p1, mid, p2);

        // 静态航海底线
        const curvePoints = curve.getPoints(50);
        const lineGeo = new THREE.BufferGeometry().setFromPoints(curvePoints);
        trailGeomPool.push(lineGeo);
        const lineMat = new THREE.LineBasicMaterial({
          color: 0x06b6d4,
          transparent: true,
          opacity: 0.35,
        });
        trailMatPool.push(lineMat);
        const line = new THREE.Line(lineGeo, lineMat);
        globeGroup.add(line);

        // 彗星微粒束 (Comet Trail)
        const particleMeshes: THREE.Mesh[] = [];
        for (let p = 0; p < PARTICLE_TRAIL_LENGTH; p++) {
          const ratio = p / PARTICLE_TRAIL_LENGTH;
          const pMat = new THREE.MeshBasicMaterial({
            color: p === 0 ? 0xffffff : 0x34d399,
            transparent: true,
            opacity: Math.max(0.1, 1.0 - ratio * 0.9),
          });
          const pMesh = new THREE.Mesh(cometGeo, pMat);
          const scale = Math.max(0.4, 1.2 - ratio * 0.8);
          pMesh.scale.setScalar(scale);
          globeGroup.add(pMesh);
          particleMeshes.push(pMesh);
        }

        flightTrails.push({
          curve,
          speed: 0.22,
          offset: i * 0.33,
          particleMeshes,
        });
      }
    }

    // 8. 物理惯性阻尼旋转手势与触控全覆盖
    let isInteracting = false;
    let prevPointerX = 0;
    let prevPointerY = 0;
    let velocityX = 0;
    let velocityY = 0;

    const onPointerDown = (clientX: number, clientY: number) => {
      isInteracting = true;
      prevPointerX = clientX;
      prevPointerY = clientY;
      velocityX = 0;
      velocityY = 0;
    };

    const onPointerMove = (clientX: number, clientY: number) => {
      if (!isInteracting) return;
      const deltaX = clientX - prevPointerX;
      const deltaY = clientY - prevPointerY;

      globeGroup.rotation.y += deltaX * 0.005;
      globeGroup.rotation.x = Math.max(
        -Math.PI * 0.35,
        Math.min(Math.PI * 0.35, globeGroup.rotation.x + deltaY * 0.005)
      );

      velocityX = deltaX * 0.004;
      velocityY = deltaY * 0.004;

      prevPointerX = clientX;
      prevPointerY = clientY;
    };

    const onPointerUp = () => {
      isInteracting = false;
    };

    // 鼠标事件
    const handleMouseDown = (e: MouseEvent) => {
      onPointerDown(e.clientX, e.clientY);
    };
    const handleMouseMove = (e: MouseEvent) => {
      onPointerMove(e.clientX, e.clientY);
    };
    const handleMouseUp = () => {
      onPointerUp();
    };

    // 触控事件 (移动端与平板全覆盖)
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        onPointerDown(e.touches[0].clientX, e.touches[0].clientY);
      }
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        onPointerMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };
    const handleTouchEnd = () => {
      onPointerUp();
    };

    // 射线拾取点击城市节点
    const raycaster = new THREE.Raycaster();
    const mouseCoord = new THREE.Vector2();

    const handleClick = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseCoord.x = ((e.clientX - rect.left) / width) * 2 - 1;
      mouseCoord.y = -((e.clientY - rect.top) / height) * 2 + 1;

      raycaster.setFromCamera(mouseCoord, camera);
      const intersects = raycaster.intersectObjects(interactiveMeshes);

      if (intersects.length > 0) {
        const hit = intersects[0].object as THREE.Mesh;
        const cIdx = hit.userData.cityIndex;
        if (cIdx !== undefined && citiesData[cIdx]) {
          setSelectedJourney(citiesData[cIdx]);
        }
      }
    };

    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('touchcancel', handleTouchEnd);
    container.addEventListener('click', handleClick);

    // 9. 动画与物理惯性渲染循环
    let animationId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // (1) 物理惯性阻尼与低能耗自然自转
      if (!isInteracting) {
        globeGroup.rotation.y += velocityX;
        globeGroup.rotation.x = Math.max(
          -Math.PI * 0.35,
          Math.min(Math.PI * 0.35, globeGroup.rotation.x + velocityY)
        );

        velocityX *= 0.95;
        velocityY *= 0.95;

        // 惯性趋近 0 时恢复平滑低速自转
        if (Math.abs(velocityX) < 0.0001 && Math.abs(velocityY) < 0.0001) {
          globeGroup.rotation.y += 0.0015;
        }
      }

      // (2) 城市 Beacon 呼吸环动画
      beaconRings.forEach((ring) => {
        const progress = (time * 1.4 + ring.phaseOffset) % 1.0;
        const scale = 1.0 + progress * 2.2;
        ring.mesh.scale.set(scale, scale, 1);
        ring.mat.opacity = (1.0 - progress) * 0.85;
      });

      // (3) 动态彗星粒子流飞行航迹沿曲线高速穿梭
      flightTrails.forEach((trail) => {
        const headProgress = (time * trail.speed + trail.offset) % 1.0;
        trail.particleMeshes.forEach((pMesh, pIdx) => {
          let pProgress = headProgress - pIdx * 0.014;
          if (pProgress < 0) pProgress += 1.0;
          const pt = trail.curve.getPointAt(pProgress);
          pMesh.position.copy(pt);
        });
      });

      renderer.render(scene, camera);
    };

    animate();

    // 10. 窗口尺寸监听
    const handleResize = () => {
      if (!container) return;
      width = container.clientWidth;
      height = container.clientHeight || 460;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    // 11. 彻底显存释放与清理
    return () => {
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
      container.removeEventListener('click', handleClick);
      cancelAnimationFrame(animationId);

      // 释放基础几何与材质
      globeGeo.dispose();
      globeMat.dispose();
      wireframeGeo.dispose();
      wireframeMat.dispose();
      atmosphereGeo.dispose();
      atmosphereMat.dispose();

      // 释放点阵大陆
      dotGeo.dispose();
      dotMat.dispose();
      instancedLand.dispose();

      // 释放 Beacon
      pinGeo.dispose();
      pinMat.dispose();
      cylinderGeo.dispose();
      cylinderMat.dispose();
      interactiveMeshes.forEach((m) => (m.material as THREE.Material)?.dispose());
      beaconRings.forEach((r) => {
        r.mesh.geometry.dispose();
        r.mat.dispose();
      });

      // 释放航迹
      cometGeo.dispose();
      flightTrails.forEach((t) => {
        t.particleMeshes.forEach((m) => {
          (m.material as THREE.Material).dispose();
        });
      });
      trailGeomPool.forEach((g) => g.dispose());
      trailMatPool.forEach((m) => m.dispose());

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [journeys]);

  return (
    <div className="relative w-full h-[460px] rounded-3xl bg-neutral-950 border border-border/80 overflow-hidden shadow-2xl select-none">
      {/* 头部指示栏 */}
      <div className="absolute top-6 left-6 z-10 space-y-1 pointer-events-none">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 backdrop-blur-md">
          <Compass className="w-3.5 h-3.5 animate-spin-slow" />
          <span className="font-semibold">{t('globe.title')}</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300">2.0</span>
        </div>
        <p className="text-xs text-muted-foreground pt-1">
          {t('globe.subtitle')}
        </p>
      </div>

      {/* 访问统计与状态徽章 */}
      <div className="absolute top-6 right-6 z-10 flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono bg-neutral-900/80 text-emerald-400 border border-border/60 backdrop-blur-md pointer-events-none">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
        <span>{citiesData.length} {t('globe.cities_visited')}</span>
      </div>

      {/* 底部交互手势指引 */}
      <div className="absolute bottom-4 left-6 z-10 hidden sm:flex items-center gap-2 text-[11px] font-mono text-muted-foreground/80 pointer-events-none">
        <Globe className="w-3.5 h-3.5 text-cyan-400" />
        <span>单指/鼠标拖拽惯性旋转 · 点击 Beacon 展开足迹故事</span>
      </div>

      {/* Three.js 挂载容器 */}
      <div
        ref={containerRef}
        className="w-full h-full cursor-grab active:cursor-grabbing overflow-hidden"
      />

      {/* 选中的城市胶片弹出卡片 */}
      {selectedJourney && (
        <div className="absolute bottom-6 left-6 right-6 sm:left-auto sm:right-6 sm:w-80 z-20 bg-neutral-900/95 border border-cyan-500/30 backdrop-blur-2xl rounded-2xl p-4 shadow-2xl animate-slide-up">
          <div className="flex items-start justify-between gap-2 pb-2">
            <div>
              <span className="text-[11px] font-mono text-cyan-400 flex items-center gap-1 font-semibold">
                <MapPin className="w-3 h-3" />
                {selectedJourney.city} · {selectedJourney.country}
              </span>
              <h4 className="text-sm font-bold text-foreground line-clamp-1">
                {selectedJourney.title}
              </h4>
            </div>
            <button
              onClick={() => setSelectedJourney(null)}
              className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-neutral-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {selectedJourney.cover && (
            <div className="relative w-full h-28 rounded-xl overflow-hidden my-2">
              <SafeImage
                src={selectedJourney.cover}
                alt={selectedJourney.title}
                aspectRatio="16/9"
                containerClassName="w-full h-full"
              />
            </div>
          )}

          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {selectedJourney.description}
          </p>

          <div className="pt-3 flex items-center justify-between border-t border-border/30 mt-2">
            <span className="text-[10px] font-mono text-muted-foreground">
              {selectedJourney.startDate || selectedJourney.createdAt?.slice(0, 10) || 'VOYAGE_LOG'}
            </span>
            <Link
              href={`/journey/${selectedJourney.slug}`}
              className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              <span>{t('globe.view_detail')}</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
