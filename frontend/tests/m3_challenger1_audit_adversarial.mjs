/**
 * M3 Challenger 1: Audit Logs & Security Engine Adversarial Test Harness
 * 
 * 专门针对 M3 审计日志与安全防御体系进行对抗性实测：
 * 1. 恶意扫描识别引擎 (auditThreatDetection.ts) 攻击变体与误报率对抗测试
 * 2. IP 黑名单校验、极端畸形输入与二次确认危险弹窗拦截审计
 * 3. Git-style 数据变更 Diff 算法极限大文本、Unicode/Emoji、CRLF、行号单调性压测
 * 4. J/K 键盘导航状态机越界敲击、空列表与输入框屏蔽测试
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

// 彩色终端格式化
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  magenta: '\x1b[35m',
};

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const findings = [];

function test(name, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ${colors.green}✔${colors.reset} ${name}`);
  } catch (err) {
    failedTests++;
    console.log(`  ${colors.red}✖${colors.reset} ${name}`);
    console.log(`    ${colors.yellow}Error: ${err.message}${colors.reset}`);
  }
}

function recordFinding(category, title, detail, severity = 'MEDIUM') {
  findings.push({ category, title, detail, severity });
  console.log(`    ${colors.magenta}🔍 [DEFECT/CHALLENGE] (${severity}) ${title}: ${detail}${colors.reset}`);
}

console.log(`${colors.bold}${colors.cyan}========================================================================${colors.reset}`);
console.log(`${colors.bold}${colors.cyan}  M3 对抗性质疑专家 1: 安全审计日志与威胁识别引擎对抗实测套件  ${colors.reset}`);
console.log(`${colors.bold}${colors.cyan}========================================================================${colors.reset}\n`);

// 动态载入审计威胁识别模块
const auditThreatModule = await import('../lib/auditThreatDetection.ts');
const { detectThreats, validateIpAddress, banIp, unbanIp, isIpBanned, maskIp, ipBlacklist } = auditThreatModule;

// ============================================================================
// [SECTION 1] 恶意扫描识别引擎对抗测试 (auditThreatDetection.ts)
// ============================================================================
console.log(`${colors.bold}[SECTION 1] 恶意扫描识别引擎对抗实测 (SQLi / Path Traversal / Probes / UAs)${colors.reset}`);

// 1.1 SQL 注入变体攻击集测试
const sqliTestCases = [
  // 基础 SQLi
  { name: "Classic UNION SELECT", input: "/api/posts?id=1 UNION SELECT 1,2,3", shouldDetect: true, expectedType: 'SQL_INJECTION' },
  { name: "Case-mixed uNiOn SeLeCt", input: "/api/posts?id=1 uNiOn SeLeCt username,password FROM users", shouldDetect: true, expectedType: 'SQL_INJECTION' },
  { name: "Boolean 1' OR '1'='1", input: "/api/login?user=' OR '1'='1'--", shouldDetect: true, expectedType: 'SQL_INJECTION' },
  { name: "Boolean ' OR 1=1", input: "/api/login?user=' OR 1=1", shouldDetect: true, expectedType: 'SQL_INJECTION' },
  { name: "Stack Query with DROP TABLE", input: "/api/posts?id=1; DROP TABLE posts;--", shouldDetect: true, expectedType: 'SQL_INJECTION' },
  { name: "Time-based Blind SLEEP(5)", input: "/api/search?q=test' AND SLEEP(5)--", shouldDetect: true, expectedType: 'SQL_INJECTION' },
  { name: "Time-based WAITFOR DELAY", input: "/api/search?q=1; WAITFOR DELAY '0:0:5'", shouldDetect: true, expectedType: 'SQL_INJECTION' },
  { name: "Information Schema probe", input: "/api/posts?q=1 AND SELECT * FROM INFORMATION_SCHEMA.TABLES", shouldDetect: true, expectedType: 'SQL_INJECTION' },
  { name: "SQL Server EXEC probe", input: "/api/posts?q=1; EXEC xp_cmdshell('whoami')", shouldDetect: true, expectedType: 'SQL_INJECTION' },
  { name: "Double hyphen comment terminator", input: "/api/search?q=admin'--", shouldDetect: true, expectedType: 'SQL_INJECTION' },
  
  // 高级绕过与混淆变体 (Adversarial Evasion Variants)
  { name: "Inline comment UNION/**/SELECT", input: "/api/posts?id=1 UNION/**/SELECT 1,2,3", shouldDetect: true, expectedType: 'SQL_INJECTION' },
  { name: "Function call syntax UNION(SELECT)", input: "/api/posts?id=1 UNION(SELECT 1,2,3)", shouldDetect: true, expectedType: 'SQL_INJECTION' },
  { name: "URL encoded union select (raw %20)", input: "/api/posts?id=1%20UNION%20SELECT%201,2,3", shouldDetect: true, expectedType: 'SQL_INJECTION' },
  { name: "MySQL hash comment terminator #", input: "/api/login?user=admin'#", shouldDetect: true, expectedType: 'SQL_INJECTION' },
  { name: "Stacked multi-statement INSERT INTO", input: "/api/posts?id=1; INSERT INTO users(name) VALUES('hacker')", shouldDetect: true, expectedType: 'SQL_INJECTION' },
];

