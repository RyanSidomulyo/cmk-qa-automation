# CMK QA Automation — Project Context

> File ini adalah konteks lengkap project untuk Claude Code. **Baca dulu sebelum mengerjakan task apapun.**

---

## 👤 User Profile

**Ryan Sidomulyo** — QA Engineer di CMK (Central Mega Kencana)
- Mac (macOS), zsh shell
- Project path: `/Users/ryansidomulyo/CMK/regress/`
- GitHub repo: `https://github.com/RyanSidomulyo/cmk-qa-automation` (private)
- Branch utama: `main`

**Email contacts:**
- Sender / staging recipient: `sidomulyo784@gmail.com`
- Production recipient: `erzipaul25@gmail.com`
- Additional production recipient: `hansen@centralmegakencana.com`

**Komunikasi preference:** Bahasa Indonesia, concise, langsung action. Tidak perlu intro panjang.

---

## 🏢 Brand yang di-cover

CMK punya beberapa brand jewelry yang di-test:

| Brand | Project Name | Staging URL | Production URL | Bahasa |
|---|---|---|---|---|
| Frank & Co | `frankco` | `staging.intra.frankandcojewellery.com` | `frankandcojewellery.com` | EN |
| Mondial | `mondial` | `staging.intra.mondialjeweler.com` | `mondialjeweler.com` | EN/ID |
| The Palace | `thepalace` | `staging.intra.thepalacejeweler.com` | `thepalacejeweler.com` | ID |
| DMS Admin | (belum) | TBD | TBD | EN |

**Karakteristik per brand:**
- Frank & Co: katalog jewelry, tidak ada e-commerce penuh
- Mondial: high jewelry, brand premium
- The Palace: **e-commerce penuh** (ada wishlist, cart, harga, product detail, checkout), URL produk `/product/[slug]` (singular)

---

## 🛠 Tech Stack

- **Test framework**: Playwright (JavaScript)
- **Browser**: Chromium (untuk speed)
- **Node.js**: v18+
- **CI/CD**: GitHub Actions (production), Mac cron (staging)
- **Email**: msmtp (local), dawidd6/action-send-mail (GitHub Actions)
- **Notification**: Email HTML report
- **Uptime monitoring**: UptimeRobot (production 3 domain, notify ke 2 email)
- **Error tracking**: Sentry (sudah terpasang di thepalacejeweler.com — lihat bagian Monitoring)

---

## 📁 File Structure

```
/Users/ryansidomulyo/CMK/regress/
├── playwright.config.js               # 3 projects: frankco, mondial, thepalace
├── reporter.js                        # HTML email reporter (brand-aware) + qa_state.json
├── package.json
├── scripts/
│   └── should_send_email.sh           # Email dedup decision (shared 3 brand workflows)
├── .github/
│   └── workflows/
│       ├── qa-frankco-production.yml      # Frank & Co prod (tiap jam, dedup aktif)
│       ├── qa-mondial-production.yml      # Mondial prod (tiap jam, dedup aktif)
│       └── qa-thepalace-production.yml    # The Palace prod (tiap jam, dedup aktif)
├── run_tests.sh                           # Frank & Co staging cron
├── run_tests_mondial_staging.sh           # Mondial staging cron
├── run_tests_thepalace_staging.sh         # The Palace staging cron
├── run_tests_frankco_production.sh        # Legacy (disabled)
└── tests/
    ├── helpers/
    │   ├── page-checker.js                # Validasi halaman tidak 404/error
    │   └── api-monitor.js                 # API smoke monitor (opt-in per spec)
    ├── ecomm/         # 13 Frank & Co specs
    ├── mondial/       # 7 Mondial specs
    └── thepalace/     # 10 The Palace specs
```

---

## 📋 Spec Inventory

### Frank & Co (13 specs) — `tests/ecomm/`
SELESAI ✅ Production + Staging
- navigation, frank-fire, high-jewellery, love-commitment, mens, stories
- about-us, contact-us, diamond-education, size-guide, faq, store-locations, product-detail

