/**
 * IndexedDB 表单状态与光标毫秒级恢复沙盒引擎
 * 
 * 核心功能：
 * 1. 在后台多标签切换、意外断网或浏览器刷新时，自动将当前页面的表单数据、光标选区 (start/end) 与滚动高度持久化；
 * 2. 标签重新激活或路由重进时，毫秒级无感回填；
 * 3. 正常提交表单后立即清除快照；
 * 4. 内置 TTL 30 天自动过期清理；
 * 5. 存储受限（QuotaExceededError）或私密模式下自动降级至 LocalStorage 存储。
 */

export interface FormSnapshotRecord {
  route: string;
  updatedAt: number;
  formData: Record<string, any>;
  cursorPosition?: { start: number; end: number };
  scrollOffset?: number;
}

const DB_NAME = 'hayden_blog_admin_sandbox';
const STORE_NAME = 'form_snapshots';
const DB_VERSION = 1;
const DEFAULT_TTL_DAYS = 30;
const FALLBACK_STORAGE_PREFIX = 'hayden_sandbox_snap_';

let dbInstancePromise: Promise<IDBDatabase> | null = null;
let useLocalStorageFallback = false;

function isIndexedDBAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  return typeof window.indexedDB !== 'undefined';
}

function openDatabase(): Promise<IDBDatabase> {
  if (dbInstancePromise) return dbInstancePromise;

  dbInstancePromise = new Promise<IDBDatabase>((resolve, reject) => {
    if (!isIndexedDBAvailable()) {
      useLocalStorageFallback = true;
      return reject(new Error('IndexedDB is not available in current environment'));
    }

    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'route' });
          store.createIndex('updatedAt', 'updatedAt', { unique: false });
        }
      };

      request.onsuccess = () => {
        const db = request.result;
        // 自动触发一次 30 天过期清理
        pruneExpiredSnapshots().catch(() => {});
        resolve(db);
      };

      request.onerror = () => {
        useLocalStorageFallback = true;
        reject(request.error || new Error('Failed to open IndexedDB'));
      };

      request.onblocked = () => {
        console.warn('[indexedDbSandbox] Database open blocked by another tab');
      };
    } catch (err) {
      useLocalStorageFallback = true;
      reject(err);
    }
  });

  return dbInstancePromise;
}

// -------------------------------------------------------------
// LocalStorage 降级逻辑
// -------------------------------------------------------------
function saveToLocalStorage(record: FormSnapshotRecord): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const key = `${FALLBACK_STORAGE_PREFIX}${record.route}`;
    window.localStorage.setItem(key, JSON.stringify(record));
  } catch (err) {
    console.warn('[indexedDbSandbox] LocalStorage fallback also failed:', err);
  }
}

function getFromLocalStorage(route: string): FormSnapshotRecord | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    const key = `${FALLBACK_STORAGE_PREFIX}${route}`;
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as FormSnapshotRecord;
  } catch {
    return null;
  }
}

function removeFromLocalStorage(route: string): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const key = `${FALLBACK_STORAGE_PREFIX}${route}`;
    window.localStorage.removeItem(key);
  } catch {}
}

function clearAllLocalStorageFallbacks(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith(FALLBACK_STORAGE_PREFIX)) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach((k) => window.localStorage.removeItem(k));
  } catch {}
}

// -------------------------------------------------------------
// 核心外部导出 API
// -------------------------------------------------------------

/**
 * 保存表单快照（包含输入字段、光标选区与滚动偏移量）
 */
export async function saveFormSnapshot(
  route: string,
  data: Record<string, any>,
  cursor: { start: number; end: number } = { start: 0, end: 0 },
  scroll: number = 0
): Promise<void> {
  if (typeof window === 'undefined') return;

  const record: FormSnapshotRecord = {
    route,
    updatedAt: Date.now(),
    formData: JSON.parse(JSON.stringify(data)),
    cursorPosition: cursor,
    scrollOffset: scroll,
  };

  if (useLocalStorageFallback || !isIndexedDBAvailable()) {
    saveToLocalStorage(record);
    return;
  }

  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(record);

        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
        tx.onabort = () => reject(tx.error);
      } catch (e) {
        reject(e);
      }
    });
  } catch (err: any) {
    // 捕获 QuotaExceededError 或连接异常，降级到 LocalStorage
    console.warn('[indexedDbSandbox] IndexedDB write failed, falling back to LocalStorage:', err);
    saveToLocalStorage(record);
  }
}

/**
 * 获取指定路由的表单快照
 */
