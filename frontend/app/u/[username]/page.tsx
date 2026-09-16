import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { api } from '@/lib/api';
import { SafeImage } from '@/components/SafeImage';
import { DEFAULT_AVATAR } from '@/lib/media-defaults';
import { StardateBadge } from '@/components/ui/StardateBadge';
import { getServerTranslation } from '@/lib/i18n-server';
import {
  MessageSquareQuote,
  Heart,
  Calendar,
  User,
  BookOpen,
  Compass,
  Camera,
  ArrowRight,
  Github,
  Globe,
  Award,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  FolderGit2
} from 'lucide-react';
import type { Metadata } from 'next';

interface PublicUserPageProps {
  params: { username: string };
}

export async function generateMetadata({ params }: PublicUserPageProps): Promise<Metadata> {
  const username = decodeURIComponent(params.username);
  return {
    title: `@${username} | Hayden Xue Digital Garden`,
    description: `Public profile and community footprints of @${username} in Hayden Xue's digital garden.`,
  };
}

export const revalidate = 60;

/** 评论目标类型 → 目的地路由与展示文案 */
function targetMeta(targetType: string, locale: string) {
  const isEn = locale === 'en';
  switch ((targetType || '').toUpperCase()) {
    case 'POST':
      return { href: '/blog', label: isEn ? 'Article' : '博文', Icon: BookOpen, color: 'text-emerald-600 dark:text-emerald-400' };
    case 'JOURNEY':
      return { href: '/journey', label: isEn ? 'Journey' : '游记', Icon: Compass, color: 'text-cyan-600 dark:text-cyan-400' };
    case 'MEMO':
      return { href: '/memos', label: isEn ? 'Memo' : '随记', Icon: Camera, color: 'text-rose-600 dark:text-rose-400' };
    case 'PROJECT':
      return { href: '/projects', label: isEn ? 'Project' : '项目', Icon: FolderGit2, color: 'text-indigo-600 dark:text-indigo-400' };
    default:
      return { href: '/', label: isEn ? 'Garden' : '花园', Icon: BookOpen, color: 'text-teal-600 dark:text-teal-400' };
  }
}

