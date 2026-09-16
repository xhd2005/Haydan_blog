// e2e/utils/assertions.mjs

export class AssertionError extends Error {
  constructor(message, actual, expected) {
    super(message);
    this.name = 'AssertionError';
    this.actual = actual;
    this.expected = expected;
  }
}

function safeStringify(val) {
  try {
    return JSON.stringify(val);
  } catch {
    return String(val);
  }
}

export function expect(actual) {
  return {
    toBe(expected) {
      if (actual !== expected) {
        throw new AssertionError(
          `Expected ${safeStringify(actual)} to strictly equal ${safeStringify(expected)}`,
          actual,
          expected
        );
      }
    },
    toEqual(expected) {
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
      if (actual === undefined || actual === null) {
        throw new AssertionError(`Expected value to be defined, but got ${actual}`, actual, 'defined');
      }
    },
    toBeNull() {
      if (actual !== null) {
        throw new AssertionError(`Expected null, but got ${safeStringify(actual)}`, actual, null);
      }
    },
    toBeUndefined() {
      if (actual !== undefined) {
        throw new AssertionError(`Expected undefined, but got ${safeStringify(actual)}`, actual, undefined);
      }
    },
    toBeTruthy() {
      if (!actual) {
        throw new AssertionError(`Expected truthy value, but got ${safeStringify(actual)}`, actual, true);
      }
    },
    toBeFalsy() {
      if (actual) {
        throw new AssertionError(`Expected falsy value, but got ${safeStringify(actual)}`, actual, false);
      }
    },
    toBeGreaterThan(expected) {
      if (typeof actual !== 'number' || actual <= expected) {
        throw new AssertionError(
          `Expected ${actual} to be greater than ${expected}`,
          actual,
          `> ${expected}`
        );
      }
    },
    toBeGreaterThanOrEqual(expected) {
      if (typeof actual !== 'number' || actual < expected) {
        throw new AssertionError(
          `Expected ${actual} to be greater than or equal to ${expected}`,
          actual,
          `>= ${expected}`
        );
      }
    },
    toBeLessThan(expected) {
      if (typeof actual !== 'number' || actual >= expected) {
        throw new AssertionError(
          `Expected ${actual} to be less than ${expected}`,
          actual,
          `< ${expected}`
        );
      }
    },
    toContain(expected) {
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
      if (typeof actual !== 'string' || !regex.test(actual)) {
        throw new AssertionError(
          `Expected "${actual}" to match regex ${regex}`,
          actual,
          regex.toString()
        );
      }
    },
    toNotMatch(regex) {
      if (typeof actual === 'string' && regex.test(actual)) {
        throw new AssertionError(
          `Expected "${actual}" to NOT match regex ${regex}`,
          actual,
          `NOT ${regex}`
        );
      }
    },
    toHaveProperty(prop) {
      if (actual === null || actual === undefined || !(prop in actual)) {
        throw new AssertionError(
          `Expected object to have property "${prop}", but properties are: ${Object.keys(actual || {})}`,
          actual,
          prop
        );
      }
    },
    toBeOneOf(array) {
      if (!array.includes(actual)) {
        throw new AssertionError(
          `Expected ${safeStringify(actual)} to be one of ${safeStringify(array)}`,
          actual,
          array
        );
      }
    }
  };
}
