// @ts-check
//
// Custom Playwright test fixture untuk CMK QA.
//
// Tujuan: auto-attach API smoke monitor ke setiap test tanpa harus
// edit spec satu per satu. Spec cukup ganti import dari
// '@playwright/test' jadi '../helpers/fixtures' (atau '../fixtures').
//
// Mode (via env API_MONITOR):
//   'warn' (default)   — log saja, jangan fail (aman untuk rollout awal)
//   'strict'           — fail test kalau ada 5xx pada /api/, /graphql/, /_next/data/
//   'off'              — disable total
//
// Pemakaian di spec:
//   const { test, expect } = require('../helpers/fixtures');
//   // sama persis dengan @playwright/test, plus API monitor auto-aktif
//
// Setelah rollout stabil di staging, flip ke strict via env:
//   API_MONITOR=strict npx playwright test ...

const base = require('@playwright/test');
const { attachApiMonitor } = require('./api-monitor');

const MODE = (process.env.API_MONITOR || 'warn').toLowerCase();
const ENABLED = MODE !== 'off';
const STRICT = MODE === 'strict';

exports.test = base.test.extend({
  apiMon: async ({ page }, use, testInfo) => {
    if (!ENABLED) {
      // No-op fallback supaya spec yang akses apiMon tetap aman
      await use({
        addIgnore: () => {},
        getErrors: () => [],
        assertClean: () => {},
        detach: () => {},
      });
      return;
    }

    const monitor = attachApiMonitor(page, testInfo, {
      failOn5xx: STRICT,
      failOn4xx: false,
    });

    // Helper untuk tambah ignore pattern di tengah test
    monitor.addIgnore = (regex) => {
      // attachApiMonitor pakai closure; cara paling robust: detach dan re-attach
      // skip dulu untuk simplicity — kalau perlu, set di attachApiMonitor opts saat init
    };

    await use(monitor);

    if (testInfo.status === testInfo.expectedStatus) {
      if (STRICT) {
        monitor.assertClean();
      } else {
        const errors = monitor.getErrors();
        if (errors.length > 0) {
          console.warn(`[api-monitor warn] ${errors.length} API error di test "${testInfo.title}":`);
          errors.forEach((e) => console.warn(`  - ${e.method} ${e.status} ${e.url}`));
        }
      }
    }
  },
});

exports.expect = base.expect;