export default async function PublicUserPage({ params }: PublicUserPageProps) {
  const { locale, t } = getServerTranslation();
  const isEn = locale === 'en';
  const username = decodeURIComponent(params.username);

  let data: Awaited<ReturnType<typeof api.getPublicUserProfile>> | null = null;
  try {
    data = await api.getPublicUserProfile(username, 1, 30);
  } catch {
    notFound();
  }
  if (!data) notFound();

  const { profile, comments, likeCount } = data;
  const commentTotal = comments?.total ?? 0;
  const isSiteOwner =
    profile.username?.toLowerCase() === 'admin' ||
    profile.nickname === 'Hayden Xue';

  // 读者勋章成就计算
  const badges = [
    {
      id: 'init',
      name: isEn ? 'Spark Pioneer' : '星火初绽',
      desc: isEn ? 'Joined digital garden' : '加入数字花园并启程探索',
      unlocked: true,
      icon: Sparkles,
      color: 'text-amber-500 bg-amber-500/10 border-amber-500/30',
    },
    {
      id: 'voice',
      name: isEn ? 'Voice of Reason' : '思辨之声',
      desc: isEn ? 'Published comments' : '发表过思考评论',
      unlocked: commentTotal > 0,
      icon: MessageSquareQuote,
      color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30',
    },
    {
      id: 'explorer',
      name: isEn ? 'Cosmic Explorer' : '星际探索者',
      desc: isEn ? 'Liked garden creations' : '点亮过花园心动喜欢',
      unlocked: likeCount >= 3,
      icon: Heart,
      color: 'text-rose-500 bg-rose-500/10 border-rose-500/30',
    },
    {
      id: 'architect',
      name: isSiteOwner ? (isEn ? 'Garden Architect' : '花园建造者') : (isEn ? 'Garden Contributor' : '社区共建者'),
      desc: isSiteOwner ? (isEn ? 'Master Architect of Garden' : '数字花园总工程师') : (isEn ? 'Engaged community member' : '深度参与花园共建'),
      unlocked: isSiteOwner || commentTotal >= 5 || likeCount >= 10,
      icon: Award,
      color: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/30',
    },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-10 py-6">
      {/* 1. 用户名片（极光描边头像 + 星历档案 + 社交外链） */}
      <section className="relative overflow-hidden p-8 sm:p-10 rounded-3xl paper-card border border-slate-200/80 dark:border-white/[0.08]">
        <div className="pointer-events-none absolute -top-24 -right-24 w-64 h-64 rounded-full bg-emerald-500/10 dark:bg-emerald-400/[0.07] blur-[80px]" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" aria-hidden="true" />

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
          <div className="relative shrink-0">
            <div className={`absolute -inset-1 rounded-3xl opacity-60 blur-sm ${
              isSiteOwner 
                ? 'bg-gradient-to-tr from-amber-500 via-emerald-400 to-cyan-500' 
                : 'bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-500'
            }`} aria-hidden="true" />
            <SafeImage
              src={profile.avatar || DEFAULT_AVATAR}
              alt={profile.nickname || profile.username}
              aspectRatio="1/1"
              containerClassName="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden border-2 border-background shadow-lg"
            />
            <span className="absolute -bottom-1.5 -right-1.5 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 motion-reduce:animate-none" />
              <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-background shadow-[0_0_8px_#10b981]" />
            </span>
          </div>

          <div className="flex-1 space-y-3 text-center sm:text-left">
            <div className="space-y-1">
              <div className="flex items-center justify-center sm:justify-start gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                  {profile.nickname || profile.username}
                </h1>
                {isSiteOwner ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    HAYDEN XUE // 站长
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-secondary text-muted-foreground border border-border">
                    {isEn ? 'READER' : '探索读者'}
                  </span>
                )}
              </div>
              <p className="text-sm font-mono text-muted-foreground">@{profile.username}</p>
            </div>

            {/* 个人简介 Bio */}
            {profile.bio && (
              <p className="text-xs text-foreground/80 leading-relaxed max-w-xl">
                {profile.bio}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
              <StardateBadge date={profile.createdAt} />
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-mono bg-secondary text-muted-foreground border border-border">
                <Calendar className="w-3 h-3" />
                {isEn ? 'Joined' : '加入于'} {profile.createdAt?.split('T')[0] || '—'}
              </span>

              {/* 社交链接 */}
              {profile.github && (
                <a
                  href={profile.github.startsWith('http') ? profile.github : `https://${profile.github}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-mono bg-secondary/80 hover:bg-secondary text-muted-foreground hover:text-foreground border border-border transition-colors"
                >
                  <Github className="w-3 h-3" />
                  GitHub
                </a>
              )}
              {profile.website && (
                <a
                  href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-mono bg-secondary/80 hover:bg-secondary text-muted-foreground hover:text-primary border border-border transition-colors"
                >
                  <Globe className="w-3 h-3" />
                  Website
                </a>
              )}
            </div>

            {/* 社区数据统计 */}
            <div className="flex items-center justify-center sm:justify-start gap-6 pt-2">
              <div className="text-center sm:text-left">
                <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">{commentTotal}</p>
                <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                  {isEn ? 'Comments' : '公开评论'}
                </p>
              </div>
              <div className="text-center sm:text-left">
                <p className="text-xl font-extrabold text-rose-500">{likeCount}</p>
                <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                  {isEn ? 'Likes' : '点亮喜欢'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. 读者星历与社区勋章成就栏 */}
      <section className="bg-slate-50/50 dark:bg-white/[0.02] border border-border/80 rounded-3xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {isEn ? 'Garden Badges & Honors' : '星历勋章与社区荣誉'}
            </h2>
          </div>
          <span className="text-[11px] font-mono text-muted-foreground">
            {badges.filter((b) => b.unlocked).length} / {badges.length} {isEn ? 'Unlocked' : '已点亮'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {badges.map((b) => {
            const Icon = b.icon;
            return (
              <div
                key={b.id}
                className={`p-3 rounded-2xl border transition-all flex flex-col justify-between ${
                  b.unlocked
                    ? 'bg-card border-border/80 shadow-xs'
                    : 'bg-secondary/30 border-dashed border-border/60 opacity-50 grayscale'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className={`p-1.5 rounded-xl border ${b.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  {b.unlocked && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                </div>
                <div>
                  <h3 className="text-xs font-bold text-foreground truncate">{b.name}</h3>
                  <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{b.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. 公开评论足迹时间线 */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <MessageSquareQuote className="w-4 h-4 text-emerald-500" />
            <h2 className="text-lg font-bold text-foreground">
              {isEn ? 'Community Footprints' : '社区公开足迹'}
            </h2>
          </div>
          <span className="text-xs font-mono text-muted-foreground">
            {commentTotal} {isEn ? 'records' : '条记录'}
          </span>
        </div>

        {comments.records.length > 0 ? (
          <div className="space-y-3">
            {comments.records.map((c, idx) => {
              const meta = targetMeta(c.targetType, locale);
              return (
                <div
                  key={idx}
                  className="group flex items-start gap-3.5 p-4 rounded-2xl paper-card transition-all hover:-translate-y-0.5 hover:shadow-md border border-slate-200/80 dark:border-white/[0.08]"
                >
                  <div className={`p-2 rounded-xl bg-secondary shrink-0 ${meta.color}`}>
                    <meta.Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-muted-foreground">
                      <span className={`font-semibold ${meta.color}`}>{meta.label}</span>
                      <span>{c.createdAt?.replace('T', ' ').slice(0, 16)}</span>
                    </div>
                    <p className="text-sm text-foreground/90 leading-relaxed line-clamp-3">
                      {c.content}
                    </p>
                  </div>
                  <Link
                    href={meta.href}
                    className="self-center p-1.5 rounded-lg text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10 transition-colors shrink-0"
                    title={isEn ? 'Go to section' : '前往对应板块'}
                  >
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-14 text-center text-muted-foreground border border-dashed border-border rounded-2xl space-y-2">
            <User className="w-7 h-7 mx-auto opacity-40" />
            <p className="text-sm">
              {isEn ? 'No public footprints yet. The garden awaits their first thought.' : '还没有公开足迹，花园静候第一条思考。'}
            </p>
          </div>
        )}
      </section>

      {/* 4. 返回花园 */}
      <div className="text-center pt-2">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-emerald-500 transition-colors"
        >
          {isEn ? 'Continue exploring the garden' : '继续探索数字花园'}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
