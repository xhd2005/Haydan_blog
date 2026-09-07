// e2e/run-all.mjs
import { Reporter } from './utils/reporter.mjs';
import { TestHarness } from './utils/test-harness.mjs';
import { registerTier1Tests } from './tiers/tier1-feature-coverage.mjs';
import { registerTier2Tests } from './tiers/tier2-boundary-security.mjs';
import { registerTier3Tests } from './tiers/tier3-cross-feature.mjs';
import { registerTier4Tests } from './tiers/tier4-real-scenarios.mjs';
import { config } from './config.mjs';

async function main() {
  const args = process.argv.slice(2);
  let tierFilter = null;
  const tierArg = args.find(a => a.startsWith('--tier='));
  if (tierArg) {
    tierFilter = `Tier ${tierArg.split('=')[1]}`;
  }

  console.log(`
╔══════════════════════════════════════════════════════════════════════╗
║        Hayden Xue Blog - Opaque-box E2E Test Suite Runner            ║
║  Backend Target : ${config.apiBase.padEnd(50)} ║
║  Frontend Target: ${config.frontendBase.padEnd(50)} ║
║  Mode           : ${(config.mockMode ? 'Contract Oracle Reference Mode' : 'Live Services Integration Mode').padEnd(50)} ║
╚══════════════════════════════════════════════════════════════════════╝
`);

  const reporter = new Reporter();
  const harness = new TestHarness(reporter);

  // Register all tiers
  registerTier1Tests(harness);
  registerTier2Tests(harness);
  registerTier3Tests(harness);
  registerTier4Tests(harness);

  const summary = await harness.runAll(tierFilter);

  if (summary.failed > 0 && !args.includes('--allow-failures')) {
    process.exitCode = 1;
  } else {
    process.exitCode = 0;
  }
}

main().catch(err => {
  console.error('Fatal Test Runner Error:', err);
  process.exitCode = 1;
});