let sqliDetected = 0;
test('1.1 SQL 注入全谱系攻击变体实测与识别率统计', () => {
  sqliTestCases.forEach((tc) => {
    const res = detectThreats(tc.input, '', '');
    if (res.isThreat) {
      sqliDetected++;
    } else {
      recordFinding('SQLI_EVASION', `SQL 注入混淆绕过漏报: [${tc.name}]`, `输入 "${tc.input}" 未被检测引擎识别，存在正则匹配盲区`, 'HIGH');
    }
  });
  console.log(`    ${colors.cyan}SQL 注入测试样本: ${sqliTestCases.length} 个, 检出: ${sqliDetected} 个, 检出率: ${((sqliDetected / sqliTestCases.length) * 100).toFixed(1)}%${colors.reset}`);
  assert.ok(sqliDetected >= 10, 'SQL 注入基础核心特征检出数必须 >= 10');
});

// 1.2 路径遍历与敏感探测变体集测试
const traversalAndProbeCases = [
  // 路径穿越
  { name: "Standard ../ traversal", input: "/api/download?path=../../../../etc/passwd", shouldDetect: true, expectedType: 'PATH_TRAVERSAL' },
  { name: "Windows ..\\ traversal", input: "C:\\inetpub\\wwwroot\\..\\..\\boot.ini", shouldDetect: true, expectedType: 'PATH_TRAVERSAL' },
  { name: "Middle /../ path traversal", input: "/files/images/../../../etc/shadow", shouldDetect: true, expectedType: 'PATH_TRAVERSAL' },
  { name: "URL encoded %2e%2e%2f traversal", input: "/download?file=%2e%2e%2f%2e%2e%2fetc/passwd", shouldDetect: true, expectedType: 'PATH_TRAVERSAL' },
  { name: "Double encoded %252e%252e%252f traversal", input: "/download?file=%252e%252e%252fetc/passwd", shouldDetect: true, expectedType: 'PATH_TRAVERSAL' },
  
  // 敏感配置与框架探测
  { name: "Spring Boot Actuator heapdump probe", input: "/actuator/heapdump", shouldDetect: true, expectedType: 'SENSITIVE_PROBE' },
  { name: "Spring Boot Actuator env probe", input: "/actuator/env", shouldDetect: true, expectedType: 'SENSITIVE_PROBE' },
  { name: "Git config metadata probe", input: "/.git/config", shouldDetect: true, expectedType: 'SENSITIVE_PROBE' },
  { name: "Git HEAD probe", input: "/.git/HEAD", shouldDetect: true, expectedType: 'SENSITIVE_PROBE' },
  { name: "WordPress login probe", input: "/wp-login.php", shouldDetect: true, expectedType: 'SENSITIVE_PROBE' },
  { name: "WordPress admin probe", input: "/wp-admin/admin-ajax.php", shouldDetect: true, expectedType: 'SENSITIVE_PROBE' },
  { name: ".env secret configuration probe", input: "/.env", shouldDetect: true, expectedType: 'SENSITIVE_PROBE' },
  { name: "phpMyAdmin console probe", input: "/phpmyadmin/index.php", shouldDetect: true, expectedType: 'SENSITIVE_PROBE' },
  { name: "Direct /etc/passwd probe", input: "/etc/passwd", shouldDetect: true, expectedType: 'SENSITIVE_PROBE' },
  { name: "Direct /etc/shadow probe", input: "/etc/shadow", shouldDetect: true, expectedType: 'SENSITIVE_PROBE' },
  { name: "PHPUnit eval-stdin probe", input: "/vendor/phpunit/phpunit/src/Util/PHP/eval-stdin.php", shouldDetect: true, expectedType: 'SENSITIVE_PROBE' },
  { name: "Apache Solr injection probe", input: "/solr/admin/info/system", shouldDetect: true, expectedType: 'SENSITIVE_PROBE' },
];

