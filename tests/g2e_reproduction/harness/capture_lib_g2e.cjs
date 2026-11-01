'use strict';
// G2-E capture library: the G2-D capture_lib.cjs unchanged, plus moduleRunMod() (made by make_capture_lib_g2e.py).
// G2-D capture library. moduleRun() and hostRun() below are byte-identical copies of the G2-C capture functions
// (made by make_capture_lib.py; provenance: {"G2C_MODULES.cjs_sha256": "a98e02561bf7ac92aa37f0fa4904391507cd3cdf21ba633e4a62355c67e08984", "G2C_HOST.cjs_sha256": "49f147f6cf2ee41ba6400b86dae51a5d7aa3a24d68dffe839e6776fc2a68cf63", "moduleRun_block_sha256": "20228e8abe74650c30addfc461b394f1bc665bb9e508e683f29098b6979dba97", "hostRun_block_sha256": "446f847ec1e5be62b63c7be9aa346d1f3623c57512e8a28315e3e2dcef507007"}).
// Linux headless Chromium; in hostRun the UA-CH platform is emulated as Windows (G2-B HARNESS_FIX_02): not a Windows execution.
const C = require('./common.cjs'), cp = require('node:child_process');
const ROUTE = { m1: '/iop-cct/', m2: '/target-iop/', m3: '/vf-progression/', m4: '/rnfl-progression/' };
const pdfText = p => cp.execFileSync('pdftotext', ['-enc', 'UTF-8', p, '-'], { encoding: 'utf8' });
const MODS = ['m1', 'm2', 'm3', 'm4'];

// One module run: rows -> OD -> calculate()/analyze() -> card, COPY, export, Method panel, print DOM, optional PDF.
async function moduleRun(browser, srv, objName, module, fx, out, opts = {}) {
  const tag = objName + '_' + fx.id;
  const { ctx, events } = await C.context(browser, srv.origin, { fixClock: true });
  const page = await ctx.newPage();
  const rows = fx.dates.map((d, i) => [d, String(module === 'm3' ? fx.md[i] : fx.rnfl[i]), fx.reliability[i]]);
  const rec = { id: fx.id, object: objName, module, started_utc: C.now(), rows };
  try {
    await page.goto(srv.origin + ROUTE[module]);
    await page.waitForFunction(() => typeof addRow === 'function' && !!document.getElementById('resultCard'));
    await page.evaluate(rows => { document.getElementById('fieldRows').innerHTML = ''; rowCount = 0; for (const [d, v, r] of rows) addRow(d, v, r); }, rows);
    await page.locator('#eyeSelect').selectOption('OD');
    await page.evaluate(m => { document.activeElement && document.activeElement.blur(); return m === 'm3' ? calculate() : analyze(); }, module);
    await page.waitForFunction(() => document.getElementById('resultCard').classList.contains('visible'), null, { timeout: 5000 });
    rec.screen = await page.evaluate(module => {
      const t = id => { const e = document.getElementById(id); return e ? e.textContent : null; };
      const card = document.getElementById('resultCard'), lim = document.getElementById('scopeLimitation');
      const vis = e => !!e && getComputedStyle(e).display !== 'none' && getComputedStyle(e).visibility !== 'hidden' && e.getClientRects().length > 0;
      const s = { label: t('resProgression'), hero_slope: t('heroSlope'), hero_slope_tag: t('heroSlopeTag'), confidence: t('resConfidence'), confidence_sub: t('resConfidenceSub'),
        risk: t('riskTitle'), interpretation: t('interpretationText'), card_inner_text: card.innerText,
        scope_element_visible: vis(lim), scope_element_text: lim ? lim.textContent.replace(/\s+/g, ' ').trim() : null };
      if (module === 'm3') {
        s.method = { fields: t('traceFields'), followup: t('traceFollowup'), sufficiency_rule: t('traceRuleVal'), class_rule: t('traceClassRuleVal'), p_value: t('tracePValue'), ci: t('traceCI') };
        s.limitations_notes = [...((document.getElementById('dynamicLimitationsNotes') || {}).children || [])].map(x => x.textContent);
        s.branch_trace = (typeof gate2BranchTrace !== 'undefined') ? gate2BranchTrace.slice() : null;
        const d = window._lastData || null;
        s.last_data = d ? { finalLabel: d.finalLabel, confidence: d.confidence, risk: d.risk, slope: d.slope, slopeTag: d.slopeTag, n: d.n, nativeInsufficient: ('nativeInsufficient' in d) ? d.nativeInsufficient : '__absent__' } : null;
      } else {
        s.method = { sufficiency_rule: t('traceSufficiency'), class_rule: t('traceClassRule'), p_value: t('tracePValue'), ci: t('traceCI') };
      }
      return s;
    }, module);
    await page.locator('#copyBtn').click();
    await page.waitForFunction(() => window.__g2bClipboard.length >= 1, null, { timeout: 5000 });
    rec.copy = await page.evaluate(() => window.__g2bClipboard[window.__g2bClipboard.length - 1]);
    rec.payload_text = await page.evaluate(m => localStorage.getItem('ofty_' + m + '_result'), module);
    rec.payload_sha256 = rec.payload_text ? C.sha256(rec.payload_text) : null;
    await page.locator('#resultCard').screenshot({ path: C.path.join(out, tag + '_card.png') });
    await page.emulateMedia({ media: 'print' });
    rec.print = await page.evaluate(() => { const card = document.getElementById('resultCard'); return { card_visible_under_print: !!card && getComputedStyle(card).display !== 'none' && card.getClientRects().length > 0, card_inner_text_print: card.innerText }; });
    if (opts.pdf) { const pdfPath = C.path.join(out, tag + '_print.pdf'); await page.pdf({ path: pdfPath, format: 'A4', printBackground: true }); rec.pdf = { sha256: C.sha256(C.fs.readFileSync(pdfPath)), text_normalized: C.norm(pdfText(pdfPath)) }; }
    await page.emulateMedia({ media: 'screen' });
    rec.events = events; rec.product_console_errors = C.productConsoleErrors(events, srv.origin);
  } catch (e) { rec.harness_error = String(e.stack || e); }
  finally { rec.finished_utc = C.now(); await ctx.close(); }
  C.writeJSON(out, tag + '.json', rec);
  return rec;
}

