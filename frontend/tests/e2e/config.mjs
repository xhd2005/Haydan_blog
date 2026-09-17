// frontend/tests/e2e/config.mjs

export const config = {
  apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:8080',
  frontendBaseUrl: process.env.FRONTEND_BASE_URL || 'http://localhost:3000',
  timeoutMs: 15000,
  
  // 站长身份纯正性规范 (AGENTS.md)
  authorName: 'Hayden Xue',
  authorEmail: 'contact@haydenxue.com',
  forbiddenNames: ['howard', 'howardxue', 'howard xue', 'howard_xue'],

  // 多标签工作区最大活跃保活数 (PROJECT.md F6)
  maxActiveTabs: 6,

  // 双主题设计令牌标准色 (PROJECT.md F11)
  theme: {
    lightBg: '#fbfbfd',
    lightCard: 'rgba(255, 255, 255, 0.8)',
    lightBorder: 'rgba(226, 232, 240, 0.8)',
    darkBg: '#090a0f',
    darkCard: 'rgba(23, 23, 23, 0.6)',
    darkBorder: 'rgba(255, 255, 255, 0.08)',
  },

  // 默认使用契约仿真模式以确保不依赖外部环境即可自闭环验证，同时支持注入真实活体
  useMockOracle: true,
};
