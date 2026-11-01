'use strict';
// G2-E captures (no evaluation; G2E_EVAL.cjs evaluates against the frozen oracles). Derived from G2D_CAPTURE.cjs: same
// capture functions; adds the g2e/g2d sets, M3 modifier flags (central threat, monocular) and PRE = G2D-WV1, POST = G2E-WV1.
// Usage:
//   node G2D_CAPTURE.cjs standalone <OBJ[,OBJ]> <set> <outdir>    M3 (or M4 for wp3/t2b_m4) standalone page, fixed clock
//   node G2D_CAPTURE.cjs host <OBJ[,OBJ]> <set> <outdir>          real gate2 host (M1-M4 frames + M5); n = 1 fixtures use
//                                                                  hostRunN1 (M3 cannot publish without an engine result)
// OBJ: PRE (G2D-WV1) | POST (G2E-WV1). Sets: baseline_e | g2e | g2d | wp1 | wp2 | wp3 | a02 | a03 | t2b_m4
const C = require('./common.cjs'), L = require('./capture_lib_g2e.cjs');
const G2BEXP = C.readJSON(C.FROZEN.G2B_EXP);

function fixtures(set) {
  const REF = C.readJSON(C.FROZEN.G2C_REF);
  const pick = (arr, ids) => ids.map(id => { const f = arr.find(x => x.id === id); if (!f) throw Error('fixture ' + id); return f; });
  if (set === 'baseline_e') return { module: 'm3', list: [...C.readJSON(C.path.join(__dirname, '../designtools/baseline_e_fixtures.json'))] };
  if (set === 'g2e') return { module: 'm3', list: C.readJSON(C.FROZEN.G2E_EXP).fixtures };
  if (set === 'g2d') return { module: 'm3', list: C.readJSON(C.FROZEN.G2D_EXP).fixtures };
  if (set === 'wp1') return { module: 'm3', list: REF.WP1_grid };
  if (set === 'wp2') return { module: 'm3', list: REF.WP2_series };
  if (set === 'wp3') return { module: 'm4', list: REF.WP3_series };
  if (set === 'a02') return { module: 'm3', list: C.readJSON(C.path.join(C.FROZEN.G2C_A02_REF, 'G2C_REFERENCE_SUPPLEMENT_A02.json')).WP2_series };
  if (set === 'a03') return { module: 'm3', list: C.readJSON(C.path.join(C.FROZEN.G2C_A03, 'G2C_REFERENCE_SUPPLEMENT_A03.json')).WP1_grid };
  if (set === 't2b_m4') return { module: 'm4', list: G2BEXP.T2b.M4_states.map(st => ({ id: st.id, dates: st.series.map(x => x[0]), rnfl: st.series.map(x => x[1]), reliability: st.series.map(() => st.reliability) })) };
  throw Error('set?');
}

// Host spec: M1/M2 = G2-B T1c-H2 inputs (as in the G2-C host grids); the module under test gets the fixture series, the
// other progression module gets the G2-B T1c common series.
function hostSpec(fx, module) {
  const H2 = G2BEXP.T1c.runs[1], common = G2BEXP.T1c.common, m4c = common.m4_series, m3c = common.m3_series;
  const base = { id: fx.id, m1: H2.m1, m2: { ...H2.m2, observation_id: 'G2D-GRID-GAT' }, central_threat: !!fx.central_threat, monocular: !!fx.monocular };
  if (module === 'm3') return { ...base, m3_series: fx.dates.map((d, i) => [d, fx.md[i]]), m3_rel: fx.reliability, m4_series: m4c, m4_rel: m4c.map(() => 'good'), pdf: !!fx.host_pdf };
  return { ...base, m3_series: m3c, m3_rel: m3c.map(() => 'good'), m4_series: fx.dates.map((d, i) => [d, fx.rnfl[i]]), m4_rel: fx.reliability };
}

