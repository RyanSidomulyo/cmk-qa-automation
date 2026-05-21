// @ts-check
const { test, expect } = require('@playwright/test');

test.setTimeout(120000);

const PAGE_URL = '/en/contacts';

test.describe('Contact Us page — Mondial', () => {

  test('Halaman Contact Us load dengan benar', async ({ page }) => {
    const response = await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    const status = response ? response.status() : null;
    const title  = await page.title();
    console.log('  Status : ' + status);
    console.log('  Title  : ' + title);
    console.log('  URL    : ' + page.url());
    expect(status).toBeLessThan(400);
    expect(title.toLowerCase()).toContain('mondial');
  });

  test('Dropdown Location dan Boutique tampil', async ({ page }) => {
    await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(1500);

    // Dropdown Location
    const locationLabel = page.locator('div:has-text("Location")').first();
    const locationVisible = await locationLabel.isVisible().catch(() => false);
    console.log('  Dropdown Location: ' + (locationVisible ? 'OK' : 'TIDAK DITEMUKAN'));

    // Dropdown Boutique
    const boutiqueLabel = page.locator('div:has-text("Boutique")').first();
    const boutiqueVisible = await boutiqueLabel.isVisible().catch(() => false);
    console.log('  Dropdown Boutique: ' + (boutiqueVisible ? 'OK' : 'TIDAK DITEMUKAN'));

    expect(locationVisible, 'Dropdown Location harus tampil').toBe(true);
    expect(boutiqueVisible, 'Dropdown Boutique harus tampil').toBe(true);
    console.log('  [OK] Kedua dropdown tampil');
  });

  test('Info kontak WhatsApp dan Email tampil dengan benar', async ({ page }) => {
    await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(1500);

    // WhatsApp link
    const waLink = page.locator('a[href*="wa.me"]').first();
    const waVisible = await waLink.isVisible().catch(() => false);
    const waHref = await waLink.getAttribute('href').catch(() => '');
    console.log('  WhatsApp link: ' + (waVisible ? 'OK — ' + waHref : 'TIDAK DITEMUKAN'));
    expect(waVisible, 'WhatsApp link harus tampil').toBe(true);
    expect(waHref).toContain('wa.me');

    // Email link
    const mailLink = page.locator('a[href*="mailto"]').first();
    const mailVisible = await mailLink.isVisible().catch(() => false);
    const mailHref = await mailLink.getAttribute('href').catch(() => '');
    console.log('  Email link   : ' + (mailVisible ? 'OK — ' + mailHref : 'TIDAK DITEMUKAN'));
    expect(mailVisible, 'Email link harus tampil').toBe(true);
    expect(mailHref).toContain('mailto');

    console.log('  [OK] Informasi kontak tampil dengan benar');
  });

  test('Form kontak tampil dengan semua field', async ({ page }) => {
    await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(1500);

    const fields = [
      { label: 'Name',             selector: 'input[name="name"]' },
      { label: 'Email',            selector: 'input[name="email"]' },
      { label: 'Telephone Number', selector: 'input[name="telephone"]' },
      { label: 'Subject',          selector: 'input[name="subject"]' },
      { label: 'Message',          selector: 'textarea[name="message"]' },
      { label: 'Checkbox',         selector: 'input[name="authorization"]' },
      { label: 'Send Message',     selector: 'button[type="submit"]' },
    ];

    for (const field of fields) {
      const el = page.locator(field.selector).first();
      const visible = await el.isVisible().catch(() => false);
      console.log('  [' + (visible ? 'OK' : 'GAGAL') + '] ' + field.label);
      expect(visible, field.label + ' harus tampil').toBe(true);
    }

    // Submit harus disabled (ada reCAPTCHA)
    const submitDisabled = await page.locator('button[type="submit"]').first().isDisabled().catch(() => false);
    console.log('  Submit button disabled (reCAPTCHA): ' + (submitDisabled ? 'OK — benar' : 'WARNING — tidak disabled'));
    console.log('  [OK] Semua field form tampil dengan benar');
  });

  test('Form dapat diisi (tidak submit)', async ({ page }) => {
    await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(1500);

    await page.locator('input[name="name"]').fill('Test User');
    await page.locator('input[name="email"]').fill('test@example.com');
    await page.locator('input[name="telephone"]').fill('08123456789');
    await page.locator('input[name="subject"]').fill('Test Subject');
    await page.locator('textarea[name="message"]').fill('Test message dari QA automation');
    await page.locator('input[name="authorization"]').check().catch(() => null);

    const name    = await page.locator('input[name="name"]').inputValue();
    const email   = await page.locator('input[name="email"]').inputValue();
    const subject = await page.locator('input[name="subject"]').inputValue();

    console.log('  Name    : ' + (name === 'Test User' ? 'OK' : 'GAGAL'));
    console.log('  Email   : ' + (email === 'test@example.com' ? 'OK' : 'GAGAL'));
    console.log('  Subject : ' + (subject === 'Test Subject' ? 'OK' : 'GAGAL'));

    expect(name).toBe('Test User');
    expect(email).toBe('test@example.com');
    expect(subject).toBe('Test Subject');
    console.log('  [OK] Form dapat diisi dengan benar — tidak disubmit (ada reCAPTCHA)');
  });

});
