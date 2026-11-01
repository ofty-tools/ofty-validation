'use strict';
// Compare a run of run_reproduction.sh with EXPECTED_RESULTS.json (criteria R1-R3; R4 is checked by the shell script).
// Usage: node check_expected.cjs <run_output_dir>. Writes <run_output_dir>/SUMMARY.json. Exit 0 only if every criterion holds.
const fs = require('node:fs'), path = require('node:path');
const out = path.resolve(process.argv[2]);
const X = JSON.parse(fs.readFileSync(path.join(__dirname, 'EXPECTED_RESULTS.json'), 'utf8'));
const idx = fs.readFileSync(path.join(out, 'RUN_INDEX.csv'), 'utf8').trim().split('\n').slice(1).map(l => l.split(','));
const S = { run_dir: out, checked_utc: new Date().toISOString(), blocks: {}, problems: [] };
const tot = { 'v1.0': { standalone: [0, 0], host: [0, 0] }, 'v1.1': { standalone: [0, 0], host: [0, 0] } };
for (const [, , name, rc] of idx) if (rc !== '0') S.problems.push(`R1: block ${name} exit code ${rc}`);
for (const [key, e] of Object.entries(X.blocks)) {
  const mode = key.split('_')[0], b = { expected: e };
  const ledger = JSON.parse(fs.readFileSync(path.join(out, 'POST_' + key, 'LEDGER.json'), 'utf8'));
  const herr = ledger.records.filter(r => r.harness_error);
  if (herr.length) S.problems.push(`R1: ${key}: ${herr.length} capture record(s) with harness_error`);
  b.capture = { records: ledger.records.length, browser: ledger.browser_version, playwright: ledger.playwright, node: ledger.node };
  for (const v of ['v1.0', 'v1.1']) {
    const dir = path.join(out, `EVAL_${v}_${key}`), f = fs.readdirSync(dir).find(n => n.startsWith('G2E_EVAL_'));
    const L = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    const pass = L.rows.filter(r => r.status === 'PASS').length, n = L.rows.length;
    const checks = [...new Set(L.rows.flatMap(r => r.failed || []))].sort();
    const paths = [...new Set(L.rows.flatMap(r => [...(r.export_diff_vs_expected || []), ...(r.m3_envelope_diff_vs_expected || [])]))].sort();
    b[v] = { fixtures: n, PASS: pass, failed_checks: checks, diff_paths: paths };
    tot[v][mode][0] += pass; tot[v][mode][1] += n;
    if (n !== e.fixtures) S.problems.push(`${key} ${v}: ${n} fixtures, expected ${e.fixtures}`);
    if (v === 'v1.1' && pass !== e['v1.1_PASS']) S.problems.push(`R2: ${key} v1.1: ${pass}/${n} PASS, expected ${e['v1.1_PASS']}`);
    if (v === 'v1.0') {
      if (pass !== e['v1.0_PASS']) S.problems.push(`R3: ${key} v1.0: ${pass}/${n} PASS, expected ${e['v1.0_PASS']}`);
      if (JSON.stringify(checks) !== JSON.stringify(e['v1.0_failed_checks'])) S.problems.push(`R3: ${key} v1.0 failing checks ${JSON.stringify(checks)}, expected ${JSON.stringify(e['v1.0_failed_checks'])}`);
      if (JSON.stringify(paths) !== JSON.stringify(e['v1.0_diff_paths'])) S.problems.push(`R3: ${key} v1.0 diff paths ${JSON.stringify(paths)}, expected ${JSON.stringify(e['v1.0_diff_paths'])}`);
    }
  }
  S.blocks[key] = b;
}
S.totals = tot;
S.totals_text = Object.entries(tot).map(([v, t]) => `${v}: standalone ${t.standalone[0]}/${t.standalone[1]}, host ${t.host[0]}/${t.host[1]}, all ${t.standalone[0] + t.host[0]}/${t.standalone[1] + t.host[1]}`);
S.outcome = S.problems.length ? 'NOT REPRODUCED' : 'REPRODUCED (matches EXPECTED_RESULTS.json)';
fs.writeFileSync(path.join(out, 'SUMMARY.json'), JSON.stringify(S, null, 1));
console.log(S.totals_text.join('\n')); console.log('outcome: ' + S.outcome); for (const p of S.problems) console.log('  ' + p);
process.exitCode = S.problems.length ? 1 : 0;
