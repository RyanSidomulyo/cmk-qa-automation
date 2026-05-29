// @ts-check
const { test, expect } = require('../helpers/fixtures');
const { getConfig, ensureAuth, addToWishlist } = require('../helpers/ecommerce');

test.setTimeout(180000);

const CFG = getConfig('frankco');
const PRODUCT_SLUG = '/en/products/frank-deer-allu-baby-deer-pendant';
const PRODUCT_KEY = 'frank-deer-allu-baby-deer-pendant';

test.describe.configure({ mode: 'serial' });

test.describe('Add to Wishlist — Frank & Co', () => {

  test.beforeAll(async ({ browser }) => {
    await ensureAuth(browser, CFG);
  });

  test.use({ storageState: CFG.storagePath });

  test('Klik wishlist di PDP -> produk muncul di halaman wishlist', async ({ page }) => {
    const clicked = await addToWishlist(page, PRODUCT_SLUG, CFG);
    expect(clicked, 'Tombol wishlist harus terdeteksi & ke-klik').toBe(true);

    await page.goto(CFG.wishlistPath, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(3000);

    const url = page.url();
    console.log('  -> Wishlist URL: ' + url);
    expect(url, 'Halaman wishlist tidak boleh redirect ke login').not.toContain('/login');

    const title = await page.title();
    expect(title.toLowerCase(), 'Halaman wishlist tidak boleh 404').not.toContain('404');

    // Toleran: cari produk via image src (Frank pakai struktur custom), atau link
    const productImg = page.locator('img[src*="' + PRODUCT_KEY + '"]').first();
    const productLink = page.locator('a[href*="' + PRODUCT_KEY + '"]').first();
    const imgFound = await productImg.isVisible().catch(() => false);
    const linkFound = await productLink.isVisible().catch(() => false);

    const found = imgFound || linkFound;
    console.log('  [' + (found ? 'OK' : 'GAGAL') + '] Produk tampil di wishlist (img=' + imgFound + ', link=' + linkFound + ')');
    expect(found, 'Produk yang baru di-wishlist harus tampil (via img src atau link href)').toBe(true);
  });

});
