'use client';

import React, { useState, useRef } from 'react';
import { Friend } from '@/lib/types';
import { ExternalLink, Zap, ShieldCheck, Globe } from 'lucide-react';

interface FriendCardProps {
  friend: Friend;
  featured?: boolean;
}

export function FriendCard({ friend, featured }: FriendCardProps) {
  const cardRef = useRef<HTMLAnchorElement>(null);
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [glowPos, setGlowPos] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);
  const [imgError, setImgError] = useState(false);

  // 3D 物理微视差阻尼计算
  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const xPct = Math.min(100, Math.max(0, (mouseX / width) * 100));
    const yPct = Math.min(100, Math.max(0, (mouseY / height) * 100));

    // 最大倾斜 6.8 度
    const rotX = ((mouseY - height / 2) / (height / 2)) * -6.8;
    const rotY = ((mouseX - width / 2) / (width / 2)) * 6.8;

    setRotate({ x: rotX, y: rotY });
    setGlowPos({ x: xPct, y: yPct });
  };

  const handleMouseEnter = () => setIsHovered(true);

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotate({ x: 0, y: 0 });
  };

  const isOnline = friend.pingStatus === 'ONLINE';
  const isOffline = friend.pingStatus === 'OFFLINE';

  // 首字母兜底提取 (最多 2 字符)
  const fallbackLetter = (friend.name || 'F').trim().slice(0, 2).toUpperCase();

  // 分类专属颜色徽章
  const getCategoryBadge = (cat?: string) => {
    if (!cat) return null;
    if (cat === 'OPEN_SOURCE' || cat === '开源先锋') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 shadow-2xs">
          <Zap className="w-2.5 h-2.5" />
          <span>开源先锋</span>
        </span>
      );
    }
    if (cat === 'GEEK_PEER' || cat === '极客同好') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shadow-2xs">
          <ShieldCheck className="w-2.5 h-2.5" />
          <span>极客同好</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-2xs">
        <Globe className="w-2.5 h-2.5" />
        <span>独立博客</span>
      </span>
    );
  };

  return (
    <a
      ref={cardRef}
      href={friend.url}
      target="_blank"
      rel="noopener noreferrer"
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `perspective(1100px) rotateX(${rotate.x}deg) rotateY(${rotate.y}deg) translateZ(${
          isHovered ? '10px' : '0px'
        })`,
        transition: isHovered
          ? 'transform 0.1s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease'
          : 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.5s ease',
      }}
      className={`group relative p-6 sm:p-7 rounded-3xl flex flex-col justify-between overflow-hidden border backdrop-blur-xl transition-all duration-300 active:scale-[0.985] cursor-pointer ${
        featured
          ? 'bg-gradient-to-br from-white/95 via-white/85 to-emerald-500/5 dark:from-neutral-900/85 dark:via-neutral-900/65 dark:to-emerald-500/10 border-emerald-500/30 shadow-md hover:shadow-2xl hover:border-emerald-500/50'
          : 'bg-white/85 dark:bg-neutral-900/65 border-slate-200/80 dark:border-white/[0.08] shadow-[0_4px_24px_-4px_rgba(15,23,42,0.05)] dark:shadow-[0_12px_36px_-4px_rgba(0,0,0,0.5)] hover:shadow-2xl hover:border-slate-300 dark:hover:border-white/20'
      }`}
    >
      {/* 玻璃切角微光棱镜 (Glass Edge Sheen) - 顶部流光细线 */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[1px] opacity-70 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: `radial-gradient(180px circle at ${glowPos.x}% 0%, rgba(255, 255, 255, 0.95), transparent 80%)`,
        }}
      />

      {/* 鼠标跟随环境光晕 (Ambient Radial Glow) */}
      <div
        className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: `radial-gradient(420px circle at ${glowPos.x}% ${glowPos.y}%, rgba(16, 185, 129, 0.09), transparent 75%)`,
        }}
      />

      <div className="space-y-4 relative z-10">
        {/* 卡片头部：头像 + 探活双层呼吸灯 + 分类徽章 + 外跳指示 */}
        <div className="flex items-start justify-between gap-3">
          <div className="relative shrink-0">
            {/* 头像容器：支持 404 / 跨域自动平滑降级为首字母渐变微章 */}
            {friend.avatar && !imgError ? (
              <div className="w-13 h-13 rounded-2xl overflow-hidden bg-slate-100 dark:bg-neutral-800 border border-slate-200/80 dark:border-white/10 shadow-sm group-hover:scale-105 group-hover:shadow-md transition-all duration-300 relative flex items-center justify-center">
                <img
                  src={friend.avatar}
                  alt={friend.name}
                  onError={() => setImgError(true)}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-emerald-500/25 via-teal-500/15 to-blue-500/20 border border-emerald-500/30 flex items-center justify-center font-mono font-black text-sm text-emerald-600 dark:text-emerald-400 shadow-sm group-hover:scale-105 transition-transform duration-300">
                {fallbackLetter}
              </div>
            )}

            {/* 在线健康探活 Ping 指示灯 (双层扩散呼吸环) */}
            <div
              className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-neutral-900 flex items-center justify-center ${
                isOnline
                  ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.7)]'
                  : isOffline
                  ? 'bg-neutral-400 dark:bg-neutral-600'
                  : 'bg-emerald-500/70'
              }`}
              title={
                isOnline
                  ? `探活正常 (${friend.responseTimeMs || 35}ms)`
                  : isOffline
                  ? '站点暂时不可达或离线'
                  : '在线状态待探测'
              }
            >
              {isOnline && (
                <>
                  <span className="absolute -inset-1 rounded-full bg-emerald-500/35 animate-ping" />
                  <span className="w-1.5 h-1.5 rounded-full bg-white relative z-10" />
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {getCategoryBadge(friend.category)}
            <div className="p-1.5 rounded-xl text-slate-400 group-hover:text-emerald-500 group-hover:bg-emerald-500/10 transition-all">
              <ExternalLink className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>
          </div>
        </div>

        {/* 卡片正文：站名 + 真实简介 */}
        <div className="space-y-1.5">
          <h3 className="font-extrabold text-base sm:text-lg text-foreground group-hover:text-emerald-500 transition-colors truncate font-sans tracking-tight">
            {friend.name}
          </h3>
          <p className="text-xs sm:text-[13px] text-muted-foreground line-clamp-2 leading-relaxed h-9 font-sans">
            {friend.description || '探索数字花园与开放 Web 的同频造物者。'}
          </p>
        </div>
      </div>

      {/* 卡片底部元数据：响应时间 + 域名提示 */}
      <div className="pt-4 mt-3 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-muted-foreground relative z-10">
        <span className="truncate max-w-[150px] opacity-75 group-hover:opacity-100 group-hover:text-foreground transition-colors">
          {friend.url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
        </span>
        <div className="flex items-center gap-1 shrink-0 font-medium">
          {isOnline && friend.responseTimeMs ? (
            <span
              className={`font-semibold ${
                friend.responseTimeMs < 80
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : friend.responseTimeMs < 200
                  ? 'text-blue-500 dark:text-blue-400'
                  : 'text-amber-500 dark:text-amber-400'
              }`}
            >
              Ping {friend.responseTimeMs}ms
            </span>
          ) : isOffline ? (
            <span className="text-neutral-400 dark:text-neutral-500">OFFLINE</span>
          ) : (
            <span className="text-emerald-600/80 dark:text-emerald-400/80">ACTIVE</span>
          )}
        </div>
      </div>
    </a>
  );
}
