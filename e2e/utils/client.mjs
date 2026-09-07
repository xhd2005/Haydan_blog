// e2e/utils/client.mjs
import { config } from '../config.mjs';
import { contractOracle } from './oracle.mjs';

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
}
