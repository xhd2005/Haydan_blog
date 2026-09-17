#!/usr/bin/env node
// frontend/tests/e2e/runner.mjs

import { Reporter } from './utils/reporter.mjs';
import { TestHarness } from './utils/test-harness.mjs';
import { registerTier1Tests } from './tiers/tier1-core-features.mjs';
import { registerTier2Tests } from './tiers/tier2-boundary-defense.mjs';
import { registerTier3Tests } from './tiers/tier3-pairwise-integration.mjs';
import { registerTier4Tests } from './tiers/tier4-real-workloads.mjs';

function parseArgs() {
  const args = process.argv.slice(2);
  let tierFilter = null;
  let verbose = false;
  let bail = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--tier=')) {
      tierFilter = `Tier ${arg.split('=')[1]}`;
    } else if (arg === '-t' && args[i + 1]) {
      tierFilter = `Tier ${args[i + 1]}`;
      i++;
    } else if (arg === '--verbose' || arg === '-v') {
      verbose = true;
    } else if (arg === '--bail' || arg === '-b') {
      bail = true;
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
Hayden Studio VisionOS E2E Test Suite Runner
Usage:
  node frontend/tests/e2e/runner.mjs [options]

Options:
  --tier=<1|2|3|4>    只运行指定 Tier 的测试用例
  -t <1|2|3|4>        同 --tier
  --verbose, -v       输出详细调试与错误堆栈
  --bail, -b          首次失败立即中止测试运行
  --help, -h          显示帮助信息
`);
      process.exit(0);
    }
  }

  return { tierFilter, verbose, bail };
}

async function main() {
  const { tierFilter, verbose, bail } = parseArgs();

  console.log(`
┌──────────────────────────────────────────────────────────────────────┐
│       HAYDEN STUDIO VISIONOS REDESIGN E2E AUTOMATION RUNNER          │
│       Opaque-box Contract & Behavior Verification Infrastructure     │
└──────────────────────────────────────────────────────────────────────┘
  `);

  const reporter = new Reporter({ verbose });
  const harness = new TestHarness(reporter, { bail });

  // 注册所有测试分层用例
  registerTier1Tests(harness);
  registerTier2Tests(harness);
  registerTier3Tests(harness);
  registerTier4Tests(harness);

  if (tierFilter) {
    console.log(`[FILTER] 正在运行指定测试分层: ${tierFilter}\n`);
  } else {
    console.log(`[FULL RUN] 正在按序执行全部分层 (Tier 1 ~ Tier 4)...\n`);
  }

  const summary = await harness.runAll(tierFilter);

  if (summary.failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main().catch(err => {
  console.error('Fatal Runner Error:', err);
  process.exit(1);
});