### Mondial (7 specs) — `tests/mondial/`
SELESAI ✅ Production + Staging
- navigation, high-jewelry, boutique-locations, contact-us, faq, terms, stories

### The Palace (10 specs) — `tests/thepalace/`
SELESAI ✅ Production + Staging
- ✅ navigation.spec.js (6 tests)
- ✅ collection.spec.js (7 tests)
- ✅ article.spec.js (5 tests)
- ✅ product-category.spec.js (11 tests) — includes filter + product detail + 15 submenu check
- ✅ gold-price.spec.js (3 tests)
- ✅ boutique-locations.spec.js (5 tests)
- ✅ faq.spec.js (4 tests)
- ✅ about.spec.js (6 tests)
- ✅ legal.spec.js (6 tests)
- ✅ checkout.spec.js (5 tests) — E2E: login OTP → add to cart → cart drawer → info pengiriman → checkout

---

## 🚨 Known Bugs (laporkan ke developer)

### Frank & Co
- **Production**: Princess Candy 404
- **Staging**: Frank Sacred 404, For Him 404, Wishlist 404, Language ID 404

### Mondial
- **Staging**: ENCHANTALES (`/en/collections/enchantales`) → 500 Server Error
- **Staging**: `/en/terms` ERR_CONNECTION_RESET intermittent (sudah pakai `gotoWithRetry()` helper)

### The Palace
- **Staging — gambar broken**: `/article/lorem-ipsum`
  - Alt: `sadfsaefsdf`
  - URL: `bucket-staging-digitalteam.oss-ap-southeast-5.aliyuncs.com/thepalace/articles/058eb153-5b4e-4138-a973-3279b01a5f81.png`
- **Production — gambar broken**: `/article/mengenal-karat-emas-ini-cara-menghitung-kemurnian`
  - URL: `bucket-digitalteam.oss-ap-southeast-5.aliyuncs.com/thepalace/articles/93258a3f-d483-4b27-9767-ae29034fd10d.jpeg`
- **Staging & Production — halaman kosong** (laporkan ke tim CMS):
  - `/selection-for/pria` → 0 produk
  - `/selection-for/couple` → 0 produk
  - `/selection-for/baby` → 0 produk
  - `/moments/graduation` → 0 produk
- **Production — gold price modal**: Klik "LIHAT DETAIL" tidak menampilkan modal
- **Production — gold price stale**: "Terakhir diperbarui" lebih dari 1 hari

---

## ⚙️ Automation Schedule

### GitHub Actions (cloud, 24/7)
| Workflow | Brand | Env | Frekuensi |
|---|---|---|---|
| `qa-frankco-production.yml` | Frank & Co | Production | Setiap jam |
| `qa-mondial-production.yml` | Mondial | Production | Setiap jam |
| `qa-thepalace-production.yml` | The Palace | Production | Setiap jam |

**Secrets di GitHub:**
- `GMAIL_USER`
- `GMAIL_APP_PASSWORD`

### Mac cron (lokal, hanya saat Mac nyala)
| Schedule | Script | Brand | Env |
|---|---|---|---|
| `0 8 * * 1-5` | `run_tests.sh` | Frank & Co | Staging |
| `30 8 * * 1-5` | `run_tests_mondial_staging.sh` | Mondial | Staging |
| `0 9 * * 1-5` | `run_tests_thepalace_staging.sh` | The Palace | Staging |

**Disabled (legacy):** `run_tests_frankco_production.sh` — duplikat dengan GitHub Actions

---

## 🔍 External Monitoring

### UptimeRobot (uptime monitoring — production)
- **Monitor**: `https://thepalacejeweler.com`, `https://frankandcojewellery.com`, `https://mondialjeweler.com`
- **Interval**: 5 menit
- **Notifikasi**: `hansen@centralmegakencana.com` + `erzipaul25@gmail.com`
- **Catatan**: Staging `.intra.` tidak bisa dimonitor UptimeRobot (private network) — gunakan Playwright cron untuk staging

