// @ts-check
const { test, expect } = require('../helpers/fixtures');

test.setTimeout(120000);

const PAGE_URL = '/en/stories/articles';

test.describe('Stories / Articles page — Mondial', () => {

  test('Halaman Stories load dengan benar', async ({ page }) => {
    const response = await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    const status = response ? response.status() : null;
    const title  = await page.title();
    console.log('  Status : ' + status);
    console.log('  Title  : ' + title);
    console.log('  URL    : ' + page.url());
    expect(status).toBeLessThan(400);
    expect(title.toLowerCase()).toContain('mondial');
  });

  test('Article cards tampil dan minimal ada 1 artikel', async ({ page }) => {
    await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(1000);

    const cards = await page.locator('a.story-card').all();
    console.log('  Ditemukan ' + cards.length + ' article card');
    expect(cards.length, 'Harus ada minimal 1 artikel').toBeGreaterThan(0);

    // Cek struktur card pertama
    const firstCard = cards[0];
    const href  = await firstCard.getAttribute('href').catch(() => '');
    const img   = await firstCard.locator('img').first().isVisible().catch(() => false);
    const date  = await firstCard.locator('p').first().textContent().catch(() => '');
    const title = await firstCard.locator('p').nth(1).textContent().catch(() => '');

    console.log('  Card 1 href  : ' + href);
    console.log('  Card 1 gambar: ' + (img ? 'OK' : 'TIDAK ADA'));
    console.log('  Card 1 tanggal: ' + date.trim());
    console.log('  Card 1 judul : ' + title.trim().slice(0, 60));

    expect(href).toContain('/en/stories/articles/');
    expect(img, 'Gambar artikel harus tampil').toBe(true);
    expect(title.trim().length, 'Judul artikel harus ada').toBeGreaterThan(0);

    console.log('  Ringkasan: ' + cards.length + ' artikel ditemukan — OK');
  });

  test('Artikel dapat diklik dan mengarah ke halaman detail', async ({ page }) => {
    await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(1000);

    const cards = await page.locator('a.story-card').all();
    expect(cards.length).toBeGreaterThan(0);

    // Test maksimal 5 artikel pertama
    const toTest = cards.slice(0, 5);
    const failed = [];

    for (const card of toTest) {
      const href   = await card.getAttribute('href').catch(() => '');
      const img    = await card.locator('img').first();
      const date   = await card.locator('p').first().textContent().catch(() => '');
      const title  = await card.locator('p').nth(1).textContent().catch(() => 'Artikel');

      // Cek format href
      const hrefOk = href && href.includes('/en/stories/articles/');

      // Cek gambar ada
      const imgSrc = await img.getAttribute('src').catch(() => '');
      const imgOk  = imgSrc && imgSrc.length > 0;

      // Cek tanggal ada (format dd/mm/yyyy)
      const dateOk = date.trim().length > 0;

      // Cek judul ada
      const titleOk = title.trim().length > 0;

      // Cek halaman detail bisa diakses
      const response = await page.goto(href, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => null);
      const status = response ? response.status() : null;
      const pageOk = status && status < 400;

      const allOk = hrefOk && imgOk && dateOk && titleOk && pageOk;

      console.log('  -> Artikel: "' + title.trim().slice(0, 50) + '"');
      console.log('     Href   : ' + (hrefOk ? 'OK' : 'GAGAL — ' + href));
      console.log('     Gambar : ' + (imgOk ? 'OK' : 'TIDAK ADA'));
      console.log('     Tanggal: ' + (dateOk ? 'OK — ' + date.trim() : 'KOSONG'));
      console.log('     Judul  : ' + (titleOk ? 'OK' : 'KOSONG'));
      console.log('     Detail : ' + (pageOk ? 'OK (' + status + ')' : 'GAGAL (' + status + ')'));

      if (!allOk) failed.push(title.trim().slice(0, 50));
      await page.waitForTimeout(300);
    }

    if (failed.length > 0) {
      throw new Error('Artikel gagal validasi: ' + failed.join(', '));
    }
    console.log('  Ringkasan: ' + toTest.length + '/' + toTest.length + ' artikel OK');
  });

  test('Gambar artikel tidak broken', async ({ page }) => {
    await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Scroll untuk trigger lazy load
    await page.evaluate(async () => {
      await new Promise(resolve => {
        let total = 0;
        const timer = setInterval(() => {
          window.scrollBy(0, 300);
          total += 300;
          if (total >= document.body.scrollHeight) { clearInterval(timer); resolve(); }
        }, 100);
      });
    });
    await page.waitForTimeout(2000);

    const images = await page.locator('a.story-card img').all();
    console.log('  Ditemukan ' + images.length + ' gambar artikel');

    let broken = 0;
    for (let i = 0; i < Math.min(images.length, 6); i++) {
      const naturalWidth = await images[i].evaluate(el => el.naturalWidth).catch(() => 0);
      const ok = naturalWidth > 0;
      if (!ok) broken++;
      console.log('  Gambar ' + (i+1) + ': ' + (ok ? 'OK' : 'BROKEN'));
    }

    expect(broken, 'Tidak boleh ada gambar broken').toBe(0);
    console.log('  [OK] Semua gambar tampil dengan benar');
  });

});

test('Halaman detail artikel memiliki struktur yang benar', async ({ page }) => {
    await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(1000);

    const cards = await page.locator('a.story-card').all();
    expect(cards.length).toBeGreaterThan(0);

    // Ambil artikel pertama
    const firstCard = cards[0];
    const href  = await firstCard.getAttribute('href').catch(() => '');
    const title = await firstCard.locator('p').nth(1).textContent().catch(() => '');

    console.log('  -> Buka detail: "' + title.trim().slice(0, 60) + '"');
    await page.goto(href, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1000);

    // Cek judul h1
    const h1 = page.locator('.article-container h1').first();
    const h1Visible = await h1.isVisible().catch(() => false);
    const h1Text = await h1.textContent().catch(() => '');
    console.log('  Judul h1    : ' + (h1Visible ? 'OK — "' + h1Text.trim().slice(0, 50) + '"' : 'TIDAK ADA'));

    // Cek gambar hero
    const heroImg = page.locator('.article-container img').first();
    const imgVisible = await heroImg.isVisible().catch(() => false);
    const imgSrc = await heroImg.getAttribute('src').catch(() => '');
    console.log('  Gambar hero : ' + (imgVisible ? 'OK' : 'TIDAK ADA'));

    // Cek tanggal
    const date = page.locator('.article-container .text-primary').first();
    const dateVisible = await date.isVisible().catch(() => false);
    const dateText = await date.textContent().catch(() => '');
    console.log('  Tanggal     : ' + (dateVisible ? 'OK — ' + dateText.trim() : 'TIDAK ADA'));

    // Cek breadcrumb
    const breadcrumb = page.locator('a:has-text("News & Stories")').first();
    const breadVisible = await breadcrumb.isVisible().catch(() => false);
    console.log('  Breadcrumb  : ' + (breadVisible ? 'OK' : 'TIDAK ADA'));

    expect(h1Visible, 'Judul artikel harus tampil').toBe(true);
    expect(imgVisible, 'Gambar hero harus tampil').toBe(true);
    expect(dateVisible, 'Tanggal artikel harus tampil').toBe(true);
    expect(breadVisible, 'Breadcrumb harus tampil').toBe(true);
    console.log('  [OK] Struktur halaman detail artikel lengkap');
  });

