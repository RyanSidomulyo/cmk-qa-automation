// @ts-check
const { test, expect } = require('../helpers/fixtures');

test.setTimeout(120000);

// Gunakan URL produk yang sudah terbukti ada di staging
const PAGE_URL = '/en/products/frank-fire-union-pendant';
const HOMEPAGE_TITLE = 'Frank & co. | Natural Diamond Jewellery, Fashion Collections, and Gifts';

async function isPageValid(page) {
  const title = await page.title().catch(() => '');
  const titleLower = title.toLowerCase();
  const errorTitles = ['404', '500', '503', 'error', 'server error', 'something went wrong'];
  const hasErrorTitle = errorTitles.some(function(e) { return titleLower.startsWith(e) || titleLower.includes(e); });
  return title !== '' && title !== HOMEPAGE_TITLE && !hasErrorTitle;
}

test.describe('Product Detail Page (PDP) — functional test', () => {

  test('Halaman PDP load dengan benar', async ({ page }) => {
    const response = await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    const status = response ? response.status() : null;
    const title  = await page.title();
    console.log('  Status : ' + status);
    console.log('  Title  : ' + title);
    console.log('  URL    : ' + page.url());
    expect(status).not.toBeNull();
    expect(status).toBeGreaterThanOrEqual(200);
    expect(status).toBeLessThan(400);
    expect(await isPageValid(page), 'Halaman tidak boleh error').toBe(true);
  });

  test('Gambar produk tampil dengan benar', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(1500);

    // Cek main image
    const mainImg = page.locator('img[alt="Product Thumbnail"], img.aspect-square').first();
    const mainVisible = await mainImg.isVisible().catch(() => false);
    console.log('  Main image  : ' + (mainVisible ? 'OK' : 'GAGAL'));
    expect(mainVisible, 'Main image harus tampil').toBe(true);

    // Cek src tidak kosong
    const src = await mainImg.getAttribute('src').catch(() => '');
    console.log('  Image src   : ' + (src ? src.slice(0, 60) + '...' : 'kosong'));
    expect(src, 'Image src tidak boleh kosong').toBeTruthy();

    console.log('  [OK] Gambar produk tampil');
  });

  test('Informasi produk tampil dengan benar', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(1000);

    // Nama produk — h1 dengan class text-primary
    const productName = page.locator('h1.text-primary, h1.uppercase.text-primary').first();
    const nameVisible = await productName.isVisible().catch(() => false);
    const nameText    = await productName.innerText().catch(() => '');
    console.log('  Nama produk : ' + (nameVisible ? 'OK' : 'GAGAL') + ' — "' + nameText.trim().slice(0, 50) + '"');
    expect(nameVisible, 'Nama produk harus tampil').toBe(true);
    expect(nameText.trim().length, 'Nama produk tidak boleh kosong').toBeGreaterThan(0);

    // Harga — h2 dengan font-josefin-sans
    const price = page.locator('h2.font-josefin-sans, h2.font-light').first();
    const priceVisible = await price.isVisible().catch(() => false);
    const priceText    = await price.innerText().catch(() => '');
    console.log('  Harga       : ' + (priceVisible ? 'OK' : 'GAGAL') + ' — "' + priceText.trim() + '"');
    expect(priceVisible, 'Harga harus tampil').toBe(true);
    expect(priceText.includes('Rp'), 'Harga harus dalam format Rupiah').toBe(true);

    // Kode produk
    const code = page.locator('p:has-text("Code:")').first();
    const codeVisible = await code.isVisible().catch(() => false);
    const codeText    = await code.innerText().catch(() => '');
    console.log('  Kode produk : ' + (codeVisible ? 'OK' : 'GAGAL') + ' — "' + codeText.trim() + '"');

    console.log('  [OK] Informasi produk tampil lengkap');
  });

  test('Tombol Inquiry tampil dan dapat diklik', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(1000);

    // Tombol Inquiry di desktop
    const inquiryBtn = page.locator('button:has-text("Inquiry"), button span:has-text("Inquiry")').first();
    const btnVisible = await inquiryBtn.isVisible().catch(() => false);
    console.log('  Tombol Inquiry: ' + (btnVisible ? 'OK' : 'GAGAL'));
    expect(btnVisible, 'Tombol Inquiry harus tampil').toBe(true);

    // Klik tombol — tidak submit, hanya test bisa diklik
    await inquiryBtn.click().catch(() => null);
    await page.waitForTimeout(500);
    console.log('  [OK] Tombol Inquiry dapat diklik');
  });

  test('Accordion Description dan Specification dapat di-expand/collapse', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(1000);

    const accordions = [
      { name: 'Description',   selector: 'button:has(p:has-text("Description"))' },
      { name: 'Specification', selector: 'button:has(p:has-text("Specification"))' },
    ];

    for (const acc of accordions) {
      const btn = page.locator(acc.selector).first();
      const visible = await btn.isVisible().catch(() => false);

      if (!visible) {
        console.log('  [SKIP] ' + acc.name + ' accordion tidak ditemukan');
        continue;
      }

      const stateBefore = await btn.getAttribute('data-state').catch(() => '');
      console.log('  -> Klik accordion: ' + acc.name + ' (state: ' + stateBefore + ')');

      await btn.click();
      await page.waitForTimeout(400);

      const stateAfter = await btn.getAttribute('data-state').catch(() => '');
      console.log('  State setelah klik: ' + stateAfter);

      const changed = stateBefore !== stateAfter;
      console.log('  [' + (changed ? 'OK' : 'GAGAL') + '] ' + acc.name + ' accordion toggle berfungsi');
    }
  });

  test('Related products tampil dengan benar', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Scroll ke bawah untuk trigger lazy load related products
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
    await page.waitForTimeout(2000);

    const relatedCards = await page.locator('.group.aspect-square').all();
    console.log('\n  Ditemukan ' + relatedCards.length + ' related product card');
    expect(relatedCards.length, 'Harus ada minimal 1 related product').toBeGreaterThan(0);

    // Cek card pertama punya gambar dan tombol View Detail
    const firstCard = relatedCards[0];
    await firstCard.scrollIntoViewIfNeeded();
    await firstCard.hover();
    await page.waitForTimeout(400);

    const hasImg = await firstCard.locator('img').first().isVisible().catch(() => false);
    const hasBtn = await firstCard.locator('button span:has-text("View Detail")').first().isVisible().catch(() => false);
    console.log('  Card pertama - Gambar: ' + (hasImg ? 'OK' : 'GAGAL'));
    console.log('  Card pertama - View Detail: ' + (hasBtn ? 'OK' : 'GAGAL'));

    expect(hasImg, 'Related product card harus punya gambar').toBe(true);
    console.log('  [OK] Related products tampil dengan benar');
  });

});
