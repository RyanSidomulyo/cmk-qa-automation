// @ts-check
const { test, expect } = require('../helpers/fixtures');

test.setTimeout(120000);

test.describe('Lokasi Boutique — The Palace', () => {

  test('Halaman /location load dengan benar', async ({ page }) => {
    const response = await page.goto('/location', { waitUntil: 'domcontentloaded', timeout: 60000 });
    const status = response ? response.status() : null;
    console.log('  Status : ' + status);
    console.log('  URL    : ' + page.url());
    expect(status, 'Halaman /location harus load — ' + page.url()).toBeLessThan(400);
  });

  test('Heading dan form pencarian tampil', async ({ page }) => {
    await page.goto('/location', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(1000);

    const heading = page.locator('h2').filter({ hasText: /galeri the palace/i }).first();
    const headingVisible = await heading.isVisible().catch(() => false);
    console.log('  [' + (headingVisible ? 'OK' : 'GAGAL') + '] Heading "Galeri the palace" tampil');
    expect(headingVisible, 'Heading harus tampil').toBe(true);

    const searchInput = page.locator('input[placeholder="Cari lokasi atau kota"]').first();
    const inputVisible = await searchInput.isVisible().catch(() => false);
    console.log('  [' + (inputVisible ? 'OK' : 'GAGAL') + '] Input pencarian tampil');
    expect(inputVisible, 'Input pencarian harus tampil').toBe(true);

    const searchBtn = page.locator('button[type="submit"]').filter({ hasText: /cari lokasi/i }).first();
    const btnVisible = await searchBtn.isVisible().catch(() => false);
    console.log('  [' + (btnVisible ? 'OK' : 'GAGAL') + '] Tombol "Cari lokasi" tampil');
    expect(btnVisible, 'Tombol cari harus tampil').toBe(true);

    console.log('  [OK] Form pencarian lengkap');
  });

  test('Region accordion ada dan dapat dibuka', async ({ page }) => {
    await page.goto('/location', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(1000);

    // waitFor supaya React selesai hydrate sebelum .all() dipanggil
    await page.locator('div.container button.flex.w-full.items-center.justify-between').first().waitFor({ state: 'visible', timeout: 15000 });
    const regionButtons = await page.locator('div.container button.flex.w-full.items-center.justify-between').all();
    console.log('  Jumlah region ditemukan: ' + regionButtons.length);
    expect(regionButtons.length, 'Harus ada minimal 1 region').toBeGreaterThan(0);

    const firstBtn = regionButtons[0];
    const regionName = await firstBtn.locator('span.uppercase.tracking-widest').textContent().catch(() => '');
    const regionCount = await firstBtn.locator('span.text-sm.font-light.tracking-wider').textContent().catch(() => '');
    console.log('  → Region pertama: "' + regionName.trim() + '" ' + regionCount.trim());

    await firstBtn.click();
    await page.waitForTimeout(500);

    const cards = await page.locator('div.flex.flex-col.h-full.justify-between').all();
    console.log('  Jumlah card toko setelah buka accordion: ' + cards.length);
    expect(cards.length, 'Harus ada toko setelah accordion dibuka').toBeGreaterThan(0);

    console.log('  [OK] Region accordion berfungsi');
  });

  test('Card toko punya nama dan alamat', async ({ page }) => {
    await page.goto('/location', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(1000);

    const firstRegionBtn = page.locator('div.container button.flex.w-full.items-center.justify-between').first();
    await firstRegionBtn.click();
    await page.waitForTimeout(500);

    const cards = await page.locator('div.flex.flex-col.h-full.justify-between').all();
    expect(cards.length, 'Harus ada card toko').toBeGreaterThan(0);

    let okCount = 0;
    const failedCards = [];

    for (let i = 0; i < Math.min(cards.length, 5); i++) {
      const card = cards[i];
      const name = await card.locator('p.uppercase.text-sm.tracking-wider.font-semibold').textContent().catch(() => '');
      const address = await card.locator('p.text-sm.mb-3').first().textContent().catch(() => '');
      const hasName = name.trim().length > 0;
      const hasAddress = address.trim().length > 0;

      console.log('  → ' + (name.trim() || '(nama kosong)') + ' → nama: ' + (hasName ? '✓' : '✗') + ', alamat: ' + (hasAddress ? '✓' : '✗'));

      if (hasName && hasAddress) {
        okCount++;
      } else {
        failedCards.push(name.trim() || '(card ke-' + (i + 1) + ')');
      }
    }

    const checked = Math.min(cards.length, 5);
    console.log('  Ringkasan: ' + okCount + '/' + checked + ' card lengkap (nama + alamat)');

    if (failedCards.length > 0) {
      throw new Error('Card toko tidak memiliki nama/alamat:\n' + failedCards.map(n => '  ✗ ' + n).join('\n'));
    }
  });

  test('Semua region accordion dapat dibuka dan punya toko', async ({ page }) => {
    await page.goto('/location', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(1000);

    const regionButtons = await page.locator('div.container button.flex.w-full.items-center.justify-between').all();
    console.log('  Total region: ' + regionButtons.length);

    const failedRegions = [];

    for (let i = 0; i < regionButtons.length; i++) {
      const btn = regionButtons[i];
      const regionName = await btn.locator('span.uppercase.tracking-widest').textContent().catch(() => 'Region ' + (i + 1));
      const regionCountText = await btn.locator('span.text-sm.font-light.tracking-wider').textContent().catch(() => '(?)');

      await btn.click();
      await page.waitForTimeout(400);

      const cards = await btn.locator('xpath=following-sibling::div[1]//div[contains(@class,"flex-col") and contains(@class,"h-full")]').all();

      const ok = cards.length > 0;
      console.log('  → ' + regionName.trim() + ' ' + regionCountText.trim() + ' → ' + cards.length + ' card ' + (ok ? '✓' : '✗'));

      if (!ok) {
        failedRegions.push(regionName.trim() + ' — tidak ada card toko (URL: /location)');
      }

      await btn.click();
      await page.waitForTimeout(200);
    }

    if (failedRegions.length > 0) {
      throw new Error('Region berikut tidak memiliki card toko:\n' + failedRegions.map(r => '  ✗ ' + r).join('\n'));
    }

    console.log('  [OK] Semua region punya toko');
  });

});
