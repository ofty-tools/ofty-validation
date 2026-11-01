'use strict';
// Headless re-execution of the historical test runner H1 (OFTY_SUITE_TEST_RUNNER.html, tag v1.0.0-paper2).
// H1 embeds M5 1.0.0, loads no external engine and runs its tests on page load, writing totals to the browser console.
// This script opens the unmodified file, blocks every network request, collects the console output and extracts the
// totals. A run of this script is a post-submission re-execution; it is not evidence of the pre-submission run.
// Usage: node tests/h1_historical/run_h1_headless.cjs [output_dir]
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const REPO = path.resolve(__dirname, '../..');
const PW = process.env.OFTY_PLAYWRIGHT_DIR || path.dirname(require.resolve('playwright/package.json', { paths: [path.resolve(__dirname, '..')] }));
const H1 = path.join(REPO, 'OFTY_SUITE_TEST_RUNNER.html');
const H1_SHA256 = 'fbd64e4270cc7aab2646e8929f0441e0b44894c0f2d330efffbe4d1f73000463';
(async () => {
  const out = path.resolve(process.argv[2] || path.join(__dirname, 'out', new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z')));
  fs.mkdirSync(out, { recursive: true });
  const sha = crypto.createHash('sha256').update(fs.readFileSync(H1)).digest('hex');
  const rec = { started_utc: new Date().toISOString(), h1_file: 'OFTY_SUITE_TEST_RUNNER.html', h1_sha256: sha, h1_sha256_expected: H1_SHA256, node: process.version, platform: process.platform + '/' + process.arch,
    note: 'Post-submission headless re-execution of H1. Not evidence of the pre-submission execution.', console: [], page_errors: [], requests_blocked: [] };
  if (sha !== H1_SHA256) { rec.error = 'H1 hash mismatch'; fs.writeFileSync(path.join(out, 'H1_RUN.json'), JSON.stringify(rec, null, 1)); console.error(rec.error); process.exit(2); }
  const { chromium } = require(PW); rec.playwright = require(PW + '/package.json').version;
  const browser = await chromium.launch({ headless: true }); rec.browser_version = browser.version();
  try {
    const ctx = await browser.newContext();
    await ctx.route('**/*', r => { const u = r.request().url(); if (u.startsWith('file://')) return r.continue(); rec.requests_blocked.push(u); return r.abort(); });
    const page = await ctx.newPage();
    page.on('console', m => rec.console.push(m.text()));
    page.on('pageerror', e => rec.page_errors.push(String(e)));
    await page.goto('file://' + H1, { waitUntil: 'load' });
    await page.waitForFunction(() => true); await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(out, 'H1_page.png'), fullPage: true });
  } finally { await browser.close(); }
  const txt = rec.console.join('\n'), g = re => { const m = txt.match(re); return m ? m.slice(1) : null; };
  const manual = g(/Manual: (\d+) passed \| (\d+) failed/), stress = g(/PASS {2}(\d+)\/(\d+) combinations/) || g(/FAIL {2}(\d+)\/(\d+) passed/);
  const scen = g(/Manual: (\d+) scenarios \| (\d+) assertions/), engine = g(/Engine v([0-9.]+) · (\d+) manual scenarios/);
  rec.extracted = { engine_version: engine && engine[0], scenarios: scen && +scen[0], assertion_instances_run: scen && +scen[1],
    assertion_instances_passed: manual && +manual[0], assertion_instances_failed: manual && +manual[1],
    combinations_passed: stress && +stress[0], combinations_total: stress && +stress[1], grand_total_line: (txt.match(/GRAND TOTAL: [^\n]*/) || [null])[0] };
  rec.expected = { engine_version: '1.0.0', scenarios: 23, assertion_instances_run: 146, assertion_instances_passed: 146, assertion_instances_failed: 0, combinations_passed: 192, combinations_total: 192 };
  rec.matches_expected = Object.entries(rec.expected).every(([k, v]) => rec.extracted[k] === v) && rec.page_errors.length === 0 && rec.requests_blocked.length === 0;
  rec.finished_utc = new Date().toISOString();
  fs.writeFileSync(path.join(out, 'H1_RUN.json'), JSON.stringify(rec, null, 1));
  fs.writeFileSync(path.join(out, 'H1_CONSOLE.txt'), txt);
  console.log(JSON.stringify({ extracted: rec.extracted, page_errors: rec.page_errors.length, requests_blocked: rec.requests_blocked.length, matches_expected: rec.matches_expected }, null, 1));
  process.exitCode = rec.matches_expected ? 0 : 1;
})().catch(e => { console.error(e); process.exitCode = 1; });