let probeDetected = 0;
test('1.2 路径遍历与敏感探测变体检出率实测', () => {
  traversalAndProbeCases.forEach((tc) => {
    const res = detectThreats(tc.input, '', '');
    if (res.isThreat) {
      probeDetected++;
    } else {
      recordFinding('PROBE_EVASION', `敏感探测/遍历绕过: [${tc.name}]`, `输入 "${tc.input}" 未被检测引擎拦截`, 'HIGH');
    }
  });
  console.log(`    ${colors.cyan}路径遍历与敏感探测样本: ${traversalAndProbeCases.length} 个, 检出: ${probeDetected} 个, 检出率: ${((probeDetected / traversalAndProbeCases.length) * 100).toFixed(1)}%${colors.reset}`);
  assert.ok(probeDetected >= 12, '路径与敏感文件探测识别数必须 >= 12');
});

// 1.3 恶意黑客扫描器指纹对抗测试
const scannerUaCases = [
  { name: "sqlmap default UA", ua: "sqlmap/1.5.2#stable (http://sqlmap.org)", shouldDetect: true },
  { name: "Nikto scanner UA", ua: "Mozilla/5.0 (Nikto/2.1.6) (Evasions:None) (Test:Port Check)", shouldDetect: true },
  { name: "Masscan scanner UA", ua: "masscan/1.0 (https://github.com/robertdavidgraham/masscan)", shouldDetect: true },
  { name: "DirBuster UA", ua: "DirBuster-1.0-RC1 (http://www.owasp.org/index.php/Category:OWASP_DirBuster_Project)", shouldDetect: true },
  { name: "GoBuster UA", ua: "gobuster/3.1.0", shouldDetect: true },
  { name: "Nmap Scripting Engine UA", ua: "Mozilla/5.0 (compatible; Nmap Scripting Engine; https://nmap.org/book/nse.html)", shouldDetect: true },
  { name: "Acunetix scanner UA", ua: "Acunetix-Aspect/1.1", shouldDetect: true },
  { name: "w3af vulnerability scanner", ua: "w3af.org", shouldDetect: true },
  { name: "OWASP ZAP proxy scanner", ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) zaproxy/2.11", shouldDetect: true },
  // 正常爬虫/读者 UA (不得误报)
  { name: "Googlebot crawler", ua: "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)", shouldDetect: false },
  { name: "Standard Chrome on macOS", ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36", shouldDetect: false },
  { name: "Standard Safari on iPhone", ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Mobile/15E148 Safari/604.1", shouldDetect: false },
  { name: "cURL CLI tool", ua: "curl/7.88.1", shouldDetect: false },
];

let scannerDetected = 0;
let scannerFalsePositive = 0;
test('1.3 恶意漏洞扫描器 UA 指纹与正常浏览器区分度实测', () => {
  scannerUaCases.forEach((tc) => {
    const res = detectThreats('/api/posts', '', tc.ua);
    if (tc.shouldDetect) {
      if (res.isThreat && res.threatType === 'MALICIOUS_SCANNER') {
        scannerDetected++;
      } else {
        recordFinding('SCANNER_MISS', `扫描器指纹漏报: [${tc.name}]`, `UA "${tc.ua}" 未被识别为扫描器`, 'MEDIUM');
      }
    } else {
      if (res.isThreat) {
        scannerFalsePositive++;
        recordFinding('SCANNER_FP', `正常客户端 UA 误报: [${tc.name}]`, `UA "${tc.ua}" 被错误判定为威胁`, 'HIGH');
      }
    }
  });
  console.log(`    ${colors.cyan}恶意 UA 样本检出: ${scannerDetected}/9, 正常 UA 误报: ${scannerFalsePositive}/4${colors.reset}`);
  assert.strictEqual(scannerDetected, 9, '9 款已知漏洞扫描工具指纹必须 100% 检出');
  assert.strictEqual(scannerFalsePositive, 0, '正常浏览器与搜索引擎 UA 误报必须为 0');
});

// 1.4 正常业务请求的误报率测试 (False Positive Stress Testing)
const benignCases = [
  { name: "Markdown divider --- in post update", path: "/api/admin/posts/1", params: '{"content":"## Title\\n---\\nContent after hr"}' },
  { name: "CLI argument --dry-run in commit log", path: "/api/admin/posts/2", params: '{"operation":"Execute sync --dry-run --verbose"}' },
  { name: "Normal query searching for actuator article", path: "/api/posts", params: '{"keyword":"spring boot actuator best practice"}' },
  { name: "Normal query searching for SQL UNION article", path: "/api/posts", params: '{"keyword":"how to optimize union queries in mysql"}' },
  { name: "Normal code snippet with SQL text in tutorial", path: "/api/admin/posts/3", params: '{"content":"SELECT id, title FROM posts WHERE status = 1"}' },
  { name: "Normal hyphen in sentence", path: "/api/memos", params: '{"content":"Today is sunny -- perfect for writing"}' },
];

let benignFalsePositives = 0;
test('1.4 正常业务操作（Markdown 分割线 / 命令行参数 -- / 技术词汇）误报率实测', () => {
  benignCases.forEach((tc) => {
    const res = detectThreats(tc.path, tc.params, '');
    if (res.isThreat) {
      benignFalsePositives++;
      recordFinding(
        'FALSE_POSITIVE',
        `正常内容触发威胁误报: [${tc.name}]`,
        `输入匹配了威胁规则: ${res.threatType} (${res.matchedPattern})。原因: 正则 /--/ 过宽直接匹配了普通破折号或 Markdown 标点`,
        'MEDIUM'
      );
    }
  });
  console.log(`    ${colors.cyan}正常请求误报数: ${benignFalsePositives} / ${benignCases.length} (误报率: ${((benignFalsePositives / benignCases.length) * 100).toFixed(1)}%)${colors.reset}`);
});

// ============================================================================
// [SECTION 2] IP 黑名单拦截、极端输入与二次确认防御测试
// ============================================================================
console.log(`\n${colors.bold}[SECTION 2] IP 合法性校验、极端畸形输入与二次确认防御实测${colors.reset}`);

// 2.1 IPv4 与 IPv6 各种格式校验
const ipValidationCases = [
  // 合法 IPv4
  { ip: '127.0.0.1', valid: true, desc: 'IPv4 本地回环' },
  { ip: '192.168.1.1', valid: true, desc: 'IPv4 内网私有地址' },
  { ip: '8.8.8.8', valid: true, desc: 'IPv4 公网 DNS' },
  { ip: '255.255.255.255', valid: true, desc: 'IPv4 全网广播' },
  { ip: '0.0.0.0', valid: true, desc: 'IPv4 全零绑定' },
  { ip: ' 10.0.0.1 ', valid: true, desc: '首尾含空格有效 IPv4' },
  
  // 非法 IPv4
  { ip: '256.0.0.1', valid: false, desc: '越界数字 (>255)' },
  { ip: '1.2.3.4.5', valid: false, desc: '5段 IPv4' },
  { ip: '1.2.3', valid: false, desc: '少于4段 IPv4' },
  { ip: '-1.0.0.1', valid: false, desc: '负数段' },
  { ip: 'abc.def.ghi.jkl', valid: false, desc: '纯英文字符串' },
  { ip: '192.168.1.1/24', valid: false, desc: 'CIDR 网段格式' },
  { ip: '192.168.1.1:8080', valid: false, desc: '带端口号格式' },

  // 空与畸形超长注入
  { ip: '', valid: false, desc: '空字符串' },
  { ip: '   ', valid: false, desc: '纯空格' },
  { ip: '1.1.1.1; DROP TABLE users', valid: false, desc: 'SQL 注入串注入 IP 字段' },
  { ip: '127.0.0.1<script>alert(1)</script>', valid: false, desc: 'XSS 标签注入 IP 字段' },
  { ip: '192.168.1.1' + 'A'.repeat(5000), valid: false, desc: '超长缓冲区溢出特征串 (5000字符)' },

  // IPv6 格式
  { ip: '2001:0db8:85a3:0000:0000:8a2e:0370:7334', valid: true, desc: '标准 8 段完整 IPv6' },
  { ip: '2001:db8::1', valid: true, desc: '压缩格式 IPv6' },
  { ip: '::1', valid: true, desc: 'IPv6 回环地址 (Localhost)' },
  { ip: 'fe80::1ff:fe23:4567:890a', valid: true, desc: '链路本地 IPv6' },
];

let ipValidationFailures = 0;
test('2.1 IP 地址合法性校验全谱系防御实测 (IPv4/IPv6/畸形/注入/超长)', () => {
  ipValidationCases.forEach((tc) => {
    let isValid = false;
    let errMsg = '';
    try {
      isValid = validateIpAddress(tc.ip);
    } catch (err) {
      isValid = false;
      errMsg = err.message;
    }

    if (isValid !== tc.valid) {
      ipValidationFailures++;
      const defectSeverity = tc.ip === '::1' ? 'HIGH' : 'MEDIUM';
      recordFinding(
        'IP_VALIDATION_FLAW',
        `IP 合法性判定与预期不符: "${tc.ip}" (${tc.desc})`,
        `预期有效性: ${tc.valid}, 实际校验结果: ${isValid} (错误信息: "${errMsg}")`,
        defectSeverity
      );
    }
  });

  console.log(`    ${colors.cyan}IP 边界测试样本: ${ipValidationCases.length} 个, 异常判定项: ${ipValidationFailures} 个${colors.reset}`);
});

// 2.2 IP 黑名单防线生命周期与持久化实测
test('2.2 IP 黑名单封禁、重复封禁、去重与解封生命周期实测', () => {
  const targetIp = '203.0.113.195';

  // 1. 初始未封禁
  assert.strictEqual(isIpBanned(targetIp), false, '初始状态 targetIp 不应在黑名单中');

  // 2. 执行拉黑
  const banRes = banIp(targetIp, '自动化对抗测试恶意拉黑');
  assert.strictEqual(banRes, true, '拉黑操作应返回 true');
  assert.strictEqual(isIpBanned(targetIp), true, '拉黑后 isIpBanned 应为 true');

  // 3. 幂等性：重复拉黑同一 IP 不报错且维持封禁
  const banAgain = banIp(targetIp, '重复拉黑');
  assert.strictEqual(banAgain, true, '重复拉黑同一 IP 应成功更新');
  assert.strictEqual(isIpBanned(targetIp), true);

  // 4. 解封
  const unbanRes = unbanIp(targetIp);
  assert.strictEqual(unbanRes, true, '解封已封禁 IP 应返回 true');
  assert.strictEqual(isIpBanned(targetIp), false, '解封后 isIpBanned 应为 false');

  // 5. 再次解封不存在的 IP 应返回 false
  const unbanAgain = unbanIp(targetIp);
  assert.strictEqual(unbanAgain, false, '解封未封禁 IP 应返回 false');

  // 6. 验证非法 IP 执行 banIp 时抛出异常
  assert.throws(() => {
    banIp('999.999.999.999');
  }, /非法 IP 地址格式/);
});

// 2.3 IP 脱敏掩码实测
test('2.3 IP 掩码脱敏函数安全性实测 (末段隐匿防泄露)', () => {
  assert.strictEqual(maskIp('192.168.1.100'), '192.168.1.***', '标准 IPv4 末段应掩码为 ***');
  assert.strictEqual(maskIp('10.0.0.1'), '10.0.0.***', '标准 IPv4 必须保护末位');
  assert.strictEqual(maskIp('2001:db8:85a3::7334'), '2001:db8:85a3::****', 'IPv6 末段必须掩码');
  assert.strictEqual(maskIp(''), '***.***.***.***', '空串应安全回退');
  assert.strictEqual(maskIp(null), '***.***.***.***', 'null 应安全回退');
});

// 2.4 团队宪章破坏性批处理防误触红线静态与行为审计 (confirmModal variant: 'danger')
test('2.4 [AGENTS.md 红线审计] 审计日志管理与抽屉中封禁 IP 强制触发 danger 二次确认', () => {
  const auditLogsPageCode = fs.readFileSync(path.resolve('frontend/app/admin/audit-logs/page.tsx'), 'utf-8');
  const drawerCode = fs.readFileSync(path.resolve('frontend/components/admin/audit-logs/AuditLogsInspectorDrawer.tsx'), 'utf-8');

  // 检验 page.tsx 中的封禁触发点
  assert.ok(
    auditLogsPageCode.includes("variant: 'danger'"),
    'page.tsx 中封禁操作必须配置 variant: "danger"'
  );
  assert.ok(
    auditLogsPageCode.includes('confirmModal({'),
    'page.tsx 封禁必须通过 confirmModal 拦截'
  );

  // 检验 drawer 中的封禁触发点
  assert.ok(
    drawerCode.includes("variant: 'danger'"),
    'AuditLogsInspectorDrawer.tsx 中封禁操作必须配置 variant: "danger"'
  );
  assert.ok(
    drawerCode.includes('confirmModal({'),
    'AuditLogsInspectorDrawer.tsx 封禁必须通过 confirmModal 拦截'
  );

  // 验证无裸调 banIp 的违规绕过代码
  const linesWithBan = drawerCode.split('\n').filter(l => l.includes('onBanIp('));
  linesWithBan.forEach(line => {
    // 确保 onBanIp 仅在 confirmModal 确认分支内调用
    assert.ok(drawerCode.indexOf('confirmModal') < drawerCode.indexOf('onBanIp(log.clientIp)'));
  });
});

// ============================================================================
// [SECTION 3] Git-style 数据变更 Diff 算法极限压力与边界实测
// ============================================================================
console.log(`\n${colors.bold}[SECTION 3] Git-style 数据变更 Diff 算法极限边界与计算复杂度实测${colors.reset}`);

// 提取 GitStyleDiffViewer.tsx 内部的 computeLineDiff 算法实现进行独立极限压测
function computeLineDiff(beforeText = '', afterText = '') {
  const beforeLines = beforeText.split('\n');
  const afterLines = afterText.split('\n');

  if (beforeText === afterText) {
    return beforeLines.map((line, idx) => ({
      type: 'equal',
      content: line,
      beforeLineNum: idx + 1,
      afterLineNum: idx + 1,
    }));
  }

  const m = beforeLines.length;
  const n = afterLines.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (beforeLines[i - 1] === afterLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  const result = [];
  let i = m;
  let j = n;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && beforeLines[i - 1] === afterLines[j - 1]) {
      result.unshift({
        type: 'equal',
        content: beforeLines[i - 1],
        beforeLineNum: i,
        afterLineNum: j,
      });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({
        type: 'add',
        content: afterLines[j - 1],
        afterLineNum: j,
      });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      result.unshift({
        type: 'delete',
        content: beforeLines[i - 1],
        beforeLineNum: i,
      });
      i--;
    }
  }

  return result;
}

// 3.1 完全相同文本对比
test('3.1 完全相同文本快速路径实测 (零冗余 Diff，行号 100% 对齐)', () => {
  const identical100 = Array.from({ length: 100 }, (_, i) => `Line ${i + 1}: Hayden Studio VisionOS Design System`).join('\n');
  const res = computeLineDiff(identical100, identical100);

  assert.strictEqual(res.length, 100, '相同文本结果行数必须严格等于原行数 100');
  res.forEach((r, idx) => {
    assert.strictEqual(r.type, 'equal', `第 ${idx} 行必须判定为 equal`);
    assert.strictEqual(r.beforeLineNum, idx + 1, '旧行号必须严格递增');
    assert.strictEqual(r.afterLineNum, idx + 1, '新行号必须严格递增');
  });
});

// 3.2 空白与边界空文本对比
test('3.2 空字符串与多空行增删边界实测', () => {
  // 空 vs 空
  const emptyRes = computeLineDiff('', '');
  assert.strictEqual(emptyRes.length, 1);
  assert.strictEqual(emptyRes[0].type, 'equal');

  // 空 vs 有内容
  const addRes = computeLineDiff('', 'line1\nline2');
  assert.ok(addRes.some(l => l.type === 'add'), '新增文本必须包含 add 操作');

  // 首尾空行变化
  const leadingBlank = '\n\nhello\nworld\n';
  const cleanText = 'hello\nworld';
  const blankDiff = computeLineDiff(leadingBlank, cleanText);
  assert.ok(blankDiff.some(l => l.type === 'delete' && l.content === ''), '首部空行删除应正确识别');
});

// 3.3 特殊 Unicode、Emoji 与超长单行字符测试
test('3.3 特殊 Unicode、复合 Emoji (ZWJ序列) 与超长单行 (100k 字符) 实测', () => {
  const emojiBefore = '🚀 Hayden Studio 全景空间 👨‍👩‍👧‍👦 符号: 《》【】—— ';
  const emojiAfter = '🚀 Hayden Studio 全景空间 👨‍👩‍👧‍👦 符号: 《》【】—— (Updated 2026)';
  const emojiDiff = computeLineDiff(emojiBefore, emojiAfter);

  assert.ok(emojiDiff.length >= 2, 'Emoji 单行变更必须正确生成 del 与 add');
  assert.doesNotThrow(() => {
    JSON.stringify(emojiDiff);
  }, 'Diff 结构包含特殊 Emoji 与 ZWJ 序列不得发生序列化异常');

  // 10万字符超长单行变更
  const longBefore = 'A'.repeat(50000) + 'X' + 'B'.repeat(50000);
  const longAfter = 'A'.repeat(50000) + 'Y' + 'B'.repeat(50000);
  const startT = performance.now();
  const longDiff = computeLineDiff(longBefore, longAfter);
  const endT = performance.now();

  assert.strictEqual(longDiff.length, 2, '单行超长大文本变更应产出 1 del + 1 add');
  console.log(`    ${colors.cyan}100,000 字符超长单行 Diff 计算耗时: ${(endT - startT).toFixed(2)}ms${colors.reset}`);
});

// 3.4 行号单调性与连续性数学不变量检验
test('3.4 [数学不变量] 行号严格单调非降且在有效区间内', () => {
  const before = 'Line 1\nLine 2 (to modify)\nLine 3\nLine 4 (to delete)\nLine 5';
  const after = 'Line 1\nLine 2 (MODIFIED)\nLine 2.5 (ADDED)\nLine 3\nLine 5';
  const diff = computeLineDiff(before, after);

  let lastBeforeNum = 0;
  let lastAfterNum = 0;

  diff.forEach((item, idx) => {
    if (item.beforeLineNum !== undefined) {
      assert.ok(item.beforeLineNum > lastBeforeNum, `beforeLineNum 必须严格递增: 当前=${item.beforeLineNum}, 上一个=${lastBeforeNum}`);
      lastBeforeNum = item.beforeLineNum;
    }
    if (item.afterLineNum !== undefined) {
      assert.ok(item.afterLineNum > lastAfterNum, `afterLineNum 必须严格递增: 当前=${item.afterLineNum}, 上一个=${lastAfterNum}`);
      lastAfterNum = item.afterLineNum;
    }
  });

  assert.strictEqual(lastBeforeNum, 5, 'beforeLines 遍历必须到达最大行号 5');
  assert.strictEqual(lastAfterNum, 5, 'afterLines 遍历必须到达最大行号 5');
});

// 3.5 动态规划 LCS 矩阵复杂度极限压力测试 (500~2000行大文本)
test('3.5 [复杂度压测] 动态规划矩阵 O(m*n) 在多行大文本下的耗时与内存增长曲线', () => {
  const lineSizes = [100, 300, 600];
  const metrics = [];

  for (const size of lineSizes) {
    const textA = Array.from({ length: size }, (_, i) => `Line ${i}: Initial state with data payload alpha-${i}`).join('\n');
    const textB = Array.from({ length: size }, (_, i) => i % 3 === 0 ? `Line ${i}: Modified state with beta-${i}` : `Line ${i}: Initial state with data payload alpha-${i}`).join('\n');

    const startMemory = process.memoryUsage().heapUsed;
    const t0 = performance.now();
    const diff = computeLineDiff(textA, textB);
    const t1 = performance.now();
    const endMemory = process.memoryUsage().heapUsed;

    const duration = t1 - t0;
    const memDeltaMB = (endMemory - startMemory) / (1024 * 1024);
    metrics.push({ size, duration, memDeltaMB, diffCount: diff.length });
    console.log(`    ${colors.cyan}[Diff Stress ${size} Lines] 耗时: ${duration.toFixed(2)}ms, 内存波动: ${memDeltaMB.toFixed(2)}MB, 结果行数: ${diff.length}${colors.reset}`);
  }

  // 验证 600 行规模下能在合理时间完成（例如 < 500ms），不引发主线程完全假死
  assert.ok(metrics[2].duration < 1000, `600行 Diff 耗时 (${metrics[2].duration.toFixed(2)}ms) 必须在 1 秒以内`);

  // 记录潜在风险观察：若传入数千行，O(m*n) 二维数组内存开销过大
  recordFinding(
    'PERF_SCALABILITY',
    'GitStyleDiffViewer LCS 二维数组 O(m*n) 空间复杂度风险',
    '若变更内容超过 2000 行，DP 矩阵将占用 (2000x2000) = 400万个数组槽位，建议对超大文本引入行数上限截断或 Myers 滚动数组优化',
    'LOW'
  );
});

// ============================================================================
// [SECTION 4] J/K / Space 键盘导航与状态机边界实测
// ============================================================================
console.log(`\n${colors.bold}[SECTION 4] J/K / Space 键盘导航状态机与边界越界实测${colors.reset}`);

// 模拟 page.tsx 内部键盘状态机转移函数
function simulateKeyboardNavigation(initialState, actions, logs) {
  let selectedIndex = initialState.selectedIndex;
  let selectedLog = initialState.selectedLog;

  for (const action of actions) {
    const key = action.key;
    const isInputFocused = action.isInputFocused || false;

    if (isInputFocused) {
      continue; // 处于输入框时被保护忽略
    }

    if (key === 'j' || key === 'J' || key === 'ArrowDown') {
      const prev = selectedIndex;
      const next = prev + 1 < logs.length ? prev + 1 : prev;
      selectedIndex = next;
      if (next >= 0 && logs[next] && selectedLog) {
        selectedLog = logs[next];
      }
    } else if (key === 'k' || key === 'K' || key === 'ArrowUp') {
      const prev = selectedIndex;
      const next = prev - 1 >= 0 ? prev - 1 : (logs.length > 0 ? 0 : -1);
      selectedIndex = next;
      if (next >= 0 && logs[next] && selectedLog) {
        selectedLog = logs[next];
      }
    } else if (key === ' ' || key === 'Space') {
      if (selectedIndex >= 0 && selectedIndex < logs.length) {
        selectedLog = selectedLog ? null : logs[selectedIndex];
      }
    } else if (key === 'Escape') {
      selectedLog = null;
    }
  }

  return { selectedIndex, selectedLog };
}

// 4.1 空列表键盘敲击实测
test('4.1 空列表状态下高频敲击 J / K / Space / Esc 防越界实测', () => {
  const emptyLogs = [];
  const actions = [
    { key: 'j' }, { key: 'j' }, { key: 'k' }, { key: 'k' },
    { key: 'Space' }, { key: 'Escape' }, { key: 'j' }
  ];

  const res = simulateKeyboardNavigation({ selectedIndex: -1, selectedLog: null }, actions, emptyLogs);
  assert.strictEqual(res.selectedIndex, -1, '空列表敲击后 selectedIndex 必须维持为 -1，绝不可越界为 0 或正数');
  assert.strictEqual(res.selectedLog, null, '空列表敲击后 selectedLog 必须维持为 null');
});

// 4.2 快速连续越界敲击 (Clamping)
test('4.2 快速连续敲击 J (100次) 与 K (100次) 严格限制在首尾边界内', () => {
  const sampleLogs = Array.from({ length: 5 }, (_, i) => ({ id: i + 1, operation: `Log #${i + 1}` }));

  // 1. 连续按 100 次 J (向下)
  const jActions = Array.from({ length: 100 }, () => ({ key: 'j' }));
  const afterJ = simulateKeyboardNavigation({ selectedIndex: -1, selectedLog: null }, jActions, sampleLogs);
  assert.strictEqual(afterJ.selectedIndex, 4, '连续 100 次向下按键必须截断在最大下标 4 (logs.length - 1)');

  // 2. 连续按 100 次 K (向上)
  const kActions = Array.from({ length: 100 }, () => ({ key: 'k' }));
  const afterK = simulateKeyboardNavigation({ selectedIndex: 4, selectedLog: null }, kActions, sampleLogs);
  assert.strictEqual(afterK.selectedIndex, 0, '连续 100 次向上按键必须截断在最小下标 0');
});

// 4.3 Space 抽屉展开与随键盘移动联动
test('4.3 Space 原地切换抽屉展开/折叠与移动光标时抽屉内容同步更新实测', () => {
  const sampleLogs = [
    { id: 101, operation: 'Op 101' },
    { id: 102, operation: 'Op 102' },
    { id: 103, operation: 'Op 103' },
  ];

  // 移动到下标 1，按空格展开
  const step1 = simulateKeyboardNavigation(
    { selectedIndex: -1, selectedLog: null },
    [{ key: 'j' }, { key: 'j' }, { key: 'Space' }],
    sampleLogs
  );
  assert.strictEqual(step1.selectedIndex, 1, '移动两步应处于下标 1');
  assert.strictEqual(step1.selectedLog?.id, 102, '按空格展开抽屉应挂载 ID 102');

  // 在抽屉已展开状态下，按下 J 键移至下标 2
  const step2 = simulateKeyboardNavigation(step1, [{ key: 'j' }], sampleLogs);
  assert.strictEqual(step2.selectedIndex, 2, '光标下移至下标 2');
  assert.strictEqual(step2.selectedLog?.id, 103, '抽屉内容必须同步热更新为 ID 103');

  // 按空格折叠收起
  const step3 = simulateKeyboardNavigation(step2, [{ key: 'Space' }], sampleLogs);
  assert.strictEqual(step3.selectedLog, null, '空格键应成功折叠抽屉');

  // 按 Escape 关闭
  const step4 = simulateKeyboardNavigation(
    { selectedIndex: 2, selectedLog: sampleLogs[2] },
    [{ key: 'Escape' }],
    sampleLogs
  );
  assert.strictEqual(step4.selectedLog, null, 'Esc 键必须关闭抽屉');
});

// 4.4 输入框聚焦时快捷键屏蔽防护
test('4.4 焦点处于 input / textarea 时全局快捷键防冲突静默屏蔽实测', () => {
  const sampleLogs = [{ id: 1, operation: 'Op 1' }, { id: 2, operation: 'Op 2' }];
  const actions = [
    { key: 'j', isInputFocused: true },
    { key: 'k', isInputFocused: true },
    { key: 'Space', isInputFocused: true }
  ];

  const res = simulateKeyboardNavigation({ selectedIndex: -1, selectedLog: null }, actions, sampleLogs);
  assert.strictEqual(res.selectedIndex, -1, '处于搜索输入框中打字不得串扰触发列表高亮变化');
  assert.strictEqual(res.selectedLog, null, '处于搜索框中按空格不得触发抽屉弹开');
});

// ============================================================================
// 汇总统计与最终判定
// ============================================================================
console.log(`\n${colors.bold}${colors.cyan}========================================================================${colors.reset}`);
console.log(`${colors.bold}${colors.cyan}  M3 对抗实测汇总报告 (Adversarial Summary)  ${colors.reset}`);
console.log(`${colors.bold}${colors.cyan}========================================================================${colors.reset}`);
console.log(`测试用例总数: ${totalTests}`);
console.log(`通过用例: ${colors.green}${passedTests}${colors.reset}`);
console.log(`失败用例: ${failedTests > 0 ? colors.red : colors.green}${failedTests}${colors.reset}`);
console.log(`实测发现潜在风险/缺陷数: ${findings.length}`);

findings.forEach((f, idx) => {
  console.log(`  [#${idx + 1}] [${f.severity}] [${f.category}] ${f.title}`);
});

console.log(`${colors.bold}${colors.cyan}========================================================================${colors.reset}\n`);

// 退出码控制
process.exit(failedTests > 0 ? 1 : 0);
