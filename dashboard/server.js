/**
 * QA Dashboard Server
 * -------------------
 * UI lokal untuk trigger Playwright tests manual per brand & environment.
 *
 * Jalankan:
 *   npm run dashboard
 *   → buka http://localhost:4242
 *
 * Endpoint:
 *   GET  /                 → halaman dashboard (static)
 *   GET  /api/status       → status run sekarang per brand
 *   POST /api/run          → start run baru (body: { brand, env, spec? })
 *   GET  /api/stream/:id   → SSE stream log dari run
 *   POST /api/stop/:id     → stop run yang sedang jalan
 *   GET  /report           → serve qa-report.html terbaru
 *   GET  /report/:brand    → serve qa-report.html untuk brand tertentu
 *
 * Safety:
 *   - Hanya 1 run aktif per brand pada satu waktu
 *   - Brand & env divalidasi via whitelist (cegah command injection)
 *   - Spec path divalidasi must start with "tests/" dan tidak boleh "../"
 *   - Server bind ke localhost by default; pakai HOST=0.0.0.0 untuk LAN
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const crypto = require('crypto');

const PORT = parseInt(process.env.PORT || '4242', 10);
const HOST = process.env.HOST || '127.0.0.1';
const REGRESS_ROOT = path.resolve(__dirname, '..');

const BRANDS = ['frankco', 'mondial', 'thepalace'];
const ENVS = ['staging', 'production'];

const BRAND_LABEL = {
  frankco:   'Frank & Co',
  mondial:   'Mondial',
  thepalace: 'The Palace',
};

// In-memory state: brand -> { id, proc, env, spec, startedAt, status, logs[], lastExitCode }
const runs = {};
BRANDS.forEach((b) => (runs[b] = null));

const history = []; // global history (max 50 entries)

function isValidSpec(spec) {
  if (!spec) return true; // optional
  if (typeof spec !== 'string') return false;
  if (spec.includes('..')) return false;
  if (!spec.startsWith('tests/')) return false;
  if (!/^tests\/[a-z0-9_./-]+\.spec\.js$/i.test(spec)) return false;
  return true;
}

function getAvailableSpecs(brand) {
  const dirMap = { frankco: 'ecomm', mondial: 'mondial', thepalace: 'thepalace' };
  const subdir = dirMap[brand];
  const fullDir = path.join(REGRESS_ROOT, 'tests', subdir);
  try {
    return fs
      .readdirSync(fullDir)
      .filter((f) => f.endsWith('.spec.js'))
      .map((f) => `tests/${subdir}/${f}`);
  } catch {
    return [];
  }
}

function startRun({ brand, env, spec }) {
  if (!BRANDS.includes(brand)) throw new Error(`Invalid brand: ${brand}`);
  if (!ENVS.includes(env)) throw new Error(`Invalid env: ${env}`);
  if (!isValidSpec(spec)) throw new Error(`Invalid spec path: ${spec}`);
  if (runs[brand]) throw new Error(`Run untuk brand ${brand} masih aktif`);

  const id = crypto.randomBytes(6).toString('hex');
  const args = ['playwright', 'test', `--project=${brand}`];
  if (spec) args.push(spec);

  const childEnv = {
    ...process.env,
    TEST_ENV: env,
    BRAND: brand,
    // CI-like behavior: no headed mode, no open browser
    CI: '1',
  };

  console.log(`[dashboard] start run id=${id} brand=${brand} env=${env} spec=${spec || '(all)'}`);

  const proc = spawn('npx', args, {
    cwd: REGRESS_ROOT,
    env: childEnv,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  const state = {
    id,
    brand,
    env,
    spec: spec || null,
    startedAt: new Date().toISOString(),
    endedAt: null,
    status: 'running',
    exitCode: null,
    logs: [],
    listeners: new Set(),
  };

  const pushLog = (line) => {
    const entry = { t: Date.now(), line };
    state.logs.push(entry);
    if (state.logs.length > 5000) state.logs.shift();
    for (const send of state.listeners) {
      try { send('log', entry); } catch { /* listener gone */ }
    }
  };

  const onData = (buf) => {
    const text = buf.toString('utf8');
    text.split(/\r?\n/).forEach((line) => {
      if (line.length > 0) pushLog(line);
    });
  };

  proc.stdout.on('data', onData);
  proc.stderr.on('data', onData);

  proc.on('close', (code) => {
    state.status = code === 0 ? 'passed' : 'failed';
    state.exitCode = code;
    state.endedAt = new Date().toISOString();
    pushLog(`\n[dashboard] selesai, exit code=${code}, status=${state.status}`);
    for (const send of state.listeners) {
      try { send('end', { status: state.status, exitCode: code }); } catch { /* listener gone */ }
    }
    state.listeners.clear();
    runs[brand] = null;
    history.unshift({
      id, brand, env, spec: state.spec,
      startedAt: state.startedAt, endedAt: state.endedAt,
      status: state.status, exitCode: code,
    });
    if (history.length > 50) history.pop();
    console.log(`[dashboard] run done id=${id} brand=${brand} status=${state.status}`);
  });

  state.proc = proc;
  runs[brand] = state;
  return state;
}

