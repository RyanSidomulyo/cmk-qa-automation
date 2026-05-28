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
- The Palace: **e-commerce penuh** (ada wishlist, cart, harga, product detail), URL produk `/product/[slug]` (singular)

---

## 🛠 Tech Stack

- **Test framework**: Playwright (JavaScript)
- **Browser**: Chromium (untuk speed)
- **Node.js**: v18+
- **CI/CD**: GitHub Actions (production), Mac cron (staging)
- **Email**: msmtp (local), dawidd6/action-send-mail (GitHub Actions)
- **Notification**: Email HTML report

---

## 📁 File Structure

```
/Users/ryansidomulyo/CMK/regress/
├── playwright.config.js          # 3 projects: frankco, mondial, thepalace
├── reporter.js                   # HTML email reporter (brand-aware)
├── package.json
├── .github/
│   └── workflows/
│       ├── qa-frankco-production.yml      # Frank & Co prod (tiap jam)
│       ├── qa-mondial-production.yml      # Mondial prod (tiap jam)
│       └── qa-thepalace-production.yml    # The Palace prod (PENDING)
├── run_tests.sh                              # Frank & Co staging cron
├── run_tests_frankco_production.sh           # Legacy (disabled)
└── tests/
    ├── ecomm/         # 13 Frank & Co specs
    ├── mondial/       # 7 Mondial specs
    └── thepalace/     # 5 The Palace specs
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

### The Palace (9 specs) — `tests/thepalace/`
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

**Disabled (legacy):** `run_tests_frankco_production.sh` — duplikat dengan GitHub Actions

Semua cron sudah aktif.

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

**Product detail URL pattern:**
- The Palace: `/product/[slug]` (singular)
- Frank & Co: `/products/[slug]` (plural)

### waitUntil convention
- **STAGING**: `'networkidle'` boleh dipakai (lebih stabil)
- **PRODUCTION**: SELALU pakai `'domcontentloaded'` (production punya script polling/widget yang bikin networkidle timeout)

### Timeout convention
- Test setup default: `test.setTimeout(180000)` (3 menit)
- Test berat (cek banyak halaman): `test.setTimeout(120000)` minimal
- `page.goto` timeout: 30-60 detik

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
- `/tmp/qa_email_body.html` — buat Mac cron

### Error message convention
Saat test fail, error message **WAJIB include detail aktionable** untuk developer:
- URL halaman yang bermasalah
- URL aset (gambar/file) yang broken
- Selisih waktu (untuk stale data)
- Action item ("Cek data feed harga emas — kemungkinan stale")

Reporter otomatis catat error message ke section "Yang perlu diperhatikan" di email.

---

## 🚀 Command Reference

### Run tests
```bash
# Run 1 brand staging
npx playwright test --project=thepalace --headed

# Run 1 spec specific
npx playwright test tests/thepalace/article.spec.js --project=thepalace --headed

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

### Phase 3: Quality Improvements (priority order)
1. ~~**UptimeRobot setup**~~ ✅ SELESAI
2. **Sentry untuk error tracking real-time** (gratis tier)
3. **API testing** pakai Playwright API mode (`request.get/post`)
4. **Lighthouse CI** untuk performance regression
5. **Visual regression** pakai Playwright `toHaveScreenshot()`
6. **Mobile viewport testing** (Pixel 5, iPhone 13)
7. **E2E user journey** (3-5 critical path per brand)

### Coverage Reality Check
Saat ini coverage ~20-25% dari ideal. Yang BELUM ter-cover:
- API/backend health
- Cross-browser testing
- Performance
- Accessibility
- Security
- Data integrity (harga konsisten list vs detail)
- Real-time monitoring

---

## 💡 Decision History

| Decision | Rationale | Date |
|---|---|---|
| Pakai Playwright (bukan Cypress/Selenium) | Multi-browser, fast, auto-wait, modern syntax | Awal project |
| GitHub Actions untuk production (bukan Mac cron) | Reliability 24/7, tidak depend on Mac | Recent |
| Mac cron HANYA untuk staging | Backup yang tidak critical, hemat resource | Recent |
| Pertahankan test yang fail untuk bug real | Email setiap run = reminder ke tim CMS/Dev | Recent |
| Threshold gold price: max 1 hari kemarin | Toleransi weekend/libur | Recent |
| Pakai `domcontentloaded` untuk production | `networkidle` timeout karena polling script di prod | Recent |
| Brand-aware reporter via env `BRAND` | 1 reporter handle semua brand, konsisten footer | Recent |

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

---

*Last updated: 28 Mei 2026*
*Generated dari conversation history Claude.ai*
