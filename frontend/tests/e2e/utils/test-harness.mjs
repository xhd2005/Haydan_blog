// frontend/tests/e2e/utils/test-harness.mjs

export class TestHarness {
  constructor(reporter, options = {}) {
    this.reporter = reporter;
    this.options = options;
    this.suites = [];
  }

  createSuite(suiteName, tier) {
    const suite = {
      name: suiteName,
      tier,
      tests: [],
      beforeAllHooks: [],
      afterAllHooks: [],
      beforeEachHooks: [],
      afterEachHooks: [],
      beforeAll(fn) {
        suite.beforeAllHooks.push(fn);
      },
      afterAll(fn) {
        suite.afterAllHooks.push(fn);
      },
      beforeEach(fn) {
        suite.beforeEachHooks.push(fn);
      },
      afterEach(fn) {
        suite.afterEachHooks.push(fn);
      },
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

    try {
      for (const hook of suite.beforeAllHooks) {
        await hook();
      }
    } catch (err) {
      console.error(`Error in beforeAll hook for suite ${suite.name}:`, err);
    }

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

      try {
        for (const hook of suite.beforeEachHooks) {
          await hook();
        }
      } catch (hookErr) {
        console.error(`Error in beforeEach hook:`, hookErr);
      }

      const start = Date.now();
      try {
        const timeoutPromise = new Promise((_, reject) => {
          const timer = setTimeout(() => {
            reject(new Error(`Test timed out after ${testCase.options.timeout || 15000}ms`));
          }, testCase.options.timeout || 15000);
          if (timer.unref) timer.unref();
        });

        await Promise.race([testCase.testFn(), timeoutPromise]);
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

        if (this.options.bail) {
          console.log(`\n[BAIL] Stopping test run due to failure in ${testCase.id}`);
          break;
        }
      } finally {
        try {
          for (const hook of suite.afterEachHooks) {
            await hook();
          }
        } catch (hookErr) {
          console.error(`Error in afterEach hook:`, hookErr);
        }
      }
    }

    try {
      for (const hook of suite.afterAllHooks) {
        await hook();
      }
    } catch (err) {
      console.error(`Error in afterAll hook for suite ${suite.name}:`, err);
    }

    this.reporter.endSuite();
  }

  async runAll(tierFilter = null) {
    for (const suite of this.suites) {
      if (
        !tierFilter ||
        suite.tier.toLowerCase() === tierFilter.toLowerCase() ||
        suite.tier.toLowerCase().includes(tierFilter.toLowerCase())
      ) {
        await this.runSuite(suite);
        if (this.options.bail && this.reporter.results.some(r => r.status === 'FAIL')) {
          break;
        }
      }
    }
    return this.reporter.printSummary();
  }
}
