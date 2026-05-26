// @ts-check
const { test, expect } = require('@playwright/test');

test.setTimeout(180000);

const PAGE_URL = '/article';

test.describe('Article page — The Palace', () => {

  test('Halaman Artikel load dengan benar', async ({ page }) => {
    const response = await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    const status = response ? response.status() : null;
    const title  = await page.title();
    console.log('  Status : ' + status);
    console.log('  Title  : ' + title);
    console.log('  URL    : ' + page.url());
    expect(status).toBeLessThan(400);
  });

  test('Article cards tampil dan minimal ada 5 artikel', async ({ page }) => {
    await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(1500);

    const cards = await page.locator('a[href^="/article/"]').all();
    console.log('  Ditemukan ' + cards.length + ' article card');
    expect(cards.length, 'Harus ada minimal 5 artikel').toBeGreaterThanOrEqual(5);
    console.log('  [OK] Article cards tampil');
  });

  test('Format struktur 5 artikel teratas (gambar, tanggal, judul, link)', async ({ page }) => {
    await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(1500);

    const cards = await page.locator('a[href^="/article/"]').all();
    expect(cards.length).toBeGreaterThanOrEqual(5);

    const toTest = cards.slice(0, 5);
    const failed = [];

    for (let i = 0; i < toTest.length; i++) {
      const card = toTest[i];
      const href = await card.getAttribute('href').catch(() => '');
      const img  = card.locator('img').first();
      const imgSrc = await img.getAttribute('src').catch(() => '');
      const imgVisible = imgSrc && imgSrc.length > 0;

      // Cari tanggal dengan format dd.mm.yyyy atau "dd Month yyyy"
      const dateText = await card.locator('div.text-gray-500, div.text-sm').first().textContent().catch(() => '');
      const dateOk = dateText.trim().length > 0;

      const titleText = await card.locator('h1, h2').first().textContent().catch(() => '');
      const titleOk = titleText.trim().length > 0;

      const hrefOk = href && href.includes('/article/');

      const allOk = hrefOk && imgVisible && dateOk && titleOk;
      console.log('  Artikel ' + (i + 1) + ': "' + titleText.trim().slice(0, 50) + '"');
      console.log('     Href   : ' + (hrefOk ? 'OK' : 'GAGAL — ' + href));
      console.log('     Gambar : ' + (imgVisible ? 'OK' : 'TIDAK ADA'));
      console.log('     Tanggal: ' + (dateOk ? 'OK — ' + dateText.trim() : 'KOSONG'));
      console.log('     Judul  : ' + (titleOk ? 'OK' : 'KOSONG'));

      if (!allOk) failed.push(titleText.trim().slice(0, 50));
    }

    if (failed.length > 0) {
      throw new Error('Artikel gagal validasi: ' + failed.join(', '));
    }
    console.log('  Ringkasan: ' + toTest.length + '/' + toTest.length + ' artikel OK');
  });

  test('5 artikel teratas dapat diakses (tidak 404)', async ({ page }) => {
    await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(1500);

    const cards = await page.locator('a[href^="/article/"]').all();
    const hrefs = [];
    for (const card of cards.slice(0, 5)) {
      const href = await card.getAttribute('href').catch(() => '');
      if (href && !hrefs.includes(href)) hrefs.push(href);
    }

    console.log('  Menguji ' + hrefs.length + ' artikel pertama');
    const failed = [];

    for (const href of hrefs) {
      const response = await page.goto(href, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => null);
      const status = response ? response.status() : null;
      const ok = status && status < 400;
      console.log('  → ' + href + ' → ' + (ok ? '✓' : '✗ ' + status));
      if (!ok) failed.push(href + ' (status: ' + status + ')');
      await page.waitForTimeout(300);
    }

    if (failed.length > 0) {
      throw new Error('Artikel gagal diakses:\n' + failed.join('\n'));
    }
    console.log('  Ringkasan: ' + hrefs.length + '/' + hrefs.length + ' artikel OK');
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

    const images = await page.locator('a[href^="/article/"] img').all();
    console.log('  Ditemukan ' + images.length + ' gambar artikel');

    let broken = 0;
    const brokenDetails = [];
    for (let i = 0; i < Math.min(images.length, 6); i++) {
      const naturalWidth = await images[i].evaluate(el => el.naturalWidth).catch(() => 0);
      const src = await images[i].getAttribute('src').catch(() => '');
      const alt = await images[i].getAttribute('alt').catch(() => '');
      // Cari parent <a> untuk dapat artikel link
      const parentHref = await images[i].evaluateHandle(el => {
        let parent = el.closest('a');
        return parent ? parent.getAttribute('href') : '';
      }).then(h => h.jsonValue()).catch(() => '');

      const ok = naturalWidth > 0;
      if (!ok) {
        broken++;
        brokenDetails.push({
          index: i + 1,
          alt: alt || '(tanpa alt)',
          src: src,
          articleLink: parentHref
        });
      }
      console.log('  Gambar ' + (i + 1) + ': ' + (ok ? 'OK' : 'BROKEN — ' + (alt || '(tanpa alt)')));
    }

    if (broken > 0) {
      console.log('');
      console.log('  ===== DETAIL GAMBAR BROKEN =====');
      brokenDetails.forEach(b => {
        console.log('  Gambar #' + b.index + ':');
        console.log('    Alt          : ' + b.alt);
        console.log('    Artikel link : ' + b.articleLink);
        console.log('    Image URL    : ' + b.src);
        console.log('');
      });
    }

    if (broken > 0) {
      const errorMsg = brokenDetails.map(b =>
        '  Gambar #' + b.index + ': ' + b.alt + '\n' +
        '    Artikel : ' + b.articleLink + '\n' +
        '    URL     : ' + b.src
      ).join('\n');
      throw new Error('Ada gambar broken di halaman artikel:\n' + errorMsg);
    }
    console.log('  [OK] Semua gambar tampil dengan benar');
  });

});
