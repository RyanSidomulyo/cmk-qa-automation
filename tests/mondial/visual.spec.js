// @ts-check
const { test, expect } = require('../helpers/fixtures');
const { prepareForScreenshot } = require('../helpers/visual');

test.setTimeout(120000);

test.skip(
  process.env.TEST_ENV === 'production',
  'Visual regression hanya di staging'
);

const VIEWPORT = { width: 1280, height: 800 };

test.describe('Visual Regression — Mondial', () => {

  test.use({ viewport: VIEWPORT });

  test('Homepage layout', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await prepareForScreenshot(page, [
      '[class*="banner"]',
      '[class*="carousel"] [class*="indicator"]',
    ]);
    await expect(page).toHaveScreenshot('homepage.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
    });
  });

  test('High Jewelry page', async ({ page }) => {
    await page.goto('/en/high-jewelry', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await prepareForScreenshot(page);
    await expect(page).toHaveScreenshot('high-jewelry.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
    });
  });

});
