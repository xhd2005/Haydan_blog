'use client';

import React, { useEffect, useRef, useState } from 'react';

/**
 * 全局动态环境微光跟随系统 (Ambient Glow Spotlight)
 * 遵循 AGENTS.md 准则 3 & 4：提供三维视觉景深与环境光晕，赋予全站灵动弹性交互质感。
 * 具备双主题自适应、惯性阻尼平滑插值与 GPU 硬件加速。
 */
export function AmbientGlow() {
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const posRef = useRef({ x: -1000, y: -1000 });
  const animFrameId = useRef<number | null>(null);
  const isMoving = useRef(false);

  useEffect(() => {
    setMounted(true);

    const handlePointerMove = (e: PointerEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
      if (!isMoving.current) {
        isMoving.current = true;
        loop();
      }
    };

    const handlePointerLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 };
    };

    const loop = () => {
      const targetX = mouseRef.current.x;
      const targetY = mouseRef.current.y;

      // 平滑弹性阻尼逼近
      posRef.current.x += (targetX - posRef.current.x) * 0.08;
      posRef.current.y += (targetY - posRef.current.y) * 0.08;

      if (containerRef.current) {
        containerRef.current.style.transform = `translate3d(${posRef.current.x}px, ${posRef.current.y}px, 0)`;
      }

      // 当距离极其微弱且鼠标未动时暂缓循环以节省能耗
      const dist = Math.hypot(targetX - posRef.current.x, targetY - posRef.current.y);
      if (dist > 0.5 || targetX > 0) {
        animFrameId.current = requestAnimationFrame(loop);
      } else {
        isMoving.current = false;
      }
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    document.addEventListener('mouseleave', handlePointerLeave);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('mouseleave', handlePointerLeave);
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, []);

  if (!mounted) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      style={{ isolation: 'isolate' }}
    >
      {/* 核心跟随光晕 */}
      <div
        ref={containerRef}
        className="absolute top-0 left-0 -ml-[300px] -mt-[300px] w-[600px] h-[600px] rounded-full blur-[100px] opacity-70 dark:opacity-80 transition-opacity duration-700 will-change-transform pointer-events-none"
        style={{
          background:
            'radial-gradient(circle, rgba(16,185,129,0.12) 0%, rgba(20,184,166,0.08) 35%, rgba(6,182,212,0.03) 65%, transparent 80%)',
        }}
      />

      {/* 极光边缘次级呼吸光晕 (环境微光) */}
      <div
        className="absolute top-[-10%] right-[-5%] w-[55vw] h-[55vw] rounded-full blur-[140px] pointer-events-none opacity-30 dark:opacity-40"
        style={{
          background:
            'radial-gradient(circle, rgba(5,150,105,0.08) 0%, rgba(14,165,233,0.05) 50%, transparent 80%)',
        }}
      />
    </div>
  );
}
