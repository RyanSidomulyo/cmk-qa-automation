// @ts-check
const { test, expect } = require('@playwright/test');

test.setTimeout(120000);

const PAGE_URL = '/en/collections/mens';
const HOMEPAGE_TITLE = 'Frank & co. | Natural Diamond Jewellery, Fashion Collections, and Gifts';

async function isPageValid(page) {
  const title = await page.title().catch(() => '');
  const titleLower = title.toLowerCase();
  const errorTitles = ['404', '500', '503', 'error', 'server error', 'something went wrong', 'page not found'];
  const hasErrorTitle = errorTitles.some(function(e) { return titleLower.startsWith(e) || titleLower.includes(e); });
  const HOMEPAGE_TITLE_CHECK = 'Frank & co. | Natural Diamond Jewellery, Fashion Collections, and Gifts';
  return title !== '' && title !== HOMEPAGE_TITLE_CHECK && !hasErrorTitle;
}

async function scrollToBottom(page) {
  await page.evaluate(async () => {
    await new Promise(function(resolve) {
      let total = 0;
      const timer = setInterval(function() {
        window.scrollBy(0, 400);
        total += 400;
        if (total >= document.body.scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 150);
    });
  });
  await page.waitForTimeout(2000);
}

test.describe("Men's collection page — functional test", () => {

  test("Halaman Men's load dengan benar", async ({ page }) => {
    const response = await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    const status = response ? response.status() : null;
    const title  = await page.title();
    console.log('  Status : ' + status);
    console.log('  Title  : ' + title);
    // Cek status 2xx (200, 201, dll) — bukan 4xx atau 5xx
    expect(status, 'Halaman tidak boleh return 4xx/5xx').not.toBeNull();
    expect(status, 'Halaman tidak boleh return 4xx/5xx').toBeGreaterThanOrEqual(200);
    expect(status, 'Halaman tidak boleh return 4xx/5xx').toBeLessThan(400);
    expect(await isPageValid(page), 'Halaman tidak boleh redirect ke homepage').toBe(true);
  });

  test('Filter bar tampil dengan benar', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2000);

    // Ambil filter secara dinamis
    const filterBtns = await page.locator('button span.uppercase').all();
    const filterLabels = [];
    for (const btn of filterBtns) {
      const text = await btn.innerText().catch(() => '');
      if (text.trim()) filterLabels.push(text.trim());
    }

    console.log('  Filter yang ditemukan: ' + filterLabels.join(', '));
    expect(filterLabels.length, 'Harus ada minimal 1 filter').toBeGreaterThan(0);
    console.log('  Ringkasan: ' + filterLabels.length + ' filter ditemukan — OK');
  });

  test('Filter Category dapat diklik', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2000);

    const categoryBtn = page.locator('button span:has-text("Category")').first();
    await expect(categoryBtn, 'Tombol Category tidak ditemukan').toBeVisible();

    console.log('  -> Klik filter Category');
    await categoryBtn.click();
    await page.waitForTimeout(500);
    console.log('  [OK] Filter Category dapat diklik');
  });

  test('Sort By dapat diklik', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2000);

    const sortBtn = page.locator('button span.uppercase').filter({ hasText: /newest|oldest|price/i }).first();
    await expect(sortBtn, 'Tombol Sort By tidak ditemukan').toBeVisible();

    console.log('  -> Klik Sort By');
    await sortBtn.click();
    await page.waitForTimeout(500);
    console.log('  [OK] Sort By dapat diklik');
  });

  test('Product cards tampil dan minimal ada 1 produk', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await scrollToBottom(page);
    await page.evaluate(() => window.scrollTo(0, 0));

    const cards = await page.locator('.group.aspect-square').all();
    console.log('\n  Ditemukan ' + cards.length + ' product card');
    expect(cards.length, 'Harus ada minimal 1 product card').toBeGreaterThan(0);

    let valid = 0;
    for (let i = 0; i < Math.min(cards.length, 4); i++) {
      const card = cards[i];
      const imgAlt = await card.locator('img').first().getAttribute('alt').catch(() => '');
      await card.scrollIntoViewIfNeeded();
      await card.hover();
      await page.waitForTimeout(300);
      const btnAfterHover = await card.locator('button span').filter({ hasText: /view detail/i }).first().isVisible().catch(() => false);
      console.log('  Card ' + (i+1) + ': "' + imgAlt + '" — View Detail: ' + (btnAfterHover ? 'OK' : 'GAGAL'));
      if (btnAfterHover) valid++;
    }

    console.log('\n  Ringkasan cards: ' + valid + '/' + Math.min(cards.length, 4) + ' card valid');
    expect(valid, 'Minimal 1 card harus punya tombol View Detail').toBeGreaterThan(0);
  });

  test("Product card — View Detail mengarah ke halaman produk yang benar", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await scrollToBottom(page);
    await page.evaluate(() => window.scrollTo(0, 0));

    const cards = await page.locator('.group.aspect-square').all();
    expect(cards.length, 'Harus ada product card').toBeGreaterThan(0);

    const results = [];

    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      const productName = await card.locator('img').first().getAttribute('alt').catch(() => 'Product ' + (i + 1));

      await card.scrollIntoViewIfNeeded();
      await card.hover();
      await page.waitForTimeout(400);

      const viewDetailBtn = card.locator('button span').filter({ hasText: /view detail/i }).first();
      const btnVisible = await viewDetailBtn.isVisible().catch(() => false);

      if (!btnVisible) {
        console.log('  [SKIP] "' + productName + '" — tombol tidak visible');
        continue;
      }

      console.log('  -> Klik View Detail: "' + productName + '"');

      await card.evaluate(el => el.scrollIntoView({ block: 'center' }));
      await page.waitForTimeout(300);
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => null),
        viewDetailBtn.click({ force: true }),
      ]);

      await page.waitForTimeout(500);
      const valid = await isPageValid(page);
      const title = await page.title();
      const url   = page.url();

      console.log('    [' + (valid ? 'OK' : 'GAGAL') + '] ' + title);
      console.log('    URL: ' + url);
      results.push({ name: productName, url: url, valid: valid });

      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await scrollToBottom(page);
      await page.evaluate(() => window.scrollTo(0, 0));
    }

    const failed = results.filter(function(r) { return !r.valid; });
    if (failed.length > 0) {
      const detail = failed.map(function(f) { return '  x "' + f.name + '" -> ' + f.url; }).join('\n');
      throw new Error('Ada product card yang gagal:\n' + detail);
    }

    console.log('\n  Ringkasan: ' + (results.length - failed.length) + '/' + results.length + ' product cards OK');
  });

});
