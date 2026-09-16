'use client';

import React, { useState } from 'react';
import { Mail, Github, Check, ArrowUp, Sparkles, Heart } from 'lucide-react';
import { toast } from '@/lib/toast';
import { useI18n } from '@/lib/i18n';
import Link from 'next/link';

export function AboutFlagshipFooter() {
  const { locale } = useI18n();
  const [copied, setCopied] = useState(false);
  const contactEmail = 'haydenxue@example.com';

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(contactEmail);
    setCopied(true);
    toast.success(locale === 'en' ? 'Email copied' : '站长邮箱已复制到剪贴板');
    setTimeout(() => setCopied(false), 2000);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-20 space-y-8">
      {/* 核心连接与造物哲学卡片：液体玻璃 */}
      <div className="liquid-glass-card rounded-3xl p-8 sm:p-12 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Digital Sanctuary // 数字避难所</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-sans">
              建造属于自己的心智花园，对抗速朽
            </h3>
            <p className="text-sm text-slate-700 dark:text-slate-300 font-sans leading-relaxed">
              这里是 Hayden Xue 的个人数字避难所与心智实验场。全站所有博文、足迹、随记与多媒体均由真实生活驱动，基于双主题液态玻璃层级美学与云原生对象存储架构构建。
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleCopyEmail}
              className="px-5 py-2.5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-mono font-medium inline-flex items-center gap-2 shadow-sm hover:scale-[1.03] transition-all cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Mail className="w-3.5 h-3.5" />}
              <span>{copied ? 'COPIED!' : contactEmail}</span>
            </button>

            <a
              href="https://github.com/xhd2005"
              target="_blank"
              rel="noopener noreferrer"
              className="liquid-glass-pill px-5 py-2.5 rounded-full text-foreground hover:text-emerald-600 dark:hover:text-emerald-400 text-xs font-mono inline-flex items-center gap-2 transition-colors cursor-pointer hover:scale-[1.03]"
            >
              <Github className="w-3.5 h-3.5" />
              <span>GITHUB</span>
            </a>
          </div>
        </div>

        {/* 底部导航与回到顶部 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pt-6 border-t border-slate-100 dark:border-white/[0.06] text-xs font-mono text-muted-foreground">
          <div className="flex flex-wrap items-center gap-5 sm:gap-6">
            <Link href="/" className="hover:text-foreground transition-colors">
              HOME
            </Link>
            <Link href="/blog" className="hover:text-foreground transition-colors">
              BLOG
            </Link>
            <Link href="/projects" className="hover:text-foreground transition-colors">
              PROJECTS
            </Link>
            <Link href="/journey" className="hover:text-foreground transition-colors">
              JOURNEY
            </Link>
          </div>

          <button
            onClick={scrollToTop}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 hover:text-foreground transition-colors cursor-pointer"
          >
            <span>BACK TO TOP</span>
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 站长版权与信条 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-white/[0.06] text-[11px] font-mono text-muted-foreground">
          <span>© 2026 HAYDEN XUE. ALL RIGHTS RESERVED.</span>
          <span className="tracking-widest">FROM THE EAST, TOWARD THE UNKNOWN.</span>
        </div>
      </div>
    </footer>
  );
}
