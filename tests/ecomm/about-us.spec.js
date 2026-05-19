// @ts-check
const { test, expect } = require('@playwright/test');

test.setTimeout(60000);

const PAGE_URL = '/en/about-us';
const HOMEPAGE_TITLE = 'Frank & co. | Natural Diamond Jewellery, Fashion Collections, and Gifts';

test.describe('About Us page — functional test', () => {

  test('Halaman About Us load dengan benar', async ({ page }) => {
    const response = await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    const status = response ? response.status() : null;
    const title  = await page.title();
    console.log('  Status : ' + status);
    console.log('  Title  : ' + title);
    // Cek status 2xx (200, 201, dll) — bukan 4xx atau 5xx
    expect(status, 'Halaman tidak boleh return 4xx/5xx').not.toBeNull();
    expect(status, 'Halaman tidak boleh return 4xx/5xx').toBeGreaterThanOrEqual(200);
    expect(status, 'Halaman tidak boleh return 4xx/5xx').toBeLessThan(400);
    const titleValid = title !== HOMEPAGE_TITLE && title !== '' && !title.startsWith('404');
    expect(titleValid, 'Halaman tidak boleh redirect ke homepage').toBe(true);
  });

});
