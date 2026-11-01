'use strict';
// G3-B P2/P3/P4 navigation and no-tracking test (frozen before any G3-B change).
// Serves <tree>/candidate over HTTP on 127.0.0.1, records every browser request (localhost and other), and checks:
//  P2: GET /index.html -> 200; the index contains the five required relative links; each resolves (HTTP 200) and
//      opens the expected module page (title check); the optional orchestrator alias, if linked, reaches gate2.
//  P3: from M1-M4, the existing back link ../index.html (module files unchanged) returns to the new index.
//  P4: loading the new index alone makes zero requests to any origin other than the local server; the index source
//      contains no tracking, external URL or script/stylesheet/font reference; cookies after loading = 0.
//      External requests made by the unchanged module pages (e.g. Google Fonts) are recorded separately, blocked, and reported.
// Usage: node nav_test.cjs <public_tree_root> <outdir>
const fs = require('node:fs'), path = require('node:path'), http = require('node:http'), crypto = require('node:crypto');
const PW = process.env.OFTY_PLAYWRIGHT_DIR || path.dirname(require.resolve('playwright/package.json', { paths: [process.cwd(), path.resolve(process.argv[2], 'tests')] }));
const root = path.resolve(process.argv[2], 'candidate'), out = path.resolve(process.argv[3]);
fs.mkdirSync(out, { recursive: true });
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const REQUIRED = [
  { id: 'M1', href: './iop-cct/index.html', title: /^OFTY Tool #1 — IOP\/CCT Assessment/ },
  { id: 'M2', href: './target-iop/index.html', title: /^OFTY Tool #2 — Target IOP/ },
  { id: 'M3', href: './vf-progression/index.html', title: /^OFTY Tool #3 — VF Progression Analysis/ },
  { id: 'M4', href: './rnfl-progression/index.html', title: /^OFTY Tool #4 — OCT Progression Analysis/ },
  { id: 'M5', href: './gate2/index.html', title: /^OFTY Tool #5/ },
];
const OPTIONAL_ALIAS = { id: 'M5-alias', href: './orchestrator/index.html' };
const BACK = ['iop-cct', 'target-iop', 'vf-progression', 'rnfl-progression'];
function serve() {
  const log = [];
  const srv = http.createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html';
    const f = path.normalize(path.join(root, p));
    if (!f.startsWith(root + path.sep) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { log.push({ p, status: 404 }); res.writeHead(404); return res.end('nf'); }
    const b = fs.readFileSync(f); log.push({ p, status: 200 });
    const T = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.cjs': 'text/javascript', '.json': 'application/json' };
    res.writeHead(200, { 'Content-Type': T[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); res.end(b);
  });
  return new Promise(r => srv.listen(0, '127.0.0.1', () => r({ origin: 'http://127.0.0.1:' + srv.address().port, log, close: () => new Promise(c => srv.close(c)) })));
}
(async () => {
  const R = { started_utc: new Date().toISOString(), tree: path.basename(path.resolve(process.argv[2])), checks: {}, notes: [] };
  const idxPath = path.join(root, 'index.html'), idx = fs.readFileSync(idxPath, 'utf8');
  R.index_sha256 = sha(fs.readFileSync(idxPath));
  // P4 static scan of the index source
  const bad = [/gtag|googletagmanager|google-analytics|analytics/i, /https?:\/\//i, /\/\/[a-z0-9.-]+\.[a-z]{2,}/i, /<script\b/i, /<link\b[^>]*rel=["']?stylesheet/i, /@import|url\(/i, /<img\b|<iframe\b|<object\b|<embed\b/i, /fonts\.(googleapis|gstatic)/i, /document\.cookie|localStorage|sessionStorage/i];
  R.index_static_hits = bad.map(rx => ({ pattern: String(rx), found: rx.test(idx) }));
  R.checks.P4_static_no_tracking_or_external = R.index_static_hits.every(h => !h.found);
  const hrefs = [...idx.matchAll(/href=["']([^"']+)["']/g)].map(m => m[1]);
  R.index_hrefs = hrefs;
  R.checks.P2_required_links_present = REQUIRED.every(x => hrefs.includes(x.href));
  R.checks.P2_no_absolute_or_site_links = hrefs.every(h => !/^(https?:|\/\/|\/)/.test(h) && !/glaucoma\//.test(h));
  const { chromium } = require(PW);
  const browser = await chromium.launch({ headless: true }); R.browser = browser.version(); R.playwright = require(PW + '/package.json').version;
  const srv = await serve(); R.origin_pattern = 'http://127.0.0.1:<port>';
  const ext = []; const ctx = await browser.newContext();
  await ctx.route('**/*', r => { const u = r.request().url(); if (u.startsWith(srv.origin + '/')) return r.continue(); ext.push({ url: u, page: r.request().frame()?.url()?.replace(srv.origin, '') || null }); return r.abort(); });
  try {
    // P2/P4 index alone
    const page = await ctx.newPage(); const pageReq = [];
    page.on('request', q => pageReq.push(q.url().replace(srv.origin, '<local>')));
    const resp = await page.goto(srv.origin + '/index.html', { waitUntil: 'networkidle' });
    R.index_status = resp.status(); R.index_title = await page.title();
    R.index_requests = pageReq.slice();
    R.checks.P2_index_http_200 = resp.status() === 200;
    R.checks.P4_index_only_local_requests = pageReq.every(u => u.startsWith('<local>')) && ext.length === 0;
    R.cookies_after_index = (await ctx.cookies()).length; R.checks.P4_no_cookies = R.cookies_after_index === 0;
    await page.screenshot({ path: path.join(out, 'P2_index.png'), fullPage: true });
    R.links = [];
    for (const L of [...REQUIRED, ...(hrefs.includes(OPTIONAL_ALIAS.href) ? [OPTIONAL_ALIAS] : [])]) {
      const p = await ctx.newPage(); await p.goto(srv.origin + '/index.html', { waitUntil: 'load' });
      const before = ext.length;
      await Promise.all([p.waitForLoadState('load'), p.locator(`a[href="${L.href}"]`).first().click()]);
      await p.waitForLoadState('load'); await p.waitForTimeout(600);
      const url = p.url().replace(srv.origin, ''), title = await p.title();
      const ok = L.id === 'M5-alias' ? /\/gate2\/index\.html$/.test(url) : (url === L.href.slice(1) && (!L.title || L.title.test(title)));
      R.links.push({ id: L.id, href: L.href, landed: url, title, http_ok: srv.log.some(e => e.p === L.href.slice(1) && e.status === 200), ok, external_requests_from_module: ext.slice(before).map(e => e.url.split('?')[0]) });
      await p.close();
    }
    R.checks.P2_all_required_links_navigate = R.links.filter(l => l.id !== 'M5-alias').every(l => l.ok && l.http_ok);
    if (R.links.find(l => l.id === 'M5-alias')) R.checks.P2_alias_reaches_gate2 = R.links.find(l => l.id === 'M5-alias').ok;
    // P3 back links from M1-M4
    R.back = [];
    for (const m of BACK) {
      const p = await ctx.newPage(); await p.goto(srv.origin + '/' + m + '/index.html', { waitUntil: 'load' });
      const a = p.locator('a[href="../index.html"]'); const n = await a.count();
      let landed = null, title = null;
      if (n) { await Promise.all([p.waitForLoadState('load'), a.first().click()]); await p.waitForTimeout(300); landed = p.url().replace(srv.origin, ''); title = await p.title(); }
      R.back.push({ module: m, back_links: n, landed, title, ok: n > 0 && landed === '/index.html' && title === R.index_title });
      await p.close();
    }
    R.checks.P3_back_links_return_to_index = R.back.every(b => b.ok);
  } catch (e) { R.harness_error = String(e.stack || e); }
  finally { await ctx.close(); await browser.close(); await srv.close(); }
  R.external_requests_all = [...new Set(ext.map(e => e.url.split('?')[0]))];
  R.external_requests_by_page = ext.reduce((a, e) => { (a[e.page || '?'] = a[e.page || '?'] || new Set()).add(new URL(e.url).host); return a; }, {});
  for (const k of Object.keys(R.external_requests_by_page)) R.external_requests_by_page[k] = [...R.external_requests_by_page[k]];
  R.server_log_404 = srv.log.filter(e => e.status !== 200);
  R.status = !R.harness_error && Object.values(R.checks).every(Boolean) ? 'PASS' : 'FAIL';
  R.finished_utc = new Date().toISOString();
  fs.writeFileSync(path.join(out, 'NAV_TEST.json'), JSON.stringify(R, null, 1));
  console.log(JSON.stringify({ status: R.status, checks: R.checks, index_requests: R.index_requests, links: R.links?.map(l => [l.id, l.landed, l.ok]), back: R.back?.map(b => [b.module, b.landed, b.ok]), external_hosts_by_page: R.external_requests_by_page, harness_error: R.harness_error }, null, 1));
  process.exitCode = R.status === 'PASS' ? 0 : 1;
})();
