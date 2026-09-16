'use client';

import React, { useState, useRef, useEffect } from 'react';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';
import { 
  Sparkles, 
  Video, 
  Upload, 
  Loader2, 
  Play, 
  Pause, 
  Maximize2, 
  Sun, 
  Moon, 
  CheckCircle2, 
  Film,
  Zap
} from 'lucide-react';
import { HeroSloganLine } from '@/lib/types';

function getPreviewGradientClass(scheme: string = 'emerald') {
  switch (scheme) {
    case 'cyan':
      return 'from-cyan-400 via-sky-300 to-blue-400';
    case 'violet':
      return 'from-violet-400 via-purple-300 to-fuchsia-400';
    case 'amber':
      return 'from-amber-400 via-orange-300 to-rose-400';
    case 'rose':
      return 'from-rose-400 via-pink-300 to-fuchsia-400';
    case 'monochrome':
      return 'from-white via-slate-200 to-slate-300';
    case 'emerald':
    default:
      return 'from-emerald-400 via-teal-300 to-cyan-300';
  }
}

interface HeroLivePreviewProps {
  heroTitle: string;
  heroSlogan: string;
  heroBio: string;
  heroBgType: 'video' | 'particles' | string;
  heroVideoUrl: string;
  sloganLines?: HeroSloganLine[];
  onVideoUploaded: (url: string) => void;
  onBgTypeChange?: (type: string) => void;
}