export async function getFormSnapshot(route: string): Promise<FormSnapshotRecord | null> {
  if (typeof window === 'undefined') return null;

  if (useLocalStorageFallback || !isIndexedDBAvailable()) {
    return getFromLocalStorage(route);
  }

  try {
    const db = await openDatabase();
    const result = await new Promise<FormSnapshotRecord | null>((resolve, reject) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(route);

        req.onsuccess = () => {
          resolve((req.result as FormSnapshotRecord) || null);
        };
        req.onerror = () => reject(req.error);
      } catch (e) {
        reject(e);
      }
    });

    if (result) {
      return result;
    }
    // 如果 IndexedDB 中未命中，兜底检查一次 LocalStorage
    return getFromLocalStorage(route);
  } catch (err) {
    return getFromLocalStorage(route);
  }
}

/**
 * 清除指定路由的表单快照（如正常提交后或用户撤销草稿）
 */
export async function clearFormSnapshot(route: string): Promise<void> {
  if (typeof window === 'undefined') return;

  removeFromLocalStorage(route);

  if (useLocalStorageFallback || !isIndexedDBAvailable()) {
    return;
  }

  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.delete(route);

        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      } catch (e) {
        reject(e);
      }
    });
  } catch (err) {
    console.warn('[indexedDbSandbox] clearFormSnapshot error:', err);
  }
}

/**
 * 获取所有现存快照清单（供 Spotlight 恢复或状态分析）
 */
export async function getAllFormSnapshots(): Promise<FormSnapshotRecord[]> {
  if (typeof window === 'undefined') return [];

  const snapshots: FormSnapshotRecord[] = [];

  if (isIndexedDBAvailable() && !useLocalStorageFallback) {
    try {
      const db = await openDatabase();
      const records = await new Promise<FormSnapshotRecord[]>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();
        req.onsuccess = () => resolve((req.result as FormSnapshotRecord[]) || []);
        req.onerror = () => reject(req.error);
      });
      snapshots.push(...records);
    } catch {}
  }

  // 聚合 LocalStorage 中未在 IndexedDB 中出现的快照
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const existingRoutes = new Set(snapshots.map((s) => s.route));
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (k && k.startsWith(FALLBACK_STORAGE_PREFIX)) {
          const raw = window.localStorage.getItem(k);
          if (raw) {
            try {
              const record = JSON.parse(raw) as FormSnapshotRecord;
              if (!existingRoutes.has(record.route)) {
                snapshots.push(record);
              }
            } catch {}
          }
        }
      }
    } catch {}
  }

  return snapshots;
}

/**
 * 自动清理超过 TTL 天数（默认 30 天）的过期快照
 */
export async function pruneExpiredSnapshots(ttlDays: number = DEFAULT_TTL_DAYS): Promise<number> {
  if (typeof window === 'undefined') return 0;
  const cutoff = Date.now() - ttlDays * 24 * 60 * 60 * 1000;
  let prunedCount = 0;

  // 清理 LocalStorage 过期条目
  if (typeof window.localStorage !== 'undefined') {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (k && k.startsWith(FALLBACK_STORAGE_PREFIX)) {
          const raw = window.localStorage.getItem(k);
          if (raw) {
            try {
              const item = JSON.parse(raw) as FormSnapshotRecord;
              if (item.updatedAt < cutoff) {
                keysToRemove.push(k);
              }
            } catch {
              keysToRemove.push(k);
            }
          }
        }
      }
      keysToRemove.forEach((k) => {
        window.localStorage.removeItem(k);
        prunedCount++;
      });
    } catch {}
  }

  // 清理 IndexedDB 过期条目
  if (isIndexedDBAvailable() && !useLocalStorageFallback) {
    try {
      const db = await openDatabase();
      const expiredRoutes = await new Promise<string[]>((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();
        req.onsuccess = () => {
          const items = (req.result as FormSnapshotRecord[]) || [];
          const expired = items.filter((item) => item.updatedAt < cutoff).map((i) => i.route);
          resolve(expired);
        };
        req.onerror = () => resolve([]);
      });

      if (expiredRoutes.length > 0) {
        await new Promise<void>((resolve) => {
          const tx = db.transaction(STORE_NAME, 'readwrite');
          const store = tx.objectStore(STORE_NAME);
          expiredRoutes.forEach((route) => store.delete(route));
          tx.oncomplete = () => resolve();
          tx.onerror = () => resolve();
        });
        prunedCount += expiredRoutes.length;
      }
    } catch {}
  }

  return prunedCount;
}
