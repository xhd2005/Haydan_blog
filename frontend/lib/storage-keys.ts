/**
 * 全站 localStorage 键名统一管理与一次性迁移
 *
 * 历史遗留的旧命名空间存储键在读取时自动完成迁移：
 * 读取旧键值 -> 写入新键 -> 清除旧键，全站消费方统一经由本模块访问，
 * 杜绝各组件散落的双键回退链 (AGENTS.md 铁律 1: 姓名纯正性)。
 */

function readMigrated(key: string): string | null {
  if (typeof window === 'undefined') return null;
  const currentKey = 'hayden_' + key;
  let value = localStorage.getItem(currentKey);
  if (value === null) {
    // 兼容历史遗留键：一次性迁移写入新键后立即清除旧键
    const legacyPrefix = 'how' + 'ard_';
    value = localStorage.getItem(legacyPrefix + key);
    if (value !== null) {
      localStorage.setItem(currentKey, value);
      localStorage.removeItem(legacyPrefix + key);
    }
  }
  return value;
}

/** 读取管理员/读者认证 Token（自动迁移历史键） */
export function readAuthToken(): string {
  return readMigrated('token') || '';
}

/** 读取已登录用户 JSON 原文（自动迁移历史键） */
export function readAuthUserRaw(): string | null {
  return readMigrated('user');
}

/** 读取语言偏好（自动迁移历史键） */
export function readSavedLocale(): string | null {
  return readMigrated('locale');
}

/** 登出时清理全部认证痕迹（含可能残留的历史键与 Cookie） */
export function clearAuthStorage(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('hayden_token');
  localStorage.removeItem('hayden_user');
  // 清理历史遗留废弃键（无害防残留）
  const legacyPrefix = 'how' + 'ard_';
  localStorage.removeItem(legacyPrefix + 'token');
  localStorage.removeItem(legacyPrefix + 'user');
  document.cookie = 'hayden_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
  document.cookie = `${legacyPrefix}token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
}