export function HeroLivePreview({
  heroTitle,
  heroSlogan,
  heroBio,
  heroBgType,
  heroVideoUrl,
  sloganLines,
  onVideoUploaded,
  onBgTypeChange,
}: HeroLivePreviewProps) {
  const [previewTheme, setPreviewTheme] = useState<'dark' | 'light'>('dark');
  const [isPlaying, setIsPlaying] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 切换播放/暂停
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  // WebGL / Canvas 流光微粒模拟渲染 (当处于 particles 模式时)
  useEffect(() => {
    if (heroBgType !== 'particles' || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 800);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 450);

    const particles: Array<{ x: number; y: number; vx: number; vy: number; radius: number; alpha: number }> = [];
    const count = 45;
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        radius: Math.random() * 2 + 1,
        alpha: Math.random() * 0.6 + 0.2,
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // 背景渐变
      const bgGrad = ctx.createRadialGradient(width / 2, height / 2, 50, width / 2, height / 2, width);
      if (previewTheme === 'dark') {
        bgGrad.addColorStop(0, '#0a101f');
        bgGrad.addColorStop(1, '#05070c');
      } else {
        bgGrad.addColorStop(0, '#eaf2ff');
        bgGrad.addColorStop(1, '#f4f6fa');
      }
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // 粒子与连线
      for (let i = 0; i < count; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = previewTheme === 'dark'
          ? `rgba(16, 185, 129, ${p.alpha})`
          : `rgba(13, 148, 136, ${p.alpha})`;
        ctx.fill();

        for (let j = i + 1; j < count; j++) {
          const p2 = particles[j];
          const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (dist < 90) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = previewTheme === 'dark'
              ? `rgba(16, 185, 129, ${0.15 * (1 - dist / 90)})`
              : `rgba(13, 148, 136, ${0.12 * (1 - dist / 90)})`;
            ctx.stroke();
          }
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [heroBgType, previewTheme]);

  // 本地视频直传 MinIO
  const handleVideoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 格式与体积校验 (最大 200MB)
    const validTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(mp4|webm|mov)$/i)) {
      toast.warning('仅支持 MP4 或 WebM 格式高清视频');
      return;
    }

    if (file.size > 200 * 1024 * 1024) {
      toast.error('视频文件超过 200MB 上传上限，请压缩后再传');
      return;
    }

    setUploading(true);
    setUploadProgress(15);
    const progressTimer = setInterval(() => {
      setUploadProgress((prev) => (prev < 85 ? prev + 10 : prev));
    }, 400);

    try {
      const media = await api.uploadMedia(file);
      clearInterval(progressTimer);
      setUploadProgress(100);

      if (media && media.url) {
        onVideoUploaded(media.url);
        toast.success('大视频已成功直传 MinIO 并自动应用至 Hero 画布！');
      } else {
        toast.error('视频上传未能获取到云端直链');
      }
    } catch (err: any) {
      clearInterval(progressTimer);
      toast.error(err.message || '视频直传 MinIO 失败');
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const isVideo = heroBgType === 'video';
  const effectiveVideoUrl = heroVideoUrl;

  return (
    <div className="space-y-4">
      {/* 顶部指示条与控制钮 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-secondary/40 border border-border text-xs">
        <div className="flex items-center gap-2">
          <Film className="w-4 h-4 text-emerald-500" />
          <span className="font-bold text-foreground">
            16:9 大视窗全景实时画布 (ysjf.com 级电影画幅)
          </span>
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-semibold border border-emerald-500/20">
            {isVideo ? '4K/HD VIDEO ENGINE' : 'WEBGL PARTICLES'}
          </span>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* 双主题预览切换 */}
          <div className="flex items-center p-0.5 rounded-xl bg-card border border-border">
            <button
              type="button"
              onClick={() => setPreviewTheme('dark')}
              className={`p-1.5 rounded-lg flex items-center gap-1 transition-colors cursor-pointer ${
                previewTheme === 'dark'
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="深曜石极客暗黑视效"
            >
              <Moon className="w-3.5 h-3.5" />
              <span className="text-[10px]">深曜石</span>
            </button>
            <button
              type="button"
              onClick={() => setPreviewTheme('light')}
              className={`p-1.5 rounded-lg flex items-center gap-1 transition-colors cursor-pointer ${
                previewTheme === 'light'
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="白瓷透感浅色视效"
            >
              <Sun className="w-3.5 h-3.5" />
              <span className="text-[10px]">高定白瓷</span>
            </button>
          </div>

          {/* 快速直切背景模式 */}
          {onBgTypeChange && (
            <button
              type="button"
              onClick={() => onBgTypeChange(isVideo ? 'particles' : 'video')}
              className="px-2.5 py-1.5 rounded-xl bg-card hover:bg-secondary border border-border text-foreground text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Zap className="w-3 h-3 text-amber-500" />
              <span>切为{isVideo ? '流光微粒' : '循环视频'}</span>
            </button>
          )}
        </div>
      </div>

      {/* 16:9 画布容器 */}
      <div
        className={`w-full aspect-video rounded-3xl overflow-hidden border border-border shadow-2xl relative select-none flex items-center justify-center transition-colors duration-500 ${
          previewTheme === 'dark' ? 'bg-[#090a0f]' : 'bg-[#fbfbfd]'
        }`}
      >
        {/* 背景引擎 1: 真实高清循环视频（严格由 CMS 配置的视频直链驱动） */}
        {isVideo && !!effectiveVideoUrl && (
          <div className="absolute inset-0 z-0 overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              loop
              muted
              playsInline
              key={effectiveVideoUrl}
              src={effectiveVideoUrl}
              className="w-full h-full object-cover opacity-60 filter saturate-125"
            />
            {/* 统一深色电影纱幕：与前台 media-scrim 机制一致，浅色预览下视频同样清晰可读 */}
            <div className="absolute inset-0 bg-black/30 pointer-events-none" />
            <div
              className={`absolute inset-0 ${
                previewTheme === 'dark'
                  ? 'bg-gradient-to-t from-[#090a0f] via-black/40 to-transparent'
                  : 'bg-gradient-to-t from-[#090a0f]/70 via-black/20 to-transparent'
              }`}
            />
          </div>
        )}

        {/* 背景引擎 2: WebGL 流光微粒画布（含视频未配置时的自动回退） */}
        {(!isVideo || !effectiveVideoUrl) && (
          <div className="absolute inset-0 z-0">
            <canvas ref={canvasRef} className="w-full h-full" />
          </div>
        )}

        {/* 视频模式未配置直链时的引导提示 */}
        {isVideo && !effectiveVideoUrl && (
          <div className="absolute top-3 left-3 z-20 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-[11px] font-mono flex items-center gap-1.5">
            <Zap className="w-3 h-3" />
            <span>尚未配置视频 · 下方直传 MinIO 后即刻实时预览</span>
          </div>
        )}

        {/* 画布中央：排版文字实时双向绑定渲染 */}
        <div className="relative z-10 text-center max-w-2xl px-6 py-8 space-y-3 pointer-events-none">
          {/* 翡翠极光光晕 */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-32 bg-emerald-500/15 dark:bg-emerald-400/20 rounded-full blur-3xl pointer-events-none" />

          {/* 标语徽章 */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[11px] font-mono tracking-wider">
            <Sparkles className="w-3 h-3 animate-spin" style={{ animationDuration: '4s' }} />
            <span>HAYDEN XUE · DIGITAL GARDEN</span>
          </div>

          {/* 多排实时响应标语展示区 */}
          {sloganLines && sloganLines.length > 0 ? (
            <div className="space-y-1 my-1">
              {sloganLines.map((line, idx) => {
                const gradClass = getPreviewGradientClass(line.colorScheme);
                const customStyle =
                  line.colorScheme === 'custom' && line.customColorStart && line.customColorEnd
                    ? { backgroundImage: `linear-gradient(to right, ${line.customColorStart}, ${line.customColorEnd})` }
                    : undefined;
                const isHandwrite = line.fontStyle === 'handwrite' || !line.fontStyle;
                const isSans = line.fontStyle === 'sans';
                const isSerif = line.fontStyle === 'serif';

                const previewPx = Math.round((line.fontSize || 140) * 0.26);

                return (
                  <div
                    key={line.id || idx}
                    className={`font-black tracking-tight leading-tight bg-gradient-to-r ${gradClass} bg-clip-text text-transparent drop-shadow-sm select-none ${
                      isHandwrite
                        ? 'font-handwrite'
                        : isSans
                        ? 'font-sans'
                        : isSerif
                        ? 'font-serif italic'
                        : 'font-mono'
                    }`}
                    style={{
                      fontSize: `${Math.max(16, previewPx)}px`,
                      ...customStyle,
                    }}
                  >
                    {line.text || (idx === 0 ? 'From the East,' : 'toward the unknown.')}
                  </div>
                );
              })}
            </div>
          ) : (
            <>
              {/* 主标题 */}
              <h1
                className={`text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight transition-colors ${
                  isVideo || previewTheme === 'dark'
                    ? 'text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]'
                    : 'text-slate-900'
                }`}
              >
                {heroTitle || 'Hayden Xue'}
              </h1>

              {/* 渐变标语 Slogan */}
              <p className="text-sm sm:text-lg md:text-xl font-bold bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-sm font-sans">
                {heroSlogan || 'From the East, toward the unknown.'}
              </p>
            </>
          )}

          {/* 自述简介 Bio */}
          <p
            className={`text-xs sm:text-sm line-clamp-2 leading-relaxed transition-colors max-w-lg mx-auto ${
              isVideo || previewTheme === 'dark' ? 'text-zinc-200 drop-shadow-[0_1px_6px_rgba(0,0,0,0.5)]' : 'text-slate-600'
            }`}
          >
            {heroBio || '全栈工程师 / 独立开发者 / 终身求知者。热爱构建高美感、高可靠的数字产品与基础设施。'}
          </p>
        </div>

        {/* 视频控制小按钮浮层 */}
        {isVideo && (
          <div className="absolute bottom-3 right-3 z-20 flex items-center gap-2">
            <button
              type="button"
              onClick={togglePlay}
              className="p-2 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md border border-white/20 transition-all cursor-pointer"
              title={isPlaying ? '暂停视频循环' : '继续播放'}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}
      </div>

      {/* 画布下方直传操作区 */}
      <div className="p-4 rounded-2xl bg-secondary/40 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="space-y-0.5">
          <div className="font-semibold text-foreground flex items-center gap-1.5">
            <Upload className="w-3.5 h-3.5 text-emerald-500" />
            <span>本地 4K/HD 视频直传生产 MinIO (最大支持 200MB)</span>
          </div>
          <p className="text-muted-foreground text-[11px]">
            选择视频后即刻直传生产 MinIO 对象存储，并自动回填 CDN 直链与在上方画布实时播放
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            accept="video/mp4,video/webm"
            onChange={handleVideoFileChange}
            className="hidden"
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold flex items-center gap-1.5 shadow-md transition-colors cursor-pointer"
          >
            {uploading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>直传上传中 ({uploadProgress}%)...</span>
              </>
            ) : (
              <>
                <Video className="w-3.5 h-3.5" />
                <span>选择本地视频直传</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
