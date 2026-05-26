// @ts-check
const { defineConfig, devices } = require('@playwright/test');

const ENV = process.env.TEST_ENV || 'staging';

const BASE_URLS = {
  frankco: ENV === 'production'
    ? 'https://frankandcojewellery.com'
    : 'https://staging.intra.frankandcojewellery.com',
  mondial: ENV === 'production'
    ? 'https://mondialjeweler.com'
    : 'https://staging.intra.mondialjeweler.com',
  thepalace: ENV === 'production'
    ? 'https://thepalacejeweler.com'
    : 'https://staging.intra.thepalacejeweler.com',
};

console.log('Environment : ' + ENV.toUpperCase());
console.log('Frank & Co  : ' + BASE_URLS.frankco);
console.log('Mondial     : ' + BASE_URLS.mondial);
console.log('The Palace  : ' + BASE_URLS.thepalace);

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
    // Desktop
    {
      name: 'frankco',
      use: { ...devices['Desktop Chrome'], baseURL: BASE_URLS.frankco },
      testMatch: ['**/ecomm/**/*.spec.js'],
    },
    {
      name: 'mondial',
      use: { ...devices['Desktop Chrome'], baseURL: BASE_URLS.mondial },
      testMatch: ['**/mondial/**/*.spec.js'],
    },
    {
      name: 'thepalace',
      use: { ...devices['Desktop Chrome'], baseURL: BASE_URLS.thepalace },
      testMatch: ['**/thepalace/**/*.spec.js'],
    },
    // Mobile
    {
      name: 'frankco-mobile',
      use: { ...devices['Pixel 5'], baseURL: BASE_URLS.frankco },
      testMatch: ['**/ecomm/**/*.spec.js'],
    },
    {
      name: 'mondial-mobile',
      use: { ...devices['Pixel 5'], baseURL: BASE_URLS.mondial },
      testMatch: ['**/mondial/**/*.spec.js'],
    },
    {
      name: 'thepalace-mobile',
      use: { ...devices['Pixel 5'], baseURL: BASE_URLS.thepalace },
      testMatch: ['**/thepalace/**/*.spec.js'],
    },
  ],
});