async function hostRun(browser, srv, spec, out, tag) {
  const { ctx, events } = await C.context(browser, srv.origin, { fixClock: false });
  const page = await ctx.newPage();
  const rec = { id: tag, spec, started_utc: C.now(), origin: srv.origin };
  try {
    const major = browser.version().split('.')[0], cdp = await ctx.newCDPSession(page), ua = await page.evaluate(() => navigator.userAgent);
    rec.emulated_ua_ch = { brands: [{ brand: 'HeadlessChrome', version: major }, { brand: 'Not?A_Brand', version: '8' }, { brand: 'Chromium', version: major }], fullVersion: browser.version(), platform: 'Windows', platformVersion: '10.0.0', architecture: 'x86', model: '', mobile: false };
    await cdp.send('Emulation.setUserAgentOverride', { userAgent: ua, userAgentMetadata: rec.emulated_ua_ch });
    await page.goto(srv.origin + '/gate2/');
    await page.waitForFunction(() => typeof Gate2Host === 'object' && typeof Gate2UI === 'object');
    await page.evaluate(async () => { await Gate2Host.newAssessment('OD'); });
    const fr = {};
    for (const m of MODS) {
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
      await fr[m].evaluate(m => { document.activeElement && document.activeElement.blur(); return m === 'm3' ? calculate() : analyze(); }, m);
    }
    await page.waitForFunction(() => ['m1', 'm2', 'm3', 'm4'].every(m => Gate2Host.debug.modules[m].state === 'PUBLISHED'), null, { timeout: 10000 });
    rec.envelopes = await page.evaluate(() => Object.fromEntries(['m1', 'm2', 'm3', 'm4'].map(m => [m, JSON.parse(JSON.stringify(Gate2Host.debug.modules[m].envelope))])));
    rec.integrate_return_status = await page.evaluate(() => { const r = Gate2UI.integrate(); return r ? (r.status || 'result') : null; });
    await page.evaluate(async () => { await Gate2Host.startSave(); });
    await page.waitForFunction(() => Gate2UI.ready() === true, null, { timeout: 10000 });
    rec.result = await page.evaluate(() => JSON.parse(JSON.stringify(Gate2UI.result)));
    rec.copy = await page.evaluate(() => Gate2UI.text());
    await page.evaluate(() => { const create = URL.createObjectURL.bind(URL); window.__g2bBlobs = []; URL.createObjectURL = b => { window.__g2bBlobs.push(b.text()); return create(b); }; });
    const dlP = page.waitForEvent('download', { timeout: 10000 });
    rec.json_returned = await page.evaluate(() => Gate2UI.json());
    const dl = await dlP; const dlPath = C.path.join(out, tag + '_' + dl.suggestedFilename()); await dl.saveAs(dlPath);
    rec.json_download = { suggested_filename: dl.suggestedFilename(), sha256: C.sha256(C.fs.readFileSync(dlPath)) };
    rec.json_text = await page.evaluate(async () => await window.__g2bBlobs[0]);
    rec.json_download_equals_blob = C.fs.readFileSync(dlPath, 'utf8') === rec.json_text;
    const snap = () => page.evaluate(() => {
      const res = document.getElementById('result'), primary = res.querySelector('[data-surface="primary"]'), detail = res.querySelector('[data-layer="detail"]');
      const pairs = e => { if (!e) return []; const dt = [...e.querySelectorAll('dt')], dd = [...e.querySelectorAll('dd')]; return dt.map((d, i) => [d.textContent.trim(), (dd[i] || {}).textContent?.trim()]); };
      const vis = e => !!e && getComputedStyle(e).display !== 'none' && e.getClientRects().length > 0;
      return { primary_paragraphs: primary ? [...primary.querySelectorAll('p')].map(p => p.textContent) : [], detail_pairs: pairs(detail), result_visible: vis(res), result_inner_text: res.innerText };
    });
    rec.screen = await snap();
    await page.locator('#result').screenshot({ path: C.path.join(out, tag + '_M5_result.png') });
    if (spec.full_page_screenshot) await page.screenshot({ path: C.path.join(out, tag + '_host_fullpage.png'), fullPage: true });
    rec.print_permission = await page.evaluate(() => { window.__g2bPrintCalls = 0; window.print = () => { window.__g2bPrintCalls++; }; dispatchEvent(new Event('beforeprint')); return { returned: Gate2UI.print(), calls: window.__g2bPrintCalls }; });
    await page.emulateMedia({ media: 'print' });
    rec.print_dom = await snap();
    if (spec.pdf) { const pdfPath = C.path.join(out, tag + '_host_print.pdf'); await page.pdf({ path: pdfPath, format: 'A4', printBackground: true }); rec.pdf = { sha256: C.sha256(C.fs.readFileSync(pdfPath)), text_normalized: C.norm(cp.execFileSync('pdftotext', ['-enc', 'UTF-8', pdfPath, '-'], { encoding: 'utf8' })) }; }
    await page.emulateMedia({ media: 'screen' });
    rec.ready_after_print = await page.evaluate(() => Gate2UI.ready());
    rec.m1_frame = await fr.m1.evaluate(() => ({ hero_eyebrow: document.querySelector('#result-card .result-eyebrow')?.textContent.trim(), hero_number: document.getElementById('res-pio')?.textContent.trim(), hero_subtitle: document.querySelector('#result-card .result-subtitle')?.textContent.trim(), contextual_value: (document.getElementById('res-contextual') || {}).textContent || null, card_inner_text: document.getElementById('result-card').innerText }));
    await fr.m1.evaluate(() => copyResult()); rec.m1_frame.copy = await fr.m1.evaluate(() => window.__g2bClipboard[window.__g2bClipboard.length - 1] || null);
    if (spec.m1_screenshot) await fr.m1.locator('#result-card').screenshot({ path: C.path.join(out, tag + '_M1_frame_card.png') });
    rec.m2_frame = await fr.m2.evaluate(() => ({ iop_range: document.getElementById('iopRange')?.textContent.trim(), instruction: (document.getElementById('currentIOP-instruction') || {}).textContent || null }));
    for (const m of ['m3', 'm4']) {
      rec[m + '_frame'] = await fr[m].evaluate(m => { const t = id => (document.getElementById(id) || {}).textContent || null; return { label: t('resProgression'), hero_slope: t('heroSlope'), hero_slope_tag: t('heroSlopeTag'), confidence: t('resConfidence'), risk: t('riskTitle'), interpretation: t('interpretationText'), method_p: t('tracePValue'), scope_limitation: (document.getElementById('scopeLimitation') || {}).textContent || null, localStorage: localStorage.getItem('ofty_' + m + '_result') }; }, m);
      await fr[m].locator('#resultCard').screenshot({ path: C.path.join(out, tag + '_' + m.toUpperCase() + '_frame_card.png') });
    }
    for (const m of ['m3', 'm4']) {
      await fr[m].evaluate(() => { window.__g2bClipboard.length = 0; });
      await fr[m].locator('#copyBtn').click(); await fr[m].waitForFunction(() => window.__g2bClipboard.length >= 1);
      rec[m + '_frame'].copy = await fr[m].evaluate(() => window.__g2bClipboard[window.__g2bClipboard.length - 1]);
    }
    rec.served = srv.log.filter(l => l.status === 200).map(l => [l.p, l.sha256]);
    rec.events = events; rec.product_console_errors = C.productConsoleErrors(events, srv.origin);
  } catch (e) { rec.harness_error = String(e.stack || e); }
  finally { rec.finished_utc = C.now(); await ctx.close(); }
  C.writeJSON(out, tag + '.json', rec);
  return rec;
}

