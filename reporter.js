const fs = require('fs');

class DetailedReporter {
  constructor() {
    this.results = [];
    this.startTime = new Date();
  }

  onTestEnd(test, result) {
    const lines = [];
    if (result.stdout) {
      result.stdout.forEach(chunk => {
        const text = typeof chunk === 'string' ? chunk : chunk.toString();
        lines.push(...text.split('\n').filter(l => l.trim()));
      });
    }
    this.results.push({
      title:    test.title,
      suite:    test.parent ? test.parent.title : '',
      status:   result.status,
      duration: result.duration,
      lines,
      errors:   result.errors ? result.errors.map(e => e.message) : [],
    });
  }

  onEnd(result) {
    const endTime  = new Date();
    const elapsed  = ((endTime - this.startTime) / 1000).toFixed(1);
    const passed   = this.results.filter(r => r.status === 'passed').length;
    const failed   = this.results.filter(r => r.status === 'failed').length;
    const skipped  = this.results.filter(r => r.status === 'skipped').length;
    const total    = this.results.length;
    const tanggal  = this.startTime.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const waktu    = this.startTime.toLocaleTimeString('id-ID');
    const status   = failed > 0 ? 'GAGAL' : 'LULUS';

    // ── Email text ──────────────────────────────────────────────────────────
    const sep = '='.repeat(50);
    const sep2 = '-'.repeat(40);
    let email = '';
    email += 'CMK QA Automation Report\n';
    email += sep + '\n';
    email += 'Tanggal  : ' + tanggal + '\n';
    email += 'Waktu    : ' + waktu + '\n';
    email += 'Durasi   : ' + elapsed + ' detik\n';
    email += 'Status   : ' + (failed > 0 ? 'ADA TEST YANG GAGAL' : 'SEMUA TEST LULUS') + '\n\n';
    email += 'Total    : ' + total + ' test\n';
    email += 'Lulus    : ' + passed + '\n';
    email += 'Gagal    : ' + failed + '\n';
    email += 'Skip     : ' + skipped + '\n';
    email += sep + '\n';

    const suites = {};
    for (const r of this.results) {
      if (!suites[r.suite]) suites[r.suite] = [];
      suites[r.suite].push(r);
    }

    for (const [suite, tests] of Object.entries(suites)) {
      email += '\n[' + suite + ']\n';
      email += sep2 + '\n';
      for (const t of tests) {
        const icon = t.status === 'passed' ? 'LULUS' : t.status === 'failed' ? 'GAGAL' : 'SKIP';
        email += '[' + icon + '] ' + t.title + ' (' + (t.duration / 1000).toFixed(1) + 's)\n';
        const urlLines = t.lines.filter(l =>
          l.includes('Klik') || l.includes('Hover') || l.includes('Cek') ||
          l.includes('[200]') || l.includes('[404]') || l.includes('[ERR]') ||
          l.includes('VISIBLE') || l.includes('NOT FOUND') || l.includes('Ringkasan')
        );
        for (const line of urlLines) {
          const isFail = line.includes('[404]') || line.includes('[ERR]') || line.includes('NOT FOUND');
          const prefix = isFail ? '   ❌ GAGAL: ' : '   ';
          email += prefix + line.trim() + '\n';
        }
        if (t.errors.length > 0 && t.status === 'failed') {
          email += '\n   ❌ URL YANG GAGAL:\n';
          const errLines = t.errors[0].split('\n').filter(l => l.trim());
          for (const el of errLines) {
            email += '   ' + el + '\n';
          }
        }
        email += '\n';
      }
    }

    email += sep + '\n';
    email += 'HTML Report: playwright-report/index.html\n';
    email += 'QA Report  : qa-report.html\n';

    fs.writeFileSync('/tmp/qa_email_body.txt', email);

    // ── HTML report ─────────────────────────────────────────────────────────
    let rows = '';
    for (const r of this.results) {
      const urlLines = r.lines.filter(l =>
        l.includes('Klik') || l.includes('Hover') || l.includes('Cek') ||
        l.includes('[200]') || l.includes('[404]') || l.includes('[ERR]') ||
        l.includes('VISIBLE') || l.includes('NOT FOUND') || l.includes('Ringkasan')
      );
      const statusColor = r.status === 'passed' ? '#22c55e' : r.status === 'failed' ? '#ef4444' : '#94a3b8';
      const statusLabel = r.status === 'passed' ? 'LULUS' : r.status === 'failed' ? 'GAGAL' : 'SKIP';
      const rowBg       = r.status === 'failed' ? '#fff5f5' : r.status === 'skipped' ? '#f8fafc' : '#ffffff';
      const urlContent  = urlLines.length > 0
        ? '<ul style="margin:6px 0 0 0;padding-left:16px;font-size:11px;color:#475569">'
          + urlLines.map(l => {
              const isFail = l.includes('[404]') || l.includes('[ERR]') || l.includes('NOT FOUND') || l.includes('✗');
              const color = isFail ? 'color:#ef4444;font-weight:600' : '';
              const icon  = isFail ? '❌ ' : '';
              return '<li style="margin:2px 0;' + color + '">' + icon + l.trim() + '</li>';
            }).join('')
          + '</ul>'
        : '';
      // Tampilkan error detail jika ada
      const errorDetail = r.errors.length > 0 && r.status === 'failed'
        ? '<div style="margin-top:8px;padding:8px 12px;background:#fee2e2;border-left:3px solid #ef4444;border-radius:4px;font-size:11px;color:#991b1b;white-space:pre-wrap">'
          + '<strong>❌ URL yang Gagal:</strong>\n' + r.errors[0].replace(/</g, '&lt;').replace(/>/g, '&gt;')
          + '</div>'
        : '';

      rows += '<tr style="background:' + rowBg + ';border-bottom:1px solid #e2e8f0">'
        + '<td style="padding:10px 12px;font-size:12px;color:#64748b">' + r.suite + '</td>'
        + '<td style="padding:10px 12px;font-size:13px">' + r.title + urlContent + errorDetail + '</td>'
        + '<td style="padding:10px 12px;text-align:center"><span style="background:' + statusColor + ';color:#fff;padding:3px 10px;border-radius:4px;font-size:11px;font-weight:600">' + statusLabel + '</span></td>'
        + '<td style="padding:10px 12px;text-align:center;font-size:12px;color:#64748b">' + (r.duration / 1000).toFixed(1) + 's</td>'
        + '</tr>';
    }

    const overallColor = failed > 0 ? '#ef4444' : '#22c55e';
    const overallLabel = failed > 0 ? 'ADA TEST GAGAL' : 'SEMUA LULUS';

    const html = '<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8"><title>CMK QA Report</title>'
      + '<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#f1f5f9}'
      + '.header{background:#1e293b;color:#f8fafc;padding:24px 32px}.header h1{font-size:20px;font-weight:700}.header p{font-size:13px;color:#94a3b8;margin-top:4px}'
      + '.container{max-width:1100px;margin:24px auto;padding:0 24px}'
      + '.cards{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:24px}'
      + '.card{background:#fff;border-radius:8px;padding:16px 20px;box-shadow:0 1px 3px rgba(0,0,0,.08);text-align:center}'
      + '.card .num{font-size:28px;font-weight:700}.card .lbl{font-size:12px;color:#64748b;margin-top:4px}'
      + '.section{background:#fff;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,.08);overflow:hidden}'
      + '.section-header{padding:14px 20px;font-weight:600;font-size:14px;border-bottom:1px solid #e2e8f0;background:#f8fafc}'
      + 'table{width:100%;border-collapse:collapse}th{background:#f1f5f9;padding:10px 12px;text-align:left;font-size:11px;text-transform:uppercase;color:#64748b;border-bottom:2px solid #e2e8f0}'
      + '.footer{text-align:center;padding:16px;font-size:12px;color:#94a3b8}</style></head><body>'
      + '<div class="header"><h1>CMK QA Automation Report</h1>'
      + '<p>' + tanggal + ' | ' + waktu + ' | Durasi: ' + elapsed + 's | <span style="background:' + overallColor + ';color:#fff;padding:2px 10px;border-radius:4px;font-size:12px">' + overallLabel + '</span></p></div>'
      + '<div class="container">'
      + '<div class="cards">'
      + '<div class="card"><div class="num">' + total + '</div><div class="lbl">Total Test</div></div>'
      + '<div class="card"><div class="num" style="color:#22c55e">' + passed + '</div><div class="lbl">Lulus</div></div>'
      + '<div class="card"><div class="num" style="color:#ef4444">' + failed + '</div><div class="lbl">Gagal</div></div>'
      + '<div class="card"><div class="num" style="color:#94a3b8">' + skipped + '</div><div class="lbl">Skip</div></div>'
      + '</div>'
      + '<div class="section"><div class="section-header">Detail Hasil Test — URL yang Diuji</div>'
      + '<table><thead><tr><th style="width:180px">Suite</th><th>Test &amp; URL yang Diuji</th><th style="width:90px;text-align:center">Status</th><th style="width:70px;text-align:center">Durasi</th></tr></thead>'
      + '<tbody>' + rows + '</tbody></table></div></div>'
      + '<div class="footer">CMK QA Automation — Frank &amp; Co Jewellery</div>'
      + '</body></html>';

    fs.writeFileSync('qa-report.html', html);
    console.log('\nReport tersimpan: qa-report.html');
    console.log('Email body tersimpan: /tmp/qa_email_body.txt\n');
  }
}

module.exports = DetailedReporter;
