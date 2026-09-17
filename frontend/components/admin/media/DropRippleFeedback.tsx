'use client';

import React, { useEffect, useState } from 'react';

export interface RippleEffect {
  id: string;
  x: number;
  y: number;
}

export function DropRippleFeedback() {
  const [ripples, setRipples] = useState<RippleEffect[]>([]);

  useEffect(() => {
    const handleDrop = (e: DragEvent) => {
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const newRipple: RippleEffect = {
          id: `ripple-${Date.now()}-${Math.random()}`,
          x: e.clientX,
          y: e.clientY,
        };
        setRipples((prev) => [...prev, newRipple]);

        setTimeout(() => {
          setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
        }, 1200);
      }
    };

    window.addEventListener('drop', handleDrop);
    return () => window.removeEventListener('drop', handleDrop);
  }, []);

  if (ripples.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      {ripples.map((r) => (
        <div
          key={r.id}
          style={{
            left: `${r.x}px`,
            top: `${r.y}px`,
            transform: 'translate(-50%, -50%)',
          }}
          className="absolute"
        >
          {/* 外环波纹 */}
          <div className="w-24 h-24 rounded-full border-2 border-indigo-400/80 bg-indigo-500/20 animate-ping" />
          {/* 内环脉冲 */}
          <div className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-indigo-500/40 backdrop-blur-md shadow-[0_0_40px_rgba(99,102,241,0.8)] animate-pulse" />
        </div>
      ))}
    </div>
  );
}
