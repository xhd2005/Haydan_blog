'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Info, 
  X, 
  HelpCircle,
  AlertCircle
} from 'lucide-react';
import { 
  toastManager, 
  ToastItem, 
  ConfirmModalOptions 
} from '@/lib/toast';
import { useI18n } from '@/lib/i18n';

export function Toaster() {
  const { t } = useI18n();
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<
    (ConfirmModalOptions & { resolve: (val: boolean) => void }) | null
  >(null);

  useEffect(() => {
    const unsubToast = toastManager.subscribe(setToasts);
    const unsubConfirm = toastManager.subscribeConfirm(setConfirmDialog);
    return () => {
      unsubToast();
      unsubConfirm();
    };
  }, []);

  // ESC 键关闭 Confirm 对话框（默认返回 false）
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && confirmDialog) {
        confirmDialog.resolve(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [confirmDialog]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-rose-500 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />;
      default:
        return <Info className="w-5 h-5 text-sky-500 shrink-0" />;
    }
  };

  const getBorderColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-emerald-500/30 dark:border-emerald-500/20';
      case 'error':
        return 'border-rose-500/30 dark:border-rose-500/20';
      case 'warning':
        return 'border-amber-500/30 dark:border-amber-500/20';
      default:
        return 'border-sky-500/30 dark:border-sky-500/20';
    }
  };

  return (
    <>
      {/* Toast 队列容器 (右上角浮窗) */}
      <div 
        aria-live="polite"
        className="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: -16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95, transition: { duration: 0.15 } }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-2xl bg-card/95 dark:bg-zinc-900/95 backdrop-blur-md border ${getBorderColor(
                item.type
              )} shadow-xl shadow-black/5 dark:shadow-black/40 text-foreground text-sm`}
            >
              {getIcon(item.type)}
              <div className="flex-1 min-w-0 pt-0.5">
                <p className="text-xs sm:text-sm font-medium leading-relaxed break-words">
                  {item.message}
                </p>
              </div>
              <button
                onClick={() => toastManager.dismiss(item.id)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                aria-label={t('toast.close')}
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* 全局现代确认弹窗 (Confirm Modal) */}
      <AnimatePresence>
        {confirmDialog && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            {/* 半透明毛玻璃背景蒙层 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => confirmDialog.resolve(false)}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm"
            />

            {/* 对话框主体 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 6 }}
              transition={{ type: 'spring', stiffness: 450, damping: 30 }}
              className="relative w-full max-w-md p-6 rounded-3xl bg-card dark:bg-zinc-900 border border-border shadow-2xl space-y-5"
            >
              <div className="flex items-start gap-4">
                <div
                  className={`p-3 rounded-2xl shrink-0 ${
                    confirmDialog.variant === 'danger'
                      ? 'bg-rose-500/10 text-rose-500 dark:bg-rose-500/20'
                      : confirmDialog.variant === 'warning'
                      ? 'bg-amber-500/10 text-amber-500 dark:bg-amber-500/20'
                      : 'bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/20'
                  }`}
                >
                  {confirmDialog.variant === 'danger' ? (
                    <AlertCircle className="w-6 h-6" />
                  ) : confirmDialog.variant === 'warning' ? (
                    <AlertTriangle className="w-6 h-6" />
                  ) : (
                    <HelpCircle className="w-6 h-6" />
                  )}
                </div>
                <div className="space-y-1.5 pt-0.5">
                  <h3 className="text-base font-semibold text-foreground">
                    {confirmDialog.title || t('toast.confirm_title')}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {confirmDialog.message}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => confirmDialog.resolve(false)}
                  className="px-4 py-2 rounded-xl border border-border hover:bg-secondary text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {confirmDialog.cancelText || t('toast.cancel')}
                </button>
                <button
                  type="button"
                  autoFocus
                  onClick={() => confirmDialog.resolve(true)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium text-white transition-opacity shadow-md ${
                    confirmDialog.variant === 'danger'
                      ? 'bg-rose-600 hover:bg-rose-700'
                      : confirmDialog.variant === 'warning'
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {confirmDialog.confirmText || t('toast.confirm')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
