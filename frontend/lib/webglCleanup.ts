/**
 * WebGL 显存安全回收与主动销毁引擎
 * 
 * 核心功能：
 * 当关闭或休眠 3D 页面（如全息知识图谱 /admin/graph、航海足迹 /admin/journey、前台 3D 地球仪）时，
 * 显式触发底层 WebGL 上下文的 loseContext() 扩展，强制释放 GPU 显存与贴图缓冲区，
 * 杜绝浏览器 16 个 WebGL 上下文上限及显存泄漏崩溃。
 */

type AnyWebGLContext = 
  | HTMLCanvasElement 
  | WebGLRenderingContext 
  | WebGL2RenderingContext 
  | { loseContext?: () => void } 
  | { gl?: any }
  | null 
  | undefined;

// 存储按路由注册的主动销毁钩子
const routeDisposers = new Map<string, Set<() => void>>();

/**
 * 安全销毁指定 Canvas 或 WebGL 上下文
 * 支持 HTMLCanvasElement、WebGL 上下文对象或具备 loseContext 方法的句柄
 */
export function safelyDisposeWebGL(target: AnyWebGLContext): void {
  if (!target || typeof target !== 'object') {
    return;
  }

  try {
    // 1. 如果对象本身实现了 loseContext 方法（如 mock 或封装句柄）
    if ('loseContext' in target && typeof target.loseContext === 'function') {
      target.loseContext();
      return;
    }

    // 2. 如果包含内部 gl 属性（如某些 Three.js/MapLibre 包装对象）
    if ('gl' in target && target.gl && typeof target.gl === 'object') {
      safelyDisposeWebGL(target.gl);
    }

    // 3. 如果是 HTMLCanvasElement
    if (typeof HTMLCanvasElement !== 'undefined' && target instanceof HTMLCanvasElement) {
      const gl2 = target.getContext('webgl2') as WebGL2RenderingContext | null;
      if (gl2) {
        const ext = gl2.getExtension('WEBGL_lose_context');
        if (ext) {
          ext.loseContext();
        }
      }
      const gl = target.getContext('webgl') as WebGLRenderingContext | null;
      if (gl) {
        const ext = gl.getExtension('WEBGL_lose_context');
        if (ext) {
          ext.loseContext();
        }
      }
      return;
    }

    // 4. 如果是 WebGLRenderingContext 或 WebGL2RenderingContext
    if (
      (typeof WebGLRenderingContext !== 'undefined' && target instanceof WebGLRenderingContext) ||
      (typeof WebGL2RenderingContext !== 'undefined' && target instanceof WebGL2RenderingContext) ||
      ('getExtension' in target && typeof (target as any).getExtension === 'function')
    ) {
      const ext = (target as any).getExtension('WEBGL_lose_context');
      if (ext && typeof ext.loseContext === 'function') {
        ext.loseContext();
      }
    }
  } catch (err) {
    // 防御性静默捕获，杜绝因为个别浏览器不支持特定扩展导致整站崩溃
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[webglCleanup] safelyDisposeWebGL encountered error:', err);
    }
  }
}

/**
 * 递归扫描并清理 DOM 容器内的所有 WebGL Canvas
 */
export function cleanupContainerWebGL(container: HTMLElement | Document | null): void {
  if (!container || typeof container.querySelectorAll !== 'function') {
    return;
  }

  try {
    const canvases = container.querySelectorAll('canvas');
    canvases.forEach((canvas) => {
      safelyDisposeWebGL(canvas);
    });
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[webglCleanup] cleanupContainerWebGL encountered error:', err);
    }
  }
}

/**
 * 为特定路由注册自定义 WebGL 显存清理回调
 * 返回取消注册函数
 */
export function registerWebGLDisposer(route: string, disposer: () => void): () => void {
  if (!routeDisposers.has(route)) {
    routeDisposers.set(route, new Set());
  }
  const disposers = routeDisposers.get(route)!;
  disposers.add(disposer);

  return () => {
    disposers.delete(disposer);
    if (disposers.size === 0) {
      routeDisposers.delete(route);
    }
  };
}

/**
 * 触发特定路由的所有 WebGL 显存释放回调
 */
export function triggerRouteWebGLCleanup(route: string): void {
  // 1. 执行注册的回调
  const disposers = routeDisposers.get(route);
  if (disposers && disposers.size > 0) {
    disposers.forEach((fn) => {
      try {
        fn();
      } catch (err) {
        console.warn(`[webglCleanup] Error executing disposer for ${route}:`, err);
      }
    });
  }

  // 2. 如果关闭的是已知 3D 页面（/admin/graph 或 /admin/journey），且在浏览器环境
  if (typeof document !== 'undefined' && (route.startsWith('/admin/graph') || route.startsWith('/admin/journey'))) {
    try {
      const activeTabContainer = document.querySelector(`[data-tab-route="${route}"]`);
      if (activeTabContainer) {
        cleanupContainerWebGL(activeTabContainer as HTMLElement);
      }
    } catch {}
  }
}
