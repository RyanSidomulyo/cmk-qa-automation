// @ts-check
const { test, expect } = require('@playwright/test');

test.setTimeout(120000);

const TERMS_SECTIONS = [
  'Definisi',
  'Syarat Pendaftaran Akun',
  'Kegiatan yang Dilarang',
  'Harga dan Pembayaran',
  'Garansi Penukaran',
  'Pengiriman Produk',
  'Hak Kekayaan Intelektual',
];

test.describe('Halaman Legal — The Palace', () => {

  test('Halaman /terms-condition load dengan benar', async ({ page }) => {
    const response = await page.goto('/terms-condition', { waitUntil: 'domcontentloaded', timeout: 60000 });
    const status = response ? response.status() : null;
    console.log('  Status : ' + status);
    console.log('  URL    : ' + page.url());
    expect(status, 'Halaman /terms-condition harus load — ' + page.url()).toBeLessThan(400);
  });

  test('Halaman /privacy-policies load dengan benar', async ({ page }) => {
    const response = await page.goto('/privacy-policies', { waitUntil: 'domcontentloaded', timeout: 60000 });
    const status = response ? response.status() : null;
    console.log('  Status : ' + status);
    console.log('  URL    : ' + page.url());
    expect(status, 'Halaman /privacy-policies harus load — ' + page.url()).toBeLessThan(400);
  });

  test('/terms-condition — heading dan seksi utama tampil', async ({ page }) => {
    await page.goto('/terms-condition', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(1000);

    const h3 = page.locator('h3').filter({ hasText: 'Syarat dan Ketentuan' }).first();
    const h3Visible = await h3.isVisible().catch(() => false);
    console.log('  [' + (h3Visible ? 'OK' : 'GAGAL') + '] Heading "Syarat dan Ketentuan"');
    expect(h3Visible, 'Heading harus tampil').toBe(true);

    const failedSections = [];
    for (const section of TERMS_SECTIONS) {
      const el = page.locator('p.font-medium').filter({ hasText: section }).first();
      const visible = await el.isVisible().catch(() => false);
      console.log('  [' + (visible ? 'OK' : 'GAGAL') + '] Seksi "' + section + '"');
      if (!visible) failedSections.push(section);
    }

    if (failedSections.length > 0) {
      throw new Error('Seksi tidak ditemukan di /terms-condition:\n' + failedSections.map(s => '  ✗ ' + s).join('\n'));
    }
    console.log('  [OK] Semua seksi utama tampil');
  });

  test('/terms-condition — breadcrumb tampil', async ({ page }) => {
    await page.goto('/terms-condition', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(500);

    const breadcrumbLinks = await page.locator('div.container a[href]').all();
    console.log('  Breadcrumb links: ' + breadcrumbLinks.length);
    expect(breadcrumbLinks.length, 'Harus ada breadcrumb').toBeGreaterThan(0);

    for (const link of breadcrumbLinks) {
      const text = await link.textContent().catch(() => '');
      const href = await link.getAttribute('href').catch(() => '');
      const visible = await link.isVisible().catch(() => false);
      console.log('  [' + (visible ? 'OK' : 'GAGAL') + '] "' + text.trim() + '" → ' + href);
      expect(visible, 'Breadcrumb harus tampil').toBe(true);
    }
  });

  test('/terms-condition — link ke /privacy-policies ada dan berfungsi', async ({ page }) => {
    await page.goto('/terms-condition', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(500);

    const privacyLink = page.locator('a[href="/privacy-policies"]').first();
    const visible = await privacyLink.isVisible().catch(() => false);
    console.log('  [' + (visible ? 'OK' : 'GAGAL') + '] Link ke /privacy-policies tampil');
    expect(visible, 'Link ke /privacy-policies harus ada di halaman terms').toBe(true);

    const response = await page.goto('/privacy-policies', { waitUntil: 'domcontentloaded', timeout: 60000 });
    const status = response ? response.status() : null;
    console.log('  /privacy-policies → status ' + status);
    expect(status, 'Link /privacy-policies harus tidak 404').toBeLessThan(400);
  });

  test('/privacy-policies — heading dan konten tampil', async ({ page }) => {
    await page.goto('/privacy-policies', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(1000);

    const heading = page.locator('h1, h2, h3').first();
    const headingVisible = await heading.isVisible().catch(() => false);
    const headingText = await heading.textContent().catch(() => '');
    console.log('  [' + (headingVisible ? 'OK' : 'GAGAL') + '] Heading: "' + headingText.trim() + '"');
    expect(headingVisible, 'Heading halaman privacy harus tampil').toBe(true);

    const paragraphs = await page.locator('p').all();
    console.log('  Jumlah paragraf: ' + paragraphs.length);
    expect(paragraphs.length, 'Halaman privacy harus punya konten').toBeGreaterThan(3);

    const sections = await page.locator('p.font-medium').all();
    console.log('  Jumlah seksi: ' + sections.length);
    expect(sections.length, 'Harus ada seksi di halaman privacy').toBeGreaterThan(0);

    console.log('  [OK] Konten /privacy-policies ada');
  });

  test('/terms-condition — konten tidak kosong', async ({ page }) => {
    await page.goto('/terms-condition', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(1000);

    const allSections = await page.locator('p.font-medium').all();
    console.log('  Total seksi ditemukan: ' + allSections.length);
    expect(allSections.length, 'Harus ada minimal 10 seksi di terms').toBeGreaterThanOrEqual(10);

    const paragraphs = await page.locator('p.leading-6').all();
    console.log('  Total paragraf konten: ' + paragraphs.length);
    expect(paragraphs.length, 'Harus ada konten paragraf').toBeGreaterThan(10);

    console.log('  [OK] Konten /terms-condition lengkap');
  });

});
