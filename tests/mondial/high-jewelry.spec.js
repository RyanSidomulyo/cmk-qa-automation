// @ts-check
const { test, expect } = require('@playwright/test');

test.setTimeout(120000);

const PAGE_URL = '/en/high-jewelry';

async function isPageValid(page) {
  const title = await page.title().catch(() => '');
  const titleLower = title.toLowerCase();
  const errorTitles = ['404', '500', '503', 'error', 'something went wrong'];
  return title !== '' && !errorTitles.some(e => titleLower.includes(e));
}

test.describe('High Jewelry page — Mondial', () => {

  test('Halaman High Jewelry load dengan benar', async ({ page }) => {
    const response = await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    const status = response ? response.status() : null;
    const title  = await page.title();
    console.log('  Status : ' + status);
    console.log('  Title  : ' + title);
    console.log('  URL    : ' + page.url());
    expect(status).toBeLessThan(400);
    expect(await isPageValid(page)).toBe(true);
  });

  test('Section MEC Ultimate, Brilliant Rose, Firemark tampil', async ({ page }) => {
    await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(1000);

    const sections = [
      { name: 'MEC ULTIMATE',   selector: 'h2:has-text("MEC ULTIMATE")',   link: '/en/mondial-mec' },
      { name: 'BRILLIANT ROSE', selector: 'h2:has-text("BRILLIANT ROSE")', link: '/en/products/brilliant-rose-2' },
      { name: 'FIREMARK',       selector: 'h2:has-text("FIREMARK")',        link: '/en/products/firemark-2' },
    ];

    for (const section of sections) {
      const heading = page.locator(section.selector).first();
      const visible = await heading.isVisible().catch(() => false);
      console.log('  [' + (visible ? 'OK' : 'GAGAL') + '] ' + section.name);
      expect(visible, section.name + ' harus tampil').toBe(true);

      // Cek link CTA
      const link = page.locator('a[href*="' + section.link.split('/').pop() + '"]').first();
      const linkVisible = await link.isVisible().catch(() => false);
      console.log('       CTA link: ' + (linkVisible ? 'OK' : 'TIDAK DITEMUKAN'));
    }
  });

  test('Section Precious Stone & Fancy Diamond tampil dengan 4 collection', async ({ page }) => {
    await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(1000);

    const collections = [
      { name: 'PRECIOUS STONE',       href: '/en/products/precious-stone-2' },
      { name: 'FANCY DESIGN',         href: '/en/products/fancy-design' },
      { name: 'FANCY SHAPE DIAMOND',  href: '/en/products/fancy-shape-diamond' },
      { name: 'FANCY COLOR DIAMOND',  href: '/en/products/fancy-color-diamond' },
    ];

    for (const col of collections) {
      const heading = page.locator('h3:has-text("' + col.name + '")').first();
      const visible = await heading.isVisible().catch(() => false);
      console.log('  [' + (visible ? 'OK' : 'GAGAL') + '] ' + col.name);
      expect(visible, col.name + ' harus tampil').toBe(true);
    }
    console.log('  [OK] 4/4 collection cards tampil');
  });

  test('Semua CTA link mengarah ke halaman yang benar', async ({ page }) => {
    await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(1000);

    const ctas = [
      { name: 'MEC ULTIMATE',        href: '/en/mondial-mec' },
      { name: 'BRILLIANT ROSE',      href: '/en/products/brilliant-rose-2' },
      { name: 'FIREMARK',            href: '/en/products/firemark-2' },
      { name: 'PRECIOUS STONE',      href: '/en/products/precious-stone-2' },
      { name: 'FANCY DESIGN',        href: '/en/products/fancy-design' },
      { name: 'FANCY SHAPE DIAMOND', href: '/en/products/fancy-shape-diamond' },
      { name: 'FANCY COLOR DIAMOND', href: '/en/products/fancy-color-diamond' },
    ];

    const failed = [];
    for (const cta of ctas) {
      const response = await page.goto(cta.href, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => null);
      const status = response ? response.status() : null;
      const valid  = status && status < 400 && await isPageValid(page);
      console.log('  [' + (valid ? 'OK' : 'GAGAL') + '] ' + cta.name + ' → ' + cta.href);
      if (!valid) failed.push(cta.name);
      await page.waitForTimeout(300);
    }

    if (failed.length > 0) {
      throw new Error('CTA links gagal: ' + failed.join(', '));
    }
    console.log('  Ringkasan: ' + ctas.length + '/' + ctas.length + ' CTA links OK');
  });

  test('Semua gambar pada halaman tampil dengan benar', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Scroll untuk trigger lazy load
    await page.evaluate(async () => {
      await new Promise(resolve => {
        let total = 0;
        const timer = setInterval(() => {
          window.scrollBy(0, 400);
          total += 400;
          if (total >= document.body.scrollHeight) { clearInterval(timer); resolve(); }
        }, 150);
      });
    });
    await page.waitForTimeout(2000);

    // Cek semua gambar di halaman
    const images = await page.locator('img[alt*="High Jewelry"]').all();
    console.log('  Ditemukan ' + images.length + ' gambar High Jewelry');
    expect(images.length, 'Harus ada minimal 5 gambar').toBeGreaterThan(4);

    let brokenCount = 0;
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      const src = await img.getAttribute('src').catch(() => '');
      const alt = await img.getAttribute('alt').catch(() => '');

      // Cek gambar tidak broken menggunakan naturalWidth
      const naturalWidth = await img.evaluate(el => el.naturalWidth).catch(() => 0);
      const ok = naturalWidth > 0;

      console.log('  Gambar ' + (i+1) + ' [' + (ok ? 'OK' : 'BROKEN') + '] ' + alt);
      if (!ok) brokenCount++;
    }

    expect(brokenCount, 'Tidak boleh ada gambar yang broken').toBe(0);
    console.log('  [OK] Semua gambar tampil dengan benar');
  });

  test('Tombol Contact Us mengarah ke halaman yang benar', async ({ page }) => {
    await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(1000);

    const contactBtn = page.locator('a[href*="contacts"]').first();
    const visible = await contactBtn.isVisible().catch(() => false);
    console.log('  Contact Us button: ' + (visible ? 'OK' : 'TIDAK DITEMUKAN'));
    expect(visible, 'Tombol Contact Us harus tampil').toBe(true);

    await contactBtn.click();
    await page.waitForTimeout(1000);

    const title = await page.title();
    const url   = page.url();
    console.log('  → ' + title + ' -- ' + url);
    expect(url).toContain('/en/contacts');
    console.log('  [OK] Contact Us mengarah ke halaman yang benar');
  });

});
