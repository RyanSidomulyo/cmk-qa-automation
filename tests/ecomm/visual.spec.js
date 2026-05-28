// @ts-check
const { test, expect } = require('../helpers/fixtures');
const { prepareForScreenshot } = require('../helpers/visual');

test.setTimeout(120000);

// Visual regression baseline tersimpan di tests/__screenshots__/ ecomm/visual.spec.js/
// Jalankan dengan --update-snapshots untuk refresh baseline setelah perubahan UI sah.

// HANYA jalankan visual regression di staging untuk avoid false diff karena
// content production yang sering berubah (banner promo, harga, dll).
test.skip(
  process.env.TEST_ENV === 'production',
  'Visual regression hanya di staging'
);

const VIEWPORT = { width: 1280, height: 800 };

test.describe('Visual Regression — Frank & Co', () => {

  test.use({ viewport: VIEWPORT });

  test('Homepage layout', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await prepareForScreenshot(page, [
      // Hide elemen yang sering berubah
      '[class*="banner"]',
      '[class*="carousel"] [class*="indicator"]',
    ]);
    await expect(page).toHaveScreenshot('homepage.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.02, // 2% toleransi
    });
  });

  test('High Jewellery page', async ({ page }) => {
    await page.goto('/en/high-jewellery', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await prepareForScreenshot(page);
    await expect(page).toHaveScreenshot('high-jewellery.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
    });
  });

});