### Sentry (JavaScript error tracking)
- **Status**: Sudah terpasang di `thepalacejeweler.com` oleh developer
- **Endpoint**: `/sentry-tunnel` (proxy untuk bypass ad-blocker)
- **Organization ID**: `4510033077010432`
- **Project ID**: `4510033089855488`
- **Region**: US
- **Akses dashboard**: Minta invite dari developer ke `sentry.io`
- **Catatan**: Sentry dipasang di source code website (bukan Playwright). QA perlu akses dashboard untuk lihat error dan setup alert.

---

## 🔐 Test Accounts

### The Palace Staging
- **Nomor HP**: `82291349125` (tanpa leading 0, karena form sudah tampilkan `+62`)
- **OTP**: Auto-terisi di staging (tidak perlu input manual)
- **Alamat tersimpan**: "rumah | budi" — Makassar
- **Dipakai di**: `checkout.spec.js`

---

## 🎯 Design Patterns & Conventions

### Selectors yang umum dipakai

**Product card (The Palace):**
```javascript
// Product card di category page (TIDAK ada <a> wrapper, navigate via React onClick)
const cards = await page.locator('div.group:has(img):has(h2)').all();
await cards[0].click(); // klik untuk masuk detail
```

**Filter button (The Palace):**
```javascript
const filterBtn = page.locator('button:has(span:text-is("Harga"))').first();
await filterBtn.click();
const expanded = await filterBtn.getAttribute('aria-expanded'); // 'true' kalau terbuka
```

**Article card:**
```javascript
const cards = await page.locator('a[href^="/article/"]').all();
```

**Cart icon di navigasi (The Palace):**
```javascript
const cartBtn = page.locator('button[aria-label="Shopping cart"]').first();
// Ada 2 cart button (desktop + mobile), pakai .first()
```

**Cart drawer:**
```javascript
const cartDrawer = page.locator('[data-slot="sheet-content"]');
await cartDrawer.waitFor({ state: 'visible', timeout: 15000 });
```

**Add to cart button (The Palace product detail):**
```javascript
// Ada 2 button (desktop hidden md:flex + mobile md:hidden), .first() ambil desktop
const addToCartBtn = page.locator('button[data-slot="button"]')
  .filter({ hasText: 'Masukan ke Keranjang' }).first();
```

**Product detail URL pattern:**
- The Palace: `/product/[slug]` (singular)
- Frank & Co: `/products/[slug]` (plural)

### E2E Test Patterns (The Palace checkout)

**Login dengan OTP staging:**
```javascript
// Phone tanpa leading 0 karena form sudah tampilkan +62
const PHONE = '82291349125';

// OTP auto-terisi di staging
await page.waitForFunction(() => {
  const inputs = document.querySelectorAll('input[maxlength="1"]');
  return inputs.length === 6 && Array.from(inputs).every(el => el.value.length > 0);
}, { timeout: 30000 });
await page.locator('button[data-slot="button"]').filter({ hasText: 'Kirim' }).click();
```

**StorageState untuk berbagi sesi antar test:**
```javascript
const STORAGE_PATH = '/tmp/thepalace-checkout-auth.json';

// Pastikan file ada sebelum test.use() dibaca
if (!fs.existsSync(STORAGE_PATH)) {
  fs.writeFileSync(STORAGE_PATH, JSON.stringify({ cookies: [], origins: [] }));
}

// Login sekali di beforeAll, reuse di semua test
test.beforeAll(async ({ browser }) => {
  const isValid = fs.existsSync(STORAGE_PATH) &&
    (Date.now() - fs.statSync(STORAGE_PATH).mtimeMs) < 15 * 60 * 1000 &&
    JSON.parse(fs.readFileSync(STORAGE_PATH, 'utf8')).cookies?.length > 0;
  if (!isValid) {
    // do login, save state
    await context.storageState({ path: STORAGE_PATH });
  }
});
test.use({ storageState: STORAGE_PATH });
```

