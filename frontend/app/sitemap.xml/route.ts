import { api } from '@/lib/api';

export const revalidate = 3600;

export async function GET() {
  const [postsData, projects, journeys] = await Promise.all([
    api.getPosts({ page: 1, pageSize: 100 }).catch(() => ({ records: [] })),
    api.getProjects().catch(() => []),
    api.getJourneys().catch(() => []),
  ]);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const now = new Date().toISOString();

  const staticPages = ['', '/about', '/blog', '/projects', '/journey', '/now', '/memos', '/links'];

  const staticUrls = staticPages
    .map(
      (path) => `
    <url>
      <loc>${siteUrl}${path}</loc>
      <lastmod>${now}</lastmod>
      <changefreq>daily</changefreq>
      <priority>${path === '' ? '1.0' : '0.8'}</priority>
    </url>`
    )
    .join('');

  const postUrls = (postsData.records || [])
    .map(
      (p) => `
    <url>
      <loc>${siteUrl}/blog/${p.slug}</loc>
      <lastmod>${p.updatedAt || now}</lastmod>
      <changefreq>weekly</changefreq>
      <priority>0.7</priority>
    </url>`
    )
    .join('');

  const projectUrls = projects
    .map(
      (p) => `
    <url>
      <loc>${siteUrl}/projects/${p.slug}</loc>
      <lastmod>${p.updatedAt || now}</lastmod>
      <changefreq>monthly</changefreq>
      <priority>0.6</priority>
    </url>`
    )
    .join('');

  const journeyUrls = journeys
    .map(
      (j) => `
    <url>
      <loc>${siteUrl}/journey/${j.slug}</loc>
      <lastmod>${j.updatedAt || now}</lastmod>
      <changefreq>monthly</changefreq>
      <priority>0.6</priority>
    </url>`
    )
    .join('');

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${staticUrls}
  ${postUrls}
  ${projectUrls}
  ${journeyUrls}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
}
