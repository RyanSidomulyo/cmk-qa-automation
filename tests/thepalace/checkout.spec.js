// @ts-check
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const { attachApiMonitor } = require('../helpers/api-monitor');

test.setTimeout(180000);

const PHONE = '82291349125'; // tanpa leading 0, karena form sudah tampilkan +62
const PRODUCT_SLUG = 'anting-sugar-rush-blue-round-huggie';
const STORAGE_PATH = '/tmp/thepalace-checkout-auth.json';

// Pastikan file storageState ada sebelum test.use() dibaca
if (!fs.existsSync(STORAGE_PATH)) {
  fs.writeFileSync(STORAGE_PATH, JSON.stringify({ cookies: [], origins: [] }));
}

async function loginWithPhone(page) {
  const phoneInput = page.locator('input[name="phoneNumber"]');
  await phoneInput.waitFor({ state: 'visible', timeout: 15000 });
  await phoneInput.fill(PHONE);
  console.log('    → Isi nomor HP: ' + PHONE);

  await page.locator('button[type="submit"]').filter({ hasText: 'Masuk' }).click();
  console.log('    → Submit nomor HP');

  await page.locator('input[maxlength="1"]').first().waitFor({ state: 'visible', timeout: 30000 });
  console.log('    → Halaman OTP muncul');

  // Staging: OTP auto-terisi, tunggu semua 6 digit terisi
  await page.waitForFunction(() => {
    const inputs = document.querySelectorAll('input[maxlength="1"]');
    return inputs.length === 6 && Array.from(inputs).every(el => el.value.length > 0);
  }, { timeout: 30000 });
  console.log('    → OTP auto-terisi oleh staging');

  await page.locator('button[data-slot="button"]').filter({ hasText: 'Kirim' }).click();
  console.log('    → Submit OTP');

  await page.waitForURL(url => {
    const href = url.href;
    return !href.includes('otp') && !href.includes('/login') && !href.includes('/auth');
  }, { timeout: 30000 });
  console.log('    → Login berhasil → ' + page.url());
}

