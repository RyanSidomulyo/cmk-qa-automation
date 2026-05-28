// @ts-check
//
// Page validation helpers untuk Frank & Co specs.
// Mengatasi race condition Next.js client-side routing dimana
// title belum di-update saat dibaca terlalu cepat setelah klik.

const HOMEPAGE_TITLE = 'Frank & co. | Natural Diamond Jewellery, Fashion Collections, and Gifts';
const ERROR_KEYWORDS = ['404', '500', '503', 'error', 'server error', 'something went wrong', 'page not found'];

function isTitleValid(title) {
  if (!title || title.trim() === '') return false;
  if (title === HOMEPAGE_TITLE) return false;
  const lower = title.toLowerCase();
  return !ERROR_KEYWORDS.some((kw) => lower.startsWith(kw) || lower.includes(kw));
}

async function isPageValid(page) {
  const title = await page.title().catch(() => '');
  return isTitleValid(title);
}

function buildResult(title, url) {
  if (!title || title.trim() === '') {
    return { valid: false, title, url, reason: 'Title kosong' };
  }
  if (title === HOMEPAGE_TITLE) {
    return { valid: false, title, url, reason: 'Redirect ke homepage (kemungkinan 404 silent)' };
  }
  const lower = title.toLowerCase();
  const matchedError = ERROR_KEYWORDS.find((kw) => lower.startsWith(kw) || lower.includes(kw));
  if (matchedError) {
    return { valid: false, title, url, reason: `Title mengandung "${matchedError}"` };
  }
  return { valid: true, title, url, reason: '' };
}

/**
 * Tunggu sampai halaman beneran siap setelah aksi klik / navigasi client-side.
 * Mengatasi race condition di Next.js dimana domcontentloaded fire SEBELUM
 * React selesai render head metadata.
 *
 * options:
 *   - fromTitle: title sebelum klik (akan tunggu sampai title beda)
 *   - fromUrl:   URL sebelum klik (akan tunggu sampai URL beda)
 *   - timeout:   max wait (default 15000ms)
 *   - stableMs:  title harus stabil selama X ms (default 500ms)
 *
 * Return: { valid, title, url, reason }
 *
 * Contoh:
 *   const before = { title: await page.title(), url: page.url() };
 *   await link.click();
 *   const res = await waitForValidPage(page, { fromTitle: before.title, fromUrl: before.url });
 *   if (!res.valid) console.log('FAIL:', res.reason);
 */
async function waitForValidPage(page, options = {}) {
  const timeout = options.timeout ?? 15000;
  const stableMs = options.stableMs ?? 500;
  const fromTitle = options.fromTitle ?? null;
  const fromUrl = options.fromUrl ?? null;

  const deadline = Date.now() + timeout;
  let lastTitle = '';
  let stableSince = 0;

  while (Date.now() < deadline) {
    const title = await page.title().catch(() => '');
    const url = page.url();

    const urlChanged = !fromUrl || url !== fromUrl;
    const titleChanged = !fromTitle || (title !== fromTitle && title !== '');

    if (urlChanged && titleChanged && title !== '') {
      if (title === lastTitle) {
        if (Date.now() - stableSince >= stableMs) {
          return buildResult(title, url);
        }
      } else {
        lastTitle = title;
        stableSince = Date.now();
      }
    }

    await page.waitForTimeout(100);
  }

  // Timeout — return state apa adanya sekarang
  const finalTitle = await page.title().catch(() => '');
  const finalUrl = page.url();
  const result = buildResult(finalTitle, finalUrl);
  if (result.valid) return result;
  return {
    ...result,
    reason: result.reason || `Timeout ${timeout}ms — title="${finalTitle}", url="${finalUrl}"`,
  };
}

module.exports = { isPageValid, isTitleValid, waitForValidPage, HOMEPAGE_TITLE };
