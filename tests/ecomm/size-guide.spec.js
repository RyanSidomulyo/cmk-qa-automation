// @ts-check
const { test, expect } = require('@playwright/test');

test.setTimeout(60000);

const PAGE_URL = '/en/size-guide';
const HOMEPAGE_TITLE = 'Frank & co. | Natural Diamond Jewellery, Fashion Collections, and Gifts';

async function isPageValid(page) {
  const title = await page.title().catch(() => '');
  const titleLower = title.toLowerCase();
  const errorTitles = ['404', '500', '503', 'error', 'server error', 'something went wrong', 'page not found'];
  const hasErrorTitle = errorTitles.some(function(e) { return titleLower.startsWith(e) || titleLower.includes(e); });
  return title !== '' && title !== HOMEPAGE_TITLE && !hasErrorTitle;
}

test.describe('size-guide page — functional test', () => {

  test('Halaman size-guide load dengan benar', async ({ page }) => {
    const response = await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    const status = response ? response.status() : null;
    const title  = await page.title();
    console.log('  Status : ' + status);
    console.log('  Title  : ' + title);
    console.log('  URL    : ' + page.url());

    // Cek status 2xx
    expect(status, 'Halaman tidak boleh return 4xx/5xx').not.toBeNull();
    expect(status, 'Halaman tidak boleh return 4xx/5xx').toBeGreaterThanOrEqual(200);
    expect(status, 'Halaman tidak boleh return 4xx/5xx').toBeLessThan(400);

    // Cek tidak redirect ke homepage atau error
    expect(await isPageValid(page), 'Halaman tidak boleh error atau redirect ke homepage').toBe(true);
  });

});
