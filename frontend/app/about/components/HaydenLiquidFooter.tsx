'use client';

import React, { useState } from 'react';
import { ArrowUp, Github, Mail, Check, Sparkles, Compass } from 'lucide-react';
import { toast } from '@/lib/toast';
import { useI18n } from '@/lib/i18n';
import Link from 'next/link';

export function HaydenLiquidFooter() {
  const { locale } = useI18n();
  const [copied, setCopied] = useState(false);
  const contactEmail = 'haydenxue@example.com';

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(contactEmail);
    setCopied(true);
    toast.success(locale === 'en' ? 'Email copied' : '邮箱已复制到剪贴板');
    setTimeout(() => setCopied(false), 2000);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="relative w-full py-16 sm:py-20 px-4 sm:px-8 lg:px-12 bg-black text-white border-t border-white/[0.08]">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* 顶部邀请卡片：液体玻璃 */}
        <div className="liquid-glass rounded-3xl p-8 sm:p-12 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-neutral-400">
              <Sparkles className="w-3.5 h-3.5 text-neutral-400" />
              <span>Let&apos;s Connect</span>
            </div>
            <h3 className="text-3xl sm:text-4xl font-serif text-white">
              Ready to construct something remarkable?
            </h3>
            <p className="text-sm text-neutral-300 font-sans font-light leading-relaxed">
              无论是高并发架构探讨、三维交互实验，还是徒步胶片分享，欢迎随时通过邮件或 GitHub 与我取得联络。
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleCopyEmail}
              className="px-6 py-3 rounded-full bg-white text-neutral-950 hover:bg-neutral-200 transition-colors text-xs font-mono font-medium inline-flex items-center gap-2 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Mail className="w-3.5 h-3.5" />}
              <span>{copied ? 'COPIED!' : contactEmail}</span>
            </button>

            <a
              href="https://github.com/xhd2005"
              target="_blank"
              rel="noopener noreferrer"
              className="liquid-glass px-6 py-3 rounded-full text-white hover:text-neutral-200 transition-colors text-xs font-mono inline-flex items-center gap-2 cursor-pointer"
            >
              <Github className="w-3.5 h-3.5" />
              <span>GITHUB</span>
            </a>
          </div>
        </div>

        {/* 导航与链接 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pt-4 text-xs font-mono text-neutral-400">
          <div className="flex flex-wrap items-center gap-6">
            <Link href="/" className="hover:text-white transition-colors">
              HOME
            </Link>
            <Link href="/blog" className="hover:text-white transition-colors">
              BLOG
            </Link>
            <Link href="/projects" className="hover:text-white transition-colors">
              PROJECTS
            </Link>
            <Link href="/journey" className="hover:text-white transition-colors">
              JOURNEY
            </Link>
          </div>

          <button
            onClick={scrollToTop}
            className="self-start sm:self-auto inline-flex items-center gap-2 hover:text-white transition-colors cursor-pointer"
          >
            <span>BACK TO TOP</span>
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 版权与宣言 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-white/[0.06] pt-8 text-[11px] font-mono text-neutral-400">
          <span>© 2026 HAYDEN XUE. ALL RIGHTS RESERVED.</span>
          <span className="tracking-widest">FROM THE EAST, TOWARD THE UNKNOWN.</span>
        </div>
      </div>
    </footer>
  );
}
