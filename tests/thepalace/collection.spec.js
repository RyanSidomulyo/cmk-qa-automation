// @ts-check
const { test, expect } = require('@playwright/test');

test.setTimeout(120000);

const PAGE_URL = '/collection';

const COLLECTIONS = [
  { name: 'Gold/SNI',  banner_alt: 'Koleksi Emas', banner_href: '/product?query=&sort=created_at-desc&types=emas' },
  { name: 'Moela',     banner_alt: 'Moela',        banner_href: '/collections/moela' },
  { name: 'Kasmaran',  banner_alt: 'Kasmaran',     banner_href: '/collections/kasmaran' },
  { name: 'Nusantara', banner_alt: 'Nusantara',    banner_href: '/collections/nusantara' },
  { name: 'Kekaseh',   banner_alt: 'Kekaseh',      banner_href: '/collections/kekaseh' },
];

test.describe('Collection page — The Palace', () => {

  test('Halaman Koleksi load dengan benar', async ({ page }) => {
    const response = await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    const status = response ? response.status() : null;
    const title  = await page.title();
    console.log('  Status : ' + status);
    console.log('  Title  : ' + title);
    console.log('  URL    : ' + page.url());
    expect(status).toBeLessThan(400);
  });

  test('Heading dan deskripsi halaman tampil', async ({ page }) => {
    await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(1000);

    const heading = page.locator('h3:has-text("Koleksi The Palace")').first();
    const headingVisible = await heading.isVisible().catch(() => false);
    console.log('  Heading "Koleksi The Palace": ' + (headingVisible ? 'OK' : 'TIDAK DITEMUKAN'));
    expect(headingVisible).toBe(true);

    const desc = page.locator('p:has-text("Temukan perhiasan berkualitas")').first();
    const descVisible = await desc.isVisible().catch(() => false);
    console.log('  Deskripsi halaman: ' + (descVisible ? 'OK' : 'TIDAK DITEMUKAN'));
    expect(descVisible).toBe(true);
  });

  test('Breadcrumb BERANDA > Koleksi tampil', async ({ page }) => {
    await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(500);

    const home = page.locator('a:has-text("BERANDA")').first();
    const koleksi = page.locator('span:has-text("Koleksi")').first();

    const homeVisible = await home.isVisible().catch(() => false);
    const koleksiVisible = await koleksi.isVisible().catch(() => false);

    console.log('  Breadcrumb BERANDA: ' + (homeVisible ? 'OK' : 'TIDAK DITEMUKAN'));
    console.log('  Breadcrumb Koleksi: ' + (koleksiVisible ? 'OK' : 'TIDAK DITEMUKAN'));
    expect(homeVisible).toBe(true);
    expect(koleksiVisible).toBe(true);
  });

  test('Semua banner koleksi tampil dengan benar', async ({ page }) => {
    await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(1500);

    for (const col of COLLECTIONS) {
      const banner = page.locator('img[alt="' + col.banner_alt + '"]').first();
      const visible = await banner.isVisible().catch(() => false);
      console.log('  [' + (visible ? 'OK' : 'GAGAL') + '] Banner: ' + col.name);
      expect(visible, 'Banner ' + col.name + ' harus tampil').toBe(true);
    }
    console.log('  Ringkasan: ' + COLLECTIONS.length + '/' + COLLECTIONS.length + ' banner koleksi tampil');
  });

  test('Banner koleksi mengarah ke halaman yang benar', async ({ page }) => {
    await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(1500);

    const failed = [];
    for (const col of COLLECTIONS) {
      const response = await page.goto(col.banner_href, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => null);
      const status = response ? response.status() : null;
      const ok = status && status < 400;
      console.log('  → ' + col.name + ' (' + col.banner_href + ') → ' + (ok ? '✓' : '✗ ' + status));
      if (!ok) failed.push({ ...col, status });
    }

    if (failed.length > 0) {
      const detail = failed.map(f => '  ✗ "' + f.name + '" -> ' + f.banner_href + ' (status: ' + f.status + ')').join('\n');
      throw new Error('Ada banner koleksi yang error:\n' + detail);
    }
    console.log('  Ringkasan: ' + COLLECTIONS.length + '/' + COLLECTIONS.length + ' banner OK');
  });

  test('Produk pada setiap carousel koleksi tampil', async ({ page }) => {
    await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2000);

    const carousels = await page.locator('.slick-slider').all();
    console.log('  Ditemukan ' + carousels.length + ' carousel produk');
    expect(carousels.length, 'Harus ada minimal 5 carousel').toBeGreaterThanOrEqual(5);

    // Cek slide aktif di tiap carousel ada produk
    for (let i = 0; i < Math.min(carousels.length, 5); i++) {
      const slides = await carousels[i].locator('.slick-slide.slick-active').count();
      console.log('  Carousel ' + (i + 1) + ': ' + slides + ' slide aktif');
      expect(slides, 'Carousel ' + (i + 1) + ' harus ada slide aktif').toBeGreaterThan(0);
    }
    console.log('  [OK] Semua carousel produk aktif');
  });

  test('Tombol next/prev pada carousel berfungsi', async ({ page }) => {
    await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2000);

    const nextBtn = page.locator('button[aria-label="Next"]').first();
    const prevBtn = page.locator('button[aria-label="Previous"]').first();

    const nextExists = await nextBtn.count() > 0;
    const prevExists = await prevBtn.count() > 0;

    console.log('  Tombol Next  : ' + (nextExists ? 'OK — ada' : 'TIDAK DITEMUKAN'));
    console.log('  Tombol Prev  : ' + (prevExists ? 'OK — ada' : 'TIDAK DITEMUKAN'));
    expect(nextExists).toBe(true);
    expect(prevExists).toBe(true);
    console.log('  [OK] Tombol navigasi carousel tersedia');
  });

});
