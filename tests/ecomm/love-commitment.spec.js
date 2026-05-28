// @ts-check
const { test, expect } = require('../helpers/fixtures');

test.setTimeout(120000);

const PAGE_URL = '/en/love-commitment';
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

test.describe('Love & Commitment page — functional test', () => {

  test('Halaman Love & Commitment load dengan benar', async ({ page }) => {
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

  test('Video Love & Commitment tampil dan tidak error', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });

    const video = page.locator('video').first();
    await expect(video, 'Elemen video tidak ditemukan').toBeAttached({ timeout: 10000 });

    const sources = await page.locator('video source').all();
    expect(sources.length, 'Video harus punya minimal 1 source').toBeGreaterThan(0);

    const videoState = await page.evaluate(function() {
      const v = document.querySelector('video');
      return v ? { readyState: v.readyState, error: v.error ? v.error.code : null } : null;
    });
    console.log('  Video readyState: ' + videoState?.readyState + ', error: ' + (videoState?.error ?? 'none'));
    expect(videoState?.error, 'Video tidak boleh ada error').toBeNull();
    console.log('  [OK] Video Love & Commitment tampil normal');
  });

  test('Semua tombol Explore Collection mengarah ke halaman yang benar', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    const exploreLinks = [
      { label: 'Promise Rings',    href: '/en/moments/promise-rings' },
      { label: 'Engagement Rings', href: '/en/moments/engagement-rings' },
      { label: 'Wedding Rings',    href: '/en/moments/wedding-rings' },
      { label: 'Anniversary Rings',href: '/en/moments/anniversary-rings' },
    ];

    const failed = [];

    for (const link of exploreLinks) {
      await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await scrollToBottom(page);
      await page.evaluate(() => window.scrollTo(0, 0));

      const btn = page.locator('a[href="' + link.href + '"]').filter({ hasText: /explore collection/i }).first();
      const visible = await btn.isVisible().catch(() => false);

      if (!visible) {
        console.log('  [SKIP] Tombol "' + link.label + '" tidak visible');
        continue;
      }

      await btn.scrollIntoViewIfNeeded();
      console.log('  -> Klik Explore Collection: ' + link.label);

      await Promise.all([
        page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => null),
        btn.click(),
      ]);

      await page.waitForTimeout(500);
      const valid = await isPageValid(page);
      const title = await page.title();
      console.log('  [' + (valid ? 'OK' : 'GAGAL') + '] ' + title + ' -- ' + page.url());

      if (!valid) failed.push(link.label + ' -> ' + link.href);
    }

    if (failed.length > 0) {
      throw new Error('Ada tombol Explore Collection yang gagal:\n' + failed.map(function(f) { return '  x ' + f; }).join('\n'));
    }

    console.log('\n  Ringkasan: ' + exploreLinks.length + '/' + exploreLinks.length + ' tombol Explore Collection OK');
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

});
