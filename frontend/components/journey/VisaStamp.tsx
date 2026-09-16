import React from 'react';

interface VisaStampProps {
  city?: string;
  country?: string;
  year?: string;
  className?: string;
}

/**
 * 签证印章（环球地理杂志式 IP 记忆点）
 * 做旧圆形 SVG 印章：城市名环形排布 + 年份 + 罗盘星纹理。
 * 浅色模式如护照页朱砂印泥，深色模式如荧光核验章。
 */
export function VisaStamp({ city = '', country = '', year = '', className = '' }: VisaStampProps) {
  // 确定性微旋转（由城市名长度推导，避免每次渲染跳动）
  const rotate = ((city.length * 7 + country.length * 3) % 17) - 8;
  const ringText = `${(city || 'VOYAGE').toUpperCase()} · ${(country || 'TERRA').toUpperCase()} · VERIFIED FOOTPRINT · `;

  return (
    <div
      className={`pointer-events-none select-none ${className}`}
      style={{ transform: `rotate(${rotate}deg)` }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 120 120"
        className="w-20 h-20 sm:w-24 sm:h-24 opacity-80 mix-blend-multiply dark:mix-blend-screen dark:opacity-90 drop-shadow-sm"
      >
        <defs>
          <path id="visa-ring-path" d="M 60,60 m -42,0 a 42,42 0 1,1 84,0 a 42,42 0 1,1 -84,0" />
        </defs>

        {/* 外双环 */}
        <circle cx="60" cy="60" r="56" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-rose-600 dark:text-emerald-400" />
        <circle cx="60" cy="60" r="51" fill="none" stroke="currentColor" strokeWidth="0.8" className="text-rose-600 dark:text-emerald-400" opacity="0.7" />
        {/* 内虚线环 */}
        <circle cx="60" cy="60" r="34" fill="none" stroke="currentColor" strokeWidth="0.8" strokeDasharray="3 3" className="text-rose-600 dark:text-emerald-400" opacity="0.8" />

        {/* 环形城市名 */}
        <text fontSize="8.2" fontFamily="monospace" fontWeight="700" letterSpacing="1.5" className="fill-rose-700 dark:fill-emerald-300">
          <textPath href="#visa-ring-path">{ringText}</textPath>
        </text>

        {/* 中心罗盘星 */}
        <g transform="translate(60 52)" className="text-rose-600 dark:text-emerald-400">
          <path d="M0-14 L2.5-2.5 L14 0 L2.5 2.5 L0 14 L-2.5 2.5 L-14 0 L-2.5-2.5 Z" fill="currentColor" opacity="0.9" />
          <circle r="3" fill="none" stroke="currentColor" strokeWidth="1.2" />
        </g>

        {/* 年份 */}
        <text x="60" y="82" textAnchor="middle" fontSize="11" fontFamily="monospace" fontWeight="800" letterSpacing="2" className="fill-rose-700 dark:fill-emerald-300">
          {year || '2026'}
        </text>
      </svg>
    </div>
  );
}
