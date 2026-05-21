// @ts-check
const { test, expect } = require('@playwright/test');

test.setTimeout(90000);

const PAGE_URL = '/en/terms';

async function gotoWithRetry(page, url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      return res;
    } catch (e) {
      if (i === retries - 1) throw e;
      console.log('  [RETRY ' + (i+1) + '] Connection reset — mencoba lagi...');
      await page.waitForTimeout(2000);
    }
  }
}

const EXPECTED_SECTIONS = [
  'TERMS & CONDITIONS',
  'Definitions',
  'Account Registration Requirements',
  'Prohibited Activities',
  'Price and Payment',
  'Privacy Policy',
  'Force Majeure',
  'Intellectual Property Rights',
];

test.describe('Terms & Conditions page — Mondial', () => {

  test('Halaman Terms & Conditions load dengan benar', async ({ page }) => {
    const response = await gotoWithRetry(page, PAGE_URL);
    const status = response ? response.status() : null;
    const title  = await page.title();
    console.log('  Status : ' + status);
    console.log('  Title  : ' + title);
    console.log('  URL    : ' + page.url());
    expect(status).toBeLessThan(400);
    expect(title.toLowerCase()).toContain('mondial');
  });

  test('Heading "Terms and Conditions" tampil di halaman', async ({ page }) => {
    await gotoWithRetry(page, PAGE_URL);
    await page.waitForTimeout(500);

    const heading = page.locator('h2:has-text("Terms and Conditions")').first();
    const visible = await heading.isVisible().catch(() => false);
    console.log('  Heading Terms and Conditions: ' + (visible ? 'OK' : 'TIDAK DITEMUKAN'));
    expect(visible, 'Heading harus tampil').toBe(true);
  });

  test('Section-section utama tampil', async ({ page }) => {
    await gotoWithRetry(page, PAGE_URL);
    await page.waitForTimeout(500);

    let found = 0;
    for (const section of EXPECTED_SECTIONS) {
      const el = page.locator('.terms-wrapper h2:has-text("' + section + '")').first();
      const visible = await el.isVisible().catch(() => false);
      console.log('  [' + (visible ? 'OK' : 'GAGAL') + '] ' + section);
      if (visible) found++;
    }
    console.log('  Ringkasan: ' + found + '/' + EXPECTED_SECTIONS.length + ' section ditemukan');
    expect(found, 'Harus ada minimal 6 section').toBeGreaterThanOrEqual(6);
  });

  test('Konten halaman tidak kosong', async ({ page }) => {
    await gotoWithRetry(page, PAGE_URL);
    await page.waitForTimeout(500);

    const paragraphs = await page.locator('.terms-wrapper p').all();
    console.log('  Ditemukan ' + paragraphs.length + ' paragraf konten');
    expect(paragraphs.length, 'Harus ada minimal 5 paragraf').toBeGreaterThan(4);
    console.log('  [OK] Konten halaman tidak kosong');
  });

  test('Breadcrumb HOME > Terms and Conditions tampil', async ({ page }) => {
    await gotoWithRetry(page, PAGE_URL);
    await page.waitForTimeout(500);

    const homeLink = page.locator('a:has-text("HOME")').first();
    const termsLink = page.locator('a:has-text("Terms and Conditions")').first();

    const homeVisible = await homeLink.isVisible().catch(() => false);
    const termsVisible = await termsLink.isVisible().catch(() => false);

    console.log('  Breadcrumb HOME: ' + (homeVisible ? 'OK' : 'TIDAK DITEMUKAN'));
    console.log('  Breadcrumb Terms: ' + (termsVisible ? 'OK' : 'TIDAK DITEMUKAN'));
    expect(homeVisible, 'Breadcrumb HOME harus tampil').toBe(true);
    expect(termsVisible, 'Breadcrumb Terms harus tampil').toBe(true);
    console.log('  [OK] Breadcrumb tampil dengan benar');
  });

});
