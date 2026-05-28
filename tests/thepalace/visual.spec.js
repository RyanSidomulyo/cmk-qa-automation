// @ts-check
const { test, expect } = require('../helpers/fixtures');
const { prepareForScreenshot } = require('../helpers/visual');

test.setTimeout(180000);

test.skip(
  process.env.TEST_ENV === 'production',
  'Visual regression hanya di staging'
);

const VIEWPORT = { width: 1280, height: 800 };

test.describe('Visual Regression — The Palace', () => {

  test.use({ viewport: VIEWPORT });

  test('Homepage layout', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await prepareForScreenshot(page, [
      // Gold price sering update — pasti beda tiap run
      '[class*="gold-price"]',
      '[class*="goldPrice"]',
      // Banner promo dinamis
      '[class*="banner"]',
      '[class*="carousel"] [class*="indicator"]',
    ]);
    await expect(page).toHaveScreenshot('homepage.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.03,
    });
  });

  test('Collection page', async ({ page }) => {
    await page.goto('/collection', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await prepareForScreenshot(page);
    await expect(page).toHaveScreenshot('collection.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.03,
    });
  });

  test('Product category — Cincin', async ({ page }) => {
    await page.goto('/categories/cincin', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await prepareForScreenshot(page, [
      // Harga produk bisa update — hide sementara
      '[class*="price"]',
    ]);
    await expect(page).toHaveScreenshot('category-cincin.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.03,
    });
  });

});