// n = 1 in the real host (new G2-D capture; hostRun requires all four producers to publish, which M3 cannot do without an
// engine result). Same host set-up as hostRun; records the M3 frame (card, COPY), the M3 producer state and envelope, and
// what M5 reports. Every M5 step is attempted and its outcome recorded; nothing is retried.
async function hostRunN1(browser, srv, spec, out, tag) {
  const { ctx, events } = await C.context(browser, srv.origin, { fixClock: false });
  const page = await ctx.newPage();
  const rec = { id: tag, spec, started_utc: C.now(), origin: srv.origin, capture: 'hostRunN1' };
  const step = async (name, fn) => { try { rec[name] = await fn(); } catch (e) { rec[name] = { error: String(e).slice(0, 1000) }; } };
  try {
    const major = browser.version().split('.')[0], cdp = await ctx.newCDPSession(page), ua = await page.evaluate(() => navigator.userAgent);
    rec.emulated_ua_ch = { brands: [{ brand: 'HeadlessChrome', version: major }, { brand: 'Not?A_Brand', version: '8' }, { brand: 'Chromium', version: major }], fullVersion: browser.version(), platform: 'Windows', platformVersion: '10.0.0', architecture: 'x86', model: '', mobile: false };
    await cdp.send('Emulation.setUserAgentOverride', { userAgent: ua, userAgentMetadata: rec.emulated_ua_ch });
    await page.goto(srv.origin + '/gate2/');
    await page.waitForFunction(() => typeof Gate2Host === 'object' && typeof Gate2UI === 'object');
    await page.evaluate(async () => { await Gate2Host.newAssessment('OD'); });
    const fr = {};
    for (const m of ['m1', 'm2', 'm3', 'm4']) {
      const h = await page.locator('iframe[data-gate2-module="' + m + '"]').elementHandle(); fr[m] = await h.contentFrame();
      await fr[m].waitForFunction(() => !!window.__OFTY_APRIME_FRAME__ && !!window.Gate2Session?.current());
    }
    await fr.m1.locator('#pio').fill(spec.m1.pio); await fr.m1.locator('#cct').fill(spec.m1.cct); await fr.m1.evaluate(() => { document.activeElement && document.activeElement.blur(); calculate(); });
    await fr.m2.locator('#stage').selectOption(spec.m2.stage); await fr.m2.locator('#baseline').fill(spec.m2.baseline);
    await fr.m2.locator('#cct').selectOption(spec.m2.cct); await fr.m2.locator('#progression').selectOption(spec.m2.progression);
    await fr.m2.locator('#currentIOP').fill(spec.m2.currentIOP);
    if (spec.m2.attest) await fr.m2.locator('#g2gatattest').check(); else await fr.m2.locator('#g2gatattest').uncheck();
    await fr.m2.locator('#g2observation').fill(spec.m2.observation_id); await fr.m2.evaluate(() => { document.activeElement && document.activeElement.blur(); calculate(); });
    for (const [m, series, rel] of [['m3', spec.m3_series, spec.m3_rel], ['m4', spec.m4_series, spec.m4_rel]]) {
      await fr[m].evaluate(({ series, rel }) => { document.getElementById('fieldRows').innerHTML = ''; rowCount = 0; series.forEach(([d, v], i) => addRow(d, String(v), rel[i])); }, { series, rel });
      await fr[m].locator('#eyeSelect').selectOption('OD'); await fr[m].locator('.date-input').first().fill(series[0][0]);
      if (m === 'm3') await fr.m3.evaluate(({ ct, mo }) => { for (const [id, v] of [['centralThreat', ct], ['monocularStatus', mo]]) { const e = document.getElementById(id); e.checked = v; e.dispatchEvent(new Event('change', { bubbles: true })); } }, { ct: spec.central_threat, mo: spec.monocular });   // G2-E modifiers
      await fr[m].evaluate(m => { document.activeElement && document.activeElement.blur(); return m === 'm3' ? calculate() : analyze(); }, m);
    }
    await page.waitForFunction(() => ['m1', 'm2', 'm4'].every(m => Gate2Host.debug.modules[m].state === 'PUBLISHED'), null, { timeout: 10000 });
    await page.waitForTimeout(1000);
    rec.module_states = await page.evaluate(() => Object.fromEntries(['m1', 'm2', 'm3', 'm4'].map(m => [m, Gate2Host.debug.modules[m].state])));
    rec.m3_envelope = await page.evaluate(() => { const e = Gate2Host.debug.modules.m3.envelope; return e === undefined ? '__undefined__' : JSON.parse(JSON.stringify(e)); });
    rec.m3_frame = await fr.m3.evaluate(() => { const t = id => (document.getElementById(id) || {}).textContent || null; return { card_visible: document.getElementById('resultCard').classList.contains('visible'), label: t('resProgression'), hero_slope: t('heroSlope'), hero_slope_tag: t('heroSlopeTag'), confidence: t('resConfidence'), confidence_sub: t('resConfidenceSub'), risk: t('riskTitle'), interpretation: t('interpretationText'), scope_limitation: (document.getElementById('scopeLimitation') || {}).textContent || null, card_inner_text: document.getElementById('resultCard').innerText, localStorage: localStorage.getItem('ofty_m3_result') }; });
    await fr.m3.locator('#resultCard').screenshot({ path: C.path.join(out, tag + '_M3_frame_card.png') });
    await fr.m3.evaluate(() => { window.__g2bClipboard.length = 0; });
    await fr.m3.locator('#copyBtn').click(); await fr.m3.waitForFunction(() => window.__g2bClipboard.length >= 1);
    rec.m3_frame.copy = await fr.m3.evaluate(() => window.__g2bClipboard[window.__g2bClipboard.length - 1]);
    await step('integrate_return', () => page.evaluate(() => { const r = Gate2UI.integrate(); return r === undefined ? '__undefined__' : JSON.parse(JSON.stringify(r)); }));
    await step('ready_before_save', () => page.evaluate(() => Gate2UI.ready()));
    await step('start_save', () => page.evaluate(async () => { try { await Gate2Host.startSave(); return 'returned'; } catch (e) { return 'threw: ' + String(e); } }));
    await page.waitForTimeout(1500);
    await step('ready_after_save', () => page.evaluate(() => Gate2UI.ready()));
    await step('m5_result', () => page.evaluate(() => Gate2UI.result === undefined ? '__undefined__' : JSON.parse(JSON.stringify(Gate2UI.result))));
    await step('m5_copy', () => page.evaluate(() => Gate2UI.text()));
    await step('m5_screen', () => page.evaluate(() => { const res = document.getElementById('result'); return res ? { visible: getComputedStyle(res).display !== 'none' && res.getClientRects().length > 0, inner_text: res.innerText } : null; }));
    await page.screenshot({ path: C.path.join(out, tag + '_host_fullpage.png'), fullPage: true });
    rec.served = srv.log.filter(l => l.status === 200).map(l => [l.p, l.sha256]);
    rec.events = events; rec.product_console_errors = C.productConsoleErrors(events, srv.origin);
  } catch (e) { rec.harness_error = String(e.stack || e); }
  finally { rec.finished_utc = C.now(); await ctx.close(); }
  C.writeJSON(out, tag + '.json', rec);
  return rec;
}

