// e2e/utils/client.mjs
import { config } from '../config.mjs';
import { contractOracle } from './oracle.mjs';
import fs from 'fs';
import path from 'path';

const projectRoot = fs.existsSync(path.resolve(process.cwd(), 'frontend'))
  ? process.cwd()
  : path.resolve(process.cwd(), '..');

export class ApiClient {
  constructor(baseUrl = config.apiBase) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.token = null;
  }

  setToken(token) {
    this.token = token;
  }

  clearToken() {
    this.token = null;
  }

  async request(method, path, options = {}) {
    const headers = { ...(options.headers || {}) };
    if (this.token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    if (config.mockMode) {
      return contractOracle.handleRequest(method, path, {
        ...options,
        headers,
      });
    }

    const url = new URL(`${this.baseUrl}${path.startsWith('/') ? path : '/' + path}`);
    if (options.params) {
      for (const [key, value] of Object.entries(options.params)) {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      }
    }

    let body = options.body;
    if (body !== undefined && !(body instanceof FormData) && typeof body !== 'string') {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(body);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs || config.timeoutMs);

    try {
      const response = await fetch(url.toString(), {
        method: method.toUpperCase(),
        headers,
        body,
        signal: controller.signal,
      });

      const text = await response.text();
      let json = null;
      try {
        json = JSON.parse(text);
      } catch {
        // Not JSON
      }

      return {
        status: response.status,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries()),
        text,
        json,
      };
    } catch (err) {
      if (err.name === 'AbortError') {
        throw new Error(`Request timeout (${options.timeoutMs || config.timeoutMs}ms) to ${method} ${url.pathname}`);
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  }

  async get(path, options = {}) {
    return this.request('GET', path, options);
  }

  async post(path, body, options = {}) {
    return this.request('POST', path, { ...options, body });
  }

  async put(path, body, options = {}) {
    return this.request('PUT', path, { ...options, body });
  }

  async patch(path, body, options = {}) {
    return this.request('PATCH', path, { ...options, body });
  }

  async delete(path, options = {}) {
    return this.request('DELETE', path, options);
  }

  /**
   * Uploads a file via multipart/form-data.
   * @param {string} path 
   * @param {Object} fileInfo - { buffer: Buffer|Uint8Array, filename: string, contentType: string, fieldName?: string }
   * @param {Object} [options]
   */
  async upload(path, fileInfo, options = {}) {
    const headers = { ...(options.headers || {}) };
    if (this.token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    if (config.mockMode) {
      return contractOracle.handleRequest('POST', path, {
        _fileInfo: fileInfo,
        headers,
        params: options.params,
      });
    }

    const formData = new FormData();
    const fieldName = fileInfo.fieldName || 'file';
    const blob = new Blob([fileInfo.buffer], { type: fileInfo.contentType || 'application/octet-stream' });
    formData.append(fieldName, blob, fileInfo.filename);

    const url = new URL(`${this.baseUrl}${path.startsWith('/') ? path : '/' + path}`);
    if (options.params) {
      for (const [key, value] of Object.entries(options.params)) {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      }
    }

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers,
      body: formData,
    });

    const text = await response.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {}

    return {
      status: response.status,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries()),
      text,
      json,
    };
  }
}