// G2-E copy of moduleRun with modifier support. One module run: rows -> OD -> calculate()/analyze() -> card, COPY, export, Method panel, print DOM, optional PDF.
async function moduleRunMod(browser, srv, objName, module, fx, out, opts = {}) {
  const tag = objName + '_' + fx.id;
  const { ctx, events } = await C.context(browser, srv.origin, { fixClock: true });
  const page = await ctx.newPage();
  const rows = fx.dates.map((d, i) => [d, String(module === 'm3' ? fx.md[i] : fx.rnfl[i]), fx.reliability[i]]);
  const rec = { id: fx.id, object: objName, module, started_utc: C.now(), rows };
  try {
    await page.goto(srv.origin + ROUTE[module]);
    await page.waitForFunction(() => typeof addRow === 'function' && !!document.getElementById('resultCard'));
    await page.evaluate(rows => { document.getElementById('fieldRows').innerHTML = ''; rowCount = 0; for (const [d, v, r] of rows) addRow(d, v, r); }, rows);
    await page.locator('#eyeSelect').selectOption('OD');
    // G2-E (moduleRunMod only): M3 clinical modifiers from the fixture; set as a user would, then 'change' dispatched.
    await page.evaluate(({ ct, mo }) => { for (const [id, v] of [['centralThreat', ct], ['monocularStatus', mo]]) { const e = document.getElementById(id); e.checked = v; e.dispatchEvent(new Event('change', { bubbles: true })); } }, { ct: !!fx.central_threat, mo: !!fx.monocular });
    await page.evaluate(m => { document.activeElement && document.activeElement.blur(); return m === 'm3' ? calculate() : analyze(); }, module);
    await page.waitForFunction(() => document.getElementById('resultCard').classList.contains('visible'), null, { timeout: 5000 });
    rec.screen = await page.evaluate(module => {
      const t = id => { const e = document.getElementById(id); return e ? e.textContent : null; };
      const card = document.getElementById('resultCard'), lim = document.getElementById('scopeLimitation');
      const vis = e => !!e && getComputedStyle(e).display !== 'none' && getComputedStyle(e).visibility !== 'hidden' && e.getClientRects().length > 0;
      const s = { label: t('resProgression'), hero_slope: t('heroSlope'), hero_slope_tag: t('heroSlopeTag'), confidence: t('resConfidence'), confidence_sub: t('resConfidenceSub'),
        risk: t('riskTitle'), interpretation: t('interpretationText'), card_inner_text: card.innerText,
        scope_element_visible: vis(lim), scope_element_text: lim ? lim.textContent.replace(/\s+/g, ' ').trim() : null };
      if (module === 'm3') {
        s.method = { fields: t('traceFields'), followup: t('traceFollowup'), sufficiency_rule: t('traceRuleVal'), class_rule: t('traceClassRuleVal'), p_value: t('tracePValue'), ci: t('traceCI') };
        s.limitations_notes = [...((document.getElementById('dynamicLimitationsNotes') || {}).children || [])].map(x => x.textContent);
        s.branch_trace = (typeof gate2BranchTrace !== 'undefined') ? gate2BranchTrace.slice() : null;
        const d = window._lastData || null;
        s.last_data = d ? { finalLabel: d.finalLabel, confidence: d.confidence, risk: d.risk, slope: d.slope, slopeTag: d.slopeTag, n: d.n, nativeInsufficient: ('nativeInsufficient' in d) ? d.nativeInsufficient : '__absent__' } : null;
      } else {
        s.method = { sufficiency_rule: t('traceSufficiency'), class_rule: t('traceClassRule'), p_value: t('tracePValue'), ci: t('traceCI') };
      }
      return s;
    }, module);
    await page.locator('#copyBtn').click();
    await page.waitForFunction(() => window.__g2bClipboard.length >= 1, null, { timeout: 5000 });
    rec.copy = await page.evaluate(() => window.__g2bClipboard[window.__g2bClipboard.length - 1]);
    rec.payload_text = await page.evaluate(m => localStorage.getItem('ofty_' + m + '_result'), module);
    rec.payload_sha256 = rec.payload_text ? C.sha256(rec.payload_text) : null;
    await page.locator('#resultCard').screenshot({ path: C.path.join(out, tag + '_card.png') });
    await page.emulateMedia({ media: 'print' });
    rec.print = await page.evaluate(() => { const card = document.getElementById('resultCard'); return { card_visible_under_print: !!card && getComputedStyle(card).display !== 'none' && card.getClientRects().length > 0, card_inner_text_print: card.innerText }; });
    if (opts.pdf) { const pdfPath = C.path.join(out, tag + '_print.pdf'); await page.pdf({ path: pdfPath, format: 'A4', printBackground: true }); rec.pdf = { sha256: C.sha256(C.fs.readFileSync(pdfPath)), text_normalized: C.norm(pdfText(pdfPath)) }; }
    await page.emulateMedia({ media: 'screen' });
    rec.events = events; rec.product_console_errors = C.productConsoleErrors(events, srv.origin);
  } catch (e) { rec.harness_error = String(e.stack || e); }
  finally { rec.finished_utc = C.now(); await ctx.close(); }
  C.writeJSON(out, tag + '.json', rec);
  return rec;
}

module.exports = { moduleRun, moduleRunMod, hostRun, ROUTE, G2E_PROVENANCE: {"g2d_capture_lib_sha256": "053c2610a9cf2d5dcda99ca18a2a444fb79122aa62eb2ec7e7a1274c24fff493", "moduleRunMod_block_sha256": "2b201f9eeb02d66be14e2d55c5e3ae529f79f9b99c6ff213ed2afc625a9d4047"}, PROVENANCE: {"G2C_MODULES.cjs_sha256": "a98e02561bf7ac92aa37f0fa4904391507cd3cdf21ba633e4a62355c67e08984", "G2C_HOST.cjs_sha256": "49f147f6cf2ee41ba6400b86dae51a5d7aa3a24d68dffe839e6776fc2a68cf63", "moduleRun_block_sha256": "20228e8abe74650c30addfc461b394f1bc665bb9e508e683f29098b6979dba97", "hostRun_block_sha256": "446f847ec1e5be62b63c7be9aa346d1f3623c57512e8a28315e3e2dcef507007"} };