(async () => {
  const [mode, objs, set, out] = process.argv.slice(2);
  C.mkout(out);
  const { module, list } = fixtures(set);
  const browser = await C.launch();
  const ledger = { block: 'G2D CAPTURE ' + mode + ' ' + set, objects: objs.split(','), started_utc: C.now(), node: process.version, platform: process.platform + '/' + process.arch,
    playwright: require(C.PW + '/package.json').version, browser_version: browser.version(), capture_lib: L.PROVENANCE, capture_lib_g2e: L.G2E_PROVENANCE,
    environment_note: mode === 'host' ? 'Linux headless Chromium; UA-CH platform emulated as Windows (G2-B HARNESS_FIX_02); not a genuine Windows execution' : 'Linux headless Chromium; fixed clock ' + C.CLOCK_ISO,
    fixtures_sha256: C.sha256(JSON.stringify(list)), records: [] };
  try {
    for (const obj of objs.split(',')) {
      ledger['tree_' + obj] = C.treeHashes(C.ROOTS[obj]);
      const srv = await C.serve(C.ROOTS[obj]);
      for (const fx of list) {
        let r;
        if (mode === 'standalone') r = (fx.central_threat || fx.monocular) ? await L.moduleRunMod(browser, srv, obj, module, fx, out, { pdf: true }) : await L.moduleRun(browser, srv, obj, module, fx, out, { pdf: true });
        else if (mode === 'host') {
          const spec = hostSpec(fx, module);
          if ((fx.central_threat || fx.monocular) && fx.dates.length >= 2) throw Error('host modifiers supported for n = 1 only');
          r = (module === 'm3' && fx.dates.length < 2) ? await hostRunN1(browser, srv, spec, out, obj + '_' + fx.id) : await L.hostRun(browser, srv, { ...spec, pdf: true }, out, obj + '_' + fx.id);
        } else throw Error('mode?');
        ledger.records.push({ id: fx.id, object: obj, file: obj + '_' + fx.id + '.json', harness_error: r.harness_error || null,
          label: r.screen ? r.screen.label : r.m3_frame ? r.m3_frame.label : null, m5_hero: r.result?.hero?.signal ?? null });
      }
      ledger['served_' + obj] = srv.log.length; await srv.close();
    }
  } finally { await browser.close(); }
  ledger.finished_utc = C.now(); C.writeJSON(out, 'LEDGER.json', ledger);
  console.log(JSON.stringify({ records: ledger.records.length, harness_errors: ledger.records.filter(r => r.harness_error).map(r => r.object + '/' + r.id + ': ' + r.harness_error.slice(0, 300)), labels: ledger.records.map(r => r.object + '/' + r.id + ' → ' + r.label + (r.m5_hero ? ' | M5 ' + r.m5_hero : '')) }, null, 1));
})().catch(e => { console.error(e); process.exitCode = 1; });