**Serial mode untuk E2E yang butuh shared state:**
```javascript
test.describe.configure({ mode: 'serial' });
// Mencegah: parallel tests login bersamaan → rate limit OTP staging
```

**Cart drawer tidak selalu auto-buka — fallback ke cart icon:**
```javascript
await addToCartBtn.click();
await page.waitForTimeout(2000);
const isAutoOpen = await cartDrawer.isVisible().catch(() => false);
if (!isAutoOpen) {
  // Buka manual via cart icon
  await page.locator('button[aria-label="Shopping cart"]').first().click();
}
await cartDrawer.waitFor({ state: 'visible', timeout: 15000 });
```

**Submit button yang ambigu di login page:**
```javascript
// Ada 2 button[type="submit"] (login form + gold price widget)
await page.locator('button[type="submit"]').filter({ hasText: 'Masuk' }).click();
```

### waitUntil convention
- **STAGING**: `'networkidle'` boleh dipakai (lebih stabil)
- **PRODUCTION**: SELALU pakai `'domcontentloaded'` (production punya script polling/widget yang bikin networkidle timeout)

### Retries convention
Di-set otomatis di `playwright.config.js` berdasarkan env:
- **PRODUCTION**: `retries: 2` — bug nyata gagal 2x, flake network ter-absorb
- **STAGING**: `retries: 1` — feedback cepat, flake ditoleransi manual

### User Agent convention
Default UA Chromium di-append marker `PlaywrightQA/1.0` (di-set di `playwright.config.js`).
- Tujuan: filter traffic Playwright di GA4 supaya tidak polusi data analytics
- Setup GA4 filter: Admin → Data Settings → Data Filters → Exclude `user_agent contains "PlaywrightQA"`

### Timeout convention
- Test setup default: `test.setTimeout(180000)` (3 menit)
- Test E2E (banyak step): `test.setTimeout(180000)` wajib
- `page.goto` timeout: 30-60 detik

### API Smoke Monitor
Helper `tests/helpers/api-monitor.js` — pasif dengar response, fail kalau ada 5xx
di endpoint `/api/`, `/graphql`, `/_next/data/`. Auto-ignore Sentry/GA/GTM/asset.

**Cara pakai (opt-in per spec):**
```javascript
const { attachApiMonitor } = require('../helpers/api-monitor');

test.beforeEach(async ({ page }, testInfo) => {
  testInfo.apiMon = attachApiMonitor(page, testInfo);
});
test.afterEach(async ({}, testInfo) => {
  // Hanya assert kalau test utama lulus (jangan timpa root cause asli)
  if (testInfo.status === testInfo.expectedStatus) {
    testInfo.apiMon?.assertClean();
  }
});
```

**Sudah aktif di:** `tests/thepalace/checkout.spec.js` (pilot)

Tambah `ignorePatterns: [/regex/]` di `attachApiMonitor()` kalau ada false positive
endpoint pihak ketiga yang non-critical.

### Reporter behavior
File `reporter.js` brand-aware via env `BRAND`:
- `BRAND=frankco` → footer "Frank & co."
- `BRAND=mondial` → footer "Mondial"
- `BRAND=thepalace` → footer "The Palace"
- Default fallback: `frankco`

Output files (di workspace setelah run):
- `qa-report.html` — full report
- `qa_email_body.html` — buat GitHub Actions email
- `qa_email_body.txt` — plain text fallback
- `qa_state.json` — state untuk email dedup (status + failureHash + timestamp)
- `/tmp/qa_email_body.html` — buat Mac cron

### Email Deduplication (GitHub Actions production)
Tiap workflow production sekarang pakai `scripts/should_send_email.sh` untuk
suppress email duplikat. Logika:

