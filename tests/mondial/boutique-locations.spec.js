// @ts-check
const { test, expect } = require('@playwright/test');

test.setTimeout(120000);

const PAGE_URL = '/en/boutiques';

const CITY_FILTERS = ['Jabodetabek', 'Bandung', 'Makassar', 'Medan', 'Surabaya'];

test.describe('Boutique Locations page — Mondial', () => {

  test('Halaman Boutique Locations load dengan benar', async ({ page }) => {
    const response = await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    const status = response ? response.status() : null;
    const title  = await page.title();
    console.log('  Status : ' + status);
    console.log('  Title  : ' + title);
    console.log('  URL    : ' + page.url());
    expect(status).toBeLessThan(400);
    expect(title.toLowerCase()).toContain('mondial');
  });

  test('Search bar tampil dan dapat diisi', async ({ page }) => {
    await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(1000);

    const searchInput = page.locator('input[placeholder*="Search boutique"]').first();
    const visible = await searchInput.isVisible().catch(() => false);
    console.log('  Search input: ' + (visible ? 'OK' : 'TIDAK DITEMUKAN'));
    expect(visible, 'Search input harus tampil').toBe(true);

    await searchInput.fill('Plaza Indonesia');
    const value = await searchInput.inputValue();
    console.log('  Nilai input: ' + value);
    expect(value).toBe('Plaza Indonesia');
    console.log('  [OK] Search bar dapat diisi');
  });

  test('Filter kota tampil dan dapat diklik', async ({ page }) => {
    await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(1000);

    // Cek semua filter kota tersedia
    for (const city of CITY_FILTERS) {
      const btn = page.locator('nav[aria-label="Store locations"] button:has-text("' + city + '")').first();
      const visible = await btn.isVisible().catch(() => false);
      console.log('  Filter ' + city + ': ' + (visible ? 'OK' : 'TIDAK DITEMUKAN'));
      expect(visible, 'Filter ' + city + ' harus tampil').toBe(true);
    }
    console.log('  [OK] ' + CITY_FILTERS.length + ' filter kota tersedia');
  });

  test('Filter kota berfungsi — klik Jabodetabek', async ({ page }) => {
    await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(1000);

    // Hitung store sebelum filter
    const beforeCount = await page.locator('article[aria-label^="Store"]').count();
    console.log('  Store sebelum filter: ' + beforeCount);
    expect(beforeCount).toBeGreaterThan(0);

    // Klik filter Jabodetabek
    const jaboBtn = page.locator('nav[aria-label="Store locations"] button:has-text("Jabodetabek")').first();
    await jaboBtn.click();
    await page.waitForTimeout(1000);

    const afterCount = await page.locator('article[aria-label^="Store"]').count();
    console.log('  Store setelah filter Jabodetabek: ' + afterCount);
    expect(afterCount).toBeGreaterThan(0);
    console.log('  [OK] Filter Jabodetabek berfungsi');
  });

  test('Store cards tampil dengan nama, alamat, WhatsApp, dan email', async ({ page }) => {
    await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(1000);

    const cards = await page.locator('article[aria-label^="Store"]').all();
    console.log('  Ditemukan ' + cards.length + ' store card');
    expect(cards.length, 'Harus ada minimal 1 store').toBeGreaterThan(0);

    // Cek card pertama secara detail
    const firstCard = cards[0];
    const name    = await firstCard.locator('h3').first().textContent().catch(() => '');
    const address = await firstCard.locator('p').first().textContent().catch(() => '');
    const waLink  = await firstCard.locator('a[href*="wa.me"]').first().getAttribute('href').catch(() => null);
    const mailLink = await firstCard.locator('a[href*="mailto"]').first().getAttribute('href').catch(() => null);

    console.log('  Store pertama: "' + name.trim() + '"');
    console.log('  Alamat: ' + (address.trim().length > 0 ? 'OK' : 'KOSONG'));
    console.log('  WhatsApp: ' + (waLink ? 'OK — ' + waLink : 'TIDAK ADA'));
    console.log('  Email: ' + (mailLink ? 'OK — ' + mailLink : 'TIDAK ADA'));

    expect(name.trim().length, 'Nama store harus ada').toBeGreaterThan(0);
    expect(address.trim().length, 'Alamat store harus ada').toBeGreaterThan(0);
    expect(waLink, 'WhatsApp link harus ada').toBeTruthy();
    expect(mailLink, 'Email link harus ada').toBeTruthy();
    console.log('  [OK] Store card pertama valid');
  });

  test('Nama boutique dapat diklik dan mengarah ke halaman detail', async ({ page }) => {
    await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(1000);

    // Klik nama boutique (link di h3) — bukan icon
    const firstDetailLink = page.locator('article[aria-label^="Store"] a.group[href*="/en/boutiques/"]').first();
    const href = await firstDetailLink.getAttribute('href').catch(() => null);
    console.log('  Link detail pertama: ' + href);
    expect(href, 'Link detail harus ada').toBeTruthy();

    const response = await page.goto(href, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => null);
    const status = response ? response.status() : null;
    const title  = await page.title();
    console.log('  Status: ' + status + ' — ' + title);
    expect(status, 'Halaman detail harus 200').toBeLessThan(400);
    console.log('  [OK] Halaman detail boutique dapat diakses');
  });

});
