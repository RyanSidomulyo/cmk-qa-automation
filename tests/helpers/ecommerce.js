// @ts-check
/**
 * Reusable e-commerce flow helpers untuk Frank & Co, Mondial, The Palace.
 *
 * Pola login (phone OTP) di staging:
 * 1. Buka loginPath
 * 2. Isi nomor HP (input[name="phoneNumber"])
 * 3. Submit -> halaman OTP
 * 4. Staging auto-fill 6 digit OTP
 * 5. Submit OTP -> redirect ke halaman utama
 *
 * Storage state disimpan per brand di /tmp dan reuse selama 15 menit.
 */

const fs = require('fs');

const DEFAULT_PHONE = '82291349125';

/**
 * Brand config defaults. Override per spec kalau perlu.
 */
const BRAND_DEFAULTS = {
  frankco: {
    loginPath: '/en/login',
    storagePath: '/tmp/frankco-auth.json',
    phone: DEFAULT_PHONE,
    submitLoginText: /sign in|masuk|continue|next/i,
    submitOtpText: /verify|submit|kirim|continue|confirm/i,
    addToCartText: /add to (cart|bag)/i,
    checkoutText: /checkout/i,
    cartIconAriaLabel: /(shopping )?cart|bag|keranjang/i,
    wishlistIconAriaLabel: /wishlist|favorite|love/i,
    wishlistPath: '/en/wishlists',
  },
  mondial: {
    loginPath: '/en/login',
    storagePath: '/tmp/mondial-auth.json',
    phone: DEFAULT_PHONE,
    submitLoginText: /sign in|masuk|continue|next/i,
    submitOtpText: /verify|submit|kirim|continue|confirm/i,
    addToCartText: /add to (cart|bag)/i,
    checkoutText: /checkout/i,
    cartIconAriaLabel: /(shopping )?cart|bag|keranjang/i,
    wishlistIconAriaLabel: /wishlist|favorite|love/i,
    wishlistPath: '/en/wishlists',
  },
  thepalace: {
    loginPath: '/login',
    storagePath: '/tmp/thepalace-auth.json',
    phone: DEFAULT_PHONE,
    submitLoginText: /masuk/i,
    submitOtpText: /kirim/i,
    addToCartText: /masukan ke keranjang|add to cart/i,
    checkoutText: /checkout/i,
    cartIconAriaLabel: /shopping cart/i,
    wishlistIconAriaLabel: /wishlist|favorite|love/i,
    wishlistPath: '/wishlist',
  },
};

const AUTH_TTL_MS = 15 * 60 * 1000;

function getConfig(brand, overrides = {}) {
  const base = BRAND_DEFAULTS[brand];
  if (!base) throw new Error('Unknown brand: ' + brand);
  return Object.assign({}, base, overrides);
}

/**
 * Login pakai phone OTP. Staging auto-fill OTP.
 * Penting: Next.js perlu tunggu hydration supaya submit tidak fallback ke GET form action.
 */
async function loginWithPhone(page, cfg) {
  // Track OTP request failure -> kasih error message yang jelas (bukan timeout misterius)
  let otpRequestStatus = null;
  page.on('response', (resp) => {
    if (/request-otp|send-otp|otp\/request/i.test(resp.url())) {
      otpRequestStatus = resp.status();
    }
  });

  await page.goto(cfg.loginPath, { waitUntil: 'domcontentloaded', timeout: 60000 });
  // Tunggu hydration — kalau di-skip, click submit jadi native GET dan reset page state
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1500);

  const phoneInput = page.locator('input[name="phoneNumber"]').first();
  await phoneInput.waitFor({ state: 'visible', timeout: 15000 });
  await phoneInput.fill(cfg.phone);
  console.log('    -> Isi nomor HP: ' + cfg.phone);

  const submitBtn = page.locator('button[type="submit"]').filter({ hasText: cfg.submitLoginText }).first();
  await submitBtn.click();
  console.log('    -> Submit nomor HP');

  // Halaman OTP — tunggu URL berubah ke /otp atau input maxlength=1 muncul
  try {
    await Promise.race([
      page.waitForURL((u) => /otp/i.test(u.href), { timeout: 30000 }),
      page.locator('input[maxlength="1"]').first().waitFor({ state: 'visible', timeout: 30000 }),
    ]);
  } catch (_) { /* fall through to next check */ }

  await page.locator('input[maxlength="1"]').first().waitFor({ state: 'visible', timeout: 15000 })
    .catch(() => {
      // Kasih error spesifik kalau request-otp gagal di backend
      if (otpRequestStatus && otpRequestStatus >= 500) {
        throw new Error('Login GAGAL: backend request-otp return HTTP ' + otpRequestStatus +
          '. Ini bug backend, bukan bug test. Cek API /x-api/customers/request-otp di ' + cfg.loginPath);
      }
      if (otpRequestStatus === 429) {
        throw new Error('Login GAGAL: backend rate-limit (HTTP 429). Tunggu sebentar atau pakai nomor HP lain.');
      }
      throw new Error('Login GAGAL: halaman OTP tidak muncul. OTP API status: ' +
        (otpRequestStatus || 'tidak terdeteksi'));
    });
  console.log('    -> Halaman OTP muncul');

  // Tunggu auto-fill (staging)
  await page.waitForFunction(() => {
    const inputs = document.querySelectorAll('input[maxlength="1"]');
    return inputs.length === 6 && Array.from(inputs).every((el) => el.value.length > 0);
  }, { timeout: 30000 });
  console.log('    -> OTP auto-terisi');

  // Beberapa brand auto-submit setelah OTP terisi -> cek dulu apakah sudah keluar dari login
  await page.waitForTimeout(1500);
  if (/\/(login|auth|otp)/i.test(page.url())) {
    const otpSubmit = page.locator('button[data-slot="button"], button[type="submit"]')
      .filter({ hasText: cfg.submitOtpText }).first();
    if (await otpSubmit.isVisible().catch(() => false)) {
      await otpSubmit.click();
      console.log('    -> Submit OTP');
    }
  }

  await page.waitForURL((url) => {
    const href = url.href;
    return !/\/(login|auth|otp)/i.test(href);
  }, { timeout: 30000 });
  console.log('    -> Login berhasil -> ' + page.url());
}