| Skenario | Aksi |
|---|---|
| First run / no cache state | SEND |
| Status berubah (pass↔fail) | SEND (alert / recovery) |
| Hash failure berubah (bug baru) | SEND |
| Hash sama, < `MAX_QUIET_HOURS` (default 6 jam) | SKIP |
| Hash sama, ≥ `MAX_QUIET_HOURS` | SEND (digest reminder) |

**Mekanisme:**
- `reporter.js` emit `qa_state.json` dengan SHA256 signature dari failure (title + 1st error line, di-normalize)
- Workflow simpan state di GitHub Actions cache (`actions/cache@v4`)
- Run berikutnya restore cache, bandingkan via `scripts/should_send_email.sh`
- Field `lastEmailedAt` di-stamp HANYA saat email beneran terkirim → digest timer akurat

**Tuning `MAX_QUIET_HOURS`:** edit di workflow YAML (env var) per brand bila perlu.

### Error message convention
Saat test fail, error message **WAJIB include detail aktionable** untuk developer:
- URL halaman yang bermasalah
- URL aset (gambar/file) yang broken
- Selisih waktu (untuk stale data)
- Action item ("Cek data feed harga emas — kemungkinan stale")

Reporter otomatis catat error message ke section "Yang perlu diperhatikan" di email.
Error message juga jadi input failureHash — pastikan stabil antar run (jangan
include timestamp/random ID; reporter sudah auto-normalize angka panjang).

---

## 🚀 Command Reference

### Run tests
```bash
# Run 1 brand staging
npx playwright test --project=thepalace --headed

# Run 1 spec specific
npx playwright test tests/thepalace/checkout.spec.js --project=thepalace --headed

# Run dengan grep (sub-set test)
npx playwright test --project=thepalace --grep "Gambar"

# Production mode
TEST_ENV=production BRAND=thepalace npx playwright test --project=thepalace
```

### Git workflow
```bash
git status
git add <files>
git commit -m "message"
git push
```

### Crontab
```bash
crontab -l       # lihat cron
crontab -e       # edit cron
```

---

## 🗺 Roadmap

### Phase 1: Spec Coverage ✅ SELESAI
- [x] Selesaikan The Palace remaining specs (lokasi, FAQ, tentang, terms, privacy)
- [x] Setup GitHub Actions The Palace production
- [x] Setup cron staging Mondial + The Palace

### Phase 2: DMS Admin Testing
- Login, role-based access, create product, edit harga, publish artikel

### Phase 3: Quality Improvements
1. ~~**UptimeRobot setup**~~ ✅ SELESAI — 3 monitor production, notify 2 email
2. **Sentry dashboard access** — Sudah terpasang di website, perlu minta akses dari developer
3. ~~**API testing**~~ ✅ SELESAI (pasif) — `api-monitor.js` helper, pilot di `checkout.spec.js`
4. ~~**E2E user journey The Palace**~~ ✅ SELESAI — checkout.spec.js (login → cart → checkout)
5. ~~**GA4 filter Playwright traffic**~~ ✅ SELESAI (sisi automation) — UA marker `PlaywrightQA/1.0` di-set; tinggal aktifkan filter di GA4 dashboard
6. ~~**Email deduplication**~~ ✅ SELESAI — failureHash + cache, suppress noise saat bug menetap
7. **Lighthouse CI** untuk performance regression
8. **Visual regression** pakai Playwright `toHaveScreenshot()`
9. **Mobile viewport testing** (Pixel 5, iPhone 13) — di-skip karena effort tinggi
10. **E2E user journey Frank & Co & Mondial** — belum ada (tidak ada e-commerce penuh)
11. **Rollout API monitor ke spec lain** — setelah pilot checkout stabil (navigation, product-category)

### Coverage Reality Check
Saat ini coverage ~30% dari ideal. Yang BELUM ter-cover:
- API/backend health
- Cross-browser testing
- Performance (Lighthouse)
- Accessibility
- Security
- Data integrity (harga konsisten list vs detail)
- GA4 analytics quality (Playwright traffic tidak di-filter)

---

## 💡 Decision History

