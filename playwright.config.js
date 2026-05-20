// @ts-check
const { defineConfig, devices } = require('@playwright/test');

const ENV = process.env.TEST_ENV || 'staging';

const BASE_URLS = {
  frankco: ENV === 'production'
    ? 'https://frankandcojewellery.com'
    : 'https://staging.intra.frankandcojewellery.com',
};

console.log('Environment : ' + ENV.toUpperCase());
console.log('Frank & Co  : ' + BASE_URLS.frankco);

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: true,
  retries: 1,
  workers: 4,
  reporter: [
    [require.resolve('./reporter.js')],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
  ],
  timeout: 180000,
  use: {
    screenshot:        'only-on-failure',
    trace:             'on-first-retry',
    video:             'on-first-retry',
    actionTimeout:     15000,
    navigationTimeout: 30000,
    ignoreHTTPSErrors: true,
  },
  outputDir: 'test-results',
  projects: [
    {
      name: 'frankco',
      use: { ...devices['Desktop Chrome'], baseURL: BASE_URLS.frankco },
      testMatch: ['**/ecomm/**/*.spec.js'],
    },
  ],
});
