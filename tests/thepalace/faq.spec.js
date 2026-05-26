// @ts-check
const { test, expect } = require('@playwright/test');

test.setTimeout(120000);

const FAQ_CATEGORIES = [
  'Informasi Produk',
  'Pengiriman',
  'Penjualan, Pembelian, dan Reparasi',
  'Pengembalian Produk',
  'CMK Club',
  'Stores',
  '3T',
];

test.describe('FAQ — The Palace', () => {

  test('Halaman /faq load dengan benar', async ({ page }) => {
    const response = await page.goto('/faq', { waitUntil: 'domcontentloaded', timeout: 60000 });
    const status = response ? response.status() : null;
    console.log('  Status : ' + status);
    console.log('  URL    : ' + page.url());
    expect(status, 'Halaman /faq harus load — ' + page.url()).toBeLessThan(400);
  });

  test('Heading FAQ dan kategori tampil', async ({ page }) => {
    await page.goto('/faq', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(1000);

    const h1 = page.locator('h1').filter({ hasText: /^FAQ$/i }).first();
    const h1Visible = await h1.isVisible().catch(() => false);
    console.log('  [' + (h1Visible ? 'OK' : 'GAGAL') + '] Heading "FAQ" tampil');
    expect(h1Visible, 'Heading FAQ harus tampil').toBe(true);

    const categoryHeadings = await page.locator('h2.text-xl').all();
    console.log('  Jumlah kategori ditemukan: ' + categoryHeadings.length);
    expect(categoryHeadings.length, 'Harus ada minimal ' + FAQ_CATEGORIES.length + ' kategori').toBeGreaterThanOrEqual(FAQ_CATEGORIES.length);

    for (const cat of FAQ_CATEGORIES) {
      const heading = page.locator('h2').filter({ hasText: cat }).first();
      const visible = await heading.isVisible().catch(() => false);
      console.log('  [' + (visible ? 'OK' : 'GAGAL') + '] Kategori "' + cat + '"');
      expect(visible, 'Kategori "' + cat + '" harus tampil').toBe(true);
    }

    console.log('  [OK] Semua kategori FAQ tampil');
  });

  test('Setiap kategori punya pertanyaan', async ({ page }) => {
    await page.goto('/faq', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(1000);

    const questions = await page.locator('button[data-slot="accordion-trigger"]').all();
    console.log('  Total pertanyaan ditemukan: ' + questions.length);
    expect(questions.length, 'Harus ada pertanyaan di FAQ').toBeGreaterThan(0);

    const failedQuestions = [];
    for (let i = 0; i < questions.length; i++) {
      const text = await questions[i].textContent().catch(() => '');
      const cleaned = text.trim().replace(/\s+/g, ' ');
      const hasText = cleaned.length > 0;
      if (!hasText) {
        failedQuestions.push('Pertanyaan ke-' + (i + 1) + ' tidak punya teks');
      }
    }

    if (failedQuestions.length > 0) {
      throw new Error('Pertanyaan tanpa teks:\n' + failedQuestions.map(q => '  ✗ ' + q).join('\n'));
    }
    console.log('  [OK] Semua ' + questions.length + ' pertanyaan punya teks');
  });

  test('Accordion FAQ bisa dibuka dan menampilkan jawaban', async ({ page }) => {
    await page.goto('/faq', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(1000);

    const firstTrigger = page.locator('button[data-slot="accordion-trigger"]').first();
    const questionText = await firstTrigger.textContent().catch(() => '');
    console.log('  Klik pertanyaan: "' + questionText.trim().substring(0, 60) + '..."');

    const stateBefore = await firstTrigger.getAttribute('aria-expanded').catch(() => 'false');
    expect(stateBefore, 'Accordion harus tertutup sebelum diklik').toBe('false');

    await firstTrigger.click();
    await page.waitForTimeout(500);

    const stateAfter = await firstTrigger.getAttribute('aria-expanded').catch(() => 'false');
    console.log('  aria-expanded setelah klik: ' + stateAfter);
    expect(stateAfter, 'Accordion harus terbuka setelah diklik').toBe('true');

    const contentId = await firstTrigger.getAttribute('aria-controls').catch(() => '');
    if (contentId) {
      const content = page.locator('#' + contentId);
      const isHidden = await content.getAttribute('hidden').catch(() => null);
      console.log('  Content hidden attribute: ' + isHidden);
      expect(isHidden, 'Konten jawaban harus tampil (tidak hidden)').toBeNull();
    }

    console.log('  [OK] Accordion FAQ berfungsi');
  });

});
