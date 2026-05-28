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

// Production: 2 retries (bug nyata gagal 2x; flaky network di-absorb)
// Staging:    1 retry  (lebih cepat feedback, flake lebih ditoleransi manual)
const RETRIES = ENV === 'production' ? 2 : 1;

// Custom user agent untuk identifikasi traffic Playwright di GA4.
// Cara filter di GA4:
//   Admin → Data Settings → Data Filters → Create filter
//   Filter name: Exclude Playwright QA
//   Filter operation: Exclude
//   Parameter: user_agent  Contains  "PlaywrightQA"
const PLAYWRIGHT_UA_SUFFIX = ' PlaywrightQA/1.0 (+cmk-qa-automation)';

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: true,
  retries: RETRIES,
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
    // Append marker ke default Chromium UA (jangan replace, supaya tetap valid Chrome).
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' + PLAYWRIGHT_UA_SUFFIX,
  },
  outputDir: 'test-results',
  projects: [
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
  ],
});
