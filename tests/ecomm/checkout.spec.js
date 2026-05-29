// @ts-check
const { test, expect } = require('../helpers/fixtures');
const { getConfig, ensureAuth, addProductToCart } = require('../helpers/ecommerce');

test.setTimeout(180000);

const CFG = getConfig('frankco');
const PRODUCT_SLUG = '/en/products/frank-deer-allu-baby-deer-pendant';

test.describe.configure({ mode: 'serial' });

test.describe('E2E User Journey — Frank & Co (checkout flow)', () => {

  test.beforeAll(async ({ browser }) => {
    await ensureAuth(browser, CFG);
  });

  test.use({ storageState: CFG.storagePath });

  test('Sesi login aktif', async ({ page }) => {
    await page.goto('/en', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(500);
    const url = page.url();
    console.log('  -> URL: ' + url);
    expect(url, 'Sesi harus aktif, tidak redirect ke login').not.toContain('/login');
    console.log('  [OK] Sesi login aktif');
  });

  test('Add to Cart — produk masuk ke keranjang', async ({ page }) => {
    const drawer = await addProductToCart(page, CFG, PRODUCT_SLUG);

    const productLink = drawer.locator('a[href*="/products/"]').first();
    const productVisible = await productLink.isVisible().catch(() => false);
    console.log('  [' + (productVisible ? 'OK' : 'GAGAL') + '] Produk tampil di cart');
    expect(productVisible, 'Produk harus ada di cart drawer').toBe(true);

    const drawerText = await drawer.textContent().catch(() => '');
    const hasPrice = /Rp|IDR|\$/.test(drawerText);
    console.log('  [' + (hasPrice ? 'OK' : 'GAGAL') + '] Harga tampil di drawer');
    expect(hasPrice, 'Drawer harus menampilkan harga').toBe(true);

    console.log('  [OK] Produk berhasil masuk ke keranjang');
  });

  test('Cart Drawer — tombol CHECKOUT berfungsi', async ({ page }) => {
    const drawer = await addProductToCart(page, CFG, PRODUCT_SLUG);

    const checkoutBtn = drawer.locator('button, a').filter({ hasText: CFG.checkoutText }).first();
    const btnVisible = await checkoutBtn.isVisible().catch(() => false);
    console.log('  [' + (btnVisible ? 'OK' : 'GAGAL') + '] Tombol CHECKOUT tampil');
    expect(btnVisible, 'Tombol CHECKOUT harus tampil di cart drawer').toBe(true);

    await checkoutBtn.click();
    console.log('  -> Klik CHECKOUT');

    // Tunggu URL berubah ke /checkout atau halaman shipping
    await page.waitForURL((u) => /checkout|shipping|info/i.test(u.href), { timeout: 30000 });
    console.log('  [OK] Redirect ke halaman checkout/shipping -> ' + page.url());
  });

  test('Halaman Checkout — info pengiriman tampil', async ({ page }) => {
    const drawer = await addProductToCart(page, CFG, PRODUCT_SLUG);
    await drawer.locator('button, a').filter({ hasText: CFG.checkoutText }).first().click();
    await page.waitForURL((u) => /checkout|shipping|info/i.test(u.href), { timeout: 30000 });

    const heading = page.locator('h1, h2').filter({ hasText: /shipping|checkout|info|pengiriman/i }).first();
    const headingVisible = await heading.isVisible().catch(() => false);
    console.log('  [' + (headingVisible ? 'OK' : 'GAGAL') + '] Heading checkout/shipping tampil');
    expect(headingVisible, 'Heading checkout harus tampil').toBe(true);

    console.log('  [OK] Halaman checkout loaded — STOP sebelum proses pembayaran');
  });

});
