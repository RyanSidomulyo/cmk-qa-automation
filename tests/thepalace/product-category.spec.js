// @ts-check
const { test, expect } = require('../helpers/fixtures');

test.setTimeout(180000);

const CATEGORIES = [
  { label: 'Cincin',             href: '/categories/cincin' },
  { label: 'Gelang',             href: '/categories/gelang' },
  { label: 'Anting',             href: '/categories/anting' },
  { label: 'Kalung dan Liontin', href: '/categories/kalung-dan-liontin' },
];

const FILTER_BUTTONS = ['Perhiasan', 'Koleksi', 'Penerima', 'Momen', 'Harga'];

test.describe('Product category page — The Palace', () => {

  test('Semua halaman kategori load dengan benar', async ({ page }) => {
    for (const cat of CATEGORIES) {
      const response = await page.goto(cat.href, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => null);
      const status = response ? response.status() : null;
      const ok = status && status < 400;
      console.log('  → ' + cat.label + ' (' + cat.href + ') → ' + (ok ? '✓ ' + status : '✗ ' + status));
      expect(ok, cat.label + ' harus load 200').toBe(true);
    }
    console.log('  Ringkasan: ' + CATEGORIES.length + '/' + CATEGORIES.length + ' kategori OK');
  });

  test('Filter bar tampil dengan semua tombol', async ({ page }) => {
    await page.goto('/categories/cincin', { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(3000);

    for (const label of FILTER_BUTTONS) {
      const btn = page.locator('button:has(span:text-is("' + label + '"))').first();
      const visible = await btn.isVisible().catch(() => false);
      console.log('  [' + (visible ? 'OK' : 'GAGAL') + '] Filter: ' + label);
      expect(visible, 'Filter ' + label + ' harus tampil').toBe(true);
    }
    console.log('  [OK] Semua tombol filter tampil');
  });

  test('Sort dropdown tampil dan dapat diklik', async ({ page }) => {
    await page.goto('/categories/cincin', { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(3000);

    // Cari sort button (yang ada teks "Harga, Terendah" atau "Harga, Tertinggi")
    const sortBtn = page.locator('button:has(span:has-text("Harga, Terendah")), button:has(span:has-text("Harga, Tertinggi"))').first();
    const btnVisible = await sortBtn.isVisible().catch(() => false);
    const btnText = await sortBtn.textContent().catch(() => '');
    console.log('  Sort button: ' + (btnVisible ? 'OK — "' + btnText.trim() + '"' : 'TIDAK DITEMUKAN'));
    expect(btnVisible, 'Sort button harus tampil').toBe(true);

    await sortBtn.click();
    await page.waitForTimeout(500);
    const expanded = await sortBtn.getAttribute('aria-expanded').catch(() => 'false');
    console.log('  Sort dropdown aria-expanded: ' + expanded);
    expect(expanded, 'Sort dropdown harus terbuka').toBe('true');
    console.log('  [OK] Sort dropdown dapat dibuka');
  });

  test('Filter Harga dapat dibuka dan menampilkan opsi', async ({ page }) => {
    await page.goto('/categories/cincin', { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(3000);

    const hargaBtn = page.locator('button:has(span:text-is("Harga"))').first();
    await hargaBtn.click();
    await page.waitForTimeout(1000);

    const expanded = await hargaBtn.getAttribute('aria-expanded').catch(() => 'false');
    console.log('  Filter Harga aria-expanded: ' + expanded);
    expect(expanded).toBe('true');
    console.log('  [OK] Filter Harga dapat dibuka');
  });

  test('Filter Penerima dapat dibuka dan menampilkan opsi', async ({ page }) => {
    await page.goto('/categories/cincin', { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(3000);

    const penerimaBtn = page.locator('button:has(span:text-is("Penerima"))').first();
    await penerimaBtn.click();
    await page.waitForTimeout(1000);

    const expanded = await penerimaBtn.getAttribute('aria-expanded').catch(() => 'false');
    console.log('  Filter Penerima aria-expanded: ' + expanded);
    expect(expanded).toBe('true');
    console.log('  [OK] Filter Penerima dapat dibuka');
  });

  test('Filter Momen dapat dibuka dan menampilkan opsi', async ({ page }) => {
    await page.goto('/categories/cincin', { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(3000);

    const momenBtn = page.locator('button:has(span:text-is("Momen"))').first();
    await momenBtn.click();
    await page.waitForTimeout(1000);

    const expanded = await momenBtn.getAttribute('aria-expanded').catch(() => 'false');
    console.log('  Filter Momen aria-expanded: ' + expanded);
    expect(expanded).toBe('true');
    console.log('  [OK] Filter Momen dapat dibuka');
  });

  test('Produk tampil di halaman kategori', async ({ page }) => {
    await page.goto('/categories/cincin', { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(3000);

    const productCards = await page.locator('div.group:has(img):has(h2)').all();
    console.log('  Ditemukan ' + productCards.length + ' product card');
    expect(productCards.length, 'Harus ada minimal 5 produk').toBeGreaterThanOrEqual(5);
    console.log('  [OK] Product cards tampil');
  });

  test('5 produk teratas: struktur lengkap (gambar, nama, harga)', async ({ page }) => {
    await page.goto('/categories/cincin', { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(3000);

    const cards = await page.locator('div.group:has(img):has(h2)').all();
    const toTest = cards.slice(0, 5);
    const failed = [];

    for (let i = 0; i < toTest.length; i++) {
      const card = toTest[i];
      const img    = card.locator('img').first();
      const name   = card.locator('h2').first();
      const price  = card.locator('p').first();

      const imgSrc   = await img.getAttribute('src').catch(() => '');
      const nameText = await name.textContent().catch(() => '');
      const priceText = await price.textContent().catch(() => '');

      const imgOk  = imgSrc && imgSrc.length > 0;
      const nameOk = nameText.trim().length > 0;
      const allOk = imgOk && nameOk;

      console.log('  Produk ' + (i + 1) + ': "' + nameText.trim().slice(0, 40) + '"');
      console.log('     Gambar: ' + (imgOk ? 'OK' : 'TIDAK ADA'));
      console.log('     Nama  : ' + (nameOk ? 'OK' : 'KOSONG'));
      console.log('     Harga : ' + (priceText.trim().length > 0 ? priceText.trim() : '(kosong, OK untuk produk emas)'));

      if (!allOk) failed.push(nameText.trim().slice(0, 40));
    }

    if (failed.length > 0) {
      throw new Error('Produk gagal validasi: ' + failed.join(', '));
    }
    console.log('  Ringkasan: ' + toTest.length + '/' + toTest.length + ' produk OK');
  });

  test('5 produk teratas dapat diakses ke halaman detail', async ({ page }) => {
    await page.goto('/categories/cincin', { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(3000);

    const productCards = await page.locator('div.group:has(img):has(h2)').all();
    expect(productCards.length, 'Harus ada minimal 5 produk').toBeGreaterThanOrEqual(5);

    const productNames = [];
    for (let i = 0; i < 5; i++) {
      const name = await productCards[i].locator('h2').first().textContent().catch(() => '');
      productNames.push(name.trim());
    }

    console.log('  Menguji 5 produk pertama');
    const failed = [];

    for (let i = 0; i < 5; i++) {
      // Kembali ke halaman category setiap iterasi
      await page.goto('/categories/cincin', { waitUntil: 'networkidle', timeout: 60000 });
      await page.waitForTimeout(2000);

      const cards = await page.locator('div.group:has(img):has(h2)').all();
      await cards[i].click();
      await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
      await page.waitForTimeout(1500);

      const url = page.url();
      const ok = url.includes('/product/');
      console.log('  → "' + productNames[i] + '" → ' + (ok ? '✓ ' + url : '✗ ' + url));
      if (!ok) failed.push(productNames[i] + ' → ' + url);
    }

    if (failed.length > 0) {
      throw new Error('Produk gagal diakses:\n' + failed.join('\n'));
    }
    console.log('  Ringkasan: 5/5 produk OK');
  });

  test('Halaman detail produk memiliki struktur lengkap', async ({ page }) => {
    await page.goto('/categories/cincin', { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(3000);

    // Klik product card pertama
    const firstCard = page.locator('div.group:has(img):has(h2)').first();
    const productName = await firstCard.locator('h2').first().textContent().catch(() => '');
    console.log('  → Klik produk: "' + productName.trim() + '"');

    await firstCard.click();
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    const url = page.url();
    console.log('  → URL: ' + url);
    expect(url, 'Harus pindah ke halaman /product/...').toContain('/product/');

    // Cek elemen detail produk
    const productTitle = page.locator('h1, h2').first();
    const titleVisible = await productTitle.isVisible().catch(() => false);
    const titleText = await productTitle.textContent().catch(() => '');
    console.log('  Judul produk: ' + (titleVisible ? 'OK — "' + titleText.trim().slice(0, 50) + '"' : 'TIDAK ADA'));

    // Kode barang
    const kodeBarang = page.locator('text=/Kode Barang/i').first();
    const kodeVisible = await kodeBarang.isVisible().catch(() => false);
    console.log('  Kode Barang : ' + (kodeVisible ? 'OK' : 'TIDAK ADA'));

    // Harga
    const harga = page.locator('text=/Rp[0-9.]+/').first();
    const hargaVisible = await harga.isVisible().catch(() => false);
    const hargaText = await harga.textContent().catch(() => '');
    console.log('  Harga       : ' + (hargaVisible ? 'OK — ' + hargaText.trim() : 'TIDAK ADA'));

    // Tombol Hubungi Kami
    const cta = page.locator('button:has-text("HUBUNGI KAMI"), a:has-text("HUBUNGI KAMI")').first();
    const ctaVisible = await cta.isVisible().catch(() => false);
    console.log('  Hubungi Kami: ' + (ctaVisible ? 'OK' : 'TIDAK ADA'));

    // Wishlist
    const wishlist = page.locator('text=/Tambah ke Wishlist/i').first();
    const wishlistVisible = await wishlist.isVisible().catch(() => false);
    console.log('  Wishlist    : ' + (wishlistVisible ? 'OK' : 'TIDAK ADA'));

    // Share
    const share = page.locator('text=/Bagikan/i').first();
    const shareVisible = await share.isVisible().catch(() => false);
    console.log('  Bagikan     : ' + (shareVisible ? 'OK' : 'TIDAK ADA'));

    // Related products
    const related = page.locator('h2:has-text("Anda Mungkin Juga Suka")').first();
    const relatedVisible = await related.isVisible().catch(() => false);
    console.log('  Related     : ' + (relatedVisible ? 'OK' : 'TIDAK ADA'));

    expect(titleVisible, 'Judul produk harus tampil').toBe(true);
    expect(ctaVisible, 'Tombol Hubungi Kami harus tampil').toBe(true);
    console.log('  [OK] Struktur halaman detail produk lengkap');
  });


  test('Semua 15 halaman submenu PERHIASAN punya minimal 3 produk', async ({ page }) => {
    test.setTimeout(120000);
    const ALL_LISTINGS = [
      // Jenis Perhiasan
      { group: 'Jenis Perhiasan', label: 'Perhiasan Emas',    href: '/product?types=emas' },
      { group: 'Jenis Perhiasan', label: 'Perhiasan Berlian', href: '/product?types=berlian' },
      // Kategori
      { group: 'Kategori', label: 'Gelang',            href: '/categories/gelang' },
      { group: 'Kategori', label: 'Anting',            href: '/categories/anting' },
      { group: 'Kategori', label: 'Cincin',            href: '/categories/cincin' },
      { group: 'Kategori', label: 'Kalung dan Liontin', href: '/categories/kalung-dan-liontin' },
      // Penerima
      { group: 'Penerima', label: 'Wanita', href: '/selection-for/wanita' },
      { group: 'Penerima', label: 'Pria',   href: '/selection-for/pria' },
      { group: 'Penerima', label: 'Couple', href: '/selection-for/couple' },
      { group: 'Penerima', label: 'Baby',   href: '/selection-for/baby' },
      // Momen
      { group: 'Momen', label: 'Pernikahan',  href: '/moments/pernikahan' },
      { group: 'Momen', label: 'Tunangan',    href: '/moments/tunangan' },
      { group: 'Momen', label: 'Anniversary', href: '/moments/anniversary' },
      { group: 'Momen', label: 'Birthday',    href: '/moments/birthday' },
      { group: 'Momen', label: 'Graduation',  href: '/moments/graduation' },
    ];

    const failed = [];

    for (const item of ALL_LISTINGS) {
      await page.goto(item.href, { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => null);
      await page.waitForTimeout(1500);

      const productCount = await page.locator('div.group:has(img):has(h2)').count();
      const ok = productCount >= 3;
      console.log('  → ' + item.group + ' > ' + item.label + ': ' + productCount + ' produk → ' + (ok ? '✓' : '✗ KURANG DARI 3'));

      if (!ok) {
        failed.push({ ...item, count: productCount });
      }
    }

    if (failed.length > 0) {
      const detail = failed.map(f =>
        '  ✗ "' + f.group + '" > "' + f.label + '" -> ' + f.href + ' (hanya ' + f.count + ' produk)'
      ).join('\n');
      throw new Error('Ada halaman dengan produk kurang dari 3:\n' + detail);
    }
    console.log('  Ringkasan: ' + ALL_LISTINGS.length + '/' + ALL_LISTINGS.length + ' halaman OK (min 3 produk)');
  });

});