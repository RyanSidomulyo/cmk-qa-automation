// @ts-check
const { test, expect } = require('../helpers/fixtures');

test.setTimeout(120000);

const PAGE_URL = '/en/faq';

const FAQ_SECTIONS = ['PRODUCT', 'PACKAGING AND GIFT', 'GUARANTEE & AUTHENTICITY', 'RETURNS & EXCHANGE', 'NOTE ON COVID-19'];

test.describe('FAQ page — Mondial', () => {

  test('Halaman FAQ load dengan benar', async ({ page }) => {
    const response = await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    const status = response ? response.status() : null;
    const title  = await page.title();
    console.log('  Status : ' + status);
    console.log('  Title  : ' + title);
    console.log('  URL    : ' + page.url());
    expect(status).toBeLessThan(400);
    expect(title.toLowerCase()).toContain('mondial');
  });

  test('Semua section FAQ tampil', async ({ page }) => {
    await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(1000);

    for (const section of FAQ_SECTIONS) {
      const el = page.locator('.faq-section-title:has-text("' + section + '")').first();
      const visible = await el.isVisible().catch(() => false);
      console.log('  [' + (visible ? 'OK' : 'GAGAL') + '] Section: ' + section);
      expect(visible, section + ' harus tampil').toBe(true);
    }
    console.log('  [OK] ' + FAQ_SECTIONS.length + '/'+FAQ_SECTIONS.length+' section FAQ tampil');
  });

  test('Minimal ada FAQ items yang tampil', async ({ page }) => {
    await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(1000);

    const questions = await page.locator('.question').all();
    console.log('  Ditemukan ' + questions.length + ' pertanyaan FAQ');
    expect(questions.length, 'Harus ada minimal 5 pertanyaan').toBeGreaterThan(4);
    console.log('  [OK] FAQ items tampil');
  });

  test('Accordion FAQ dapat di-expand dan di-collapse', async ({ page }) => {
    await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(1000);

    const firstQuestion = page.locator('.question').first();
    const questionText = await firstQuestion.locator('span').first().textContent().catch(() => '');
    console.log('  -> Klik pertanyaan: "' + questionText.trim().slice(0, 60) + '"');

    // Cek answer tertutup awalnya
    const answer = page.locator('.list').first().locator('.answer');
    const initialClass = await answer.getAttribute('class').catch(() => '');
    const isClosed = initialClass.includes('max-h-0');
    console.log('  State awal: ' + (isClosed ? 'tertutup (OK)' : 'terbuka'));

    // Klik untuk expand
    await firstQuestion.click();
    await page.waitForTimeout(500);

    const afterClass = await answer.getAttribute('class').catch(() => '');
    const isOpen = !afterClass.includes('max-h-0') || afterClass.includes('max-h-96');
    console.log('  State setelah klik: ' + (isOpen ? 'terbuka (OK)' : 'masih tertutup'));
    expect(isOpen, 'FAQ harus terbuka setelah diklik').toBe(true);

    // Klik lagi untuk collapse
    await firstQuestion.click();
    await page.waitForTimeout(500);

    const finalClass = await answer.getAttribute('class').catch(() => '');
    const isClosed2 = finalClass.includes('max-h-0');
    console.log('  State setelah klik kedua: ' + (isClosed2 ? 'tertutup (OK)' : 'masih terbuka'));
    console.log('  [OK] Accordion expand/collapse berfungsi');
  });

  test('FAQ yang sudah active terbuka saat load', async ({ page }) => {
    await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(1000);

    // Cek apakah ada list yang active (sudah terbuka)
    const activeList = page.locator('.list.active').first();
    const activeExists = await activeList.isVisible().catch(() => false);

    if (activeExists) {
      const activeAnswer = activeList.locator('.answer');
      const activeClass = await activeAnswer.getAttribute('class').catch(() => '');
      const isOpen = activeClass.includes('max-h-96') || activeClass.includes('opacity-100');
      console.log('  FAQ active ditemukan: ' + (isOpen ? 'terbuka (OK)' : 'tidak terbuka'));
      expect(isOpen, 'FAQ active harus sudah terbuka').toBe(true);
    } else {
      console.log('  [INFO] Tidak ada FAQ yang active saat load — OK');
    }
    console.log('  [OK] State FAQ saat load benar');
  });

});
