/**
 * API Smoke Monitor
 * -----------------
 * Pasif: dengar semua HTTP response yang lewat di halaman, catat yang 5xx
 * atau API yang gagal (4xx pada endpoint /api/, /graphql, dll).
 *
 * Tujuan: nambah coverage backend health TANPA bikin spec API terpisah.
 * Setiap halaman yang di-test functional otomatis sekalian "smoke test" API.
 *
 * Cara pakai (per test):
 *
 *   const { attachApiMonitor } = require('../helpers/api-monitor');
 *
 *   test('homepage', async ({ page }, testInfo) => {
 *     const apiMon = attachApiMonitor(page, testInfo, {
 *       // optional opts:
 *       includePatterns: [/\/api\//, /\/graphql/],
 *       ignorePatterns:  [/\/sentry-tunnel/, /google-analytics/, /gtm\.js/],
 *       failOn5xx: true,   // fail test kalau ada 5xx (default: true)
 *       failOn4xx: false,  // 4xx cuma di-log (default: false)
 *     });
 *
 *     await page.goto('/');
 *     // ... assertion lain ...
 *
 *     apiMon.assertClean(); // panggil di akhir untuk fail kalau ada error
 *   });
 *
 * Atau global via beforeEach di spec:
 *
 *   test.beforeEach(async ({ page }, testInfo) => {
 *     testInfo.apiMon = attachApiMonitor(page, testInfo);
 *   });
 *   test.afterEach(async ({}, testInfo) => {
 *     testInfo.apiMon?.assertClean();
 *   });
 */

const DEFAULT_IGNORE = [
  /sentry-tunnel/i,
  /sentry\.io/i,
  /google-analytics\.com/i,
  /googletagmanager\.com/i,
  /doubleclick\.net/i,
  /facebook\.(com|net)/i,
  /hotjar/i,
  /clarity\.ms/i,
  /\.(png|jpe?g|webp|gif|svg|ico|woff2?|ttf|otf|css|map)(\?|$)/i,
];

const DEFAULT_INCLUDE = [
  /\/api\//i,
  /\/graphql/i,
  /\/_next\/data\//i,
];

function shouldTrack(url, includePatterns, ignorePatterns) {
  if (ignorePatterns.some((re) => re.test(url))) return false;
  // Track everything that's HTML doc + API patterns
  return includePatterns.some((re) => re.test(url)) || /^https?:\/\/[^/]+\/?$/.test(url);
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {import('@playwright/test').TestInfo} testInfo
 * @param {object} [opts]
 */
function attachApiMonitor(page, testInfo, opts = {}) {
  const includePatterns = opts.includePatterns || DEFAULT_INCLUDE;
  const ignorePatterns = (opts.ignorePatterns || []).concat(DEFAULT_IGNORE);
  const failOn5xx = opts.failOn5xx !== false; // default true
  const failOn4xx = opts.failOn4xx === true;  // default false

  const errors = [];

  const onResponse = (response) => {
    const url = response.url();
    const status = response.status();

    if (status < 400) return;
    if (!shouldTrack(url, includePatterns, ignorePatterns)) return;

    const is5xx = status >= 500;
    const is4xx = status >= 400 && status < 500;

    if (is5xx || (is4xx && failOn4xx)) {
      errors.push({ url, status, method: response.request().method() });
    }
  };

  page.on('response', onResponse);

  return {
    /** Detach listener (jarang dipakai; auto-detach saat page close). */
    detach() {
      page.off('response', onResponse);
    },

    /** Ambil daftar error sejauh ini, tanpa fail test. */
    getErrors() {
      return errors.slice();
    },

    /**
     * Panggil di akhir test. Fail test kalau ada API error.
     * Error message include URL + status + method (actionable buat dev).
     */
    assertClean() {
      if (errors.length === 0) return;

      const summary = errors
        .map((e) => `  - ${e.method} ${e.status} ${e.url}`)
        .join('\n');

      const msg =
        `\n🚨 API smoke monitor detect ${errors.length} error response:\n` +
        summary +
        `\n\nAction: cek backend log untuk endpoint di atas. ` +
        `Status 5xx = server bug, harus diteruskan ke tim dev.`;

      // Attach ke report supaya kelihatan di HTML report
      if (testInfo && typeof testInfo.attach === 'function') {
        testInfo
          .attach('api-errors.json', {
            body: Buffer.from(JSON.stringify(errors, null, 2)),
            contentType: 'application/json',
          })
          .catch(() => {});
      }

      throw new Error(msg);
    },
  };
}

module.exports = { attachApiMonitor };
