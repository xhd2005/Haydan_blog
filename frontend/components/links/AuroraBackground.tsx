'use client';

import React from 'react';

export function AuroraBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10 select-none">
      {/* 极光主光斑 1: 翡翠青绿 / 瓷青 */}
      <div
        className="absolute -top-[15%] -left-[10%] w-[55vw] h-[55vw] rounded-full blur-[110px] opacity-45 dark:opacity-30 mix-blend-multiply dark:mix-blend-screen animate-aurora-slow"
        style={{
          background:
            'radial-gradient(circle, rgba(16, 185, 129, 0.45) 0%, rgba(20, 184, 166, 0.25) 45%, transparent 70%)',
        }}
      />

      {/* 极光主光斑 2: 冰蓝天幕 / 蔚蓝 */}
      <div
        className="absolute top-[20%] -right-[15%] w-[50vw] h-[50vw] rounded-full blur-[120px] opacity-40 dark:opacity-25 mix-blend-multiply dark:mix-blend-screen animate-aurora-reverse"
        style={{
          background:
            'radial-gradient(circle, rgba(59, 130, 246, 0.4) 0%, rgba(99, 102, 241, 0.2) 50%, transparent 70%)',
        }}
      />

      {/* 极光次光斑 3: 暗夜微紫 / 暮光 */}
      <div
        className="absolute top-[60%] left-[20%] w-[45vw] h-[45vw] rounded-full blur-[130px] opacity-35 dark:opacity-20 mix-blend-multiply dark:mix-blend-screen animate-aurora-mid"
        style={{
          background:
            'radial-gradient(circle, rgba(168, 85, 247, 0.3) 0%, rgba(139, 92, 246, 0.15) 50%, transparent 70%)',
        }}
      />

      {/* 极光次光斑 4: 底部温润微光 */}
      <div
        className="absolute -bottom-[20%] -right-[10%] w-[60vw] h-[50vw] rounded-full blur-[140px] opacity-30 dark:opacity-20 mix-blend-multiply dark:mix-blend-screen"
        style={{
          background:
            'radial-gradient(circle, rgba(20, 184, 166, 0.35) 0%, rgba(56, 189, 248, 0.15) 50%, transparent 70%)',
        }}
      />

      {/* 极细微透环境点阵纹理 (1px Dot Matrix Texture) */}
      <div
        className="absolute inset-0 opacity-[0.035] dark:opacity-[0.055]"
        style={{
          backgroundImage: `radial-gradient(currentColor 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
      />
    </div>
  );
}
