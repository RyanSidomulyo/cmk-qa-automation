// @ts-check
const { test, expect } = require('@playwright/test');

test.setTimeout(120000);

const MAIN_MENU = [
  { label: 'BERANDA',   href: '/' },
  { label: 'KOLEKSI',   href: '/collection' },
  { label: 'ARTIKEL',   href: '/article' },
];

const PERHIASAN_SUBMENU = [
  // Jenis Perhiasan
  { group: 'Jenis Perhiasan', label: 'Perhiasan Emas',    href: '/product?types=emas' },
  { group: 'Jenis Perhiasan', label: 'Perhiasan Berlian', href: '/product?types=berlian' },
  // Kategori
  { group: 'Kategori', label: 'Gelang',             href: '/categories/gelang' },
  { group: 'Kategori', label: 'Anting',             href: '/categories/anting' },
  { group: 'Kategori', label: 'Cincin',             href: '/categories/cincin' },
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

const FOOTER_LINKS = [
  // Menu
  { group: 'MENU', label: 'Tentang Kami',    href: '/about/the-palace' },
  { group: 'MENU', label: 'Tentang Berlian', href: '/about/diamond' },
  { group: 'MENU', label: 'Tentang Emas',    href: '/about/gold' },
  { group: 'MENU', label: 'Artikel',         href: '/article' },
  // Bantuan
  { group: 'BANTUAN', label: 'FAQ',                  href: '/faq' },
  { group: 'BANTUAN', label: 'Syarat dan Ketentuan', href: '/terms-condition' },
  { group: 'BANTUAN', label: 'Kebijakan Privasi',    href: '/privacy-policies' },
];

test.describe('Menu navigation — The Palace', () => {

  test('Halaman homepage The Palace load dengan benar', async ({ page }) => {
    const response = await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    const status = response ? response.status() : null;
    const title  = await page.title();
    console.log('  Status : ' + status);
    console.log('  Title  : ' + title);
    console.log('  URL    : ' + page.url());
    expect(status).toBeLessThan(400);
  });

  test('Menu utama dapat diklik dan tidak 404', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60000 });

    let okCount = 0;
    for (const item of MAIN_MENU) {
      const response = await page.goto(item.href, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => null);
      const status = response ? response.status() : null;
      const ok = status && status < 400;
      console.log('  → ' + item.label + ' (' + item.href + ') → ' + (ok ? '✓' : '✗ ' + status));
      if (ok) okCount++;
    }
    expect(okCount, 'Semua menu utama harus OK').toBe(MAIN_MENU.length);
    console.log('  Ringkasan: ' + okCount + '/' + MAIN_MENU.length + ' menu OK');
  });

  test('Semua submenu PERHIASAN tidak 404', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60000 });

    const failed = [];
    for (const item of PERHIASAN_SUBMENU) {
      const response = await page.goto(item.href, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => null);
      const status = response ? response.status() : null;
      const ok = status && status < 400;
      console.log('  → ' + item.group + ' > ' + item.label + ' → ' + (ok ? '✓' : '✗ ' + status));
      if (!ok) failed.push({ ...item, status });
    }

    if (failed.length > 0) {
      const detail = failed.map(f => '  ✗ "' + f.group + '" > "' + f.label + '" -> ' + f.href + ' (status: ' + f.status + ')').join('\n');
      throw new Error('Ada submenu yang mengembalikan error:\n' + detail);
    }
    console.log('  Ringkasan: ' + PERHIASAN_SUBMENU.length + '/' + PERHIASAN_SUBMENU.length + ' submenu OK');
  });

  test('Footer links tidak 404', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60000 });

    const failed = [];
    for (const item of FOOTER_LINKS) {
      const response = await page.goto(item.href, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => null);
      const status = response ? response.status() : null;
      const ok = status && status < 400;
      console.log('  → ' + item.group + ' > ' + item.label + ' → ' + (ok ? '✓' : '✗ ' + status));
      if (!ok) failed.push({ ...item, status });
    }

    if (failed.length > 0) {
      const detail = failed.map(f => '  ✗ "' + f.group + '" > "' + f.label + '" -> ' + f.href).join('\n');
      throw new Error('Ada footer link yang error:\n' + detail);
    }
    console.log('  Ringkasan: ' + FOOTER_LINKS.length + '/' + FOOTER_LINKS.length + ' footer link OK');
  });

  test('Header icons — Search, Map, Wishlist, Cart, Profile', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(1000);

    const checks = [
      { label: 'Search icon',   selector: 'button:has(svg.lucide-search)' },
      { label: 'Map Pin icon',  selector: 'a[href*="/location"] svg.lucide-map-pin' },
      { label: 'Wishlist icon', selector: 'a[href="/wishlist"] svg.lucide-heart' },
      { label: 'Cart icon',     selector: 'button:has(svg.lucide-shopping-cart)' },
      { label: 'Profile icon',  selector: 'a[href*="/profile"] svg.lucide-user' },
    ];

    for (const c of checks) {
      const el = page.locator(c.selector).first();
      const visible = await el.isVisible().catch(() => false);
      console.log('  [' + (visible ? 'OK' : 'GAGAL') + '] ' + c.label);
      expect(visible, c.label + ' harus tampil').toBe(true);
    }
    console.log('  [OK] Semua header icon tampil');
  });

  test('Social media links di footer tampil', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(1000);

    const socials = [
      { label: 'TikTok',    href: 'tiktok.com' },
      { label: 'Instagram', href: 'instagram.com' },
      { label: 'Facebook',  href: 'facebook.com' },
      { label: 'YouTube',   href: 'youtube.com' },
    ];

    for (const s of socials) {
      const link = page.locator('a[href*="' + s.href + '"]').first();
      const visible = await link.isVisible().catch(() => false);
      const href = await link.getAttribute('href').catch(() => '');
      console.log('  [' + (visible ? 'OK' : 'GAGAL') + '] ' + s.label + ' → ' + href);
      expect(visible, s.label + ' harus tampil').toBe(true);
    }
    console.log('  [OK] Semua social media link tampil');
  });

});
