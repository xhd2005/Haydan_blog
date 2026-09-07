// e2e/config.mjs
export const config = {
  apiBase: process.env.API_BASE || 'http://localhost:8080',
  frontendBase: process.env.FRONTEND_BASE || 'http://localhost:3000',
  admin: {
    username: process.env.ADMIN_USER || 'admin',
    password: process.env.ADMIN_PASS || 'admin123',
  },
  readerDefaults: {
    password: process.env.READER_PASS || 'ReaderPass123!',
    emailDomain: 'example.com',
  },
  timeoutMs: parseInt(process.env.TEST_TIMEOUT || '10000', 10),
  verbose: process.env.VERBOSE === 'true' || process.argv.includes('--verbose'),
  mockMode: process.env.MOCK_ORACLE === 'true' || process.argv.includes('--mock-oracle'),
};

export function createRandomId(prefix = 'test') {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 7);
  return `${prefix}_${timestamp}_${randomStr}`;
}
