// frontend/tests/e2e/utils/assertions.mjs

export class AssertionError extends Error {
  constructor(message, actual, expected) {
    super(message);
    this.name = 'AssertionError';
    this.actual = actual;
    this.expected = expected;
  }
}

let assertionCounter = 0;

export function getAssertionCount() {
  return assertionCounter;
}

export function resetAssertionCount() {
  assertionCounter = 0;
}

function countAssert() {
  assertionCounter++;
}

function safeStringify(val) {
  if (val === undefined) return 'undefined';
  try {
    return JSON.stringify(val);
  } catch {
    return String(val);
  }
}

export function expect(actual) {
  return {
    toBe(expected) {
      countAssert();
      if (actual !== expected) {
        throw new AssertionError(
          `Expected ${safeStringify(actual)} to strictly equal ${safeStringify(expected)}`,
          actual,
          expected
        );
      }
    },
    toEqual(expected) {
      countAssert();
      const actualStr = safeStringify(actual);
      const expectedStr = safeStringify(expected);
      if (actualStr !== expectedStr) {
        throw new AssertionError(
          `Expected ${actualStr} to deeply equal ${expectedStr}`,
          actual,
          expected
        );
      }
    },
    toBeDefined() {
      countAssert();
      if (actual === undefined || actual === null) {
        throw new AssertionError(`Expected value to be defined, but got ${actual}`, actual, 'defined');
      }
    },
    toBeNull() {
      countAssert();
      if (actual !== null) {
        throw new AssertionError(`Expected null, but got ${safeStringify(actual)}`, actual, null);
      }
    },
    toBeUndefined() {
      countAssert();
      if (actual !== undefined) {
        throw new AssertionError(`Expected undefined, but got ${safeStringify(actual)}`, actual, undefined);
      }
    },
    toBeTruthy() {
      countAssert();
      if (!actual) {
        throw new AssertionError(`Expected truthy value, but got ${safeStringify(actual)}`, actual, true);
      }
    },
    toBeFalsy() {
      countAssert();
      if (actual) {
        throw new AssertionError(`Expected falsy value, but got ${safeStringify(actual)}`, actual, false);
      }
    },
    toBeGreaterThan(expected) {
      countAssert();
      if (typeof actual !== 'number' || actual <= expected) {
        throw new AssertionError(
          `Expected ${actual} to be greater than ${expected}`,
          actual,
          `> ${expected}`
        );
      }
    },
    toBeGreaterThanOrEqual(expected) {
      countAssert();
      if (typeof actual !== 'number' || actual < expected) {
        throw new AssertionError(
          `Expected ${actual} to be greater than or equal to ${expected}`,
          actual,
          `>= ${expected}`
        );
      }
    },
    toBeLessThan(expected) {
      countAssert();
      if (typeof actual !== 'number' || actual >= expected) {
        throw new AssertionError(
          `Expected ${actual} to be less than ${expected}`,
          actual,
          `< ${expected}`
        );
      }
    },
    toBeLessThanOrEqual(expected) {
      countAssert();
      if (typeof actual !== 'number' || actual > expected) {
        throw new AssertionError(
          `Expected ${actual} to be less than or equal to ${expected}`,
          actual,
          `<= ${expected}`
        );
      }
    },
    toContain(expected) {
      countAssert();
      if (typeof actual === 'string' || Array.isArray(actual)) {
        if (!actual.includes(expected)) {
          throw new AssertionError(
            `Expected ${safeStringify(actual)} to contain ${safeStringify(expected)}`,
            actual,
            expected
          );
        }
      } else {
        throw new AssertionError(`Expected string or array for toContain, got ${typeof actual}`, actual, expected);
      }
    },
    toNotContain(expected) {
      countAssert();
      if (typeof actual === 'string' || Array.isArray(actual)) {
        if (actual.includes(expected)) {
          throw new AssertionError(
            `Expected ${safeStringify(actual)} to NOT contain ${safeStringify(expected)}`,
            actual,
            `NOT ${expected}`
          );
        }
      } else {
        throw new AssertionError(`Expected string or array for toNotContain, got ${typeof actual}`, actual, expected);
      }
    },
    toMatch(regex) {
      countAssert();
      if (typeof actual !== 'string' || !regex.test(actual)) {
        throw new AssertionError(
          `Expected "${actual}" to match regex ${regex}`,
          actual,
          regex.toString()
        );
      }
    },
    toNotMatch(regex) {
      countAssert();
      if (typeof actual === 'string' && regex.test(actual)) {
        throw new AssertionError(
          `Expected "${actual}" to NOT match regex ${regex}`,
          actual,
          `NOT ${regex}`
        );
      }
    },
    toHaveProperty(prop) {
      countAssert();
      if (actual === null || actual === undefined || !(prop in actual)) {
        throw new AssertionError(
          `Expected object to have property "${prop}", but properties are: ${Object.keys(actual || {})}`,
          actual,
          prop
        );
      }
    },
    toBeOneOf(array) {
      countAssert();
      if (!array.includes(actual)) {
        throw new AssertionError(
          `Expected ${safeStringify(actual)} to be one of ${safeStringify(array)}`,
          actual,
          array
        );
      }
    },
    toThrow(expectedErrorPattern) {
      countAssert();
      if (typeof actual !== 'function') {
        throw new AssertionError('Expected a function to test for throwing error', actual, 'function');
      }
      let threw = false;
      let errorThrown = null;
      try {
        actual();
      } catch (err) {
        threw = true;
        errorThrown = err;
      }
      if (!threw) {
        throw new AssertionError('Expected function to throw an error, but it did not', null, 'Error');
      }
      if (expectedErrorPattern) {
        const message = errorThrown.message || String(errorThrown);
        if (expectedErrorPattern instanceof RegExp) {
          if (!expectedErrorPattern.test(message)) {
            throw new AssertionError(
              `Expected error message "${message}" to match ${expectedErrorPattern}`,
              message,
              expectedErrorPattern.toString()
            );
          }
        } else if (typeof expectedErrorPattern === 'string') {
          if (!message.includes(expectedErrorPattern)) {
            throw new AssertionError(
              `Expected error message "${message}" to include "${expectedErrorPattern}"`,
              message,
              expectedErrorPattern
            );
          }
        }
      }
    },
    async rejects(expectedErrorPattern) {
      countAssert();
      let threw = false;
      let errorThrown = null;
      try {
        if (typeof actual === 'function') {
          await actual();
        } else {
          await actual;
        }
      } catch (err) {
        threw = true;
        errorThrown = err;
      }
      if (!threw) {
        throw new AssertionError('Expected async operation to reject, but it resolved successfully', null, 'Rejection');
      }
      if (expectedErrorPattern) {
        const message = errorThrown.message || String(errorThrown);
        if (expectedErrorPattern instanceof RegExp) {
          if (!expectedErrorPattern.test(message)) {
            throw new AssertionError(
              `Expected rejection message "${message}" to match ${expectedErrorPattern}`,
              message,
              expectedErrorPattern.toString()
            );
          }
        } else if (typeof expectedErrorPattern === 'string') {
          if (!message.includes(expectedErrorPattern)) {
            throw new AssertionError(
              `Expected rejection message "${message}" to include "${expectedErrorPattern}"`,
              message,
              expectedErrorPattern
            );
          }
        }
      }
    }
  };
}
