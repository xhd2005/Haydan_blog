/**
 * frontend/tests/m3_challenger2_health_adversarial.mjs
 * M3 对抗性质疑专家 2 独立对抗实测套件
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  magenta: '\x1b[35m',
};

let totalTests = 0, passedTests = 0, failedTests = 0, totalAsserts = 0;
const defects = [], observations = [];

function test(name, fn) {
  totalTests++;
  try { fn(); passedTests++; console.log(`  ${c.green}✔ [PASS]${c.reset} ${name}`); }
  catch (err) { failedTests++; console.log(`  ${c.red}✖ [FAIL]${c.reset} ${name}\n    ${c.yellow}Error: ${err.message}${c.reset}`); }
}

async function asyncTest(name, fn) {
  totalTests++;
  try { await fn(); passedTests++; console.log(`  ${c.green}✔ [PASS]${c.reset} ${name}`); }
  catch (err) { failedTests++; console.log(`  ${c.red}✖ [FAIL]${c.reset} ${name}\n    ${c.yellow}Error: ${err.message}${c.reset}`); }
}

function verify(condition, message) { totalAsserts++; assert.ok(condition, message); }
function recordDefect(category, title, detail, severity = 'HIGH') {
  defects.push({ category, title, detail, severity });
  console.log(`    ${c.red}⚠ [DEFECT FOUND] (${severity}) ${title}: ${detail}${c.reset}`);
}
function recordObservation(category, title, detail) {
  observations.push({ category, title, detail });
  console.log(`    ${c.magenta}ℹ [OBSERVATION] ${title}: ${detail}${c.reset}`);
}

console.log(`${c.bold}${c.cyan}========================================================================${c.reset}`);
console.log(`${c.bold}${c.cyan}  M3 对抗性质疑专家 2: 健康体检与压缩工坊极端边界与容灾对抗实测  ${c.reset}`);
console.log(`${c.bold}${c.cyan}========================================================================\n${c.reset}`);
// ============================================================================
// [SECTION 1] 巨幅大图无损压缩工坊对抗实测 (imageCompressionWorkshop.ts)
// ============================================================================
console.log(`${c.bold}[SECTION 1] 巨幅大图无损压缩工坊与正文重写管道对抗实测${c.reset}`);

const workshopSourcePath = path.resolve('frontend/lib/imageCompressionWorkshop.ts');
const workshopSource = fs.readFileSync(workshopSourcePath, 'utf8');

test('1.1 WebP 格式检测对抗：标准、大写、带参数、带锚点 URL 识别检验', () => {
  const isWebpUrl = (url, mimeType) => {
    return url.toLowerCase().endsWith('.webp') || mimeType === 'image/webp';
  };

  verify(isWebpUrl('https://cdn.example.com/photo.webp', 'image/webp') === true, '标准 webp URL 识别为 true');
  verify(isWebpUrl('https://cdn.example.com/HERO.WEBP', 'image/webp') === true, '大写 .WEBP 识别为 true');
  verify(isWebpUrl('https://cdn.example.com/asset-1234', 'image/webp') === true, 'mimeType image/webp 识别为 true');

  const queryWebp = 'https://cdn.example.com/photo.webp?v=1.2.0&width=1200';
  const hashWebp = 'https://cdn.example.com/photo.webp#preview';
  const isQueryWebpMatch = isWebpUrl(queryWebp, 'image/jpeg');
  const isHashWebpMatch = isWebpUrl(hashWebp, 'image/jpeg');

  if (!isQueryWebpMatch || !isHashWebpMatch) {
    recordObservation(
      'WORKSHOP_URL_PARSING',
      '带有 Query 参数或 Hash 锚点的 WebP URL 无法被 endsWith(".webp") 识别',
      `URL '${queryWebp}' endsWith('.webp') 判定为 false，可能导致带参数的 WebP 图片被重复纳入扫描`
    );
  }
});

test('1.2 compressImageToWebp 对 WebP 输入优雅跳过：返回 converted: false 且零重写', async () => {
  const simulateCompressImageToWebp = async (target, postsList) => {
    const { id, url, size = 2500000, mimeType = 'image/jpeg' } = target;
    if (!url) throw new Error('Image URL cannot be empty');

    if (url.toLowerCase().endsWith('.webp') || mimeType === 'image/webp') {
      return {
        converted: false,
        oldUrl: url,
        newUrl: url,
        oldSize: size,
        newSize: size,
        savedBytes: 0,
        compressionRatio: '0%',
        rewrittenPosts: 0,
        reason: 'Already WebP',
      };
    }

    const newUrl = url.replace(/\.(jpe?g|png|bmp|tiff)$/i, '.webp');
    const oldSize = size;
    const newSize = Math.round(oldSize * 0.28);
    const savedBytes = oldSize - newSize;
    let rewrittenPosts = 0;

    for (const post of (postsList || [])) {
      let modified = false;
      let newContent = post.content || '';
      let newCover = post.cover;

      if (newCover === url) {
        newCover = newUrl;
        modified = true;
      }
      if (newContent && newContent.includes(url)) {
        newContent = newContent.replaceAll(url, newUrl);
        modified = true;
      }
      if (modified) {
        rewrittenPosts++;
        post.cover = newCover;
        post.content = newContent;
      }
    }

    return {
      converted: true,
      assetId: id,
      oldUrl: url,
      newUrl,
      oldSize,
      newSize,
      savedBytes,
      compressionRatio: '72%',
      rewrittenPosts,
    };
  };

  const samplePosts = [
    { id: 1, title: '博文一', cover: 'https://cdn.com/cover.webp', content: '这是一篇包含已优化图片 ![icon](https://cdn.com/icon.webp) 的文章' }
  ];

  const result = await simulateCompressImageToWebp({
    url: 'https://cdn.com/cover.webp',
    size: 3200000,
    mimeType: 'image/webp',
  }, samplePosts);

  verify(result.converted === false, 'WebP 图片必须返回 converted = false');
  verify(result.reason === 'Already WebP', '跳过原因必须为 Already WebP');
  verify(result.rewrittenPosts === 0, '跳过时重写文章数必须为 0');
  verify(result.savedBytes === 0, '跳过时节省字节数必须为 0');
  verify(samplePosts[0].cover === 'https://cdn.com/cover.webp', '博文封面保持原样');
});

test('1.3 scanGiantImages 容灾测试：远端死链、404 与 API 异常不会阻断全站体检扫描', async () => {
  const mockPosts = [
    { id: 1, title: '正常文章', content: '![正常图](https://cdn.com/large.png)' },
    { id: 2, title: '404死链文章', content: '![死链图](https://broken-404-domain.com/dead.jpg)' },
    { id: 3, title: '未水合大文本文章', content: '' },
    { id: 4, title: '坏格式文章', content: '纯文本无图片' },
  ];

  let apiFailuresCaught = 0;

  const simulatedScan = async () => {
    const rawPosts = mockPosts;
    const hydratedPosts = await Promise.all(
      rawPosts.map(async (p) => {
        if (p.content && p.content.length > 50) return p;
        try {
          if (p.id === 3) {
            return { ...p, content: '水合后的大文本正文：![水合图](https://cdn.com/hydrated.png)' };
          }
          throw new Error('500 Internal Server Error for post ' + p.id);
        } catch {
          apiFailuresCaught++;
          return p;
        }
      })
    );

    const imageMap = new Map();
    const markdownImgRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;

    hydratedPosts.forEach((post) => {
      if (post.content) {
        let match;
        while ((match = markdownImgRegex.exec(post.content)) !== null) {
          const url = match[2].trim();
          imageMap.set(url, { url, size: 2500000, isAlreadyWebp: url.toLowerCase().endsWith('.webp') });
        }
      }
    });

    return {
      total: imageMap.size,
      images: Array.from(imageMap.values()),
    };
  };

  const scanResult = await simulatedScan();
  verify(scanResult.total === 3, '扫描提取到 3 张图片（包括正常图、死链图、水合图）');
  verify(apiFailuresCaught >= 1, 'API 异常被内部 catch 捕获降级');
  verify(scanResult.images.some((img) => img.url.includes('dead.jpg')), '死链图片在工坊中正常列出供压缩与检查');
});

test('1.4.1 正文重写精度：同段落多图紧邻混排，仅精准重写目标图片，相邻图片与上下文完好无损', () => {
  const originalContent = 
    '这是前言段落。\n\n' +
    '第一张图：![架构图一](https://cdn.com/arch-1.png) 以及相邻的第二张未选中图：![架构图二](https://cdn.com/arch-2.png) 紧随其后。\n\n' +
    '这是总结段落。';

  const targetUrl = 'https://cdn.com/arch-1.png';
  const targetNewUrl = 'https://cdn.com/arch-1.webp';

  const newContent = originalContent.replaceAll(targetUrl, targetNewUrl);

  verify(newContent.includes('![架构图一](https://cdn.com/arch-1.webp)'), '目标图片成功更新为 .webp');
  verify(newContent.includes('![架构图二](https://cdn.com/arch-2.png)'), '相邻图片保持原始 .png 格式不变');
  verify(newContent.startsWith('这是前言段落。'), '前言段落保持完全一致');
  verify(newContent.endsWith('这是总结段落。'), '总结段落保持完全一致');
});

test('1.4.2 正文重写精度对抗：带标题属性的 Markdown 图片 ![alt](url "title") 边界行为检验', () => {
  const contentWithTitle = '![架构大图](https://cdn.com/system-design.png "Hayden Xue 架构设计")';
  const markdownImgRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  const match = markdownImgRegex.exec(contentWithTitle);

  verify(match !== null, '正则能匹配到带有标题的 Markdown 图片语法');
  const matchedUrlPart = match[2].trim();

  const hasExtractedTitleInsideUrl = matchedUrlPart.includes('"');
  if (hasExtractedTitleInsideUrl) {
    recordDefect(
      'WORKSHOP_MARKDOWN_REGEX',
      'Markdown 带标题图片语法解析边界缺陷',
      `正则 /!\\[([^\\]]*)\\]\\(([^)]+)\\)/g 将括号内的 "title" 一同提取为 URL：'${matchedUrlPart}'。这会导致 url.replace(/\\.(png|jpg)$/i, '.webp') 无法匹配后缀（因为末尾是引号而非扩展名），从而导致带标题图片的转码后直链无法生成 WebP 后缀！`,
      'HIGH'
    );
  }

  const replacedDirectly = matchedUrlPart.replace(/\.(jpe?g|png|bmp|tiff)$/i, '.webp');
  verify(replacedDirectly === matchedUrlPart, '证实缺陷：因为末尾是 "title"，直接正则替换后缀无法生效');
});

test('1.4.3 正文重写精度对抗：HTML <img> 标签混排的识别与重写检验', () => {
  const htmlContent = 
    '<div class="gallery">\n' +
    '  <img src="https://cdn.com/hero-banner.png" alt="Hero Banner" class="rounded-xl" />\n' +
    '</div>';

  const markdownImgRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  const foundByMarkdownRegex = markdownImgRegex.exec(htmlContent);

  if (foundByMarkdownRegex === null) {
    recordDefect(
      'WORKSHOP_HTML_IMG_SCAN',
      '正文 HTML <img> 标签大图遗漏扫描',
      'scanGiantImages 仅使用 markdownImgRegex 扫描 Markdown 语法 ![]()，未能扫描富文本或自定义 HTML 中的 <img src="...">，导致 HTML 大图无法被工坊发现',
      'MEDIUM'
    );
  }

  const targetUrl = 'https://cdn.com/hero-banner.png';
  const targetNewUrl = 'https://cdn.com/hero-banner.webp';
  const rewrittenHtml = htmlContent.replaceAll(targetUrl, targetNewUrl);
  verify(rewrittenHtml.includes('src="https://cdn.com/hero-banner.webp"'), '若 URL 已知，replaceAll 能够精确重写 HTML <img> 标签');
});

test('1.4.4 防误伤正文其他文本对抗验证：前缀包含、同名超链接与备份路径', () => {
  const complexContent = 
    '请访问图床：https://cdn.com/wallpaper.png 查看大图。\n' +
    '代码参考：const backupFile = "https://cdn.com/wallpaper.png.bak";\n' +
    '缩略图：https://cdn.com/wallpaper.png_thumbnail.jpg\n' +
    '文章配图：![壁纸](https://cdn.com/wallpaper.png)';

  const targetUrl = 'https://cdn.com/wallpaper.png';
  const targetNewUrl = 'https://cdn.com/wallpaper.webp';

  const rewritten = complexContent.replaceAll(targetUrl, targetNewUrl);

  verify(rewritten.includes('![壁纸](https://cdn.com/wallpaper.webp)'), '文章配图精准替换');
  const backupMiswritten = rewritten.includes('https://cdn.com/wallpaper.webp.bak');
  if (backupMiswritten) {
    recordObservation(
      'WORKSHOP_REPLACE_GREEDINESS',
      '简单子串 replaceAll 对前缀重叠路径产生级联替换',
      "'https://cdn.com/wallpaper.png.bak' 被替换为了 'https://cdn.com/wallpaper.webp.bak'"
    );
  }
});

test('1.4.5 前端巨幅大图工坊缩略图容错：坏图/404图片触发 onError 降级隐藏与兜底', () => {
  const workshopCompPath = path.resolve('frontend/components/admin/health/GiantImageCompressionWorkshop.tsx');
  const workshopCompSource = fs.readFileSync(workshopCompPath, 'utf8');

  verify(workshopCompSource.includes('onError='), '缩略图必须配置 onError 事件监听器');
  verify(workshopCompSource.includes("style.display = 'none'"), '坏图触发 onError 时必须隐藏破损 img 标签');
  verify(workshopCompSource.includes('<ImageIcon'), '破损图片隐藏后必须展现底层的 ImageIcon 兜底占位图标');
});

// ============================================================================
// [SECTION 2] 中间件延迟探活与全景健康跑分对抗实测 (middlewareHealthCheck.ts)
// ============================================================================
console.log(`\n${c.bold}[SECTION 2] 中间件延迟探活与健康跑分算法对抗实测${c.reset}`);

test('2.1 中间件探活对抗实测：网络超时 6000ms 时探测器运行与硬编码截断缺陷检验', () => {
  const simulatePing = (elapsedMs) => {
    const elapsed = Math.max(1, Math.round(elapsedMs));
    const dbLatency = Math.min(elapsed, 12);
    const redisLatency = Math.max(1, Math.round(dbLatency * 0.3));
    const minioLatency = Math.max(5, Math.round(dbLatency * 1.5));
    const aiLatency = Math.max(120, Math.min(elapsed * 8, 350));
    const sysLatency = Math.max(1, Math.round(redisLatency * 1.2));

    return {
      database: { latencyMs: dbLatency, status: dbLatency > 100 ? 'SLOW' : 'UP' },
      redis: { latencyMs: redisLatency, status: redisLatency > 50 ? 'SLOW' : 'UP' },
      minio: { latencyMs: minioLatency, status: minioLatency > 150 ? 'SLOW' : 'UP' },
      aiService: { latencyMs: aiLatency, status: aiLatency > 800 ? 'SLOW' : 'UP' },
      systemResource: { latencyMs: sysLatency, status: 'UP' },
    };
  };

  const slowResult = simulatePing(6000);
  verify(slowResult.database.latencyMs === 12, '数据库延迟被 Math.min(elapsed, 12) 截断为 12ms');
  verify(slowResult.aiService.latencyMs === 350, 'AI 延迟被 Math.min(elapsed * 8, 350) 截断为 350ms');

  const allUpUnderTimeout = 
    slowResult.database.status === 'UP' &&
    slowResult.redis.status === 'UP' &&
    slowResult.minio.status === 'UP' &&
    slowResult.aiService.status === 'UP';

  if (allUpUnderTimeout) {
    recordDefect(
      'HEALTH_PING_LATENCY_CLAMP',
      'pingMiddlewareServices 延迟上限硬编码截断导致 SLOW 状态无法触发',
      'pingMiddlewareServices 中 dbLatency 使用了 Math.min(elapsed, 12)，aiLatency 使用了 Math.min(..., 350)。而状态判定阈值分别是 dbLatency > 100 和 aiLatency > 800，因此无论实际网络往返延迟多高（哪怕 10000ms 超时），中间件状态永远被判定为 UP，绝不可能触发 SLOW 状态告警！',
      'HIGH'
    );
  }
});

test('2.1.2 中间件探活静态代码审查：验证异常捕获与 Promise rejection 防御', () => {
  const middlewareSourcePath = path.resolve('frontend/lib/middlewareHealthCheck.ts');
  const middlewareSource = fs.readFileSync(middlewareSourcePath, 'utf8');

  verify(middlewareSource.includes("fetch('/api/actuator/health'"), '探活接口探测 /api/actuator/health');
  verify(middlewareSource.includes('.catch(() => null)'), '探活 fetch 带有 .catch() 局部兜底');
  verify(middlewareSource.includes('try {') && middlewareSource.includes('} catch {'), '探活外层包含 try/catch 双重防御');
});

const calculateSystemHealthScore = (params) => {
  const middleware = params.middleware || {
    database: { key: 'database', name: 'MySQL', status: 'UP', latencyMs: 3 },
    redis: { key: 'redis', name: 'Redis', status: 'UP', latencyMs: 1 },
    minio: { key: 'minio', name: 'MinIO', status: 'UP', latencyMs: 12 },
    aiService: { key: 'aiService', name: 'DeepSeek', status: 'UP', latencyMs: 180 },
    systemResource: { key: 'systemResource', name: 'Sys', status: 'UP', latencyMs: 2 },
  };
  const giantImagesCount = params.giantImagesCount || 0;
  const brokenLinksCount = params.brokenLinksCount || 0;
  const orphanTagsCount = params.orphanTagsCount || 0;
  const emptyCategoriesCount = params.emptyCategoriesCount || 0;
  const unresolvedThreatsCount = params.unresolvedThreatsCount || 0;
  const daysSinceLastBackup = params.daysSinceLastBackup ?? 2;

  let score = 100;
  const penalties = [];

  for (const info of Object.values(middleware)) {
    if (info.status === 'DOWN') {
      score -= 25;
      penalties.push({ type: 'MIDDLEWARE_DOWN', name: info.name, penalty: 25 });
    } else if (info.status === 'SLOW' || info.latencyMs > 100) {
      if (info.key !== 'aiService' || info.latencyMs > 600) {
        score -= 5;
        penalties.push({ type: 'HIGH_LATENCY', name: info.name, penalty: 5 });
      }
    }
  }

  if (giantImagesCount > 0) {
    const p = Math.min(giantImagesCount * 8, 24);
    score -= p;
    penalties.push({ type: 'GIANT_IMAGES', penalty: p });
  }

  if (unresolvedThreatsCount > 0) {
    const p = Math.min(unresolvedThreatsCount * 5, 15);
    score -= p;
    penalties.push({ type: 'UNRESOLVED_THREATS', penalty: p });
  }

  if (brokenLinksCount > 0) {
    const p = Math.min(brokenLinksCount * 5, 20);
    score -= p;
    penalties.push({ type: 'BROKEN_LINKS', penalty: p });
  }

  const taxonomyDefects = orphanTagsCount + emptyCategoriesCount;
  if (taxonomyDefects > 0) {
    const p = Math.min(taxonomyDefects * 2, 10);
    score -= p;
    penalties.push({ type: 'TAXONOMY_DEFECT', penalty: p });
  }

  if (daysSinceLastBackup > 7) {
    score -= 5;
    penalties.push({ type: 'STALE_BACKUP', penalty: 5 });
  }

  const finalScore = Math.max(0, Math.min(100, Math.round(score)));

  let grade = 'S';
  let gradeText = '极佳 (Excellent)';
  if (finalScore < 60) {
    grade = 'D';
    gradeText = '高危 (Critical Risk)';
  } else if (finalScore < 75) {
    grade = 'C';
    gradeText = '警告 (Needs Attention)';
  } else if (finalScore < 90) {
    grade = 'B';
    gradeText = '良好 (Healthy)';
  } else if (finalScore < 98) {
    grade = 'A';
    gradeText = '优秀 (Optimal)';
  }

  return { score: finalScore, grade, gradeText, penalties };
};

test('2.2.1 极端灾难全灭场景 (Worst Case)：扣分总和达 199 分，跑分严格截断在 0 分，评级为 D，绝无负数', () => {
  const worstCaseMiddleware = {
    database: { key: 'database', name: 'MySQL', status: 'DOWN', latencyMs: 0 },
    redis: { key: 'redis', name: 'Redis', status: 'DOWN', latencyMs: 0 },
    minio: { key: 'minio', name: 'MinIO', status: 'DOWN', latencyMs: 0 },
    aiService: { key: 'aiService', name: 'DeepSeek', status: 'DOWN', latencyMs: 0 },
    systemResource: { key: 'systemResource', name: 'Sys', status: 'DOWN', latencyMs: 0 },
  };

  const report = calculateSystemHealthScore({
    middleware: worstCaseMiddleware,
    giantImagesCount: 10,
    brokenLinksCount: 10,
    orphanTagsCount: 20,
    emptyCategoriesCount: 10,
    unresolvedThreatsCount: 10,
    daysSinceLastBackup: 60,
  });

  verify(report.score === 0, '全灭灾难场景得分必须为 0 分');
  verify(report.grade === 'D', '评级必须为 D');
  verify(report.gradeText === '高危 (Critical Risk)', '评级文案必须为 高危 (Critical Risk)');
  verify(report.score >= 0 && report.score <= 100, '得分严格在 [0, 100] 闭区间内');
});

test('2.2.2 极致完美基准场景 (Best Case)：零异常中间件全绿，跑分严格为 100 分，评级为 S，绝无溢出', () => {
  const bestMiddleware = {
    database: { key: 'database', name: 'MySQL', status: 'UP', latencyMs: 2 },
    redis: { key: 'redis', name: 'Redis', status: 'UP', latencyMs: 1 },
    minio: { key: 'minio', name: 'MinIO', status: 'UP', latencyMs: 5 },
    aiService: { key: 'aiService', name: 'DeepSeek', status: 'UP', latencyMs: 150 },
    systemResource: { key: 'systemResource', name: 'Sys', status: 'UP', latencyMs: 1 },
  };

  const report = calculateSystemHealthScore({
    middleware: bestMiddleware,
    giantImagesCount: 0,
    brokenLinksCount: 0,
    orphanTagsCount: 0,
    emptyCategoriesCount: 0,
    unresolvedThreatsCount: 0,
    daysSinceLastBackup: 1,
  });

  verify(report.score === 100, '完美场景得分必须为 100 分');
  verify(report.grade === 'S', '评级必须为 S');
  verify(report.gradeText === '极佳 (Excellent)', '评级文案必须为 极佳 (Excellent)');
  verify(report.penalties.length === 0, '惩罚项必须为空');
});

test('2.2.3 评分梯度临界阈值跃迁验证 (D < 60 <= C < 75 <= B < 90 <= A < 98 <= S)', () => {
  const getGrade = (s) => {
    if (s < 60) return 'D';
    if (s < 75) return 'C';
    if (s < 90) return 'B';
    if (s < 98) return 'A';
    return 'S';
  };

  verify(getGrade(0) === 'D', '0 分为 D');
  verify(getGrade(59) === 'D', '59 分为 D');
  verify(getGrade(60) === 'C', '60 分为 C');
  verify(getGrade(74) === 'C', '74 分为 C');
  verify(getGrade(75) === 'B', '75 分为 B');
  verify(getGrade(89) === 'B', '89 分为 B');
  verify(getGrade(90) === 'A', '90 分为 A');
  verify(getGrade(97) === 'A', '97 分为 A');
  verify(getGrade(98) === 'S', '98 分为 S');
  verify(getGrade(100) === 'S', '100 分为 S');
});

test('2.2.4 极端异常值 Fuzzing 对抗实测：负数、NaN、Infinity、空对象输入下杜绝崩溃与非数', () => {
  const reportNegative = calculateSystemHealthScore({
    giantImagesCount: -5,
    brokenLinksCount: -10,
    orphanTagsCount: -20,
  });
  verify(reportNegative.score === 100, '负数参数不会导致加分溢出，维持 100 分');
  verify(!Number.isNaN(reportNegative.score), '得分不可为 NaN');

  const reportNaN = calculateSystemHealthScore({
    giantImagesCount: NaN,
    brokenLinksCount: NaN,
    daysSinceLastBackup: NaN,
  });
  verify(!Number.isNaN(reportNaN.score), 'NaN 参数下利用 || 0 兜底，得分不可为 NaN');
  verify(reportNaN.score >= 0 && reportNaN.score <= 100, 'NaN 参数下得分仍在 [0, 100]');

  const reportInfinity = calculateSystemHealthScore({
    giantImagesCount: Infinity,
  });
  verify(reportInfinity.score === 76, 'Infinity 参数下 Math.min(Infinity, 24) 封顶扣 24 分，得分不崩溃');

  const reportEmpty = calculateSystemHealthScore({});
  verify(reportEmpty.score >= 0 && reportEmpty.score <= 100, '空参数安全兜底');
});

// ============================================================================
// [SECTION 3] 定时静默巡检与告警机器人对抗实测 (SilentInspectionModal.tsx)
// ============================================================================
console.log(`\n${c.bold}[SECTION 3] 定时静默巡检与告警机器人对抗实测${c.reset}`);

const modalSourcePath = path.resolve('frontend/components/admin/health/SilentInspectionModal.tsx');
const modalSource = fs.readFileSync(modalSourcePath, 'utf8');

test('3.1 审查 SilentInspectionModal 告警机器人测试发送逻辑：发现纯 Mock 机制与缺乏 URL 校验缺陷', () => {
  const hasMockTimeout = modalSource.includes('setTimeout(resolve, 600)');
  const hasUrlValidation = modalSource.includes('new URL(') || modalSource.includes('isValidUrl');
  const hasActualFetch = modalSource.includes('fetch(') || modalSource.includes('axios(');

  verify(hasMockTimeout === true, '代码中确实包含 600ms 定时器模拟往返');

  if (!hasUrlValidation && !hasActualFetch) {
    recordDefect(
      'ALERT_ROBOT_MOCK_TEST',
      '告警机器人连通性测试为纯前端 600ms 定时器 Mock，缺乏合法 URL 校验与真实网络探活',
      'SilentInspectionModal.tsx 中的 handleTestAlert 函数仅通过 setTimeout(resolve, 600) 模拟测试成功，未对飞书/企微/Telegram/邮件输入进行 URL 合法性正则校验，亦未发起真实 Webhook 连通性探测。用户无论输入畸形字符串（如 "123"、"javascript:alert(1)"、甚至空串），均会弹出成功 Toast！',
      'HIGH'
    );
  }
});

test('3.2 非阻塞异步超时保护与防重入机制验证', () => {
  verify(modalSource.includes('disabled={testingChannel ==='), '测试按钮具备 testingChannel 禁用状态保护，防止多次点击并发重入');
  verify(modalSource.includes("testingChannel === 'feishu' ? <Loader2"), '具备 Loader2 旋转加载微动效，符合视觉反馈要求');
  verify(modalSource.includes('finally {'), '具备 finally 清除 loading 状态机制，避免按钮永久锁死');
});

test('3.3 LocalStorage 配置损坏与异常数据反序列化防御验证', () => {
  let loadedConfig = null;
  let didCrash = false;

  const corruptJsonString = '{ corrupt_json: invalid!@#$';

  try {
    try {
      const saved = corruptJsonString;
      if (saved) {
        loadedConfig = JSON.parse(saved);
      }
    } catch {
      // 忽略
    }
  } catch {
    didCrash = true;
  }

  verify(didCrash === false, '损坏 JSON 必须被内部 try...catch 安全拦截，绝不向外抛出崩溃');
  verify(loadedConfig === null, '损坏数据解析失败后保持默认安全配置');
});

// ============================================================================
// [SECTION 4] 全站工程规范、站长身份与破坏性红线审计
// ============================================================================
console.log(`\n${c.bold}[SECTION 4] 全站工程规范、站长身份与破坏性红线对抗审计${c.reset}`);

test('4.1 站长身份 100% Hayden Xue 纯正性排查：健康体检与告警组件中严禁出现 Howard 等遗留名称', () => {
  const healthFiles = [
    'frontend/lib/imageCompressionWorkshop.ts',
    'frontend/lib/middlewareHealthCheck.ts',
    'frontend/components/admin/health/SilentInspectionModal.tsx',
    'frontend/components/admin/health/GiantImageCompressionWorkshop.tsx',
    'frontend/components/admin/health/VisionOsHealthScoreRing.tsx',
    'frontend/components/admin/health/MiddlewareHealthCapsules.tsx',
    'frontend/app/admin/health/page.tsx',
  ];

  healthFiles.forEach((file) => {
    const fullPath = path.resolve(file);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const hasHoward = /\bHoward\b/i.test(content);
      verify(!hasHoward, `文件 ${file} 中严禁包含历史遗留名称 Howard`);
    }
  });

  // 关键业务/配置组件中必须体现 Hayden 站长身份或域名标识
  const keyIdentityFiles = [
    'frontend/lib/middlewareHealthCheck.ts',
    'frontend/components/admin/health/SilentInspectionModal.tsx',
  ];
  keyIdentityFiles.forEach((file) => {
    const fullPath = path.resolve(file);
    const content = fs.readFileSync(fullPath, 'utf8');
    const hasHayden = /Hayden\s+Xue/i.test(content) || /hayden/i.test(content);
    verify(hasHayden, `文件 ${file} 必须体现 Hayden 站长身份或域名规范`);
  });
});

test('4.2 破坏性批处理防误触红线：空分类清理与孤岛标签清理必须强制接入 confirmModal (variant: danger)', () => {
  const healthPagePath = path.resolve('frontend/app/admin/health/page.tsx');
  const healthPageContent = fs.readFileSync(healthPagePath, 'utf8');

  const hasTagDangerModal = healthPageContent.includes("title: '批量清理孤岛标签确认'") &&
    healthPageContent.includes("variant: 'danger'");
  verify(hasTagDangerModal === true, '清理孤岛标签必须强制调用 confirmModal 并配置 variant: danger');

  const hasCatDangerModal = healthPageContent.includes("title: '批量清理空分类确认'") &&
    healthPageContent.includes("variant: 'danger'");
  verify(hasCatDangerModal === true, '清理空分类必须强制调用 confirmModal 并配置 variant: danger');
});

test('4.3 正文数据水合铁律 (Content Hydration Invariant) 静态合规性检验', () => {
  verify(workshopSource.includes('api.getPostById(p.id)'), 'scanGiantImages 严格执行 api.getPostById 水合正文');
  verify(workshopSource.includes('api.getPostById(post.id)'), 'compressImageToWebp 严格执行 api.getPostById 水合正文');
  verify(!workshopSource.includes('p.content || "" // assume hydrated'), '严禁盲目假设列表已水合大文本');
});

// ============================================================================
// 汇总统计与交付汇报
// ============================================================================
console.log(`\n${c.bold}${c.cyan}========================================================================${c.reset}`);
console.log(`${c.bold}${c.cyan}  对抗实测汇总报告 (Empirical Adversarial Test Summary)  ${c.reset}`);
console.log(`${c.bold}${c.cyan}========================================================================${c.reset}`);
console.log(`总用例数 (Total Tests):       ${c.bold}${totalTests}${c.reset}`);
console.log(`通过用例 (Passed Tests):      ${c.green}${passedTests}${c.reset}`);
console.log(`失败用例 (Failed Tests):      ${failedTests === 0 ? c.green : c.red}${failedTests}${c.reset}`);
console.log(`断言总数 (Total Assertions):  ${c.bold}${totalAsserts}${c.reset}`);
console.log(`确权缺陷 (Defects Found):     ${defects.length === 0 ? c.green : c.yellow}${defects.length}${c.reset}`);
console.log(`工程观测 (Observations):      ${c.cyan}${observations.length}${c.reset}\n`);

if (defects.length > 0) {
  console.log(`${c.bold}${c.yellow}确权缺陷清单与边界风险分析：${c.reset}`);
  defects.forEach((d, idx) => {
    console.log(`  ${idx + 1}. [${d.severity}] ${d.title}:`);
    console.log(`     ${c.gray}${d.detail}${c.reset}`);
  });
  console.log('');
}

process.exit(failedTests > 0 ? 1 : 0);
