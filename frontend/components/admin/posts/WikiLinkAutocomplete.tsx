'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { Post } from '@/lib/types';
import { Sparkles, FileText, Link2, Sprout } from 'lucide-react';

interface WikiLinkAutocompleteProps {
  isOpen: boolean;
  query: string;
  position: { top: number; left: number };
  onSelect: (nodeTitle: string) => void;
  onClose: () => void;
}

export function WikiLinkAutocomplete({
  isOpen,
  query,
  position,
  onSelect,
  onClose,
}: WikiLinkAutocompleteProps) {
  const [nodes, setNodes] = useState<Post[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (!isOpen) return;
    api
      .getAdminPosts({ pageSize: 50 })
      .then((res) => {
        setNodes(res.records || []);
      })
      .catch(() => {});
  }, [isOpen]);

  const filteredNodes = nodes.filter((n) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return n.title.toLowerCase().includes(q) || n.slug.toLowerCase().includes(q);
  });

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          filteredNodes.length > 0 ? (prev + 1) % filteredNodes.length : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          filteredNodes.length > 0 ? (prev - 1 + filteredNodes.length) % filteredNodes.length : 0
        );
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        if (filteredNodes[selectedIndex]) {
          onSelect(filteredNodes[selectedIndex].title);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    },
    [isOpen, filteredNodes, selectedIndex, onSelect, onClose]
  );

  useEffect(() => {
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
      className="fixed z-50 w-80 max-h-64 overflow-y-auto rounded-2xl bg-white/95 dark:bg-[#12131a]/95 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] shadow-2xl p-1.5 space-y-1 font-sans text-xs"
    >
      <div className="px-2.5 py-1.5 flex items-center justify-between text-[10px] font-semibold uppercase text-emerald-600 dark:text-emerald-400 border-b border-slate-100 dark:border-white/[0.05]">
        <span className="flex items-center gap-1">
          <Sprout className="w-3 h-3" />
          数字花园知识节点联想
        </span>
        <span className="text-slate-400 font-normal">Enter 选择 · Esc 关闭</span>
      </div>

      {filteredNodes.length === 0 ? (
        <div className="py-4 text-center text-slate-400 text-xs">
          未匹配到包含「{query}」的博文节点
        </div>
      ) : (
        filteredNodes.slice(0, 10).map((node, index) => {
          const isSelected = index === selectedIndex;
          return (
            <div
              key={node.id}
              onClick={() => onSelect(node.title)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`px-3 py-2 rounded-xl cursor-pointer flex items-center justify-between gap-2 transition-all ${
                isSelected
                  ? 'bg-emerald-500/15 text-emerald-900 dark:text-emerald-100 font-medium'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.03]'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <Link2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                <span className="truncate">{node.title}</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono flex-shrink-0">
                {node.lang === 'en' ? 'EN' : 'ZH'}
              </span>
            </div>
          );
        })
      )}
    </div>
  );
}
