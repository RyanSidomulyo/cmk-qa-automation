// @ts-check
//
// Visual Regression Helper
// ------------------------
// Wrapper di atas Playwright `toHaveScreenshot()` dengan masking
// untuk konten dinamis (harga emas, timestamp, animasi).
//
// Strategi:
//   - Hide elemen dinamis via CSS injection sebelum screenshot
//   - Disable animasi & transition supaya screenshot deterministik
//   - Wait font load + lazy images supaya layout stabil
//
// First run: screenshot baseline auto-tersimpan ke
//   tests/__screenshots__/<spec>/<name>-<browser>-<platform>.png
//
// Subsequent run: bandingkan dengan baseline. Threshold default Playwright.
// Untuk update baseline setelah perubahan UI legit:
//   npx playwright test visual --update-snapshots

/**
 * @param {import('@playwright/test').Page} page
 * @param {string[]} [selectorsToHide] CSS selectors elemen dinamis yang akan di-hide
 */
async function prepareForScreenshot(page, selectorsToHide = []) {
  // Disable animasi + transition
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
      }
      ${selectorsToHide.map((s) => `${s} { visibility: hidden !important; }`).join('\n')}
    `,
  });

  // Tunggu font selesai load
  await page.evaluate(() => document.fonts.ready);

  // Trigger semua lazy image dengan scroll cepat
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let total = 0;
      const step = window.innerHeight;
      const max = document.body.scrollHeight;
      const timer = setInterval(() => {
        window.scrollBy(0, step);
        total += step;
        if (total >= max) {
          clearInterval(timer);
          window.scrollTo(0, 0);
          setTimeout(resolve, 500);
        }
      }, 100);
    });
  });

  await page.waitForTimeout(800);
}

module.exports = { prepareForScreenshot };
