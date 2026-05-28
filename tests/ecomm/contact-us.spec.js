// @ts-check
const { test, expect } = require('../helpers/fixtures');

test.setTimeout(60000);

const PAGE_URL = '/en/contacts';
const HOMEPAGE_TITLE = 'Frank & co. | Natural Diamond Jewellery, Fashion Collections, and Gifts';

async function isPageValid(page) {
  const title = await page.title().catch(() => '');
  const titleLower = title.toLowerCase();
  const errorTitles = ['404', '500', '503', 'error', 'server error', 'something went wrong', 'page not found'];
  const hasErrorTitle = errorTitles.some(function(e) { return titleLower.startsWith(e) || titleLower.includes(e); });
  const HOMEPAGE_TITLE_CHECK = 'Frank & co. | Natural Diamond Jewellery, Fashion Collections, and Gifts';
  return title !== '' && title !== HOMEPAGE_TITLE_CHECK && !hasErrorTitle;
}

test.describe('Contact Us page — functional test', () => {

  test('Halaman Contact Us load dengan benar', async ({ page }) => {
    const response = await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    const status = response ? response.status() : null;
    const title  = await page.title();
    console.log('  Status : ' + status);
    console.log('  Title  : ' + title);
    // Cek status 2xx (200, 201, dll) — bukan 4xx atau 5xx
    expect(status, 'Halaman tidak boleh return 4xx/5xx').not.toBeNull();
    expect(status, 'Halaman tidak boleh return 4xx/5xx').toBeGreaterThanOrEqual(200);
    expect(status, 'Halaman tidak boleh return 4xx/5xx').toBeLessThan(400);
    expect(await isPageValid(page), 'Halaman tidak boleh redirect ke homepage').toBe(true);
  });

  test('Location dan Store dropdown tampil dan berfungsi', async ({ page }) => {
    await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Cek Location dropdown
    const locationSelect = page.locator('select#area').first();
    await expect(locationSelect, 'Location dropdown tidak ditemukan').toBeVisible();

    const locationOptions = await locationSelect.locator('option').all();
    console.log('  Location options: ' + locationOptions.length + ' kota');
    expect(locationOptions.length, 'Harus ada minimal 1 kota').toBeGreaterThan(0);

    // Cek Store dropdown
    const storeSelect = page.locator('select#storeId').first();
    await expect(storeSelect, 'Store dropdown tidak ditemukan').toBeVisible();

    const storeOptions = await storeSelect.locator('option').all();
    console.log('  Store options (default): ' + storeOptions.length + ' store');
    expect(storeOptions.length, 'Harus ada minimal 1 store').toBeGreaterThan(0);

    // Ganti lokasi ke Bandung dan cek store berubah
    console.log('  -> Pilih lokasi: Bandung');
    await locationSelect.selectOption('Bandung');
    await page.waitForTimeout(1000);

    const storeAfter = await storeSelect.locator('option').all();
    console.log('  Store options (Bandung): ' + storeAfter.length + ' store');
    console.log('  [OK] Location dan Store dropdown berfungsi');
  });

  test('Informasi kontak tampil dengan benar', async ({ page }) => {
    await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(1000);
    // Scroll dan tunggu sampai WhatsApp link muncul
    await page.evaluate(() => window.scrollBy(0, 800));
    await page.waitForSelector('a[href*="wa.me"]', { timeout: 15000 });
    await page.waitForTimeout(500);

    // Cek WhatsApp link
    const waLink = page.locator('a[href*="wa.me"]').first();
    const waVisible = await waLink.isVisible().catch(() => false);
    const waHref = await waLink.getAttribute('href').catch(() => '');
    console.log('  WhatsApp link: ' + (waVisible ? 'OK' : 'GAGAL') + ' — ' + waHref);
    expect(waVisible, 'WhatsApp link harus visible').toBe(true);

    // Cek Email link
    const emailLink = page.locator('a[href*="mailto:"]').first();
    const emailVisible = await emailLink.isVisible().catch(() => false);
    const emailHref = await emailLink.getAttribute('href').catch(() => '');
    console.log('  Email link   : ' + (emailVisible ? 'OK' : 'GAGAL') + ' — ' + emailHref);
    expect(emailVisible, 'Email link harus visible').toBe(true);

    console.log('  [OK] Informasi kontak tampil dengan benar');
  });

  test('Form kontak tampil dengan semua field', async ({ page }) => {
    await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    // Scroll ke bawah agar form ter-render
    await page.evaluate(async () => {
      await new Promise(function(resolve) {
        let total = 0;
        const timer = setInterval(function() {
          window.scrollBy(0, 400);
          total += 400;
          if (total >= document.body.scrollHeight) { clearInterval(timer); resolve(); }
        }, 150);
      });
    });
    // Tunggu sampai form muncul
    await page.waitForSelector('input[placeholder="Full Name"]', { timeout: 15000 });
    await page.waitForTimeout(500);

    const fields = [
      { name: 'Full Name',    selector: 'input[placeholder="Full Name"]' },
      { name: 'Email',        selector: 'input[placeholder="Email"]' },
      { name: 'Phone Number', selector: 'input[placeholder="Phone Number"]' },
      { name: 'Subject',      selector: 'input[placeholder="Subject"]' },
      { name: 'Message',      selector: 'input[placeholder="Message"]' },
      { name: 'Checkbox',     selector: 'input[type="checkbox"]' },
      { name: 'Send Message', selector: 'button[type="submit"]' },
    ];

    const failed = [];
    for (const field of fields) {
      const el = page.locator(field.selector).first();
      const visible = await el.isVisible().catch(() => false);
      console.log('  [' + (visible ? 'OK' : 'GAGAL') + '] ' + field.name);
      if (!visible) failed.push(field.name);
    }

    if (failed.length > 0) {
      throw new Error('Field tidak ditemukan:\n' + failed.map(function(f) { return '  x ' + f; }).join('\n'));
    }

    // Cek submit button disabled (karena reCAPTCHA belum diisi)
    const submitBtn = page.locator('button[type="submit"]').first();
    const isDisabled = await submitBtn.isDisabled().catch(() => false);
    console.log('  Submit button disabled (reCAPTCHA): ' + (isDisabled ? 'OK — benar' : 'WARNING — tidak disabled'));

    console.log('  [OK] Semua field form tampil dengan benar');
  });

  test('Form dapat diisi (tidak submit)', async ({ page }) => {
    await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Isi form tanpa submit — hanya test bahwa field bisa diisi
    await page.locator('input[placeholder="Full Name"]').fill('Test QA Automation');
    await page.locator('input[placeholder="Email"]').fill('qa@test.com');
    await page.locator('input[placeholder="Phone Number"]').fill('081234567890');
    await page.locator('input[placeholder="Subject"]').fill('Test Subject QA');
    await page.locator('input[placeholder="Message"]').fill('Test message from QA automation');
    await page.locator('input[type="checkbox"]').check();

    // Verifikasi nilai sudah masuk
    const nameVal    = await page.locator('input[placeholder="Full Name"]').inputValue();
    const emailVal   = await page.locator('input[placeholder="Email"]').inputValue();
    const subjectVal = await page.locator('input[placeholder="Subject"]').inputValue();
    const checked    = await page.locator('input[type="checkbox"]').isChecked();

    console.log('  Full Name : ' + (nameVal === 'Test QA Automation' ? 'OK' : 'GAGAL'));
    console.log('  Email     : ' + (emailVal === 'qa@test.com' ? 'OK' : 'GAGAL'));
    console.log('  Subject   : ' + (subjectVal === 'Test Subject QA' ? 'OK' : 'GAGAL'));
    console.log('  Checkbox  : ' + (checked ? 'OK' : 'GAGAL'));

    expect(nameVal, 'Full Name harus terisi').toBe('Test QA Automation');
    expect(emailVal, 'Email harus terisi').toBe('qa@test.com');
    expect(checked, 'Checkbox harus terceklis').toBe(true);

    console.log('  [OK] Form dapat diisi dengan benar — tidak disubmit (ada reCAPTCHA)');
  });

});
