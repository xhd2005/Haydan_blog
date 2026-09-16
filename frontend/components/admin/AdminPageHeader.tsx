'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface AdminPageHeaderProps {
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: React.ReactNode;
  badgeText?: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function AdminPageHeader({
  title,
  description,
  icon: Icon,
  badge,
  badgeText,
  breadcrumbs,
  actions,
  action,
  className = '',
}: AdminPageHeaderProps) {
  const renderedBadge = badge || (badgeText ? (
    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-secondary border border-border text-muted-foreground">
      {badgeText}
    </span>
  ) : null);
  const renderedActions = actions || action;
  return (
    <div className={`border-b border-border pb-5 mb-6 space-y-3 transition-colors ${className}`}>
      {/* 顶部面包屑 (若提供) */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <React.Fragment key={idx}>
                {idx > 0 && <ChevronRight className="w-3 h-3 text-muted-foreground/60 shrink-0" />}
                {isLast || !crumb.href ? (
                  <span className="text-foreground font-medium truncate">{crumb.label}</span>
                ) : (
                  <Link
                    href={crumb.href}
                    className="hover:text-foreground transition-colors truncate"
                  >
                    {crumb.label}
                  </Link>
                )}
              </React.Fragment>
            );
          })}
        </nav>
      )}

      {/* 主标题与右侧动作区 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            {Icon && (
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0 shadow-sm">
                <Icon className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" />
              </div>
            )}
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
              <span>{title}</span>
            </h1>
            {renderedBadge && <div className="inline-flex items-center">{renderedBadge}</div>}
          </div>

          {description && (
            <p className="text-xs text-muted-foreground max-w-3xl leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {renderedActions && (
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            {renderedActions}
          </div>
        )}
      </div>
    </div>
  );
}