| Decision | Rationale | Date |
|---|---|---|
| Pakai Playwright (bukan Cypress/Selenium) | Multi-browser, fast, auto-wait, modern syntax | Awal project |
| GitHub Actions untuk production (bukan Mac cron) | Reliability 24/7, tidak depend on Mac | Mei 2026 |
| Mac cron HANYA untuk staging | Backup yang tidak critical, hemat resource | Mei 2026 |
| Pertahankan test yang fail untuk bug real | Email setiap run = reminder ke tim CMS/Dev | Mei 2026 |
| Threshold gold price: max 1 hari kemarin | Toleransi weekend/libur | Mei 2026 |
| Pakai `domcontentloaded` untuk production | `networkidle` timeout karena polling script di prod | Mei 2026 |
| Brand-aware reporter via env `BRAND` | 1 reporter handle semua brand, konsisten footer | Mei 2026 |
| Retries: prod 2, staging 1 | Bug nyata gagal 2x; flake network ter-absorb di prod | Mei 2026 |
| Marker `PlaywrightQA/1.0` di user agent | Filter traffic Playwright di GA4 supaya analytics bersih | Mei 2026 |
| API smoke monitor pasif (helper) | Tambah coverage backend health tanpa spec API terpisah | Mei 2026 |
| Email dedup via failureHash + cache | Reduce 72 email/hari → ~12 email/hari saat ada bug menetap | Mei 2026 |
| UptimeRobot HANYA untuk production | Staging pakai `.intra.` = private network, tidak bisa diakses dari luar | Mei 2026 |
| Skip Sentry setup dari sisi QA | Sentry sudah terpasang oleh developer, QA cukup minta akses dashboard | Mei 2026 |
| E2E checkout pakai `storageState` + `beforeAll` | Login 1x untuk semua test — hindari rate limit OTP staging saat parallel run | Mei 2026 |
| E2E test pakai `mode: 'serial'` | Mencegah parallel login ke akun yang sama → rate limit OTP staging | Mei 2026 |
| Fallback buka cart via cart icon (bukan auto-open) | Cart drawer tidak selalu auto-buka setelah add to cart | Mei 2026 |
| Mobile viewport di-skip | Selector desktop-only, effort fix terlalu tinggi untuk nilai yang didapat | Mei 2026 |

---

## 🎨 Code Style

- **Bahasa**: JavaScript (bukan TypeScript)
- **String concat**: lebih sering pakai `+` daripada template literal (legacy)
- **Test description**: Bahasa Indonesia, deskriptif
- **Console log format**: indented dengan 2 space, `[OK]` atau `→` prefix
- **Error message**: include action item untuk developer

Contoh format console log standar:
```
  → Banner: Gold/SNI (/product?...) → ✓
  [OK] Semua banner koleksi tampil
  Ringkasan: 5/5 banner OK
```

---

## 📌 IMPORTANT Notes untuk Claude Code

1. **JANGAN ubah behavior test yang sudah dikonfirmasi sebagai bug real** — biarkan fail sebagai reminder
2. **SELALU verifikasi selector dulu** sebelum buat test baru — minta user kirim HTML element
3. **Production = `domcontentloaded`, Staging = bisa `networkidle`** — jangan terbalik
4. **Brand-aware**: setiap run production, set `BRAND=<brand>` env
5. **File output di workspace** — bukan `/tmp/` saja (GitHub Actions tidak punya `/tmp/`)
6. **Komunikasi**: Bahasa Indonesia, concise, langsung ke action
7. **E2E test The Palace**: gunakan `storageState` + `beforeAll` + `mode: 'serial'` — jangan login di tiap test
8. **Phone number untuk login staging**: `82291349125` (TANPA leading 0) — form sudah tampilkan `+62`
9. **Cart drawer tidak auto-buka** setelah add to cart — selalu sediakan fallback klik cart icon

---

*Last updated: 28 Mei 2026*
*Generated dari conversation history Claude Code*
