'use client';

import React, { useState } from 'react';
import { toast } from '@/lib/toast';
import { Media } from '@/lib/types';
import { MediaPickerModal } from './MediaPickerModal';
import { ImagePlus } from 'lucide-react';

interface CoverPickerButtonProps {
  /** 选中封面后回调（回填 URL） */
  onSelect: (url: string) => void;
  className?: string;
}

/**
 * 封面媒体库快捷选择按钮（封装 MediaPickerModal image 模式）
 * 统一接入博文/项目/旅程等管理页的封面字段，免除手动粘贴 URL。
 */
export function CoverPickerButton({ onSelect, className = '' }: CoverPickerButtonProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (media: Media) => {
    onSelect(media.url);
    setOpen(false);
    toast.success(`已选用封面「${media.filename}」`);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-700 dark:text-emerald-400 border border-emerald-600/30 text-[11px] font-semibold transition-colors cursor-pointer ${className}`}
      >
        <ImagePlus className="w-3.5 h-3.5" />
        <span>媒体库选择</span>
      </button>

      <MediaPickerModal
        open={open}
        onClose={() => setOpen(false)}
        mimePrefix="image/"
        title="从媒体资产库选择封面图片"
        onSelect={handleSelect}
      />
    </>
  );
}
