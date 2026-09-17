/**
 * auditThreatDetection.ts
 * 
 * 恶意扫描特征实时识别引擎与 IP 黑名单防线
 * 遵从 AGENTS.md 准则 & PROJECT.md (F19)
 */

export type ThreatType =
  | 'PATH_TRAVERSAL'
  | 'SQL_INJECTION'
  | 'SENSITIVE_PROBE'
  | 'MALICIOUS_SCANNER'
  | 'ANOMALOUS_STATUS';

export type RiskLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';

export interface ThreatDetectionResult {
  isThreat: boolean;
  threatType: ThreatType | null;
  riskLevel: RiskLevel;
  matchedPattern?: string;
  description?: string;
}

export interface BannedIpRecord {
  ip: string;
  bannedAt: string;
  reason: string;
  source: 'MANUAL_AUDIT' | 'AUTO_DEFENSE';
}

const BANNED_IPS_STORAGE_KEY = 'hayden_banned_ips_registry';

// 恶意扫描特征库 (包含 SQL 注入、路径遍历、敏感探测路径与恶意扫描器特征)
function safeDecodeUri(str: string): string {
  let decoded = str;
  try {
    decoded = decodeURIComponent(decoded);
    // 支持双重 URL 编码防御 (如 %252e%252e%252f -> %2e%2e%2f -> ../)
    decoded = decodeURIComponent(decoded);
  } catch {
    // 忽略畸形 URI 解码错误
  }
  return decoded;
}

