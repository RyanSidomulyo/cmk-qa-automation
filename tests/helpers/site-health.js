// @ts-check
//
// Site Health Helpers
// -------------------
// Shared helpers untuk SEO meta validation & 3rd party script check.
// Dipakai oleh tests/{ecomm,mondial,thepalace}/site-health.spec.js.

const TITLE_MIN = 25;
const TITLE_MAX = 70;
const DESC_MIN = 50;
const DESC_MAX = 165;

/**
 * Ambil semua meta tag relevan dari page.
 * @param {import('@playwright/test').Page} page
 */
async function collectMeta(page) {
  return page.evaluate(() => {
    const get = (sel, attr = 'content') => {
      const el = document.querySelector(sel);
      return el ? el.getAttribute(attr) : null;
    };
    const html = document.documentElement;
    return {
      title:         document.title || '',
      description:   get('meta[name="description"]'),
      canonical:     get('link[rel="canonical"]', 'href'),
      robots:        get('meta[name="robots"]'),
      lang:          html.getAttribute('lang'),
      ogTitle:       get('meta[property="og:title"]'),
      ogDescription: get('meta[property="og:description"]'),
      ogImage:       get('meta[property="og:image"]'),
      ogUrl:         get('meta[property="og:url"]'),
      ogType:        get('meta[property="og:type"]'),
      twitterCard:   get('meta[name="twitter:card"]'),
      twitterTitle:  get('meta[name="twitter:title"]'),
      twitterImage:  get('meta[name="twitter:image"]'),
    };
  });
}

/**
 * Validasi meta tags & return array of issue messages.
 * Empty array = halaman sehat secara SEO basic.
 */
function validateMeta(meta, options = {}) {
  const issues = [];
  const required = options.required || ['title', 'description', 'canonical', 'ogTitle', 'ogImage'];

  required.forEach((key) => {
    const val = meta[key];
    if (!val || (typeof val === 'string' && val.trim() === '')) {
      issues.push(`Meta "${key}" kosong atau tidak ada`);
    }
  });

  if (meta.title) {
    const len = meta.title.length;
    if (len < TITLE_MIN) issues.push(`Title terlalu pendek (${len} char, min ${TITLE_MIN})`);
    if (len > TITLE_MAX) issues.push(`Title terlalu panjang (${len} char, max ${TITLE_MAX})`);
  }

  if (meta.description) {
    const len = meta.description.length;
    if (len < DESC_MIN) issues.push(`Description terlalu pendek (${len} char, min ${DESC_MIN})`);
    if (len > DESC_MAX) issues.push(`Description terlalu panjang (${len} char, max ${DESC_MAX})`);
  }

  if (meta.robots && /noindex|nofollow/i.test(meta.robots)) {
    issues.push(`Robots mengandung noindex/nofollow: "${meta.robots}" (cek apakah ini intended)`);
  }

  if (!meta.lang) {
    issues.push('Atribut <html lang> tidak di-set');
  }

  if (meta.canonical && !/^https?:\/\//.test(meta.canonical)) {
    issues.push(`Canonical bukan absolute URL: "${meta.canonical}"`);
  }

  if (meta.ogImage && !/^https?:\/\//.test(meta.ogImage)) {
    issues.push(`og:image bukan absolute URL: "${meta.ogImage}"`);
  }

  return issues;
}

/**
 * Capture network responses untuk script 3rd party.
 * Pakai sebelum page.goto. Return collector object dengan getReport().
 * @param {import('@playwright/test').Page} page
 */
function startThirdPartyTracker(page) {
  const TRACKERS = {
    googleAnalytics: [/google-analytics\.com/i, /googletagmanager\.com\/gtag/i, /\/g\/collect/i],
    googleTagManager: [/googletagmanager\.com\/gtm\.js/i, /googletagmanager\.com\/gtag\/js/i],
    sentry:          [/sentry\.io/i, /sentry-tunnel/i, /\/sentry\//i],
    facebookPixel:   [/connect\.facebook\.net/i, /facebook\.com\/tr/i],
    recaptcha:       [/recaptcha/i, /gstatic\.com\/recaptcha/i],
    hotjar:          [/static\.hotjar\.com/i, /hotjar\.com/i],
    clarity:         [/clarity\.ms/i],
  };

  const seen = {};
  const errors = [];
  Object.keys(TRACKERS).forEach((k) => (seen[k] = []));

  const onResponse = (res) => {
    const url = res.url();
    const status = res.status();
    for (const [name, patterns] of Object.entries(TRACKERS)) {
      if (patterns.some((re) => re.test(url))) {
        seen[name].push({ url, status });
        // HANYA 5xx yang dianggap error tracker — 4xx (terutama GA collect 403)
        // adalah behavior normal saat consent ditolak / traffic automation
        if (status >= 500) {
          errors.push({ tracker: name, url, status });
        }
        break;
      }
    }
  };

  page.on('response', onResponse);

  return {
    detach() {
      page.off('response', onResponse);
    },
    getReport() {
      const report = {};
      for (const [name, hits] of Object.entries(seen)) {
        report[name] = {
          loaded: hits.length > 0,
          count: hits.length,
          firstUrl: hits[0]?.url || null,
          worstStatus: hits.reduce((max, h) => Math.max(max, h.status), 0),
        };
      }
      return { trackers: report, errors };
    },
  };
}

/**
 * Listen untuk console errors selama load page.
 * @param {import('@playwright/test').Page} page
 */
function startConsoleErrorTracker(page) {
  const errors = [];
  const onConsole = (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Skip noise yang umum & tidak actionable
      if (/Failed to load resource.*404/i.test(text)) return;
      if (/cross-origin/i.test(text)) return;
      if (/ResizeObserver loop limit/i.test(text)) return;
      errors.push(text);
    }
  };
  const onPageError = (err) => {
    errors.push('[pageerror] ' + (err.message || String(err)));
  };
  page.on('console', onConsole);
  page.on('pageerror', onPageError);
  return {
    detach() {
      page.off('console', onConsole);
      page.off('pageerror', onPageError);
    },
    getErrors() {
      return errors.slice();
    },
  };
}

module.exports = {
  collectMeta,
  validateMeta,
  startThirdPartyTracker,
  startConsoleErrorTracker,
  isSentryLoaded,
};

/**
 * Cek Sentry SDK loaded di window. Sentry typically hanya kirim request
 * saat ada exception, jadi network-based detection tidak reliable.
 * Cek presence window.Sentry / window.__SENTRY__ object.
 * @param {import('@playwright/test').Page} page
 */
async function isSentryLoaded(page) {
  return page.evaluate(() => {
    // @ts-ignore
    return !!(window.Sentry || window.__SENTRY__);
  });
}
