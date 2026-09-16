/**
 * 全站统一媒体 URL 规范化与类型识别工具库 (AGENTS.md 铁律 5: 云端对象存储优先)
 */

const PUBLIC_MINIO_DEFAULT = 'http://49.233.166.212:9000';

/**
 * 规范化媒体资产 URL
 * 1. 自动将容器内网主机名 (如 1Panel-minio-nnF3:9000) 映射为当前客户端可访问的公网 MinIO 地址；
 * 2. 避免客户端浏览器因解析不了内网 Docker DNS 产生 ERR_NAME_NOT_RESOLVED 黑屏；
 * 3. 自动将开发期残留的 localhost:9000 在外部访问时替换为真实服务器 IP。
 */
export function normalizeMediaUrl(url?: string | null): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  let publicBase = process.env.NEXT_PUBLIC_MINIO_URL || PUBLIC_MINIO_DEFAULT;

  if (typeof window !== 'undefined' && window.location && window.location.hostname) {
    const host = window.location.hostname;
    const protocol = window.location.protocol || 'http:';
    // 如果当前是通过公网 IP 或域名访问，优先取当前域名/IP的 9000 端口并保持同协议
    if (host !== 'localhost' && host !== '127.0.0.1') {
      publicBase = `${protocol}//${host}:9000`;
    }
  }

  // 1. 匹配 1Panel-minio-nnF3:9000 (容器主机名)
  if (trimmed.includes('1Panel-minio-nnF3:9000')) {
    return trimmed.replace(/http:\/\/1Panel-minio-nnF3:9000/g, publicBase);
  }

  // 2. 客户端外部访问时匹配 localhost:9000 或 127.0.0.1:9000
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    if (trimmed.includes('localhost:9000')) {
      return trimmed.replace(/http:\/\/localhost:9000/g, publicBase);
    }
    if (trimmed.includes('127.0.0.1:9000')) {
      return trimmed.replace(/http:\/\/127\.0\.0\.1:9000/g, publicBase);
    }
  }

  // 3. 针对 Unsplash 原生 CDN 进行参数轻量化加速 (直连官方极速 CDN，杜绝国外被墙代理 wsrv.nl)
  if (trimmed.startsWith('https://images.unsplash.com/') || trimmed.startsWith('http://images.unsplash.com/')) {
    const rawClean = trimmed.replace(/^http:\/\//, 'https://');
    if (!rawClean.includes('auto=format')) {
      const sep = rawClean.includes('?') ? '&' : '?';
      return `${rawClean}${sep}auto=format&fit=crop&w=1200&q=80`;
    }
    return rawClean;
  }

  // 4. 针对阿里云 OSS 默认域名 (*.aliyuncs.com) 自动映射为服务端极速流媒体代理
  // 解决阿里云官方对默认域名强制返回 Content-Disposition: attachment 导致浏览器强行下载与无法作为网页图片内联显示的限制
  const ossMatch = trimmed.match(/^https?:\/\/[a-z0-9-]+\.(?:oss|s3\.oss)-[a-z0-9-]+\.aliyuncs\.com\/(.+)$/i);
  if (ossMatch && ossMatch[1]) {
    return `/api/media/view/${ossMatch[1]}`;
  }

  return trimmed;
}

/**
 * 判断媒体是否为图片 (MIME + 后缀名双重智能识别)
 */
export function isImageMedia(mimeType?: string | null, url?: string | null): boolean {
  if (mimeType && mimeType.toLowerCase().startsWith('image/')) return true;
  if (!url) return false;
  const cleanUrl = url.split('?')[0].split('#')[0].toLowerCase();
  return /\.(png|jpe?g|webp|gif|svg|avif|bmp|ico|tiff?)$/.test(cleanUrl);
}

/**
 * 判断媒体是否为视频 (MIME + 后缀名双重智能识别)
 */
export function isVideoMedia(mimeType?: string | null, url?: string | null): boolean {
  if (mimeType && mimeType.toLowerCase().startsWith('video/')) return true;
  if (!url) return false;
  const cleanUrl = url.split('?')[0].split('#')[0].toLowerCase();
  return /\.(mp4|webm|ogg|mov|m4v|avi|mkv|flv)$/.test(cleanUrl);
}
