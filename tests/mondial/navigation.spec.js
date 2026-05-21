// @ts-check
const { test, expect } = require('@playwright/test');

test.setTimeout(180000);

const HOMEPAGE_TITLE_KEYWORD = 'mondial';

async function isPageValid(page) {
  const title = await page.title().catch(() => '');
  const titleLower = title.toLowerCase();
  const errorTitles = ['404', '500', '503', 'error', 'server error', 'something went wrong', 'page not found'];
  const hasErrorTitle = errorTitles.some(e => titleLower.includes(e));
  return title !== '' && !hasErrorTitle;
}

// ── Menu utama ──────────────────────────────────────────────────────────────
const MAIN_MENUS = [
  { label: 'HIGH JEWELRY',   href: '/en/high-jewelry' },
  { label: 'STORIES',        href: '/en/stories/articles' },
];

// ── Semua submenu ───────────────────────────────────────────────────────────
const SUBMENUS = [
  // High Jewelry
  { parent: 'HIGH JEWELRY', label: 'FANCY SHAPE DIAMOND',  href: '/en/collections/fancy-shape-diamond' },
  { parent: 'HIGH JEWELRY', label: 'FANCY COLOR DIAMOND',  href: '/en/collections/fancy-color-diamond' },
  { parent: 'HIGH JEWELRY', label: 'FANCY DESIGN',         href: '/en/collections/fancy-design' },
  { parent: 'HIGH JEWELRY', label: 'PRECIOUS STONE',       href: '/en/collections/precious-stone' },
  { parent: 'HIGH JEWELRY', label: 'FIREMARK',             href: '/en/collections/firemark' },
  { parent: 'HIGH JEWELRY', label: 'BRILLIANT ROSE',       href: '/en/collections/brilliant-rose' },
  { parent: 'HIGH JEWELRY', label: 'MEC ULTIMATE',         href: '/en/mondial-mec' },
  // Jewelry — Featured Collections
  { parent: 'JEWELRY', label: 'MONDIAL REALMS',            href: '/en/collections/mondial-realms' },
  { parent: 'JEWELRY', label: 'MONDIAL PRECIOUS: FIRE',    href: '/en/collections/mondial-precious-fire' },
  { parent: 'JEWELRY', label: 'MONDIAL PRECIOUS',          href: '/en/collections/mondial-precious' },
  { parent: 'JEWELRY', label: 'GALA COLLECTION',           href: '/en/collections/gala-collection' },
  { parent: 'JEWELRY', label: 'TIMELESS',                  href: '/en/collections/timeless' },
  { parent: 'JEWELRY', label: 'MONDIAL DREAMS',            href: '/en/collections/mondial-dreams' },
  { parent: 'JEWELRY', label: 'I SAID MONDIAL',            href: '/en/collections/i-said-mondial' },
  { parent: 'JEWELRY', label: 'ENCHANTALES',               href: '/en/collections/enchantales' },
  { parent: 'JEWELRY', label: 'FANTASY',                   href: '/en/collections/fantasy' },
  // Jewelry — Item
  { parent: 'JEWELRY', label: 'BRACELET',                  href: '/en/categories/bracelet' },
  { parent: 'JEWELRY', label: 'LADIES RING',               href: '/en/categories/ladies-ring' },
  { parent: 'JEWELRY', label: 'NECKLACE',                  href: '/en/categories/necklace' },
  { parent: 'JEWELRY', label: 'PENDANT & CHAIN',           href: '/en/categories/pendant-and-chain' },
  { parent: 'JEWELRY', label: 'EARRINGS',                  href: '/en/categories/earrings' },
  { parent: 'JEWELRY', label: 'PENDANT',                   href: '/en/categories/pendant' },
  { parent: 'JEWELRY', label: 'BANGLE',                    href: '/en/categories/bangle' },
  { parent: 'JEWELRY', label: "MEN'S JEWELRY",             href: '/en/collections/mens-jewelry' },
  { parent: 'JEWELRY', label: 'BROOCH',                    href: '/en/categories/brooch' },
  // Engagement & Bridal
  { parent: 'ENGAGEMENT & BRIDAL', label: 'ENGAGEMENT RINGS', href: '/en/moments/engagement-rings' },
  { parent: 'ENGAGEMENT & BRIDAL', label: 'WEDDING RINGS',    href: '/en/moments/wedding-rings' },
  // Gift Ideas
  { parent: 'GIFT IDEAS', label: 'KIDS', href: '/en/selection-for/kids' },
  { parent: 'GIFT IDEAS', label: 'HER',  href: '/en/selection-for/her' },
  { parent: 'GIFT IDEAS', label: 'HIM',  href: '/en/selection-for/him' },
  // Stories
  { parent: 'STORIES', label: 'ARTICLES',          href: '/en/stories/articles' },
  { parent: 'STORIES', label: 'A TALE OF BLUE HOUSE', href: '/en/mondial-blue-house' },
  { parent: 'STORIES', label: 'SEEN ON CELEBRITY',  href: '/en/seen-on-celebrity' },
  // All About Diamonds
  { parent: 'ALL ABOUT DIAMONDS', label: "THE 4 C'S OF DIAMONDS", href: '/en/all-about-diamond' },
  { parent: 'ALL ABOUT DIAMONDS', label: 'RING SIZE GUIDE',        href: '/en/size-guide' },
];

