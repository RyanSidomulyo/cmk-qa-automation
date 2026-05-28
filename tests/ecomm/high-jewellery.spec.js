// @ts-check
const { test, expect } = require('../helpers/fixtures');
const { waitForValidPage } = require('../helpers/page-checker');

test.setTimeout(120000);

const PAGE_URL = '/en/high-jewellery';
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
  await page.waitForTimeout(1000);
}

test.describe('High Jewellery page — functional test', () => {

  test('Halaman High Jewellery load dengan benar', async ({ page }) => {
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

  test('Video High Jewellery tampil dan tidak error', async ({ page }) => {
    await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });

    const videos = await page.locator('video').all();
    console.log('  Ditemukan ' + videos.length + ' video');
    expect(videos.length, 'Harus ada minimal 1 video').toBeGreaterThan(0);

    for (let i = 0; i < videos.length; i++) {
      const videoState = await page.evaluate(function(idx) {
        const vids = document.querySelectorAll('video');
        const v = vids[idx];
        return v ? { readyState: v.readyState, error: v.error ? v.error.code : null } : null;
      }, i);
      console.log('  Video ' + (i + 1) + ' readyState: ' + videoState?.readyState + ', error: ' + (videoState?.error ?? 'none'));
      expect(videoState?.error, 'Video ' + (i + 1) + ' tidak boleh ada error').toBeNull();
    }
    console.log('  [OK] Semua video tampil normal');
  });

  test('Tombol Explore Collection mengarah ke halaman yang benar', async ({ page }) => {
    await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Tombol ini href-nya /collections/high-jewellery (tanpa /en/)
    const exploreBtn = page.locator('a[href*="high-jewellery"]').filter({ hasText: /explore collection/i }).first();
    await expect(exploreBtn, 'Tombol Explore Collection tidak ditemukan').toBeVisible();

    console.log('  -> Klik Explore Collection');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => null),
      exploreBtn.click(),
    ]);
    await page.waitForTimeout(500);
    const valid = await isPageValid(page);
    const title = await page.title();
    console.log('  [' + (valid ? 'OK' : 'GAGAL') + '] ' + title + ' -- ' + page.url());
    expect(valid, 'Halaman Explore Collection harus valid').toBe(true);
  });

  test('Tombol View All Products mengarah ke halaman yang benar', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await scrollToBottom(page);

    const viewAllBtn = page.locator('a[href*="high-jewellery"]').filter({ hasText: /view all products/i }).first();
    await expect(viewAllBtn, 'Tombol View All Products tidak ditemukan').toBeVisible();
    await viewAllBtn.scrollIntoViewIfNeeded();

    console.log('  -> Klik View All Products');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => null),
      viewAllBtn.click(),
    ]);
    await page.waitForTimeout(500);
    const valid = await isPageValid(page);
    const title = await page.title();
    console.log('  [' + (valid ? 'OK' : 'GAGAL') + '] ' + title + ' -- ' + page.url());
    expect(valid, 'Halaman View All Products harus valid').toBe(true);
  });

  test('Tombol Contact Us mengarah ke halaman yang benar', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await scrollToBottom(page);

    const contactBtn = page.locator('a[href*="/en/contacts"]').filter({ hasText: /contact us/i }).first();
    await expect(contactBtn, 'Tombol Contact Us tidak ditemukan').toBeVisible();
    await contactBtn.scrollIntoViewIfNeeded();

    console.log('  -> Klik Contact Us');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => null),
      contactBtn.click(),
    ]);
    await page.waitForTimeout(500);
    const valid = await isPageValid(page);
    const title = await page.title();
    console.log('  [' + (valid ? 'OK' : 'GAGAL') + '] ' + title + ' -- ' + page.url());
    expect(valid, 'Halaman Contact Us harus valid').toBe(true);
  });

  test('Image slider tampil dan tombol prev/next berfungsi', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await scrollToBottom(page);
    await page.evaluate(() => window.scrollTo(0, 0));

    // Cek slider ada
    const slider = page.locator('.slick-slider').first();
    await expect(slider, 'Slick slider tidak ditemukan').toBeVisible({ timeout: 10000 });
    console.log('  [OK] Slider ditemukan');

    // Cek tombol next
    const nextBtn = page.locator('.slick-next').first();
    const nextVisible = await nextBtn.isVisible().catch(() => false);
    if (nextVisible) {
      await nextBtn.scrollIntoViewIfNeeded();
      await nextBtn.click();
      await page.waitForTimeout(500);
      console.log('  [OK] Tombol Next slider berfungsi');
    } else {
      console.log('  [INFO] Tombol Next slider tidak visible (mungkin hidden di desktop)');
    }

    // Cek tombol prev
    const prevBtn = page.locator('.slick-prev').first();
    const prevVisible = await prevBtn.isVisible().catch(() => false);
    if (prevVisible) {
      await prevBtn.scrollIntoViewIfNeeded();
      await prevBtn.click();
      await page.waitForTimeout(500);
      console.log('  [OK] Tombol Prev slider berfungsi');
    } else {
      console.log('  [INFO] Tombol Prev slider tidak visible (mungkin hidden di desktop)');
    }
  });

  test('Product cards — hover muncul overlay dan tombol View Detail bisa diklik', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await scrollToBottom(page);
    await page.evaluate(() => window.scrollTo(0, 0));

    const cards = await page.locator('.group.aspect-square').all();
    console.log('\n  Ditemukan ' + cards.length + ' product card\n');
    expect(cards.length, 'Harus ada minimal 1 product card').toBeGreaterThan(0);

    const results = [];

    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      const productName = await card.locator('img').first().getAttribute('alt').catch(() => 'Product ' + (i + 1));
      console.log('  -> Hover card: "' + productName + '"');

      await card.scrollIntoViewIfNeeded();
      await card.hover();
      await page.waitForTimeout(500);

      const viewDetailBtn = card.locator('button span').filter({ hasText: /view detail/i }).first();
      const btnVisible = await viewDetailBtn.isVisible().catch(() => false);

      if (!btnVisible) {
        console.log('    [SKIP] Tombol View Detail tidak visible');
        continue;
      }

      // Scroll card ke tengah layar agar tidak tertutup navbar sticky
      await card.evaluate(el => el.scrollIntoView({ block: 'center' }));
      await page.waitForTimeout(300);

      const before = { title: await page.title(), url: page.url() };

      await Promise.all([
        page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => null),
        viewDetailBtn.click({ force: true }),
      ]);

      const result = await waitForValidPage(page, {
        fromTitle: before.title,
        fromUrl: before.url,
        timeout: 15000,
      });

      console.log('    [' + (result.valid ? 'OK' : 'GAGAL') + '] ' + result.title);
      console.log('    URL: ' + result.url);
      if (!result.valid) console.log('    Reason: ' + result.reason);
      results.push({ name: productName, url: result.url, valid: result.valid, reason: result.reason });

      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await scrollToBottom(page);
      await page.evaluate(() => window.scrollTo(0, 0));
    }

    const failed = results.filter(function(r) { return !r.valid; });
    if (failed.length > 0) {
      const detail = failed.map(function(f) { return '  x "' + f.name + '" -> ' + f.url + ' (' + f.reason + ')'; }).join('\n');
      throw new Error('Ada product card yang gagal:\n' + detail);
    }

    console.log('\n  Ringkasan: ' + (results.length - failed.length) + '/' + results.length + ' product cards OK');
  });

});
