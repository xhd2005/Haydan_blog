export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

export interface ConfirmModalOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'default';
}

type ToastListener = (toasts: ToastItem[]) => void;
type ConfirmListener = (dialog: (ConfirmModalOptions & { resolve: (val: boolean) => void }) | null) => void;

class ToastEventManager {
  private toasts: ToastItem[] = [];
  private toastListeners: Set<ToastListener> = new Set();
  private confirmListener: ConfirmListener | null = null;

  subscribe(listener: ToastListener) {
    this.toastListeners.add(listener);
    listener(this.toasts);
    return () => {
      this.toastListeners.delete(listener);
    };
  }

  subscribeConfirm(listener: ConfirmListener) {
    this.confirmListener = listener;
    return () => {
      this.confirmListener = null;
    };
  }

  private notify() {
    this.toastListeners.forEach((l) => l([...this.toasts]));
  }

  show(message: string, type: ToastType = 'info', duration: number = 3500) {
    const id = Math.random().toString(36).substring(2, 9);
    const item: ToastItem = { id, type, message, duration };
    this.toasts = [item, ...this.toasts].slice(0, 5); // 最多同时显示 5 条
    this.notify();

    if (duration > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, duration);
    }
    return id;
  }

  dismiss(id: string) {
    this.toasts = this.toasts.filter((t) => t.id !== id);
    this.notify();
  }

  confirm(options: ConfirmModalOptions): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.confirmListener) {
        this.confirmListener({
          ...options,
          resolve: (val: boolean) => {
            if (this.confirmListener) {
              this.confirmListener(null);
            }
            resolve(val);
          },
        });
      } else {
        // 兜底（如果组件尚未挂载）
        if (typeof window !== 'undefined') {
          resolve(window.confirm(options.message || options.title || '请确认操作'));
        } else {
          resolve(true);
        }
      }
    });
  }
}

export const toastManager = new ToastEventManager();

export const toast = {
  success: (msg: string, duration?: number) => toastManager.show(msg, 'success', duration),
  error: (msg: string, duration?: number) => toastManager.show(msg, 'error', duration),
  info: (msg: string, duration?: number) => toastManager.show(msg, 'info', duration),
  warning: (msg: string, duration?: number) => toastManager.show(msg, 'warning', duration),
  dismiss: (id: string) => toastManager.dismiss(id),
};

export const confirmModal = (options: ConfirmModalOptions | string): Promise<boolean> => {
  if (typeof options === 'string') {
    return toastManager.confirm({ message: options });
  }
  return toastManager.confirm(options);
};
