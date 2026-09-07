// e2e/utils/reporter.mjs

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
};

export class Reporter {
  constructor() {
    this.results = [];
    this.currentSuite = null;
    this.startTime = Date.now();
  }

  startSuite(name, tier = '') {
    this.currentSuite = {
      name,
      tier,
      tests: [],
      startTime: Date.now(),
    };
    console.log(`\n${colors.bright}${colors.cyan}======================================================================${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}▶  SUITE: ${name} ${tier ? `[${tier}]` : ''}${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}======================================================================${colors.reset}`);
  }

  recordTest(testResult) {
    const { id, title, status, durationMs, error } = testResult;
    if (this.currentSuite) {
      this.currentSuite.tests.push(testResult);
    }
    this.results.push(testResult);

    if (status === 'PASS') {
      console.log(`  ${colors.green}✔ [PASS]${colors.reset} ${colors.white}${id}${colors.reset} - ${title} ${colors.dim}(${durationMs}ms)${colors.reset}`);
    } else if (status === 'FAIL') {
      console.log(`  ${colors.red}✖ [FAIL]${colors.reset} ${colors.bright}${id}${colors.reset} - ${title} ${colors.dim}(${durationMs}ms)${colors.reset}`);
      if (error) {
        console.log(`     ${colors.red}Error: ${error.message}${colors.reset}`);
        if (error.actual !== undefined || error.expected !== undefined) {
          console.log(`     ${colors.yellow}Expected: ${JSON.stringify(error.expected)}${colors.reset}`);
          console.log(`     ${colors.yellow}Actual:   ${JSON.stringify(error.actual)}${colors.reset}`);
        }
      }
    } else if (status === 'SKIP') {
      console.log(`  ${colors.yellow}○ [SKIP]${colors.reset} ${id} - ${title} (Skipped)`);
    }
  }

  endSuite() {
    if (this.currentSuite) {
      const suiteDuration = Date.now() - this.currentSuite.startTime;
      const passed = this.currentSuite.tests.filter(t => t.status === 'PASS').length;
      const failed = this.currentSuite.tests.filter(t => t.status === 'FAIL').length;
      const skipped = this.currentSuite.tests.filter(t => t.status === 'SKIP').length;
      console.log(`${colors.dim}Suite completed in ${suiteDuration}ms | Passed: ${passed}, Failed: ${failed}, Skipped: ${skipped}${colors.reset}\n`);
    }
  }

  printSummary() {
    const totalTime = Date.now() - this.startTime;
    const total = this.results.length;
    const passed = this.results.filter(t => t.status === 'PASS').length;
    const failed = this.results.filter(t => t.status === 'FAIL').length;
    const skipped = this.results.filter(t => t.status === 'SKIP').length;
    const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : '0.0';

    console.log(`\n${colors.bright}======================================================================${colors.reset}`);
    console.log(`${colors.bright}                   E2E TEST SUITE EXECUTION SUMMARY                  ${colors.reset}`);
    console.log(`${colors.bright}======================================================================${colors.reset}`);

    // Group by tier
    const tiers = ['Tier 1', 'Tier 2', 'Tier 3', 'Tier 4'];
    for (const tier of tiers) {
      const tierTests = this.results.filter(t => t.tier === tier);
      if (tierTests.length > 0) {
        const tPassed = tierTests.filter(t => t.status === 'PASS').length;
        const tFailed = tierTests.filter(t => t.status === 'FAIL').length;
        const tSkipped = tierTests.filter(t => t.status === 'SKIP').length;
        const color = tFailed === 0 ? colors.green : colors.yellow;
        console.log(` ${colors.bright}${tier.padEnd(8)}:${colors.reset} Total: ${String(tierTests.length).padStart(2)} | Passed: ${color}${String(tPassed).padStart(2)}${colors.reset} | Failed: ${tFailed > 0 ? colors.red : colors.dim}${String(tFailed).padStart(2)}${colors.reset} | Skipped: ${String(tSkipped).padStart(2)}`);
      }
    }

    console.log(`${colors.dim}----------------------------------------------------------------------${colors.reset}`);
    console.log(` ${colors.bright}Overall  :${colors.reset} Total: ${String(total).padStart(2)} | Passed: ${colors.green}${String(passed).padStart(2)}${colors.reset} | Failed: ${failed > 0 ? colors.red : colors.dim}${String(failed).padStart(2)}${colors.reset} | Skipped: ${String(skipped).padStart(2)}`);
    console.log(` ${colors.bright}Pass Rate:${colors.reset} ${passed === total ? colors.green : (passRate > 80 ? colors.yellow : colors.red)}${passRate}%${colors.reset}`);
    console.log(` ${colors.bright}Duration :${colors.reset} ${(totalTime / 1000).toFixed(2)}s`);
    console.log(`${colors.bright}======================================================================${colors.reset}\n`);

    return {
      total,
      passed,
      failed,
      skipped,
      passRate: parseFloat(passRate),
      durationMs: totalTime,
      results: this.results,
    };
  }
}
