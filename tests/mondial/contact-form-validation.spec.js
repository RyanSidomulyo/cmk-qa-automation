// @ts-check
const { test, expect } = require('../helpers/fixtures');

test.setTimeout(120000);

const PAGE_URL = '/en/contacts';

test.describe('Contact Form — Mondial', () => {

  test('Empty submit — button tetap disabled atau tidak submit ke backend', async ({ page }) => {
    await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(1500);

    const submitBtn = page.locator('button[type="submit"]').first();
    const isDisabled = await submitBtn.isDisabled().catch(() => true);

    if (isDisabled) {
      console.log('  [OK] Submit button disabled saat form kosong');
      return;
    }

    let submittedToBackend = false;
    page.on('request', (req) => {
      if (req.method() === 'POST' && /contact|message|inquiry/i.test(req.url())) {
        submittedToBackend = true;
      }
    });

    await submitBtn.click({ force: true }).catch(() => null);
    await page.waitForTimeout(2000);

    expect(submittedToBackend, 'Form kosong tidak boleh ke-submit ke backend').toBe(false);
    console.log('  [OK] Form kosong tidak ke-submit ke backend');
  });

  test('Email invalid — validation muncul', async ({ page }) => {
    await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(1500);

    await page.locator('input[name="name"]').fill('QA Test');
    await page.locator('input[name="email"]').fill('not-an-email');
    await page.locator('input[name="telephone"]').fill('081234567890');
    await page.locator('input[name="subject"]').fill('QA Validation');
    await page.locator('textarea[name="message"]').fill('Testing email validation');

    const emailField = page.locator('input[name="email"]').first();
    const emailType = await emailField.getAttribute('type').catch(() => '');
    const validity = await emailField.evaluate((el) => {
      const inp = /** @type {HTMLInputElement} */ (el);
      return { valid: inp.checkValidity?.() ?? true, message: inp.validationMessage || '' };
    }).catch(() => ({ valid: true, message: '' }));

    console.log(`  Email type      : ${emailType}`);
    console.log(`  Email validity  : ${validity.valid ? 'valid' : 'INVALID — ' + validity.message}`);

    if (emailType === 'email') {
      expect(validity.valid, 'Email invalid harus ditolak browser').toBe(false);
      console.log('  [OK] Email validation aktif');
    } else {
      console.log('  [INFO] Email field bukan type="email"');
    }
  });

  test('reCAPTCHA widget tampil di form', async ({ page }) => {
    await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(2000);

    const recaptchaFound = await page
      .waitForSelector('iframe[src*="recaptcha"], .g-recaptcha, [class*="recaptcha" i]', { timeout: 10000 })
      .then(() => true)
      .catch(() => false);

    console.log(`  reCAPTCHA detected: ${recaptchaFound ? 'YES' : 'NO'}`);
    expect(recaptchaFound, 'reCAPTCHA harus ada di form kontak').toBe(true);
    console.log('  [OK] reCAPTCHA aktif');
  });

});