/**
 * Ensure storageState file ada (kosong placeholder kalau belum).
 */
function ensureStorageFile(storagePath) {
  if (!fs.existsSync(storagePath)) {
    fs.writeFileSync(storagePath, JSON.stringify({ cookies: [], origins: [] }));
  }
}

/**
 * Cek apakah storage state masih valid (umur < TTL dan ada cookie).
 */
function isAuthValid(storagePath) {
  if (!fs.existsSync(storagePath)) return false;
  try {
    const age = Date.now() - fs.statSync(storagePath).mtimeMs;
    if (age > AUTH_TTL_MS) return false;
    const data = JSON.parse(fs.readFileSync(storagePath, 'utf8'));
    return Array.isArray(data.cookies) && data.cookies.length > 0;
  } catch (_) {
    return false;
  }
}

/**
 * Login sekali via browser, simpan storage state.
 * Dipanggil di beforeAll.
 */
async function ensureAuth(browser, cfg) {
  ensureStorageFile(cfg.storagePath);

  if (isAuthValid(cfg.storagePath)) {
    console.log('  [auth] Storage state masih valid -> skip re-login');
    return;
  }

  console.log('  [auth] Login baru...');
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  try {
    await loginWithPhone(page, cfg);
    await ctx.storageState({ path: cfg.storagePath });
    console.log('  [auth] Storage state tersimpan -> ' + cfg.storagePath);
  } finally {
    await ctx.close();
  }
}

/**
 * Add product ke cart dan buka cart drawer.
 * Return cartDrawer locator.
 */
async function addProductToCart(page, cfg, productSlug) {
  await page.goto(productSlug, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(2000);

  const addBtn = page.locator('button').filter({ hasText: cfg.addToCartText }).first();
  await addBtn.waitFor({ state: 'visible', timeout: 15000 });
  await addBtn.click();
  console.log('    -> Klik Add to Cart');
  await page.waitForTimeout(2000);

  // Cart drawer auto-open?
  const drawer = page.locator('[data-slot="sheet-content"], [role="dialog"]').first();
  let opened = await drawer.isVisible().catch(() => false);

  if (!opened) {
    console.log('    -> Cart tidak auto-buka, klik cart icon...');
    const cartBtn = page.locator('button[aria-label]').filter({
      has: page.locator('svg'),
    }).first();
    // Fallback: cari berdasarkan aria-label regex
    const labeled = page.getByRole('button', { name: cfg.cartIconAriaLabel }).first();
    if (await labeled.isVisible().catch(() => false)) {
      await labeled.click();
    } else {
      await cartBtn.click();
    }
    await drawer.waitFor({ state: 'visible', timeout: 10000 });
  }

  console.log('    -> Cart drawer terbuka');
  return drawer;
}

/**
 * Klik tombol wishlist/heart di PDP.
 * Return true kalau button terdeteksi & ke-klik.
 */
async function addToWishlist(page, productSlug, cfg) {
  await page.goto(productSlug, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(1500);

  // Strategi (prioritas dari paling spesifik):
  const candidates = [
    // Text-based (Frank: "Add to Wishlist", Mondial: "Add to Wishlist")
    page.locator('button').filter({ hasText: /add to wishlist|wishlist/i }),
    // Aria-label based
    page.getByRole('button', { name: cfg.wishlistIconAriaLabel }),
    page.locator('button[aria-label*="wishlist" i]'),
    page.locator('button[aria-label*="favorite" i]'),
    // SVG icon based
    page.locator('button:has(svg.lucide-heart)'),
    page.locator('button:has(svg[class*="heart" i])'),
  ];

  for (const cand of candidates) {
    const btn = cand.first();
    if (await btn.isVisible().catch(() => false)) {
      // Cek apakah sudah dalam state "added" — kalau ya, skip click
      const text = (await btn.innerText().catch(() => '')).toLowerCase();
      const ariaPressed = await btn.getAttribute('aria-pressed').catch(() => null);
      const alreadyAdded = text.includes('remove') || text.includes('hapus') || ariaPressed === 'true';

      if (alreadyAdded) {
        console.log('    -> Produk sudah ada di wishlist, skip klik');
      } else {
        await btn.click();
        console.log('    -> Klik tombol wishlist');
        await page.waitForTimeout(2000);
      }
      return true;
    }
  }

  console.log('    [WARN] Tombol wishlist tidak ditemukan di PDP');
  return false;
}

module.exports = {
  BRAND_DEFAULTS,
  getConfig,
  loginWithPhone,
  ensureStorageFile,
  isAuthValid,
  ensureAuth,
  addProductToCart,
  addToWishlist,
};
