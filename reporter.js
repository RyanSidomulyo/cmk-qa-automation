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
    const endTime = new Date();
    const elapsed = ((endTime - this.startTime) / 1000).toFixed(1);
    const passed  = this.results.filter(r => r.status === 'passed').length;
    const failed  = this.results.filter(r => r.status === 'failed').length;
    const skipped = this.results.filter(r => r.status === 'skipped').length;
    const total   = this.results.length;
    const tanggal = this.startTime.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const waktu   = this.startTime.toLocaleTimeString('id-ID');
    const env     = process.env.TEST_ENV === 'production' ? 'Production' : 'Staging';
    const baseURL = process.env.TEST_ENV === 'production'
      ? 'frankandcojewellery.com'
      : 'staging.intra.frankandcojewellery.com';
    const isPass  = failed === 0;

    // ── Group results by suite ──────────────────────────────────────────────
    const suites = {};
    this.results.forEach(r => {
      const key = r.suite || 'Other';
      if (!suites[key]) suites[key] = [];
      suites[key].push(r);
    });

    // ── Collect failed & skipped ────────────────────────────────────────────
    const failedList  = this.results.filter(r => r.status === 'failed');
    const skippedList = this.results.filter(r => r.status === 'skipped');
    const needsAttention = [...failedList, ...skippedList];

    // ── Colors ─────────────────────────────────────────────────────────────
    const headerBg     = isPass ? '#0F6E56' : '#A32D2D';
    const headerLight  = isPass ? '#9FE1CB' : '#F7C1C1';
    const headerText   = isPass ? '#E1F5EE' : '#FCEBEB';
    const headerSub    = isPass ? '#5DCAA5' : '#F09595';
    const headerIcon   = isPass ? 'check-circle' : 'alert-circle';
    const headerLabel  = isPass ? 'All tests passed' : 'Ada test yang gagal';

    // ── Helper: badge ───────────────────────────────────────────────────────
    const badge = (status) => {
      if (status === 'failed')  return '<span style="font-size:11px;background:#FCEBEB;color:#A32D2D;padding:2px 8px;border-radius:99px;font-weight:500;">GAGAL</span>';
      if (status === 'skipped') return '<span style="font-size:11px;background:#F1EFE8;color:#5F5E5A;padding:2px 8px;border-radius:99px;font-weight:500;">SKIP</span>';
      return '<span style="font-size:11px;background:#EAF3DE;color:#3B6D11;padding:2px 8px;border-radius:99px;font-weight:500;">LULUS</span>';
    };

    const icon = (status) => {
      if (status === 'failed')  return '&#10006;';
      if (status === 'skipped') return '&#8212;';
      return '&#10003;';
    };

    const iconColor = (status) => {
      if (status === 'failed')  return '#E24B4A';
      if (status === 'skipped') return '#888780';
      return '#1D9E75';
    };

    const borderColor = (status) => {
      if (status === 'failed')  return '#E24B4A';
      if (status === 'skipped') return '#888780';
      return '#1D9E75';
    };

    // ── Suite summary row ───────────────────────────────────────────────────
    const suiteRows = Object.entries(suites).map(([name, tests]) => {
      const p = tests.filter(t => t.status === 'passed').length;
      const f = tests.filter(t => t.status === 'failed').length;
      const s = tests.filter(t => t.status === 'skipped').length;
      const ic = f > 0 ? '&#10006;' : '&#10003;';
      const icColor = f > 0 ? '#E24B4A' : '#1D9E75';
      let summary = p + '/' + tests.length + ' lulus';
      if (f > 0) summary += ' &middot; ' + f + ' gagal';
      if (s > 0) summary += ' &middot; ' + s + ' skip';
      const summaryColor = f > 0 ? '#A32D2D' : '#5F5E5A';
      return `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;border-radius:8px;background:#F1EFE8;margin-bottom:6px;">
          <div style="display:flex;align-items:center;gap:10px;">
            <span style="font-size:16px;color:${icColor};">${ic}</span>
            <span style="font-size:14px;color:#2C2C2A;">${name}</span>
          </div>
          <span style="font-size:13px;color:${summaryColor};">${summary}</span>
        </div>`;
    }).join('');

    // ── Attention cards ─────────────────────────────────────────────────────
    let attentionSection = '';
    if (needsAttention.length > 0) {
      const cards = needsAttention.map(r => {
        const rawErr = r.errors.length > 0
          ? r.errors[0].replace(/\x1b\[[0-9;]*m/g, '')
          : '';
        // Ambil semua baris error yang relevan (termasuk list 404)
        const errLines = rawErr.split('\n')
          .filter(l => l.trim() && !l.includes('at ') && !l.includes('expect(') && !l.includes('Expected') && !l.includes('Received'))
          .slice(0, 6)
          .map(l => l.trim())
          .join('<br>');
        const errMsg = errLines || (r.status === 'skipped' ? 'Test di-skip' : 'Test gagal');
        return `
          <div style="background:#ffffff;border-radius:8px;border-left:3px solid ${borderColor(r.status)};padding:12px 14px;margin-bottom:8px;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
              <span style="font-size:13px;font-weight:500;color:#2C2C2A;">${r.suite} &mdash; ${r.title}</span>
              ${badge(r.status)}
            </div>
            <p style="margin:0;font-size:12px;color:#5F5E5A;">${errMsg}</p>
          </div>`;
      }).join('');

      attentionSection = `
        <div style="padding:20px 28px;border-bottom:1px solid #D3D1C7;background:#FCEBEB;">
          <p style="margin:0 0 12px;font-size:13px;font-weight:500;color:#791F1F;text-transform:uppercase;letter-spacing:0.05em;">
            &#9888; Yang perlu diperhatikan
          </p>
          ${cards}
        </div>`;
    }

    // ── Detail per suite ────────────────────────────────────────────────────
    const detailSections = Object.entries(suites).map(([name, tests]) => {
      const rows = tests.map(t => {
        const dur = (t.duration / 1000).toFixed(1) + 's';
        return `
          <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid #F1EFE8;">
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="font-size:14px;color:${iconColor(t.status)};">${icon(t.status)}</span>
              <span style="font-size:13px;color:#2C2C2A;">${t.title}</span>
            </div>
            <div style="display:flex;align-items:center;gap:10px;">
              <span style="font-size:12px;color:#888780;">${dur}</span>
              ${badge(t.status)}
            </div>
          </div>`;
      }).join('');

      return `
        <div style="margin-bottom:20px;">
          <p style="margin:0 0 8px;font-size:13px;font-weight:500;color:#2C2C2A;padding-bottom:6px;border-bottom:2px solid ${failed > 0 ? '#E24B4A' : '#1D9E75'};">${name}</p>
          ${rows}
        </div>`;
    }).join('');

    // ── Full HTML ───────────────────────────────────────────────────────────
    const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:24px;background:#F1EFE8;font-family:Arial,sans-serif;">
<div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;border:1px solid #D3D1C7;overflow:hidden;">

  <div style="background:${headerBg};padding:24px 28px;">
    <p style="margin:0;font-size:13px;color:${headerLight};font-weight:400;">CMK QA Automation &mdash; ${env}</p>
    <p style="margin:4px 0 8px;font-size:20px;font-weight:bold;color:${headerText};">${headerLabel}</p>
    <p style="margin:0;font-size:13px;color:${headerSub};">${tanggal} &middot; ${waktu} WIB &middot; ${elapsed} detik</p>
  </div>

  <div style="padding:20px 28px;border-bottom:1px solid #D3D1C7;">
    <table style="width:100%;border-collapse:separate;border-spacing:8px;">
      <tr>
        <td style="background:#F1EFE8;border-radius:8px;padding:12px;text-align:center;">
          <p style="margin:0;font-size:12px;color:#5F5E5A;">Total</p>
          <p style="margin:4px 0 0;font-size:24px;font-weight:bold;color:#2C2C2A;">${total}</p>
        </td>
        <td style="background:#EAF3DE;border-radius:8px;padding:12px;text-align:center;">
          <p style="margin:0;font-size:12px;color:#3B6D11;">Lulus</p>
          <p style="margin:4px 0 0;font-size:24px;font-weight:bold;color:#27500A;">${passed}</p>
        </td>
        <td style="background:#FCEBEB;border-radius:8px;padding:12px;text-align:center;">
          <p style="margin:0;font-size:12px;color:#A32D2D;">Gagal</p>
          <p style="margin:4px 0 0;font-size:24px;font-weight:bold;color:#791F1F;">${failed}</p>
        </td>
        <td style="background:#F1EFE8;border-radius:8px;padding:12px;text-align:center;">
          <p style="margin:0;font-size:12px;color:#5F5E5A;">Skip</p>
          <p style="margin:4px 0 0;font-size:24px;font-weight:bold;color:#2C2C2A;">${skipped}</p>
        </td>
      </tr>
    </table>
  </div>

  ${attentionSection}

  <div style="padding:20px 28px;border-bottom:1px solid #D3D1C7;">
    <p style="margin:0 0 12px;font-size:13px;font-weight:bold;color:#5F5E5A;text-transform:uppercase;letter-spacing:0.05em;">Ringkasan per section</p>
    ${suiteRows}
  </div>

  <div style="padding:20px 28px;border-bottom:1px solid #D3D1C7;">
    <p style="margin:0 0 16px;font-size:13px;font-weight:bold;color:#5F5E5A;text-transform:uppercase;letter-spacing:0.05em;">Detail lengkap</p>
    ${detailSections}
  </div>

  <div style="padding:16px 28px;display:flex;align-items:center;justify-content:space-between;">
    <div>
      <p style="margin:0;font-size:12px;color:#5F5E5A;">Website</p>
      <p style="margin:0;font-size:13px;color:#2C2C2A;">${baseURL}</p>
    </div>
    <div style="text-align:right;">
      <p style="margin:0;font-size:12px;color:#5F5E5A;">CMK QA Automation</p>
      <p style="margin:0;font-size:13px;color:#5F5E5A;">Frank &amp; co. &middot; ${env}</p>
    </div>
  </div>

</div>
</body>
</html>`;

    // ── Write files ─────────────────────────────────────────────────────────
    fs.writeFileSync('qa-report.html', html);
    fs.writeFileSync('/tmp/qa_email_body.html', html);

    // ── Plain text fallback ─────────────────────────────────────────────────
    let text = 'CMK QA Automation Report\n';
    text += '='.repeat(50) + '\n';
    text += 'Tanggal : ' + tanggal + '\n';
    text += 'Waktu   : ' + waktu + '\n';
    text += 'Durasi  : ' + elapsed + ' detik\n';
    text += 'Status  : ' + (failed > 0 ? 'ADA TEST YANG GAGAL' : 'SEMUA TEST LULUS') + '\n';
    text += 'Total   : ' + total + ' | Lulus: ' + passed + ' | Gagal: ' + failed + ' | Skip: ' + skipped + '\n';
    if (needsAttention.length > 0) {
      text += '\nYANG PERLU DIPERHATIKAN:\n';
      needsAttention.forEach(r => {
        const err = r.errors.length > 0 ? r.errors[0].replace(/\x1b\[[0-9;]*m/g, '').split('\n')[0].slice(0, 100) : '';
        text += '  [' + r.status.toUpperCase() + '] ' + r.suite + ' - ' + r.title + '\n';
        if (err) text += '         ' + err + '\n';
      });
    }
    fs.writeFileSync('/tmp/qa_email_body.txt', text);
    console.log('Report tersimpan: qa-report.html');
    console.log('Email HTML tersimpan: /tmp/qa_email_body.html');
  }
}

module.exports = DetailedReporter;