async function addProductToCart(page) {
  await page.goto('/product/' + PRODUCT_SLUG, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(2000);

  const addToCartBtn = page.locator('button[data-slot="button"]').filter({ hasText: 'Masukan ke Keranjang' }).first();
  await addToCartBtn.waitFor({ state: 'visible', timeout: 15000 });
  await addToCartBtn.click();
  console.log('    → Klik Masukan ke Keranjang');
  await page.waitForTimeout(2000);

  // Cek apakah cart drawer auto-terbuka
  const cartDrawer = page.locator('[data-slot="sheet-content"]');
  const isAutoOpen = await cartDrawer.isVisible().catch(() => false);

  if (!isAutoOpen) {
    // Fallback: buka cart drawer via cart icon di navigasi
    console.log('    → Cart tidak auto-buka, klik cart icon di nav...');
    const cartBtn = page.locator('button[aria-label="Shopping cart"]').first();
    await cartBtn.waitFor({ state: 'visible', timeout: 10000 });
    await cartBtn.click();
  }

  await cartDrawer.waitFor({ state: 'visible', timeout: 15000 });
  console.log('    → Cart drawer terbuka');
  return cartDrawer;
}

test.describe.configure({ mode: 'serial' });

test.describe('E2E User Journey — The Palace', () => {

  // Login sekali, simpan sesi, semua test pakai sesi yang sama
  test.beforeAll(async ({ browser }) => {
    const isValid = fs.existsSync(STORAGE_PATH) &&
      (Date.now() - fs.statSync(STORAGE_PATH).mtimeMs) < 15 * 60 * 1000 &&
      JSON.parse(fs.readFileSync(STORAGE_PATH, 'utf8')).cookies?.length > 0;

    if (isValid) {
      console.log('  [beforeAll] Auth state masih valid, skip re-login');
      return;
    }

    console.log('  [beforeAll] Login dan simpan auth state...');
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await loginWithPhone(page);
    await context.storageState({ path: STORAGE_PATH });
    await context.close();
    console.log('  [beforeAll] Auth state tersimpan → ' + STORAGE_PATH);
  });

  test.use({ storageState: STORAGE_PATH });

  // API smoke monitor — dengar response di setiap test, fail kalau ada 5xx
  // pada endpoint /api/, /graphql, atau /_next/data/.
  // Ignore otomatis: Sentry, GA, GTM, asset statis. Tambah pattern di sini
  // kalau ada false positive yang sah (mis. endpoint pihak ketiga yang
  // memang sering 5xx tapi non-critical).
  test.beforeEach(async ({ page }, testInfo) => {
    testInfo.apiMon = attachApiMonitor(page, testInfo, {
      ignorePatterns: [
        // Tambah pattern di sini kalau muncul false positive
      ],
    });
  });

  test.afterEach(async ({}, testInfo) => {
    // Hanya assert kalau test utama lulus. Kalau test sudah fail, jangan
    // timpa error message — biar root cause asli tetap kelihatan.
    if (testInfo.status === testInfo.expectedStatus) {
      testInfo.apiMon?.assertClean();
    }
  });

  test('Sesi login aktif', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(500);

    const url = page.url();
    console.log('  → URL: ' + url);
    expect(url, 'Sesi harus aktif, tidak redirect ke login').not.toContain('/login');
    console.log('  [OK] Sesi login aktif');
  });

  test('Add to Cart — produk masuk ke keranjang', async ({ page }) => {
    const cartDrawer = await addProductToCart(page);

    const productLink = cartDrawer.locator('a[href^="/product/"]').first();
    const productVisible = await productLink.isVisible().catch(() => false);
    console.log('  [' + (productVisible ? 'OK' : 'GAGAL') + '] Produk ada di cart');
    expect(productVisible, 'Produk harus ada di cart drawer').toBe(true);

    const productName = await cartDrawer.locator('h3').first().textContent().catch(() => '');
    console.log('  → Nama produk: ' + productName.trim().substring(0, 60));

    const subtotal = await cartDrawer.locator('[data-slot="sheet-footer"] span.text-lg').textContent().catch(() => '');
    console.log('  → Subtotal: ' + subtotal.trim());
    expect(subtotal, 'Subtotal harus tampil').toContain('Rp');

    console.log('  [OK] Produk berhasil masuk ke keranjang');
  });

  test('Cart Drawer — tombol CHECKOUT berfungsi', async ({ page }) => {
    const cartDrawer = await addProductToCart(page);

    const checkoutBtn = cartDrawer.locator('button[data-slot="button"]').filter({ hasText: 'CHECKOUT' });
    const btnVisible = await checkoutBtn.isVisible().catch(() => false);
    console.log('  [' + (btnVisible ? 'OK' : 'GAGAL') + '] Tombol CHECKOUT tampil di cart');
    expect(btnVisible, 'Tombol CHECKOUT harus tampil di cart drawer').toBe(true);

    await checkoutBtn.click();
    console.log('  → Klik CHECKOUT');

    const shippingHeading = page.locator('h1').filter({ hasText: /info pengiriman/i });
    await shippingHeading.waitFor({ state: 'visible', timeout: 30000 });
    console.log('  [OK] Redirect ke halaman Info Pengiriman → ' + page.url());
  });

  test('Info Pengiriman — alamat tersedia dan lanjut ke checkout', async ({ page }) => {
    const cartDrawer = await addProductToCart(page);
    await cartDrawer.locator('button[data-slot="button"]').filter({ hasText: 'CHECKOUT' }).click();

    await page.locator('h1').filter({ hasText: /info pengiriman/i }).waitFor({ state: 'visible', timeout: 30000 });
    console.log('  → Halaman Info Pengiriman: ' + page.url());

    const addressCard = page.locator('div.p-4.border.border-primary').first();
    const addressVisible = await addressCard.isVisible().catch(() => false);
    console.log('  [' + (addressVisible ? 'OK' : 'GAGAL') + '] Alamat tersimpan tersedia');
    expect(addressVisible, 'Harus ada alamat tersimpan di akun test').toBe(true);

    const addressText = await addressCard.textContent().catch(() => '');
    console.log('  → Alamat: ' + addressText.trim().replace(/\s+/g, ' ').substring(0, 100));

    await addressCard.click();
    await page.waitForTimeout(300);

    const lanjutBtn = page.locator('button[data-slot="button"]').filter({ hasText: 'Lanjut' });
    await lanjutBtn.waitFor({ state: 'visible', timeout: 10000 });
    await lanjutBtn.click();
    console.log('  → Klik Lanjut');

    await page.locator('h1').filter({ hasText: /checkout/i }).waitFor({ state: 'visible', timeout: 30000 });
    console.log('  [OK] Redirect ke halaman Checkout → ' + page.url());
  });

  test('Halaman Checkout — ringkasan pesanan dan tombol bayar', async ({ page }) => {
    // Setup: full flow sampai halaman checkout
    const cartDrawer = await addProductToCart(page);
    await cartDrawer.locator('button[data-slot="button"]').filter({ hasText: 'CHECKOUT' }).click();
    await page.locator('h1').filter({ hasText: /info pengiriman/i }).waitFor({ state: 'visible', timeout: 30000 });

    const addressCard = page.locator('div.p-4.border.border-primary').first();
    await addressCard.click();
    await page.waitForTimeout(300);

    await page.locator('button[data-slot="button"]').filter({ hasText: 'Lanjut' }).click();
    await page.locator('h1').filter({ hasText: /checkout/i }).waitFor({ state: 'visible', timeout: 30000 });
    console.log('  → Halaman Checkout: ' + page.url());

    // Section info pengiriman di halaman checkout
    const shippingSection = page.locator('h2').filter({ hasText: /info pengiriman/i }).first();
    const shippingVisible = await shippingSection.isVisible().catch(() => false);
    console.log('  [' + (shippingVisible ? 'OK' : 'GAGAL') + '] Section Info Pengiriman tampil');
    expect(shippingVisible, 'Section Info Pengiriman harus tampil di halaman checkout').toBe(true);

    // Ringkasan pesanan
    const ringkasan = page.locator('h5').filter({ hasText: /ringkasan pesanan/i });
    const ringkasanVisible = await ringkasan.isVisible().catch(() => false);
    console.log('  [' + (ringkasanVisible ? 'OK' : 'GAGAL') + '] Ringkasan Pesanan');
    expect(ringkasanVisible, 'Ringkasan Pesanan harus tampil').toBe(true);

    // Total harga
    const totalRow = page.locator('div.py-4.border-t.border-b.border-gray-300');
    const totalText = await totalRow.textContent().catch(() => '');
    console.log('  → Total: ' + totalText.trim().replace(/\s+/g, ' '));
    expect(totalText, 'Total harus tampil dengan nilai Rp').toContain('Rp');

    // BAYAR SEKARANG harus disabled sebelum setuju T&C
    const bayarBtn = page.locator('button[data-slot="button"]').filter({ hasText: /bayar sekarang/i });
    const isDisabledBefore = await bayarBtn.isDisabled().catch(() => true);
    console.log('  [' + (isDisabledBefore ? 'OK' : 'GAGAL') + '] BAYAR SEKARANG disabled sebelum centang T&C');
    expect(isDisabledBefore, 'Tombol bayar harus disabled sebelum setuju T&C').toBe(true);

    // Centang persetujuan T&C
    const termsCheckbox = page.locator('input[type="checkbox"]');
    await termsCheckbox.check();
    await page.waitForTimeout(500);
    console.log('  → Centang "Saya setuju dengan Syarat & Ketentuan"');

    // BAYAR SEKARANG harus enabled setelah setuju
    const isEnabledAfter = await bayarBtn.isEnabled().catch(() => false);
    console.log('  [' + (isEnabledAfter ? 'OK' : 'GAGAL') + '] BAYAR SEKARANG enabled setelah centang T&C');
    expect(isEnabledAfter, 'Tombol bayar harus enabled setelah setuju T&C').toBe(true);

    console.log('  [OK] Checkout siap — STOP sebelum proses pembayaran');
  });

});
