'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

export function AmbientSoundWidget() {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

  const toggleSound = async () => {
    if (isPlaying) {
      // 优雅淡出
      if (gainNodeRef.current && audioCtxRef.current) {
        gainNodeRef.current.gain.linearRampToValueAtTime(
          0.0001,
          audioCtxRef.current.currentTime + 0.5
        );
        setTimeout(() => {
          try {
            sourceNodeRef.current?.stop();
            sourceNodeRef.current?.disconnect();
          } catch {}
          setIsPlaying(false);
        }, 500);
      } else {
        setIsPlaying(false);
      }
    } else {
      try {
        const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtxClass) return;
        const ctx = audioCtxRef.current || new AudioCtxClass();
        audioCtxRef.current = ctx;

        if (ctx.state === 'suspended') {
          await ctx.resume();
        }

        // 创建舒缓的粉红噪音 (Pink Noise) 缓冲区 (循环 3 秒)
        const bufferSize = ctx.sampleRate * 3;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = buffer.getChannelData(0);

        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.969 * b2 + white * 0.153852;
          b3 = 0.8665 * b3 + white * 0.3104856;
          b4 = 0.55 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.016898;
          output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.035;
          b6 = white * 0.115926;
        }

        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        sourceNodeRef.current = source;

        // 低通滤波器模拟山林微风/细雨
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(650, ctx.currentTime);

        // 增益节点（音量与淡入）
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.0001, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.8);
        gainNodeRef.current = gain;

        source.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        source.start();
        setIsPlaying(true);
      } catch (err) {
        console.error('Ambient Audio Failed:', err);
      }
    }
  };

  useEffect(() => {
    return () => {
      try {
        sourceNodeRef.current?.stop();
        audioCtxRef.current?.close();
      } catch {}
    };
  }, []);

  return (
    <button
      onClick={toggleSound}
      type="button"
      className={`group relative flex items-center gap-2 px-3 py-1.5 rounded-2xl text-xs font-mono transition-all duration-300 border cursor-pointer select-none ${
        isPlaying
          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 shadow-sm shadow-emerald-500/10'
          : 'bg-white/60 dark:bg-neutral-900/60 text-muted-foreground border-slate-200/80 dark:border-white/10 hover:text-foreground hover:bg-white dark:hover:bg-neutral-800'
      }`}
      title={isPlaying ? '暂停环境氛围白噪音' : '开启专注心流白噪音（微风与雨声）'}
    >
      {isPlaying ? (
        <>
          <Volume2 className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
          <span className="hidden sm:inline">心流伴听中</span>
          {/* 动效音波柱 */}
          <span className="flex items-center gap-0.5 ml-0.5">
            <span className="w-0.5 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="w-0.5 h-3 bg-emerald-500 rounded-full animate-pulse" />
            <span className="w-0.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          </span>
        </>
      ) : (
        <>
          <VolumeX className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
          <span className="hidden sm:inline">氛围伴听</span>
        </>
      )}
    </button>
  );
}
