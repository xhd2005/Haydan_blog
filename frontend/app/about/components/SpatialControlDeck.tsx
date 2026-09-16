'use client';

import React from 'react';
import { SpatialEntityId } from './ThreePhysicalGlassStage';
import { Sparkles, Compass, RotateCcw, Play, Pause, Layers } from 'lucide-react';

interface SpatialControlDeckProps {
  selectedEntity: SpatialEntityId | null;
  onSelectEntity: (entityId: SpatialEntityId) => void;
  autoRotate: boolean;
  onToggleAutoRotate: () => void;
  onResetView: () => void;
}

const ENTITY_BUTTONS: { id: SpatialEntityId; label: string; tag: string }[] = [
  { id: 'central-prism', label: '核心透镜', tag: 'ARCHITECT' },
  { id: 'epoch-1', label: '01 萌芽', tag: '2018' },
  { id: 'epoch-2', label: '02 并发', tag: '2021' },
  { id: 'epoch-3', label: '03 旷野', tag: '2023' },
  { id: 'epoch-4', label: '04 花园', tag: '2026' },
  { id: 'toolkit-arch', label: '分布式底座', tag: 'JAVA 21' },
  { id: 'toolkit-spatial', label: '空间计算', tag: 'THREE.JS' },
  { id: 'journeys-ring', label: '真实足迹', tag: 'JOURNEYS' },
];

export function SpatialControlDeck({
  selectedEntity,
  onSelectEntity,
  autoRotate,
  onToggleAutoRotate,
  onResetView,
}: SpatialControlDeckProps) {
  return (
    <div className="absolute inset-x-0 bottom-5 sm:bottom-8 z-20 flex flex-col items-center gap-3 px-3 pointer-events-none">
      {/* 交互提示气泡 */}
      <div className="liquid-glass-pill px-4 py-1.5 rounded-full text-[11px] font-mono text-muted-foreground flex items-center gap-2 pointer-events-auto">
        <Sparkles className="w-3 h-3 text-emerald-500 animate-pulse" />
        <span>移动鼠标体验 3D 物理折射与视差 · 点击实体或下方芯片展开 HUD 极客档案</span>
      </div>

      {/* 实体选择坞 */}
      <div className="liquid-glass-dock rounded-full p-1.5 sm:p-2 flex items-center gap-1 sm:gap-1.5 max-w-4xl overflow-x-auto no-scrollbar pointer-events-auto shadow-2xl">
        {ENTITY_BUTTONS.map((btn) => {
          const isSelected = selectedEntity === btn.id;
          return (
            <button
              key={btn.id}
              onClick={() => onSelectEntity(btn.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-mono whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                isSelected
                  ? 'bg-emerald-500 text-white font-bold shadow-md scale-105'
                  : 'text-foreground hover:bg-black/5 dark:hover:bg-white/10'
              }`}
            >
              <span className="opacity-60 text-[10px]">{btn.tag}</span>
              <span>{btn.label}</span>
            </button>
          );
        })}

        <div className="w-[1px] h-4 bg-slate-200 dark:bg-white/20 mx-1 shrink-0" />

        {/* 辅助控制：自转与复位 */}
        <button
          onClick={onToggleAutoRotate}
          className="p-2 rounded-full text-foreground hover:bg-black/5 dark:hover:bg-white/10 transition-colors shrink-0"
          title={autoRotate ? '暂停自转' : '开启自转'}
        >
          {autoRotate ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
        </button>

        <button
          onClick={onResetView}
          className="p-2 rounded-full text-foreground hover:bg-black/5 dark:hover:bg-white/10 transition-colors shrink-0"
          title="复位视角"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