// ── Footer links ────────────────────────────────────────────────────────────
const FOOTER_LINKS = [
  { label: 'CONTACT US',                href: '/en/contacts' },
  { label: 'FREQUENTLY ASKED QUESTIONS', href: '/en/faq' },
  { label: 'TERMS AND CONDITIONS',       href: '/en/terms' },
  { label: 'BOUTIQUE LOCATION',          href: '/en/boutiques' },
  { label: 'STORIES',                    href: '/en/stories/all' },
];

test.describe('Menu navigation — Mondial', () => {

  test('Halaman homepage Mondial load dengan benar', async ({ page }) => {
    const response = await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    const status = response ? response.status() : null;
    const title  = await page.title();
    console.log('  Status : ' + status);
    console.log('  Title  : ' + title);
    expect(status).toBeLessThan(400);
    expect(title.toLowerCase()).toContain(HOMEPAGE_TITLE_KEYWORD);
  });

  test('Menu utama dapat diklik dan tidak 404', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(1000);

    const failed = [];
    for (const menu of MAIN_MENUS) {
      const response = await page.goto(menu.href, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => null);
      const status = response ? response.status() : null;
      const valid  = await isPageValid(page);
      const ok     = status && status < 400 && valid;
      console.log('  → ' + menu.label + ' → ' + (ok ? '✓' : '✗ ' + status));
      if (!ok) failed.push(menu);
      await page.waitForTimeout(300);
    }

    if (failed.length > 0) {
      throw new Error('Menu gagal: ' + failed.map(m => m.label).join(', '));
    }
    console.log('  Ringkasan: ' + MAIN_MENUS.length + '/' + MAIN_MENUS.length + ' menu OK');
  });

  test('Semua submenu tidak 404', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60000 });

    const failed = [];
    for (const sub of SUBMENUS) {
      const response = await page.goto(sub.href, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => null);
      const status = response ? response.status() : null;
      const valid  = await isPageValid(page);
      const ok     = status && status < 400 && valid;
      console.log('  → ' + sub.parent + ' > ' + sub.label + ' → ' + (ok ? '✓' : '✗ ' + status));
      if (!ok) failed.push(sub);
      await page.waitForTimeout(200);
    }

    if (failed.length > 0) {
      const detail = failed.map(f => '  ✗ "' + f.parent + '" > "' + f.label + '" -> ' + f.href).join('\n');
      throw new Error('Ada submenu yang mengembalikan 404:\n' + detail);
    }
    console.log('  Ringkasan: ' + SUBMENUS.length + '/' + SUBMENUS.length + ' submenu OK');
  });

  test('Footer links tidak 404', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60000 });

    const failed = [];
    for (const link of FOOTER_LINKS) {
      const response = await page.goto(link.href, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => null);
      const status = response ? response.status() : null;
      const valid  = await isPageValid(page);
      const ok     = status && status < 400 && valid;
      console.log('  → ' + link.label + ' → ' + (ok ? '✓' : '✗ ' + status));
      if (!ok) failed.push(link);
      await page.waitForTimeout(300);
    }

    if (failed.length > 0) {
      throw new Error('Footer link gagal: ' + failed.map(f => f.label).join(', '));
    }
    console.log('  Ringkasan: ' + FOOTER_LINKS.length + '/' + FOOTER_LINKS.length + ' footer links OK');
  });

  test('Header icons — Search, Wishlist, Profile, Boutique', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(1000);

    // Search button
    const searchBtn = page.locator('button:has(svg.lucide-search), button:has(svg[class*="search"])').first();
    const searchVisible = await searchBtn.isVisible().catch(() => false);
    console.log('  Search button: ' + (searchVisible ? 'OK' : 'TIDAK DITEMUKAN'));

    // Wishlist
    const wishlistLink = page.locator('a[href*="wishlist"]').first();
    const wishlistVisible = await wishlistLink.isVisible().catch(() => false);
    console.log('  Wishlist link: ' + (wishlistVisible ? 'OK' : 'TIDAK DITEMUKAN'));

    // Boutique location icon
    const boutiqueLink = page.locator('a[href*="boutique"]').first();
    const boutiqueVisible = await boutiqueLink.isVisible().catch(() => false);
    console.log('  Boutique icon: ' + (boutiqueVisible ? 'OK' : 'TIDAK DITEMUKAN'));

    // Language switcher
    const langBtn = page.locator('button:has-text("EN"), button:has-text("ID")').first();
    const langVisible = await langBtn.isVisible().catch(() => false);
    console.log('  Language switcher: ' + (langVisible ? 'OK' : 'TIDAK DITEMUKAN'));

    expect(searchVisible || boutiqueVisible, 'Minimal satu header icon harus tampil').toBe(true);
  });

});
