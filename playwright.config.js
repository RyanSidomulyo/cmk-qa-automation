// @ts-check
const { defineConfig, devices } = require('@playwright/test');

const ENV = process.env.TEST_ENV || 'staging';

const SITES = {
  staging: {
    frankco: 'https://staging.intra.frankandcojewellery.com',
    mondial: 'https://staging.intra.mondialjeweler.com',
    palace:  'https://staging.intra.thepalacejeweler.com',
    admin:   'https://staging-dms.intra.cmk.co.id',
  },
  production: {
    frankco: 'https://frankandcojewellery.com',
    mondial: 'https://mondialjeweler.com',
    palace:  'https://thepalacejeweler.com',
    admin:   'https://dms.cmk.co.id',
  },
};

const URLS = SITES[ENV] || SITES.staging;

console.log('Environment : ' + ENV.toUpperCase());
console.log('Frank & Co  : ' + URLS.frankco);

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
      use: { ...devices['Desktop Chrome'], baseURL: URLS.frankco },
      testMatch: ['**/ecomm/**/*.spec.js'],
    },
    {
      name: 'mondial',
      use: { ...devices['Desktop Chrome'], baseURL: URLS.mondial },
      testMatch: ['**/mondial/**/*.spec.js'],
    },
    {
      name: 'palace',
      use: { ...devices['Desktop Chrome'], baseURL: URLS.palace },
      testMatch: ['**/palace/**/*.spec.js'],
    },
    {
      name: 'admin',
      use: { ...devices['Desktop Chrome'], baseURL: URLS.admin },
      testMatch: ['**/admin/**/*.spec.js'],
    },
  ],
});
