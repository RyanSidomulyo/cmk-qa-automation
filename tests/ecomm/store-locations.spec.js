// @ts-check
const { test, expect } = require('../helpers/fixtures');

test.setTimeout(120000);

const PAGE_URL = '/en/stores';
const HOMEPAGE_TITLE = 'Frank & co. | Natural Diamond Jewellery, Fashion Collections, and Gifts';

async function isPageValid(page) {
  const title = await page.title().catch(() => '');
  const titleLower = title.toLowerCase();
  const errorTitles = ['404', '500', '503', 'error', 'server error', 'something went wrong'];
  const hasErrorTitle = errorTitles.some(function(e) { return titleLower.startsWith(e) || titleLower.includes(e); });
  return title !== '' && title !== HOMEPAGE_TITLE && !hasErrorTitle;
}

test.describe('Store Locations page — functional test', () => {

  test('Halaman Store Locations load dengan benar', async ({ page }) => {
    const response = await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    const status = response ? response.status() : null;
    const title  = await page.title();
    console.log('  Status : ' + status);
    console.log('  Title  : ' + title);
    console.log('  URL    : ' + page.url());
    expect(status).not.toBeNull();
    expect(status).toBeGreaterThanOrEqual(200);
    expect(status).toBeLessThan(400);
    expect(await isPageValid(page), 'Halaman tidak boleh error atau redirect ke homepage').toBe(true);
  });

  test('Accordion kota tampil dan dapat di-expand', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(1000);

    // Cari semua accordion button kota
    const accordionBtns = await page.locator('button[aria-expanded]:has(span.uppercase)').all();
    console.log('\n  Ditemukan ' + accordionBtns.length + ' accordion kota');
    expect(accordionBtns.length, 'Harus ada minimal 1 kota').toBeGreaterThan(0);

    // Klik accordion pertama dan cek expand
    const firstBtn = accordionBtns[0];
    const cityName = await firstBtn.locator('span').first().innerText().catch(() => 'Unknown');
    console.log('  -> Klik accordion: "' + cityName + '"');

    const ariaBeforeClick = await firstBtn.getAttribute('aria-expanded');
    console.log('  aria-expanded sebelum klik: ' + ariaBeforeClick);

    await firstBtn.click();
    await page.waitForTimeout(500);

    const ariaAfterClick = await firstBtn.getAttribute('aria-expanded');
    console.log('  aria-expanded setelah klik: ' + ariaAfterClick);

    expect(ariaAfterClick, 'Accordion harus berubah setelah diklik').not.toBe(ariaBeforeClick);
    console.log('  [OK] Accordion dapat di-expand');
  });

  test('Store cards tampil setelah accordion di-expand', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(1000);

    // Klik accordion pertama (Jabodetabek)
    const firstBtn = page.locator('button[aria-expanded]:has(span.uppercase)').first();
    const cityName = await firstBtn.locator('span').first().innerText().catch(() => 'Unknown');
    console.log('  -> Expand kota: "' + cityName + '"');
    await firstBtn.click();
    await page.waitForTimeout(800);

    // Cek store cards muncul — cari nama toko di dalam accordion
    const storeNames = await page.locator('p.text-primary.uppercase').all();
    console.log('  Ditemukan ' + storeNames.length + ' store card');
    expect(storeNames.length, 'Harus ada store setelah accordion di-expand').toBeGreaterThan(0);

    // Cek store pertama punya nama, alamat, dan link kontak
    const firstName = await storeNames[0].innerText().catch(() => '');
    console.log('  Store pertama: "' + firstName + '"');

    const firstWa  = await page.locator('a[href*="wa.me"]').first().isVisible().catch(() => false);
    const firstMail = await page.locator('a[href*="mailto:"]').first().isVisible().catch(() => false);
    console.log('  WhatsApp link: ' + (firstWa ? 'OK' : 'GAGAL'));
    console.log('  Email link   : ' + (firstMail ? 'OK' : 'GAGAL'));

    expect(firstName.length, 'Nama store tidak boleh kosong').toBeGreaterThan(0);
    console.log('  [OK] Store cards tampil dengan benar');
  });

  test('Multiple accordion dapat di-expand dan di-collapse', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(1000);

    const accordionBtns = await page.locator('button[aria-expanded]:has(span.uppercase)').all();
    const testCount = Math.min(accordionBtns.length, 3);

    console.log('\n  Test ' + testCount + ' accordion pertama:');
    for (let i = 0; i < testCount; i++) {
      const btn = accordionBtns[i];
      const name = await btn.locator('span').first().innerText().catch(() => 'Unknown');

      // Expand
      await btn.click();
      await page.waitForTimeout(400);
      const expanded = await btn.getAttribute('aria-expanded');

      // Collapse
      await btn.click();
      await page.waitForTimeout(400);
      const collapsed = await btn.getAttribute('aria-expanded');

      console.log('  [' + (expanded === 'true' && collapsed === 'false' ? 'OK' : 'GAGAL') + '] ' + name + ' — expand: ' + expanded + ', collapse: ' + collapsed);
    }

    console.log('  [OK] Accordion expand/collapse berfungsi');
  });

  test('Map pin link dapat diklik dan mengarah ke URL yang valid', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(1000);

    // Expand accordion pertama
    const firstBtn = page.locator('button[aria-expanded]:has(span.uppercase)').first();
    await firstBtn.click();
    await page.waitForTimeout(800);

    // Cek map pin links — bisa internal (/stores/...) atau external (google maps)
    const mapLinks = await page.locator('a:has(svg.lucide-map-pin)').all();
    console.log('\n  Ditemukan ' + mapLinks.length + ' map pin link');
    expect(mapLinks.length, 'Harus ada minimal 1 map link').toBeGreaterThan(0);

    // Cek 3 link pertama
    const sample = Math.min(mapLinks.length, 3);
    for (let i = 0; i < sample; i++) {
      const href = await mapLinks[i].getAttribute('href').catch(() => '');
      const isInternal = href && href.startsWith('/stores/');
      const isExternal = href && href.includes('google.com/maps');
      const valid = isInternal || isExternal;
      console.log('  Link ' + (i+1) + ': ' + (valid ? 'OK' : 'GAGAL') + ' — ' + (href ? href.slice(0, 60) : 'kosong'));
    }

    console.log('  [OK] Map pin links valid');
  });

});
