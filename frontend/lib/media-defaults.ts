/**
 * 全站统一媒体兜底资源 (AGENTS.md 铁律 2: 展示内容 100% 后台可管理)
 *
 * 历史问题：全站 11+ 处硬编码 images.unsplash.com 外链作为默认头像/封面，
 * 违反「后台可管理 + 云端对象存储优先」原则且存在外链失效风险。
 * 现统一收敛为本地静态占位资源，业务数据缺省时由此兜底。
 */

/** 用户/站长头像兜底（翡翠极光抽象人形剪影） */
export const DEFAULT_AVATAR = '/avatar-placeholder.svg';

/** 博文/项目/旅程封面兜底（曜石黑极光山峦） */
export const DEFAULT_COVER = '/cover-placeholder.svg';

/** 解析头像 URL：优先业务数据，缺省回退本地占位 */
export function resolveAvatar(avatar?: string | null): string {
  return avatar && avatar.trim() ? avatar : DEFAULT_AVATAR;
}

/** 解析封面 URL：优先业务数据，缺省回退本地占位 */
export function resolveCover(cover?: string | null): string {
  return cover && cover.trim() ? cover : DEFAULT_COVER;
}
