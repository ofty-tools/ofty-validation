'use strict';
// G2-E harness: shared utilities. Copy of the G2-D common.cjs; utility functions unchanged. Changed: object roots (G2-E
// compares G2D-WV1 = PRE with G2E-WV1 = POST), frozen-input locations and the version table. Synthetic data only. Pages are served from 127.0.0.1; every other request is aborted.
// RELEASE-KIT ADAPTATION (G3-A, HADAPT-G3A-01; path bindings only, no change to capture, comparison or oracle logic):
//   Playwright is resolved from the kit's node_modules (or OFTY_PLAYWRIGHT_DIR); POST = <repository>/candidate (the released
//   G2-E source); PRE sources are not shipped: the PRE side is the archived PRE capture set in baseline_pre_captures/;
//   frozen inputs are read from tests/g2e_reproduction/frozen/. See ../HADAPT-G3A-01.md and common.cjs.diff.
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto'), http = require('node:http');
const G2E = path.resolve(__dirname, '..');                                // <repository>/tests/g2e_reproduction (the kit)
const SCR = path.resolve(G2E, '../..');                                   // <repository>
const PW = process.env.OFTY_PLAYWRIGHT_DIR || path.dirname(require.resolve('playwright/package.json', { paths: [G2E, path.resolve(G2E, '..')] }));
const G2D_PKG = null, G2C_PKG = null, G2B_PKG = null;                     // not shipped; their frozen inputs are copied into frozen/
const CLOCK_ISO = '2026-10-14T10:00:00.000Z';
const ROOTS = {
  PRE: null,                                                              // not shipped (G2D-WV1); use baseline_pre_captures/
  POST: path.join(SCR, 'candidate'),                                      // G2-E candidate as staged in this repository
};
const FROZEN = {
  G2E_EXP: path.join(G2E, 'frozen/G2E_EXPECTATIONS.json'),
  G2D_EXP: path.join(G2E, 'frozen/G2D_EXPECTATIONS.json'),
  G2C_REF: path.join(G2E, 'frozen/G2C_REFERENCE.json'),
  G2C_A02_REF: path.join(G2E, 'frozen/supplements_A02'),
  G2C_A03: path.join(G2E, 'frozen/supplements_A03'),
  G2B_EXP: path.join(G2E, 'frozen/G2B_EXPECTATIONS.json'),
};
const sha256 = b => crypto.createHash('sha256').update(b).digest('hex');
const now = () => new Date().toISOString();
const readJSON = p => JSON.parse(fs.readFileSync(p, 'utf8'));
function mkout(dir) { fs.mkdirSync(dir, { recursive: true }); return dir; }
function writeJSON(dir, name, value) { fs.writeFileSync(path.join(dir, name), JSON.stringify(value, null, 2), { flag: 'wx' }); }
function treeHashes(root) {
  const out = {};
  (function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else out[path.relative(root, p)] = sha256(fs.readFileSync(p)); } })(root);
  return out;
}
function countOcc(hay, needle) { if (!needle || hay == null) return 0; let n = 0, i = 0; while ((i = hay.indexOf(needle, i)) >= 0) { n++; i += needle.length; } return n; }
const norm = s => String(s).replace(/\s+/g, ' ').trim();
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.cjs': 'text/javascript; charset=utf-8', '.json': 'application/json', '.css': 'text/css' };
function serve(root) {
  const log = [];
  const srv = http.createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (p.endsWith('/')) p += 'index.html';
    const f = path.normalize(path.join(root, p));
    if (!f.startsWith(root + path.sep) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { log.push({ t: now(), p, status: 404 }); res.writeHead(404); return res.end('not found'); }
    const body = fs.readFileSync(f); log.push({ t: now(), p, status: 200, sha256: sha256(body) });
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); res.end(body);
  });
  return new Promise(r => srv.listen(0, '127.0.0.1', () => r({ origin: 'http://127.0.0.1:' + srv.address().port, log, close: () => new Promise(c => srv.close(c)) })));
}
async function launch() { const { chromium } = require(PW); return chromium.launch({ headless: true, args: ['--lang=en-GB'] }); }
async function context(browser, origin, opts = {}) {
  const ctx = await browser.newContext({ locale: 'en-GB', timezoneId: 'Europe/Madrid', serviceWorkers: 'block', viewport: { width: 1280, height: 1000 } });
  const events = { console: [], page_errors: [], aborted_external: [], network_failed: [] };
  await ctx.route('**/*', r => { const u = r.request().url(); if (u.startsWith(origin + '/')) return r.continue(); events.aborted_external.push(u); return r.abort(); });
  await ctx.addInitScript(({ iso, fix }) => {
    if (fix) { const N = Date; window.Date = class extends N { constructor(...a) { super(...(a.length ? a : [iso])); } static now() { return N.parse(iso); } }; }
    window.__g2bClipboard = [];
    try { Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: t => { window.__g2bClipboard.push(String(t)); return Promise.resolve(); }, readText: () => Promise.resolve(window.__g2bClipboard[window.__g2bClipboard.length - 1] || '') } }); } catch (e) { window.__g2bClipboardError = String(e); }
  }, { iso: CLOCK_ISO, fix: !!opts.fixClock });
  const watch = page => {
    page.on('console', m => events.console.push({ type: m.type(), text: m.text(), url: (m.location() || {}).url || null }));
    page.on('pageerror', e => events.page_errors.push(String(e)));
    page.on('requestfailed', rq => events.network_failed.push({ url: rq.url(), err: (rq.failure() || {}).errorText }));
  };
  ctx.on('page', watch);
  return { ctx, events, watch };
}
function productConsoleErrors(events, origin) {
  const externalFailed = new Set(events.network_failed.filter(f => !f.url.startsWith(origin + '/')).map(f => f.url));
  return events.console.filter(c => c.type === 'error').filter(c => !(/Failed to load resource/.test(c.text) && (externalFailed.size > 0) && (!c.url || !c.url.startsWith(origin + '/'))));
}
// Expected version strings per object (G2-E frozen plan).
const VERSIONS = {
  PRE: { m3_alg: '2.3.1', m3_ui: '2.6.1', m3_transport: 'gate2-m3-0.2.0', m4_alg: '1.3.1', semantic: 'gate2-semantic-0.3.1', m5_ui: 'v0.4.7-ui-aprime-staging-A1' },
  POST: { m3_alg: '2.3.1', m3_ui: '2.6.2', m3_transport: 'gate2-m3-0.2.1', m4_alg: '1.3.1', semantic: 'gate2-semantic-0.3.1', m5_ui: 'v0.4.8-ui-aprime-staging-A1' },
};
module.exports = { fs, path, sha256, now, readJSON, mkout, writeJSON, treeHashes, countOcc, norm, serve, launch, context, productConsoleErrors, ROOTS, FROZEN, G2E, G2D_PKG, G2C_PKG, G2B_PKG, SCR, CLOCK_ISO, PW, VERSIONS };