function stopRun(brand) {
  const state = runs[brand];
  if (!state) return false;
  try {
    state.proc.kill('SIGTERM');
    setTimeout(() => { try { state.proc.kill('SIGKILL'); } catch {} }, 3000);
  } catch (e) {
    console.warn('[dashboard] stop error:', e.message);
  }
  return true;
}

// ────────────────────────────────────────────────────────────────────────────
// HTTP app
// ────────────────────────────────────────────────────────────────────────────
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/config', (req, res) => {
  const specsPerBrand = {};
  BRANDS.forEach((b) => (specsPerBrand[b] = getAvailableSpecs(b)));
  res.json({
    brands: BRANDS.map((b) => ({ id: b, label: BRAND_LABEL[b] })),
    envs: ENVS,
    specs: specsPerBrand,
  });
});

app.get('/api/status', (req, res) => {
  const snapshot = {};
  BRANDS.forEach((b) => {
    const s = runs[b];
    snapshot[b] = s
      ? {
          id: s.id, status: s.status, env: s.env, spec: s.spec,
          startedAt: s.startedAt, logsCount: s.logs.length,
        }
      : null;
  });
  res.json({ runs: snapshot, history: history.slice(0, 20) });
});

app.post('/api/run', (req, res) => {
  const { brand, env, spec } = req.body || {};
  try {
    const state = startRun({ brand, env, spec });
    res.json({ ok: true, id: state.id });
  } catch (e) {
    res.status(400).json({ ok: false, error: e.message });
  }
});

app.post('/api/stop/:brand', (req, res) => {
  const ok = stopRun(req.params.brand);
  res.json({ ok });
});

app.get('/api/stream/:id', (req, res) => {
  const id = req.params.id;
  const state = BRANDS.map((b) => runs[b]).find((s) => s && s.id === id);

  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders?.();

  if (!state) {
    // Check history
    const old = history.find((h) => h.id === id);
    if (old) {
      res.write(`event: end\ndata: ${JSON.stringify(old)}\n\n`);
    } else {
      res.write(`event: error\ndata: ${JSON.stringify({ error: 'Run tidak ditemukan' })}\n\n`);
    }
    return res.end();
  }

  // Backfill existing logs
  state.logs.forEach((entry) => {
    res.write(`event: log\ndata: ${JSON.stringify(entry)}\n\n`);
  });

  const send = (event, payload) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`);
  };
  state.listeners.add(send);

  // Heartbeat tiap 15 detik
  const hb = setInterval(() => {
    res.write(': hb\n\n');
  }, 15000);

  req.on('close', () => {
    clearInterval(hb);
    state.listeners.delete(send);
  });
});

app.get('/report', (req, res) => {
  const file = path.join(REGRESS_ROOT, 'qa-report.html');
  if (!fs.existsSync(file)) return res.status(404).send('Belum ada qa-report.html');
  res.sendFile(file);
});

// Playwright HTML report
app.use('/playwright-report', express.static(path.join(REGRESS_ROOT, 'playwright-report')));

app.listen(PORT, HOST, () => {
  console.log(`\n  🚀 QA Dashboard ready`);
  console.log(`     Local:   http://localhost:${PORT}`);
  if (HOST === '0.0.0.0') {
    console.log(`     LAN:     http://<mac-ip>:${PORT}`);
  } else {
    console.log(`     LAN:     set HOST=0.0.0.0 untuk akses dari device lain\n`);
  }
});