// 恶意扫描特征库 (包含 SQL 注入、路径遍历、敏感探测路径与恶意扫描器特征)
const SUSPICIOUS_PATTERNS: Array<{
  type: ThreatType;
  regex: RegExp;
  risk: RiskLevel;
  desc: string;
}> = [
  // 1. 路径遍历 (Path Traversal)
  {
    type: 'PATH_TRAVERSAL',
    regex: /\.\.\/|\.\.\\|\/\.\.\//i,
    risk: 'CRITICAL',
    desc: '试图跨目录读取系统或受限文件 (Path Traversal 攻击)',
  },
  // 2. SQL 注入关键字 (SQL Injection)
  {
    type: 'SQL_INJECTION',
    regex: /' OR '1'='1'|' OR 1=1|\bUNION\s*(?:\(\s*)?SELECT\b|\bDROP\s+TABLE\b|\bINSERT\s+INTO\b|\bINFORMATION_SCHEMA\b|\bSLEEP\(|\bWAITFOR\s+DELAY\b|(?:'|")\s*--|(?:;\s*--)|\b(?:AND|OR)\b[^\n]*?--|'\s*#|;\s*#|\b(?:AND|OR)\b[^\n]*?#|\bEXEC\s+(?:xp_cmdshell|[a-zA-Z0-9_]+)/i,
    risk: 'CRITICAL',
    desc: '检测到 SQL 注入语法特征 (SQL Injection 尝试)',
  },
  // 3. 敏感系统探测路径 (Sensitive File / Admin Probes)
  {
    type: 'SENSITIVE_PROBE',
    regex: /\/\.env|\/wp-login\.php|\/wp-admin|\/\.git|\/actuator|\/phpmyadmin|\/cgi-bin|\/eval-stdin\.php|\/etc\/passwd|\/etc\/shadow|\/solr/i,
    risk: 'HIGH',
    desc: '探测系统隐藏配置、控制台或历史漏洞脚本 (Sensitive Probe)',
  },
  // 4. 自动化漏洞扫描器指纹 (Scanner User-Agents)
  {
    type: 'MALICIOUS_SCANNER',
    regex: /sqlmap|nikto|masscan|dirbuster|gobuster|nmap|acunetix|w3af|zaproxy/i,
    risk: 'HIGH',
    desc: '匹配到已知黑客扫描工具 User-Agent 签名',
  },
];

/**
 * 实时分析请求特征并判定威胁
 */
export function detectThreats(
  path: string = '',
  queryOrParams: string = '',
  userAgent: string = '',
  status?: number
): ThreatDetectionResult {
  const rawTarget = `${path} ? ${queryOrParams}`;
  const decodedTarget = safeDecodeUri(rawTarget);
  // 归一化内联 SQL 注释 (如 UNION/**/SELECT -> UNION SELECT)
  const normalizedSqlTarget = decodedTarget.replace(/\/\*[\s\S]*?\*\//g, ' ');

  for (const p of SUSPICIOUS_PATTERNS) {
    if (p.type === 'MALICIOUS_SCANNER') {
      if (userAgent && p.regex.test(userAgent)) {
        return {
          isThreat: true,
          threatType: p.type,
          riskLevel: p.risk,
          matchedPattern: userAgent.match(p.regex)?.[0] || 'Malicious UA',
          description: p.desc,
        };
      }
    } else if (p.type === 'SQL_INJECTION') {
      if (p.regex.test(normalizedSqlTarget) || p.regex.test(rawTarget)) {
        const match = normalizedSqlTarget.match(p.regex)?.[0] || rawTarget.match(p.regex)?.[0] || p.type;
        return {
          isThreat: true,
          threatType: p.type,
          riskLevel: p.risk,
          matchedPattern: match,
          description: p.desc,
        };
      }
    } else {
      if (p.regex.test(decodedTarget) || p.regex.test(rawTarget)) {
        const match = decodedTarget.match(p.regex)?.[0] || rawTarget.match(p.regex)?.[0] || p.type;
        return {
          isThreat: true,
          threatType: p.type,
          riskLevel: p.risk,
          matchedPattern: match,
          description: p.desc,
        };
      }
    }
  }

  // 状态码 400/404 且含有可疑探测字符
  if (status && (status === 400 || status === 404)) {
    if (/[<>'"]|\bselect\b|\.php/i.test(decodedTarget) || /[<>'"]|\bselect\b|\.php/i.test(rawTarget)) {
      return {
        isThreat: true,
        threatType: 'ANOMALOUS_STATUS',
        riskLevel: 'MEDIUM',
        matchedPattern: `Status ${status} + Anomaly`,
        description: '异常错误响应伴随恶意输入片段',
      };
    }
  }

  return {
    isThreat: false,
    threatType: null,
    riskLevel: 'NONE',
  };
}

/**
 * IP 地址合法性校验 (IPv4 与 IPv6 规范匹配)
 */
export function validateIpAddress(ip: string): boolean {
  if (!ip || typeof ip !== 'string' || !ip.trim()) {
    throw new Error('IP 地址不能为空');
  }

  const cleanIp = ip.trim();

  // IPv4 基本格式
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipv4Regex.test(cleanIp)) {
    const parts = cleanIp.split('.').map(Number);
    const valid = parts.every((p) => p >= 0 && p <= 255);
    if (!valid) throw new Error(`非法 IP 地址格式: "${ip}"`);
    return true;
  }

  // IPv6 基本格式 (8段或含 :: 简写)
  if (cleanIp === '::') return true;
  if (cleanIp.includes(':')) {
    const parts = cleanIp.split('::');
    if (parts.length <= 2) {
      if (parts.length === 1) {
        const segments = cleanIp.split(':');
        if (segments.length === 8 && segments.every((s) => /^[0-9a-fA-F]{1,4}$/.test(s))) {
          return true;
        }
      } else {
        const left = parts[0] ? parts[0].split(':') : [];
        const right = parts[1] ? parts[1].split(':') : [];
        if (left.length + right.length <= 7 && left.concat(right).every((s) => /^[0-9a-fA-F]{1,4}$/.test(s))) {
          return true;
        }
      }
    }
  }

  throw new Error(`非法 IP 地址格式: "${ip}"`);
}

/**
 * 本地持久化黑名单存储管理
 */
class IpBlacklistManager {
  private bannedMap = new Map<string, BannedIpRecord>();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (typeof window === 'undefined') {
      // 服务端或测试预置默认黑名单
      this.bannedMap.set('185.220.101.5', {
        ip: '185.220.101.5',
        bannedAt: new Date().toISOString(),
        reason: '初始恶意 Tor 出口节点黑名单',
        source: 'AUTO_DEFENSE',
      });
      return;
    }

    try {
      const raw = localStorage.getItem(BANNED_IPS_STORAGE_KEY);
      if (raw) {
        const list: BannedIpRecord[] = JSON.parse(raw);
        list.forEach((item) => this.bannedMap.set(item.ip, item));
      } else {
        // 预置默认拦截项
        this.bannedMap.set('185.220.101.5', {
          ip: '185.220.101.5',
          bannedAt: new Date().toISOString(),
          reason: '初始恶意 Tor 节点探测封禁',
          source: 'AUTO_DEFENSE',
        });
        this.saveToStorage();
      }
    } catch {
      // 容错处理
    }
  }

  private saveToStorage() {
    if (typeof window === 'undefined') return;
    try {
      const list = Array.from(this.bannedMap.values());
      localStorage.setItem(BANNED_IPS_STORAGE_KEY, JSON.stringify(list));
    } catch {
      // 容错
    }
  }

  public banIp(ip: string, reason: string = '系统审计日志管理端手动拉黑'): boolean {
    validateIpAddress(ip);
    const cleanIp = ip.trim();

    this.bannedMap.set(cleanIp, {
      ip: cleanIp,
      bannedAt: new Date().toISOString(),
      reason,
      source: 'MANUAL_AUDIT',
    });
    this.saveToStorage();
    return true;
  }

  public unbanIp(ip: string): boolean {
    const cleanIp = ip.trim();
    const removed = this.bannedMap.delete(cleanIp);
    if (removed) {
      this.saveToStorage();
    }
    return removed;
  }

  public isIpBanned(ip: string): boolean {
    if (!ip) return false;
    return this.bannedMap.has(ip.trim());
  }

  public getAllBannedIps(): BannedIpRecord[] {
    return Array.from(this.bannedMap.values());
  }
}

export const ipBlacklist = new IpBlacklistManager();

/**
 * 快捷辅助函数
 */
export function banIp(ip: string, reason?: string): boolean {
  return ipBlacklist.banIp(ip, reason);
}

export function unbanIp(ip: string): boolean {
  return ipBlacklist.unbanIp(ip);
}

export function isIpBanned(ip: string): boolean {
  return ipBlacklist.isIpBanned(ip);
}

export function getBannedIps(): BannedIpRecord[] {
  return ipBlacklist.getAllBannedIps();
}

/**
 * IP 掩码脱敏（保持前三段，末段打码）
 */
export function maskIp(ip: string): string {
  if (!ip || typeof ip !== 'string') return '***.***.***.***';
  const parts = ip.trim().split('.');
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.${parts[2]}.***`;
  }
  return ip.replace(/:[^:]+$/, ':****');
}