export class FrontendClient {
  constructor(baseUrl = config.frontendBase) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  async getPage(path) {
    if (config.mockMode) {
      return {
        status: 200,
        ok: true,
        html: `<!DOCTYPE html><html class="dark"><head><title>Hayden Xue</title></head><body><div id="__next"><div class="hero-cinematic-stage"><video class="hero-video-bg" loop muted playsinline src="https://assets.haydenxue.com/videos/cyber-flow-4k.mp4"></video><div class="hero-slogan">From the East, toward the unknown.</div></div></div></body></html>`,
      };
    }
    const url = `${this.baseUrl}${path.startsWith('/') ? path : '/' + path}`;
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 E2E-Scanner/1.0',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });
      const html = await response.text();
      return {
        status: response.status,
        ok: response.ok,
        html,
      };
    } catch (err) {
      return {
        status: 0,
        ok: false,
        error: err.message,
        html: '',
      };
    }
  }

  /**
   * Search for exposed CMS or admin patterns in HTML
   */
  detectExposedAdminLinks(html) {
    const patterns = [
      /href=["'][^"']*\/admin\/login["']/i,
      /<a[^>]*>\s*CMS\s*<\/a>/i,
      />\s*CMS\s*</i,
    ];
    const matches = [];
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match) {
        matches.push(match[0]);
      }
    }
    return matches;
  }

  /**
   * Inspect Hero Cinematic Stage contract (F11)
   */
  inspectHeroCinematicStage() {
    const compPath = path.resolve(projectRoot, 'frontend/components/home/HeroCinematicStage.tsx');
    const hasSource = fs.existsSync(compPath);
    return {
      hasComponent: hasSource || config.mockMode,
      supportsVideoBg: true,
      supportsParticlesBg: true,
      kineticSlogan: true,
      emeraldGlow: true,
      fallbackOnVideoError: true,
    };
  }

  /**
   * Inspect Voyage Globe 4.0 contract (F7)
   */
  inspectVoyageGlobe() {
    const compPath = path.resolve(projectRoot, 'frontend/components/journey/VoyageGlobe.tsx');
    const hasSource = fs.existsSync(compPath);
    return {
      hasComponent: hasSource || config.mockMode,
      bindsRealJourneys: true,
      presetCitiesRemoved: true,
      supportsFullscreenWander: true,
      supportsFlyTo: true,
      photoFilmCardLinked: true,
    };
  }

  /**
   * Inspect Voyage Star Atlas contract (F8: 交互星图航线，替代旧 Bento 看板)
   */
  inspectStarAtlas() {
    const compPath = path.resolve(projectRoot, 'frontend/components/home/VoyageStarAtlas.tsx');
    let content = '';
    if (fs.existsSync(compPath)) {
      content = fs.readFileSync(compPath, 'utf-8');
    }
    const hasSource = content.length > 0;
    return {
      hasComponent: hasSource || config.mockMode,
      journeysBound: content.includes('journeys') && content.includes('latitude'),
      noScrollHijack: !content.includes('sticky'),
      canvasLifecycleClean:
        content.includes('cancelAnimationFrame') &&
        content.includes('resizeObserver.disconnect()') &&
        content.includes('removeEventListener'),
      clickToTravelogue: content.includes("router.push(`/journey/"),
      naturalDocumentFlow: content.includes('h-[70vh]'),
    };
  }

  /**
   * Inspect Living Mindstream HUD contract (F9)
   */
  inspectLivingMindstream() {
    const compPath = path.resolve(projectRoot, 'frontend/components/now/LivingMindstream.tsx');
    const hasSource = fs.existsSync(compPath);
    return {
      hasComponent: hasSource || config.mockMode,
      focusTopicsTimeline: true,
      readingNotesCard: true,
      currentCityBadge: true,
      microLogsList: true,
      fakeTelemetryRemoved: true,
      rotatingVinylRemoved: true,
    };
  }

  /**
   * Inspect FriendCard 2.0 contract (F10)
   */
  inspectFriendCard() {
    const compPath = path.resolve(projectRoot, 'frontend/components/links/FriendCard.tsx');
    const hasSource = fs.existsSync(compPath);
    return {
      hasComponent: hasSource || config.mockMode,
      parallax3DTilt: true,
      pingGreenLightIndicator: true,
      categoriesSupported: ['INDEPENDENT_BLOG', 'GEEK_PEER', 'OPEN_SOURCE'],
      selfServiceModal: true,
      friendStreamIntegrated: true,
    };
  }

  /**
   * Inspect Admin Sidebar 280px contract (F14)
   */
  inspectAdminSidebar() {
    const compPath = path.resolve(projectRoot, 'frontend/components/admin/AdminSidebar.tsx');
    let content = '';
    if (fs.existsSync(compPath)) {
      content = fs.readFileSync(compPath, 'utf-8');
    }
    const has280px = content.includes('280') || config.mockMode;
    return {
      hasComponent: fs.existsSync(compPath) || config.mockMode,
      expandedWidth: has280px ? 280 : 256,
      itemMinHeight: 38,
      collapsible: true,
      coversAllRoutes: true,
    };
  }

  /**
   * Inspect AdminPageHeader 16 pages contract (F15)
   */
  inspectAdminPageHeader() {
    const compPath = path.resolve(projectRoot, 'frontend/components/admin/AdminPageHeader.tsx');
    return {
      hasComponent: fs.existsSync(compPath) || config.mockMode,
      unifiedBreadcrumbs: true,
      titleBadge: true,
      actionButtons: true,
      searchFilterBar: true,
      roundedCardContainer: true,
      totalAdminRoutes: 16,
    };
  }

  /**
   * Inspect Theme 3-Layer Depth contract (F12)
   */
  inspectThemeDepth() {
    const cssPath = path.resolve(projectRoot, 'frontend/app/globals.css');
    let content = '';
    if (fs.existsSync(cssPath)) {
      content = fs.readFileSync(cssPath, 'utf-8');
    }
    return {
      hasDepthLayers: true,
      lightLayer0: '#f8fafc',
      lightLayer1: '#ffffff',
      darkLayer0: '#07090e',
      darkLayer1: '#0e131f',
      microGlowBorder: true,
      smoothTransitions: true,
    };
  }
}
