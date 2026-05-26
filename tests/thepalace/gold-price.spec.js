// @ts-check
const { test, expect } = require('@playwright/test');

test.setTimeout(60000);

const MONTHS_ID = {
  'Jan': 0, 'January': 0, 'Januari': 0,
  'Feb': 1, 'February': 1, 'Februari': 1,
  'Mar': 2, 'March': 2, 'Maret': 2,
  'Apr': 3, 'April': 3,
  'May': 4, 'Mei': 4,
  'Jun': 5, 'June': 5, 'Juni': 5,
  'Jul': 6, 'July': 6, 'Juli': 6,
  'Aug': 7, 'August': 7, 'Agustus': 7,
  'Sep': 8, 'September': 8,
  'Oct': 9, 'October': 9, 'Oktober': 9,
  'Nov': 10, 'November': 10,
  'Dec': 11, 'December': 11, 'Desember': 11,
};

function parseDate(text) {
  // Format: "22 May 2026" atau "22 Mei 2026"
  const match = text.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/);
  if (!match) return null;
  const day = parseInt(match[1]);
  const month = MONTHS_ID[match[2]];
  const year = parseInt(match[3]);
  if (month === undefined) return null;
  return new Date(year, month, day);
}

test.describe('Today\'s Gold Price — The Palace', () => {

  test('Tombol "TODAY\'S GOLD PRICE" tampil di header', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(1500);

    const btn = page.locator('button:has-text("TODAY\'S GOLD PRICE")').first();
    const visible = await btn.isVisible().catch(() => false);
    console.log('  Tombol TODAY\'S GOLD PRICE: ' + (visible ? 'OK' : 'TIDAK DITEMUKAN'));
    expect(visible).toBe(true);
  });

  test('Tombol "LIHAT DETAIL" dapat diklik dan modal/halaman terbuka', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(1500);

    const btn = page.locator('button:has-text("TODAY\'S GOLD PRICE")').first();
    await btn.click();

    // Tunggu sampai "Terakhir diperbarui" muncul (max 10 detik)
    const updatedText = page.locator('text=/Terakhir diperbarui/i').first();
    await updatedText.waitFor({ state: 'visible', timeout: 10000 }).catch(() => null);

    const visible = await updatedText.isVisible().catch(() => false);
    console.log('  "Terakhir diperbarui" tampil setelah klik: ' + (visible ? 'OK' : 'TIDAK'));
    expect(visible).toBe(true);
  });

  test('Tanggal "Terakhir diperbarui" tidak lebih dari 1 hari kemarin', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(1500);

    await page.locator('button:has-text("TODAY\'S GOLD PRICE")').first().click();

    const updatedEl = page.locator('text=/Terakhir diperbarui/i').first();
    await updatedEl.waitFor({ state: 'visible', timeout: 10000 }).catch(() => null);

    const fullText = await updatedEl.textContent().catch(() => '');
    console.log('  Raw text: "' + fullText.trim() + '"');

    const updatedDate = parseDate(fullText);
    if (!updatedDate) {
      throw new Error('Tidak dapat parse tanggal dari teks: "' + fullText + '"');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    updatedDate.setHours(0, 0, 0, 0);

    const diffDays = Math.floor((today - updatedDate) / (1000 * 60 * 60 * 24));
    const formattedUpdated = updatedDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
    const formattedToday = today.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });

    console.log('  Tanggal update : ' + formattedUpdated);
    console.log('  Tanggal hari ini: ' + formattedToday);
    console.log('  Selisih hari   : ' + diffDays + ' hari');

    if (diffDays > 1) {
      throw new Error(
        'Harga emas TIDAK terupdate!\n' +
        '  Tanggal update : ' + formattedUpdated + '\n' +
        '  Tanggal hari ini: ' + formattedToday + '\n' +
        '  Selisih        : ' + diffDays + ' hari (max yang diperbolehkan: 1 hari)\n' +
        '  Action: Cek data feed harga emas — kemungkinan stale.'
      );
    }

    console.log('  [OK] Harga emas terupdate (selisih ' + diffDays + ' hari)');
  });

});
