import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import crypto from 'crypto';

const REVALIDATE_SECRET = process.env.REVALIDATE_SECRET || 'isr-secret-token-2026';

function safeCompare(a?: string | null, b?: string | null): boolean {
  if (!a || !b) return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function verifyJwtAdmin(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const [headerB64, payloadB64, signatureB64] = parts;

    const payloadJson = Buffer.from(payloadB64, 'base64url').toString('utf-8');
    const payload = JSON.parse(payloadJson);
    const role = payload.role;
    if (role !== 'ADMIN' && role !== 'ROLE_ADMIN') return false;

    if (payload.exp && payload.exp * 1000 < Date.now()) return false;

    const secret = process.env.JWT_SECRET || '404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970';
    const key = Buffer.from(secret, 'base64');
    const expectedSig = crypto
      .createHmac('sha256', key)
      .update(`${headerB64}.${payloadB64}`)
      .digest('base64url');

    return safeCompare(signatureB64, expectedSig);
  } catch {
    return false;
  }
}

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.REVALIDATE_SECRET || 'isr-secret-token-2026';

  // 1. 检查请求头 x-revalidate-secret
  const headerSecret = request.headers.get('x-revalidate-secret');
  if (headerSecret && safeCompare(headerSecret, secret)) {
    return true;
  }

  // 2. 检查 Query 参数 ?secret=
  const { searchParams } = new URL(request.url);
  const querySecret = searchParams.get('secret');
  if (querySecret && safeCompare(querySecret, secret)) {
    return true;
  }

  // 3. 检查 Authorization Bearer Token (仅接受 REVALIDATE_SECRET 或合法的 ADMIN JWT 凭据)
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    if (token) {
      if (safeCompare(token, secret)) {
        return true;
      }
      if (verifyJwtAdmin(token)) {
        return true;
      }
    }
  }

  return false;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { code: 401, message: '未授权：非法 ISR Revalidation 凭据或密钥无效' },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const path = searchParams.get('path');
  const tag = searchParams.get('tag');

  if (!path && !tag) {
    return NextResponse.json(
      { code: 400, message: '缺少 path 或 tag 参数，无法执行 ISR 缓存刷新' },
      { status: 400 }
    );
  }

  try {
    if (tag) {
      revalidateTag(tag);
    }
    if (path) {
      if (path === 'layout' || path === 'all') {
        revalidatePath('/', 'layout');
      } else {
        revalidatePath(path);
        // 如果刷新了博客或主页，级联刷新 posts 标签与 layout 树
        if (path.includes('blog') || path === '/' || path.includes('post')) {
          try {
            revalidateTag('posts');
            revalidatePath('/', 'layout');
          } catch {}
        }
      }
    }
    const now = Date.now();
    return NextResponse.json({
      code: 200,
      message: 'ISR 缓存刷新成功',
      data: {
        revalidated: true,
        path,
        tag,
        timestamp: now,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { code: 500, message: 'Error revalidating', error: err.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { code: 401, message: '未授权：非法 ISR Revalidation 凭据或密钥无效' },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const queryPath = searchParams.get('path');
    const queryTag = searchParams.get('tag');
    const body = await request.json().catch(() => ({}));
    const path = queryPath || body?.path;
    const tag = queryTag || body?.tag;

    if (!path && !tag) {
      return NextResponse.json(
        { code: 400, message: '缺少 path 或 tag 参数，无法执行 ISR 缓存刷新' },
        { status: 400 }
      );
    }

    if (tag) {
      revalidateTag(tag);
    }
    if (path) {
      if (path === 'layout' || path === 'all') {
        revalidatePath('/', 'layout');
      } else {
        revalidatePath(path);
        if (path.includes('blog') || path === '/' || path.includes('post')) {
          try {
            revalidateTag('posts');
            revalidatePath('/', 'layout');
          } catch {}
        }
      }
    }
    const now = Date.now();
    return NextResponse.json({
      code: 200,
      message: 'ISR 缓存刷新成功',
      data: {
        revalidated: true,
        path,
        tag,
        timestamp: now,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { code: 500, message: 'Error revalidating', error: err.message },
      { status: 500 }
    );
  }
}
