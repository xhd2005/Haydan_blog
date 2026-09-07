'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n-client';
import { Post } from '@/lib/types';
import { X, Download, Copy, Check, Sparkles } from 'lucide-react';
import { toast } from '@/lib/toast';

interface SharePosterModalProps {
  post: Post;
  isOpen: boolean;
  onClose: () => void;
}

export function SharePosterModal({ post, isOpen, onClose }: SharePosterModalProps) {
  const { locale, t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 高清 2x 缩放尺寸
    const width = 640;
    const height = 960;
    canvas.width = width * 2;
    canvas.height = height * 2;
    ctx.scale(2, 2);

    // 1. 深色极简杂志背景
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#090d16');
    grad.addColorStop(0.5, '#0f172a');
    grad.addColorStop(1, '#020617');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // 2. 极光微光晕
    const radial = ctx.createRadialGradient(width * 0.8, height * 0.2, 20, width * 0.8, height * 0.2, 300);
    radial.addColorStop(0, 'rgba(16, 185, 129, 0.18)');
    radial.addColorStop(1, 'transparent');
    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, width, height);

    // 3. 边框网格
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.strokeRect(32, 32, width - 64, height - 64);

    // 4. 顶部 Header
    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 12px monospace';
    ctx.fillText('HAYDEN XUE · DIGITAL GARDEN', 56, 76);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = '11px monospace';
    ctx.textAlign = 'right';
    const dateStr = post.publishedAt ? post.publishedAt.split('T')[0] : '2026';
    ctx.fillText(dateStr, width - 56, 76);
    ctx.textAlign = 'left';

    // 5. 成熟度生命周期徽章
    const maturityLabel =
      post.maturity === 'EVERGREEN'
        ? '🌲 EVERGREEN'
        : post.maturity === 'SEEDLING'
        ? '🌱 SEEDLING'
        : '🌿 BUDDING';

    ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
    ctx.beginPath();
    ctx.roundRect(56, 110, 110, 26, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText(maturityLabel, 68, 127);

    // 6. 文章主标题自动折行
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 28px sans-serif';
    const title = post.title;
    const maxWidth = width - 112;
    const words = title.split('');
    let line = '';
    let y = 180;
    const lineHeight = 40;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n];
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        ctx.fillText(line, 56, y);
        line = words[n];
        y += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, 56, y);

    // 7. 分割线
    y += 30;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.beginPath();
    ctx.moveTo(56, y);
    ctx.lineTo(width - 56, y);
    ctx.stroke();

    // 8. 摘要金句
    y += 40;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = 'italic 16px serif';
    const excerpt = post.excerpt || 'From the East, toward the unknown. 记录技术探索、架构设计与长效思维演化。';
    const excerptChars = excerpt.split('');
    let excerptLine = '';
    const excerptLineHeight = 28;

    for (let n = 0; n < excerptChars.length; n++) {
      const test = excerptLine + excerptChars[n];
      const m = ctx.measureText(test);
      if (m.width > maxWidth && n > 0) {
        ctx.fillText(excerptLine, 56, y);
        excerptLine = excerptChars[n];
        y += excerptLineHeight;
        if (y > 600) break; // 防止过长
      } else {
        excerptLine = test;
      }
    }
    ctx.fillText(excerptLine, 56, y);

    // 9. 底部签名与 Slogan
    const footerY = height - 90;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.beginPath();
    ctx.moveTo(56, footerY - 20);
    ctx.lineTo(width - 56, footerY - 20);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText('Hayden Xue', 56, footerY + 8);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.font = '12px sans-serif';
    ctx.fillText('“From the East, toward the unknown.”', 56, footerY + 28);

    // 10. 极简 QR Code 矩阵象征图形
    const qrSize = 56;
    const qrx = width - 56 - qrSize;
    const qry = footerY - 12;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(qrx, qry, qrSize, qrSize);

    ctx.fillStyle = '#000000';
    // 简易黑白二维码图腾方块
    ctx.fillRect(qrx + 4, qry + 4, 16, 16);
    ctx.fillRect(qrx + qrSize - 20, qry + 4, 16, 16);
    ctx.fillRect(qrx + 4, qry + qrSize - 20, 16, 16);
    ctx.fillRect(qrx + 24, qry + 24, 10, 10);
    ctx.fillRect(qrx + 36, qry + 36, 8, 8);

    const url = canvas.toDataURL('image/png');
    setDataUrl(url);
  }, [isOpen, post]);

  const handleDownload = () => {
    if (!dataUrl) return;
    const link = document.createElement('a');
    link.download = `HaydenXue-${post.slug}-poster.png`;
    link.href = dataUrl;
    link.click();
    toast.success('海报下载已开始！');
  };

  const handleCopy = async () => {
    if (!canvasRef.current) return;
    try {
      canvasRef.current.toBlob(async (blob) => {
        if (!blob) return;
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ]);
        setIsCopied(true);
        toast.success(t('poster.copied'));
        setTimeout(() => setIsCopied(false), 2000);
      });
    } catch {
      toast.error('复制图片到剪贴板失败，请使用一键下载');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-card border border-border/80 rounded-3xl shadow-2xl p-6 overflow-hidden animate-scale-up space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-500" />
            <h3 className="text-sm font-bold text-foreground">
              {t('poster.title')}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Poster Preview */}
        <div className="relative w-full flex justify-center py-2 bg-neutral-950/40 rounded-2xl border border-border/40 overflow-hidden">
          <canvas
            ref={canvasRef}
            className="w-[280px] sm:w-[320px] rounded-xl shadow-2xl border border-border/50"
          />
        </div>

        {/* Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={handleCopy}
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold border border-border transition-all"
          >
            {isCopied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span>已复制</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>{t('poster.copy')}</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t('poster.download')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
