// e2e/utils/test-harness.mjs
import { config } from '../config.mjs';

export class TestHarness {
  constructor(reporter) {
    this.reporter = reporter;
    this.suites = [];
  }

  createSuite(suiteName, tier) {
    const suite = {
      name: suiteName,
      tier,
      tests: [],
      addTest(id, title, testFn, options = {}) {
        suite.tests.push({
          id,
          title,
          testFn,
          options,
          tier,
        });
      },
    };
    this.suites.push(suite);
    return suite;
  }

  async runSuite(suite) {
    this.reporter.startSuite(suite.name, suite.tier);
    for (const testCase of suite.tests) {
      if (testCase.options.skip) {
        this.reporter.recordTest({
          id: testCase.id,
          title: testCase.title,
          status: 'SKIP',
          tier: suite.tier,
          durationMs: 0,
        });
        continue;
      }

      const start = Date.now();
      try {
        await testCase.testFn();
        const durationMs = Date.now() - start;
        this.reporter.recordTest({
          id: testCase.id,
          title: testCase.title,
          status: 'PASS',
          tier: suite.tier,
          durationMs,
        });
      } catch (err) {
        const durationMs = Date.now() - start;
        this.reporter.recordTest({
          id: testCase.id,
          title: testCase.title,
          status: 'FAIL',
          tier: suite.tier,
          durationMs,
          error: {
            message: err.message || String(err),
            actual: err.actual,
            expected: err.expected,
            stack: err.stack,
          },
        });
      }
    }
    this.reporter.endSuite();
  }

  async runAll(tierFilter = null) {
    for (const suite of this.suites) {
      if (!tierFilter || suite.tier.toLowerCase() === tierFilter.toLowerCase() || suite.tier.toLowerCase().includes(tierFilter.toLowerCase())) {
        await this.runSuite(suite);
      }
    }
    return this.reporter.printSummary();
  }
}
