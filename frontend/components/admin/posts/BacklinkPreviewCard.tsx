'use client';

import React from 'react';
import Link from 'next/link';
import { Post } from '@/lib/types';
import { SafeImage } from '@/components/SafeImage';
import { Link2, ExternalLink, Calendar, Eye } from 'lucide-react';

interface BacklinkPreviewCardProps {
  post: Partial<Post>;
  position?: { top: number; left: number };
  onClose?: () => void;
}

export function BacklinkPreviewCard({ post, position, onClose }: BacklinkPreviewCardProps) {
  return (
    <div
      style={
        position
          ? {
              top: `${position.top}px`,
              left: `${position.left}px`,
            }
          : undefined
      }
      className="z-50 w-72 rounded-2xl bg-white/95 dark:bg-[#12131a]/95 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] shadow-2xl p-4 text-xs font-sans space-y-2.5"
    >
      {post.cover && (
        <div className="relative w-full h-24 rounded-xl overflow-hidden border border-slate-200/60 dark:border-white/[0.06]">
          <SafeImage src={post.cover} alt={post.title || ''} className="w-full h-full object-cover" containerClassName="w-full h-full" />
        </div>
      )}

      <div>
        <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mb-1">
          <Link2 className="w-3 h-3" />
          <span>数字花园双向反向链接</span>
        </div>
        <h4 className="font-bold text-slate-900 dark:text-white leading-snug">
          {post.title}
        </h4>
      </div>

      {post.excerpt && (
        <p className="text-slate-500 dark:text-slate-400 text-[11px] line-clamp-2">
          {post.excerpt}
        </p>
      )}

      <div className="pt-2 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between text-[10px] text-slate-400">
        <div className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          <span>{post.createdAt ? new Date(post.createdAt).toLocaleDateString() : '-'}</span>
        </div>

        {post.slug && (
          <Link
            href={`/blog/${post.slug}`}
            target="_blank"
            className="inline-flex items-center gap-0.5 text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            <span>访问节点</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </Link>
        )}
      </div>
    </div>
  );
}
