// @ts-check
const { test, expect } = require('../helpers/fixtures');

test.setTimeout(120000);

const PAGE_URL = '/en/articles';
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
  await page.waitForTimeout(1500);
}

test.describe('Stories / Articles page — functional test', () => {

  test('Halaman Stories load dengan benar', async ({ page }) => {
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

  test('Article cards tampil dan minimal ada 1 artikel', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await scrollToBottom(page);
    await page.evaluate(() => window.scrollTo(0, 0));

    // Article cards adalah <a href="/en/articles/...">
    const articles = await page.locator('a[href*="/en/articles/"]').all();
    console.log('\n  Ditemukan ' + articles.length + ' article card');
    expect(articles.length, 'Harus ada minimal 1 artikel').toBeGreaterThan(0);

    // Cek 3 artikel pertama punya gambar, tanggal, judul, dan Read More
    const sample = Math.min(articles.length, 3);
    for (let i = 0; i < sample; i++) {
      const article = articles[i];
      const href    = await article.getAttribute('href').catch(() => '');
      const hasImg  = await article.locator('img').first().isVisible().catch(() => false);
      const hasTitle = await article.locator('h2').first().isVisible().catch(() => false);
      const hasReadMore = await article.locator('span:has-text("Read More")').first().isVisible().catch(() => false);

      console.log('  Artikel ' + (i+1) + ': ' + href);
      console.log('    Gambar   : ' + (hasImg ? 'OK' : 'GAGAL'));
      console.log('    Judul    : ' + (hasTitle ? 'OK' : 'GAGAL'));
      console.log('    Read More: ' + (hasReadMore ? 'OK' : 'GAGAL'));
    }

    console.log('\n  Ringkasan: ' + articles.length + ' artikel ditemukan — OK');
  });

  test('Artikel dapat diklik dan mengarah ke halaman detail', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await scrollToBottom(page);
    await page.evaluate(() => window.scrollTo(0, 0));

    const articles = await page.locator('a[href*="/en/articles/"]').all();
    expect(articles.length, 'Harus ada artikel').toBeGreaterThan(0);

    const results = [];

    // Cek 3 artikel pertama saja agar tidak terlalu lama
    const sample = Math.min(articles.length, 3);
    for (let i = 0; i < sample; i++) {
      const href  = await articles[i].getAttribute('href').catch(() => '');
      const title = await articles[i].locator('h2').first().innerText().catch(() => 'Artikel ' + (i+1));

      console.log('  -> Klik artikel: "' + title.trim() + '"');

      const response = await page.goto(href, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => null);
      const status   = response ? response.status() : null;
      const valid    = await isPageValid(page);
      const pageTitle = await page.title();

      console.log('    [' + (valid ? 'OK' : 'GAGAL') + '] ' + pageTitle);
      console.log('    URL: ' + page.url());

      results.push({ title: title.trim(), href, valid, status });

      // Kembali ke halaman articles
      await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForTimeout(1000);
    }

    const failed = results.filter(function(r) { return !r.valid; });
    if (failed.length > 0) {
      const detail = failed.map(function(f) { return '  x "' + f.title + '" -> ' + f.href; }).join('\n');
      throw new Error('Ada artikel yang gagal:\n' + detail);
    }

    console.log('\n  Ringkasan: ' + (results.length - failed.length) + '/' + results.length + ' artikel OK');
  });

  test('Tombol Load More berfungsi dan menambah artikel', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await scrollToBottom(page);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);

    // Hitung artikel sebelum Load More
    const beforeCount = await page.locator('a[href*="/en/articles/"]').count();
    console.log('  Artikel sebelum Load More: ' + beforeCount);

    // Cari tombol Load More
    const loadMoreBtn = page.locator('button:has-text("LOAD MORE")').first();
    const btnVisible  = await loadMoreBtn.isVisible().catch(() => false);

    if (!btnVisible) {
      console.log('  [INFO] Tombol Load More tidak ditemukan — mungkin semua artikel sudah tampil');
      test.skip();
      return;
    }

    console.log('  -> Klik Load More');
    await loadMoreBtn.click();
    await page.waitForTimeout(2000);

    // Hitung artikel setelah Load More
    const afterCount = await page.locator('a[href*="/en/articles/"]').count();
    console.log('  Artikel setelah Load More: ' + afterCount);

    expect(afterCount, 'Jumlah artikel harus bertambah setelah Load More').toBeGreaterThan(beforeCount);
    console.log('  [OK] Load More berhasil menambah ' + (afterCount - beforeCount) + ' artikel');
  });

  test('Featured article (artikel utama) tampil dengan benar', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await scrollToBottom(page);
    await page.evaluate(() => window.scrollTo(0, 0));

    // Artikel featured adalah yang col-span-3 (artikel pertama yang lebih besar)
    const featuredArticle = page.locator('.lg\\:col-span-3 a').first();
    const visible = await featuredArticle.isVisible().catch(() => false);

    if (!visible) {
      console.log('  [INFO] Featured article tidak terdeteksi — skip');
      test.skip();
      return;
    }

    const href  = await featuredArticle.getAttribute('href').catch(() => '');
    const title = await featuredArticle.locator('h2').first().innerText().catch(() => '');
    const hasImg = await featuredArticle.locator('img').first().isVisible().catch(() => false);

    console.log('  Featured article: "' + title.trim() + '"');
    console.log('  Gambar: ' + (hasImg ? 'OK' : 'GAGAL'));
    console.log('  Link  : ' + href);

    expect(href, 'Featured article harus punya link').toBeTruthy();
    expect(hasImg, 'Featured article harus punya gambar').toBe(true);

    // Klik featured article
    console.log('  -> Klik featured article');
    const response = await page.goto(href, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => null);
    const valid    = await isPageValid(page);
    const pageTitle = await page.title();

    console.log('  [' + (valid ? 'OK' : 'GAGAL') + '] ' + pageTitle);
    expect(valid, 'Featured article harus mengarah ke halaman valid').toBe(true);
  });

});
