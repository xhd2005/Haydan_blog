import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js Edge Middleware 服务端路由与鉴权拦截
 *
 * 核心目标：
 * 1. 对 /admin/:path* 路径进行服务端级别 302 拦截与重定向；
 * 2. 杜绝未鉴权访问时的客户端白屏闪烁 (FOUC) 与前端敏感后台代码包提前水合泄露；
 * 3. 严格解析 JWT Payload 校验角色，阻断普通读者越权访问管理后台。
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 提取认证 Token (优先 Cookie，其次 Authorization Header)
  let token =
    request.cookies.get('hayden_token')?.value ||
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ||
    '';

  if (token) {
    try {
      token = decodeURIComponent(token);
    } catch {}
  }

  // 登录页处理：若已有合法的有效超管 Token，直接跳转进入管理大盘
  if (pathname === '/admin/login') {
    if (token) {
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const base64Url = parts[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(
            atob(base64)
              .split('')
              .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
              .join('')
          );
          const payload = JSON.parse(jsonPayload);
          if (!payload.exp || Date.now() < payload.exp * 1000) {
            const role = (payload.role || (Array.isArray(payload.roles) ? payload.roles[0] : '') || '').toUpperCase();
            if (role === 'ROLE_ADMIN' || role === 'ADMIN' || payload.sub === 'admin') {
              return NextResponse.redirect(new URL('/admin/dashboard', request.url), 302);
            }
          }
        }
      } catch {}
    }
    return NextResponse.next();
  }

  // 根路径 /admin 访问自动重定向至仪表盘
  if (pathname === '/admin' || pathname === '/admin/') {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url), 302);
  }

  if (!token) {
    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl, 302);
  }

  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl, 302);
    }

    // Base64URL 解码 (Edge Runtime 兼容)
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const payload = JSON.parse(jsonPayload);

    // 检查 Token 过期时间
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl, 302);
    }

    // 检查管理员角色 (大小写不敏感兼容)
    const role = (payload.role || (Array.isArray(payload.roles) ? payload.roles[0] : '') || '').toUpperCase();
    const isAdmin = role === 'ROLE_ADMIN' || role === 'ADMIN' || payload.sub === 'admin';

    if (!isAdmin) {
      // 普通读者或非法越权角色，立即 302 驱逐至前台首页
      return NextResponse.redirect(new URL('/', request.url), 302);
    }

    return NextResponse.next();
  } catch {
    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl, 302);
  }
}

export const config = {
  matcher: ['/admin/:path*'],
};
