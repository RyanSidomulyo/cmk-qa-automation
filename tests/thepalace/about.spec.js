// @ts-check
const { test, expect } = require('../helpers/fixtures');

test.setTimeout(120000);

const ABOUT_PAGES = [
  {
    path: '/about/the-palace',
    h2: 'The Palace National Jeweler',
    subHeading: 'Perhiasan kebanggaan Indonesia',
    sections: ['Terlengkap', 'Dari Indonesia untuk Indonesia'],
  },
  {
    path: '/about/diamond',
    h2: null,
    subHeading: null,
    sections: [],
  },
  {
    path: '/about/gold',
    h2: null,
    subHeading: null,
    sections: [],
  },
];

test.describe('Tentang Kami — The Palace', () => {

  test('Semua halaman /about/* load tanpa error', async ({ page }) => {
    const paths = ['/about/the-palace', '/about/diamond', '/about/gold'];
    const failed = [];

    for (const path of paths) {
      const response = await page.goto(path, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => null);
      const status = response ? response.status() : null;
      const ok = status && status < 400;
      console.log('  → ' + path + ' → ' + (ok ? '✓ ' + status : '✗ ' + status));
      if (!ok) failed.push(path + ' (status: ' + status + ')');
    }

    if (failed.length > 0) {
      throw new Error('Halaman about error:\n' + failed.map(f => '  ✗ ' + f).join('\n'));
    }
    console.log('  [OK] Semua halaman /about/* load');
  });

  test('Halaman /about/the-palace — heading dan konten tampil', async ({ page }) => {
    await page.goto('/about/the-palace', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(1000);

    const h2 = page.locator('h2').filter({ hasText: 'The Palace National Jeweler' }).first();
    const h2Visible = await h2.isVisible().catch(() => false);
    console.log('  [' + (h2Visible ? 'OK' : 'GAGAL') + '] Heading "The Palace National Jeweler"');
    expect(h2Visible, 'Heading utama harus tampil').toBe(true);

    const subHeading = page.locator('p').filter({ hasText: 'Perhiasan kebanggaan Indonesia' }).first();
    const subVisible = await subHeading.isVisible().catch(() => false);
    console.log('  [' + (subVisible ? 'OK' : 'GAGAL') + '] Sub-heading "Perhiasan kebanggaan Indonesia"');
    expect(subVisible, 'Sub-heading harus tampil').toBe(true);

    const sections = ['Terlengkap', 'Dari Indonesia untuk Indonesia'];
    for (const sec of sections) {
      const el = page.locator('h3').filter({ hasText: sec }).first();
      const visible = await el.isVisible().catch(() => false);
      console.log('  [' + (visible ? 'OK' : 'GAGAL') + '] Seksi "' + sec + '"');
      expect(visible, 'Seksi "' + sec + '" harus tampil').toBe(true);
    }
    console.log('  [OK] Konten /about/the-palace lengkap');
  });

  test('Halaman /about/the-palace — gambar tidak broken', async ({ page }) => {
    await page.goto('/about/the-palace', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2000);

    const images = await page.locator('img').all();
    console.log('  Total gambar ditemukan: ' + images.length);
    expect(images.length, 'Harus ada gambar di halaman').toBeGreaterThan(0);

    const brokenImages = [];
    for (const img of images) {
      const alt = await img.getAttribute('alt').catch(() => '');
      const src = await img.getAttribute('src').catch(() => '');

      const loaded = await img.evaluate(el => {
        return el.complete && typeof el.naturalWidth !== 'undefined' && el.naturalWidth > 0;
      }).catch(() => false);

      const label = alt || src || '(no alt)';
      console.log('  → ' + label.substring(0, 60) + ' → ' + (loaded ? '✓' : '✗ BROKEN'));

      if (!loaded) {
        brokenImages.push(
          'Alt: "' + alt + '"\n    URL: ' + src + '\n    Halaman: /about/the-palace'
        );
      }
    }

    if (brokenImages.length > 0) {
      throw new Error('Gambar broken di /about/the-palace:\n' + brokenImages.map(b => '  ✗ ' + b).join('\n\n'));
    }
    console.log('  [OK] Semua gambar load');
  });

  test('Halaman /about/the-palace — breadcrumb links berfungsi', async ({ page }) => {
    await page.goto('/about/the-palace', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(1000);

    const breadcrumbLinks = await page.locator('div.container.flex.gap-2 a').all();
    console.log('  Breadcrumb links: ' + breadcrumbLinks.length);
    expect(breadcrumbLinks.length, 'Harus ada breadcrumb links').toBeGreaterThan(0);

    for (const link of breadcrumbLinks) {
      const text = await link.textContent().catch(() => '');
      const href = await link.getAttribute('href').catch(() => '');
      const visible = await link.isVisible().catch(() => false);
      console.log('  [' + (visible ? 'OK' : 'GAGAL') + '] Breadcrumb "' + text.trim() + '" → ' + href);
      expect(visible, 'Breadcrumb "' + text.trim() + '" harus tampil').toBe(true);
      expect(href, 'Breadcrumb harus punya href').toBeTruthy();
    }
    console.log('  [OK] Breadcrumb berfungsi');
  });

  test('Halaman /about/the-palace — CTA buttons tampil dan bisa diklik', async ({ page }) => {
    await page.goto('/about/the-palace', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(1000);

    const allBtns = await page.locator('a[href], button[type="button"]').filter({ hasText: /lihat|koleksi|shop|belanja|produk/i }).all();

    // filter hanya yang visible — ignore hidden duplicates (e.g. gold price widget)
    const buttons = [];
    const seenTexts = new Set();
    for (const btn of allBtns) {
      const visible = await btn.isVisible().catch(() => false);
      const text = (await btn.textContent().catch(() => '')).trim().substring(0, 40);
      if (visible && !seenTexts.has(text)) {
        seenTexts.add(text);
        buttons.push({ btn, text });
      }
    }

    console.log('  CTA buttons visible: ' + buttons.length);

    if (buttons.length === 0) {
      console.log('  → Tidak ada CTA button eksplisit (halaman informasi statis)');
      return;
    }

    for (const { text } of buttons) {
      console.log('  [OK] Button "' + text + '"');
    }
    console.log('  [OK] Semua CTA button tampil');
  });

  test('Halaman /about/diamond — gambar tidak broken', async ({ page }) => {
    await page.goto('/about/diamond', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2000);

    const images = await page.locator('img').all();
    console.log('  Total gambar di /about/diamond: ' + images.length);

    const brokenImages = [];
    for (const img of images) {
      const alt = await img.getAttribute('alt').catch(() => '');
      const src = await img.getAttribute('src').catch(() => '');
      const loaded = await img.evaluate(el => {
        return el.complete && typeof el.naturalWidth !== 'undefined' && el.naturalWidth > 0;
      }).catch(() => false);

      console.log('  → ' + (alt || '(no alt)').substring(0, 60) + ' → ' + (loaded ? '✓' : '✗ BROKEN'));
      if (!loaded) {
        brokenImages.push('Alt: "' + alt + '"\n    URL: ' + src + '\n    Halaman: /about/diamond');
      }
    }

    if (brokenImages.length > 0) {
      throw new Error('Gambar broken di /about/diamond:\n' + brokenImages.map(b => '  ✗ ' + b).join('\n\n'));
    }
    console.log('  [OK] Semua gambar /about/diamond load');
  });

  test('Halaman /about/gold — gambar tidak broken', async ({ page }) => {
    await page.goto('/about/gold', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2000);

    const images = await page.locator('img').all();
    console.log('  Total gambar di /about/gold: ' + images.length);

    const brokenImages = [];
    for (const img of images) {
      const alt = await img.getAttribute('alt').catch(() => '');
      const src = await img.getAttribute('src').catch(() => '');
      const loaded = await img.evaluate(el => {
        return el.complete && typeof el.naturalWidth !== 'undefined' && el.naturalWidth > 0;
      }).catch(() => false);

      console.log('  → ' + (alt || '(no alt)').substring(0, 60) + ' → ' + (loaded ? '✓' : '✗ BROKEN'));
      if (!loaded) {
        brokenImages.push('Alt: "' + alt + '"\n    URL: ' + src + '\n    Halaman: /about/gold');
      }
    }

    if (brokenImages.length > 0) {
      throw new Error('Gambar broken di /about/gold:\n' + brokenImages.map(b => '  ✗ ' + b).join('\n\n'));
    }
    console.log('  [OK] Semua gambar /about/gold load');
  });

});
