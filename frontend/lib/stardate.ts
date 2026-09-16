/**
 * 星历编号工具（星际远航 IP 视觉记忆点）
 *
 * 将内容发布日期与 ID 转化为任务档案式编号：
 * - STARDATE：星历日期（YYYY.MM.DD）
 * - LOG №：任务日志序号（三位补零）
 */

/** 生成星历日期字符串，如 STARDATE 2026.09.09 */
export function formatStardate(dateInput?: string | Date | null): string {
  const d = dateInput ? new Date(dateInput) : new Date();
  if (isNaN(d.getTime())) return 'STARDATE —';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `STARDATE ${y}.${m}.${day}`;
}

/** 生成任务日志序号，如 LOG №007 */
export function formatLogNo(id?: number | string | null): string {
  if (id === undefined || id === null || id === '') return 'LOG №000';
  const n = String(id).replace(/\D/g, '') || '0';
  return `LOG №${n.padStart(3, '0')}`;
}
