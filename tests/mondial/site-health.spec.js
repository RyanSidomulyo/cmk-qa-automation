// @ts-check
const { test, expect } = require('../helpers/fixtures');
const {
  collectMeta,
  validateMeta,
  startThirdPartyTracker,
  startConsoleErrorTracker,
} = require('../helpers/site-health');

test.setTimeout(120000);

const CRITICAL_PAGES = [
  { name: 'Homepage',          url: '/' },
  { name: 'High Jewelry',      url: '/en/high-jewelry' },
  { name: 'Boutiques',         url: '/en/boutiques' },
  { name: 'Contact Us',        url: '/en/contacts' },
  { name: 'FAQ',               url: '/en/faq' },
];

const EXPECTED_TRACKERS = ['googleAnalytics'];

test.describe('Site Health — Mondial', () => {

  for (const pageInfo of CRITICAL_PAGES) {
    test(`SEO meta tags valid — ${pageInfo.name}`, async ({ page }) => {
      await page.goto(pageInfo.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForTimeout(1500);

      const meta = await collectMeta(page);
      console.log(`  Page  : ${pageInfo.name} (${pageInfo.url})`);
      console.log(`  Title : ${meta.title}`);
      console.log(`  Desc  : ${(meta.description || '').slice(0, 80)}...`);
      console.log(`  Canon : ${meta.canonical}`);
      console.log(`  OG Img: ${meta.ogImage}`);

      const issues = validateMeta(meta);
      if (issues.length > 0) {
        issues.forEach((i) => console.log(`  [WARN] ${i}`));
      }

      const critical = issues.filter((i) =>
        /Meta "title" kosong/.test(i) ||
        /Meta "description" kosong/.test(i) ||
        /Meta "canonical" kosong/.test(i)
      );
      if (critical.length > 0) {
        throw new Error(
          `SEO critical issue di ${pageInfo.name} (${page.url()}):\n` +
          critical.map((i) => '  - ' + i).join('\n')
        );
      }
    });
  }

  test('3rd party scripts load tanpa error', async ({ page }) => {
    const tracker = startThirdPartyTracker(page);
    const consoleErr = startConsoleErrorTracker(page);

    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(3000);

    const report = tracker.getReport();
    const consoleErrors = consoleErr.getErrors();
    tracker.detach();
    consoleErr.detach();

    console.log('\n  Tracker scripts yang ke-detect:');
    Object.entries(report.trackers).forEach(([name, info]) => {
      const status = info.loaded ? `loaded (${info.count}x)` : 'TIDAK LOAD';
      const worstNote = info.worstStatus >= 400 ? ` [worstStatus=${info.worstStatus}]` : '';
      console.log(`    ${name.padEnd(20)} : ${status}${worstNote}`);
    });

    const missing = EXPECTED_TRACKERS.filter((t) => !report.trackers[t]?.loaded);
    if (missing.length > 0) {
      throw new Error(`Tracker yang diharapkan TIDAK LOAD: ${missing.join(', ')}`);
    }

    if (report.errors.length > 0) {
      const detail = report.errors.map((e) => `  - [${e.tracker}] ${e.status} ${e.url}`).join('\n');
      throw new Error(`3rd party scripts error:\n${detail}`);
    }

    if (consoleErrors.length > 0) {
      console.log('\n  [WARN] Console errors saat load homepage:');
      consoleErrors.slice(0, 5).forEach((e) => console.log(`    - ${e.slice(0, 200)}`));
    }
  });

});
