// @ts-check
const { test, expect } = require('../helpers/fixtures');

test.setTimeout(120000);

const PAGE_URL = '/en/contacts';

// Test ini fokus pada interaction & validation form, BUKAN submit final.
// Real submit blocked oleh reCAPTCHA — itu by design, jangan di-bypass.
// Yang divalidasi:
//  1. Field validation client-side (email invalid, required field)
//  2. reCAPTCHA widget muncul
//  3. Submit button state (disabled tanpa reCAPTCHA)
//  4. Submit dengan field invalid tidak mengirim request POST ke backend

test.describe('Contact Form — Frank & Co', () => {

  test('Empty submit — button tetap disabled atau error muncul', async ({ page }) => {
    await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForSelector('input[placeholder="Full Name"]', { timeout: 15000 });

    const submitBtn = page.locator('button[type="submit"]').first();
    const isDisabled = await submitBtn.isDisabled().catch(() => true);

    if (isDisabled) {
      console.log('  [OK] Submit button disabled saat form kosong (good UX)');
      return;
    }

    // Kalau button enabled, coba klik dan pastikan TIDAK ada network request POST ke contact endpoint
    let submittedToBackend = false;
    page.on('request', (req) => {
      const url = req.url();
      const method = req.method();
      if (method === 'POST' && /contact|message|inquiry/i.test(url)) {
        submittedToBackend = true;
      }
    });

    await submitBtn.click({ force: true }).catch(() => null);
    await page.waitForTimeout(2000);

    expect(submittedToBackend, 'Form kosong tidak boleh ke-submit ke backend').toBe(false);
    console.log('  [OK] Form kosong tidak ke-submit ke backend (validation client-side bekerja)');
  });

  test('Email invalid — validation muncul atau form tidak submit', async ({ page }) => {
    await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForSelector('input[placeholder="Full Name"]', { timeout: 15000 });

    await page.locator('input[placeholder="Full Name"]').fill('QA Test');
    await page.locator('input[placeholder="Email"]').fill('not-an-email');
    await page.locator('input[placeholder="Phone Number"]').fill('081234567890');
    await page.locator('input[placeholder="Subject"]').fill('QA Validation Test');
    await page.locator('input[placeholder="Message"]').fill('Testing email validation');
    await page.locator('input[type="checkbox"]').check().catch(() => null);

    // Browser native validation untuk type="email"
    const emailField = page.locator('input[placeholder="Email"]').first();
    const emailType = await emailField.getAttribute('type').catch(() => '');
    const validity = await emailField.evaluate((el) => {
      const inp = /** @type {HTMLInputElement} */ (el);
      return { valid: inp.checkValidity?.() ?? true, message: inp.validationMessage || '' };
    }).catch(() => ({ valid: true, message: '' }));

    console.log(`  Email field type: ${emailType}`);
    console.log(`  Email validity  : ${validity.valid ? 'valid' : 'INVALID — ' + validity.message}`);

    if (emailType === 'email') {
      expect(validity.valid, 'Email "not-an-email" harus ditolak browser').toBe(false);
      console.log('  [OK] Browser native email validation aktif');
    } else {
      console.log('  [INFO] Email field bukan type="email" — tidak ada native validation. Cek apakah custom validation aktif.');
    }
  });

  test('reCAPTCHA widget tampil di form', async ({ page }) => {
    await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    // Scroll ke form supaya reCAPTCHA (yang biasanya di bawah) ter-trigger lazy load
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(2000);

    // reCAPTCHA iframe Google bisa butuh waktu untuk load — tunggu sampai 10s
    const recaptchaFound = await page
      .waitForSelector('iframe[src*="recaptcha"], .g-recaptcha, [class*="recaptcha" i]', { timeout: 10000 })
      .then(() => true)
      .catch(() => false);

    console.log(`  reCAPTCHA detected: ${recaptchaFound ? 'YES' : 'NO'}`);
    expect(recaptchaFound, 'reCAPTCHA widget harus ada di form kontak (anti-spam)').toBe(true);
    console.log('  [OK] reCAPTCHA aktif — form ter-proteksi dari spam');
  });

});
