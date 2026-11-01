'use strict';
// G2-E evaluator v1.1 (ORACLE-AMENDMENT OA-E01, post hoc): identical to the frozen v1.0 except the expected export also
// carries the new transport_version inside functional.native. v1.0 outputs are preserved.
// G2-E evaluator (frozen with the plan). Reads capture records only; never executes OFTY code.
// Expected POST = frozen transform of the PRE (G2D-WV1) capture (G2E_EXPECTATIONS.expected_post_transform):
//   M3: card, COPY, print, PDF unchanged; export gains functional.display.rendered_label (= the PRE card label) and the
//       new contract/UI versions; nothing else changes. M4: unchanged.
//   M5 (host): result/JSON gain only functional.display.rendered_label and candidate.ui; COPY/screen/print text change
//       only by the frozen A1 wording replacements, the detail-row rename + new "M3 card label" row, and the UI label.
// Absolute checks per G2E fixture (expected values frozen in G2E_EXPECTATIONS.fixtures).
// Usage:
//   node G2E_EVAL.cjs standalone <set> <PRE_dir> <POST_dir> <outdir>
//   node G2E_EVAL.cjs host <set> <PRE_dir> <POST_dir> <outdir>
//   node G2E_EVAL.cjs selfcheck <standalone|host> <set> <dirA> <dirB> <outdir>     design-time: two PRE runs, identity
const C = require('../harness/common.cjs');   // v1.1 lives in harness_amendments/
const X = C.readJSON(C.FROZEN.G2E_EXP), T = X.texts, V = C.VERSIONS;
const line = (t, p) => (t || '').split('\n').find(l => l.startsWith(p)) || null;
function diffPaths(a, b, p = '', out = []) {
  if (JSON.stringify(a) === JSON.stringify(b)) return out;
  if (a && b && typeof a === 'object' && typeof b === 'object' && Array.isArray(a) === Array.isArray(b)) { for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) diffPaths(a[k], b[k], p ? p + '.' + k : k, out); }
  else out.push(p);
  return out;
}
const VOLATILE = new Set(['assessment_id', 'acquisition_epoch', 'epoch', 'generated_at', 'evaluated_at', '_timestamp']);
function devol(x) { if (Array.isArray(x)) return x.map(devol); if (x && typeof x === 'object') return Object.fromEntries(Object.entries(x).map(([k, v]) => [k, VOLATILE.has(k) ? '<volatile>' : devol(v)])); return x; }
const ISO = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z/g, UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g;
const deTs = s => s == null ? s : String(s).replace(ISO, '<ts>').replace(UUID, '<uuid>');
const deTsDeep = x => JSON.parse(deTs(JSON.stringify(x)));
const squash = s => String(s || '').replace(/\s+/g, '');
const multiset = s => squash(s).split('').sort().join('');
const parse = t => t ? JSON.parse(t) : null;
const clone = x => JSON.parse(JSON.stringify(x));
const stripTs = p => { if (!p) return p; const o = clone(p); delete o._timestamp; return o; };

function fixturesFor(set) {
  const REF = C.readJSON(C.FROZEN.G2C_REF);
  if (set === 'g2e') return X.fixtures;
  if (set === 'g2d') return C.readJSON(C.FROZEN.G2D_EXP).fixtures;
  if (set === 'wp1') return REF.WP1_grid;
  if (set === 'wp2') return REF.WP2_series;
  if (set === 'wp3') return REF.WP3_series;
  if (set === 'a02') return C.readJSON(C.path.join(C.FROZEN.G2C_A02_REF, 'G2C_REFERENCE_SUPPLEMENT_A02.json')).WP2_series;
  if (set === 'a03') return C.readJSON(C.path.join(C.FROZEN.G2C_A03, 'G2C_REFERENCE_SUPPLEMENT_A03.json')).WP1_grid;
  if (set === 't2b_m4') return C.readJSON(C.FROZEN.G2B_EXP).T2b.M4_states.map(s => ({ id: s.id }));
  throw Error('set?');
}
const isM4 = set => set === 'wp3' || set === 't2b_m4';

// Expected M3 export: PRE export + rendered_label (= PRE card label) + new contract and UI versions.
function expectedExport(prePayload, preCardLabel) {
  if (!prePayload) return null;
  const e = clone(prePayload);
  e.transport_version = V.POST.m3_transport;
  e.functional.candidate.ui = V.POST.m3_ui;
  e.functional.display.rendered_label = preCardLabel;
  // OA-E01 (post hoc, see G2E_OAE01_RECORD.json): the pre-existing source line `native: JSON.parse(JSON.stringify(_m3Store))`
  // copies the store, including transport_version, into functional.native; that copy carries the same new value.
  if (e.functional.native && 'transport_version' in e.functional.native) e.functional.native.transport_version = V.POST.m3_transport;
  return e;
}
// Frozen M5 text transform (applied to every M5 text surface of the PRE capture).
function srcText(card) { return card === undefined || card === null ? T.src_absent : card === 'No progression detected' ? T.src_card_npd : T.src_card_prefix + card; }
function m5Text(s, card) {
  if (s == null) return s;
  let t = String(s);
  t = t.split(T.m5_old_unresolved).join('(' + srcText(card) + '; native');
  t = t.split(T.m5_old_plateau).join('(' + srcText(card) + ')');
  t = t.split(T.m5_old_clause).join(T.m5_new_clause);
  t = t.split(T.m5_old_caution).join(T.m5_new_caution);
  t = t.split(V.PRE.m5_ui).join(V.POST.m5_ui);
  return t;
}
function m5Detail(pairs, card) {
  const out = [];
  for (const [k, v] of pairs) {
    if (k === T.m5_old_detail_key) { out.push([T.m5_new_detail_key, m5Text(v, card)]); out.push([T.m5_card_row_key, card == null ? 'Not available' : card]); }
    else out.push([k, m5Text(v, card)]);
  }
  return out;
}
function m5InnerText(s, card, pairsPre) {
  // detail rows appear as "key\nvalue\n" in innerText: rename and insert the card row, then the string replacements.
  let t = String(s);
  const v = (pairsPre.find(([k]) => k === T.m5_old_detail_key) || [])[1];
  if (v !== undefined) t = t.split(T.m5_old_detail_key + '\n' + v + '\n').join(T.m5_new_detail_key + '\n' + v + '\n' + T.m5_card_row_key + '\n' + (card == null ? 'Not available' : card) + '\n');
  return m5Text(t, card);
}

const VIEW_KEYS = ['label', 'hero_slope', 'hero_slope_tag', 'confidence', 'confidence_sub', 'risk', 'interpretation', 'scope_element_visible', 'scope_element_text', 'method', 'limitations_notes', 'branch_trace', 'last_data'];
function evalStandaloneM3(fx, pre, post, selfcheck) {
  const row = { id: fx.id, checks: {}, notes: [] }, ch = row.checks;
  ch.no_harness_errors = !!pre && !!post && !pre.harness_error && !post.harness_error;
  if (!ch.no_harness_errors) { row.error = (pre?.harness_error || post?.harness_error || 'missing record').slice(0, 300); return row; }
  const dv = VIEW_KEYS.filter(k => JSON.stringify(pre.screen[k]) !== JSON.stringify(post.screen[k])); row.view_diff = dv;
  ch.card_view_unchanged = dv.length === 0;
  ch.copy_unchanged = pre.copy === post.copy;
  ch.print_unchanged = JSON.stringify(pre.print) === JSON.stringify(post.print);
  if (pre.pdf && post.pdf) ch.pdf_text_multiset_unchanged = multiset(pre.pdf.text_normalized) === multiset(post.pdf.text_normalized); else ch.pdf_presence_unchanged = !!pre.pdf === !!post.pdf;
  const pp = parse(pre.payload_text), qp = parse(post.payload_text);
  ch.export_presence_unchanged = (pp === null) === (qp === null);
  const exp = selfcheck ? pp : expectedExport(pp, pre.screen.label);
  row.export_diff_vs_expected = (exp && qp) ? diffPaths(stripTs(exp), stripTs(qp)) : [];
  ch.export_as_expected = (exp === null && qp === null) || row.export_diff_vs_expected.length === 0;
  if (!selfcheck && qp) {
    ch.rendered_label_equals_card_and_copy = qp.functional.display.rendered_label === post.screen.label && line(post.copy, 'Progression: ') === 'Progression: ' + qp.functional.display.rendered_label;
    ch.display_label_key_and_value_unchanged = qp.functional.display.label === pp.functional.display.label;
    ch.post_versions = qp.transport_version === V.POST.m3_transport && qp.functional.candidate.ui === V.POST.m3_ui && qp.algorithm_version === V.POST.m3_alg;
  }
  ch.no_page_errors = post.events.page_errors.length === 0 && post.product_console_errors.length === 0;
  const E = fx.expect;
  if (!selfcheck && E) {
    if (E.card_label) ch.abs_card_label = post.screen.label === E.card_label;
    if (E.risk) ch.abs_risk = post.screen.risk === E.risk && line(post.copy, 'Clinical risk: ') === 'Clinical risk: ' + E.risk;
    if (E.no_low_risk) ch.abs_no_low_risk_anywhere = ![post.screen.risk, post.copy, post.print.card_inner_text_print].join('\n').includes('Low clinical risk') && !squash(post.pdf?.text_normalized).includes('Lowclinicalrisk');
    if (E.export === false) ch.abs_no_export = qp === null;
    if (E.export === true) ch.abs_export_present = qp !== null;
    if (E.pattern_rule_label) ch.abs_pattern_rule_label = qp && qp.functional.display.label === E.pattern_rule_label;
    if (E.native_significance) ch.abs_native_significance = qp && qp.statistical_significance === E.native_significance && qp.classification === E.native_classification;
    if (E.modifier_note) ch.abs_modifier_note_in_card_and_copy = post.screen.interpretation.includes(E.modifier_note) && post.copy.includes(E.modifier_note);
  }
  return row;
}
function evalStandaloneM4(fx, pre, post) {
  const row = { id: fx.id, checks: {}, notes: [] }, ch = row.checks;
  ch.no_harness_errors = !!pre && !!post && !pre.harness_error && !post.harness_error;
  if (!ch.no_harness_errors) { row.error = 'missing/harness error'; return row; }
  ch.card_view_identical = JSON.stringify(pre.screen) === JSON.stringify(post.screen);
  ch.copy_identical = pre.copy === post.copy;
  ch.export_identical = JSON.stringify(stripTs(parse(pre.payload_text))) === JSON.stringify(stripTs(parse(post.payload_text)));
  ch.print_identical = JSON.stringify(pre.print) === JSON.stringify(post.print);
  if (pre.pdf && post.pdf) ch.pdf_text_multiset_unchanged = multiset(pre.pdf.text_normalized) === multiset(post.pdf.text_normalized);
  ch.no_page_errors = post.events.page_errors.length === 0 && post.product_console_errors.length === 0;
  return row;
}

const M3F = ['label', 'hero_slope', 'hero_slope_tag', 'confidence', 'risk', 'interpretation', 'method_p', 'scope_limitation', 'copy'];
const STALE = [T.m5_old_unresolved, T.m5_old_plateau, T.m5_old_clause, T.m5_old_caution, T.m5_old_detail_key];
function evalHost(fx, pre, post, set, selfcheck) {
  const row = { id: fx.id, checks: {}, notes: [] }, ch = row.checks;
  ch.no_harness_errors = !!pre && !!post && !pre.harness_error && !post.harness_error;
  if (!ch.no_harness_errors) { row.error = (pre?.harness_error || post?.harness_error || 'missing record').slice(0, 300); return row; }
  const E = fx.expect;
  if (pre.capture === 'hostRunN1') {
    const K = ['label', 'hero_slope', 'hero_slope_tag', 'confidence', 'confidence_sub', 'risk', 'interpretation', 'scope_limitation', 'copy', 'card_inner_text'];
    ch.m3_frame_unchanged = K.every(k => pre.m3_frame[k] === post.m3_frame[k]);
    ch.m3_not_published_no_envelope = post.module_states.m3 !== 'PUBLISHED' && post.m3_envelope === null && JSON.stringify(post.module_states) === JSON.stringify(pre.module_states);
    ch.no_m3_localStorage = post.m3_frame.localStorage === null;
    ch.m5_not_ready_as_PRE = post.ready_after_save === false && pre.ready_after_save === false && post.m5_result === null && pre.m5_result === null;
    if (!selfcheck && E) {
      if (E.risk) ch.abs_risk_frame = post.m3_frame.risk === E.risk && line(post.m3_frame.copy, 'Clinical risk: ') === 'Clinical risk: ' + E.risk;
      if (E.no_low_risk) ch.abs_no_low_risk_frame = !post.m3_frame.card_inner_text.includes('Low clinical risk') && !post.m3_frame.copy.includes('Low clinical risk');
      if (E.modifier_note) ch.abs_modifier_note_frame = post.m3_frame.interpretation.includes(E.modifier_note);
    }
    ch.no_page_errors = post.events.page_errors.length === 0 && post.product_console_errors.length === 0;
    return row;
  }
  const m3 = set !== 'wp3' || true;   // every host run carries an M3 envelope (T1c series for wp3)
  ch.m3_frame_unchanged = M3F.every(k => pre.m3_frame[k] === post.m3_frame[k]);
  const pp = pre.envelopes.m3.payload, qp = post.envelopes.m3.payload, card = pre.m3_frame.label;
  const exp = selfcheck ? pp : expectedExport(pp, card);
  row.m3_envelope_diff_vs_expected = diffPaths(devol(exp), devol(qp));
  ch.m3_envelope_as_expected = row.m3_envelope_diff_vs_expected.length === 0;
  ch.m3_localStorage_equals_envelope = JSON.stringify(devol(parse(post.m3_frame.localStorage))) === JSON.stringify(devol(qp));
  ch.m1_m2_m4_envelopes_identical = ['m1', 'm2', 'm4'].every(m => JSON.stringify(devol(pre.envelopes[m].payload)) === JSON.stringify(devol(post.envelopes[m].payload)));
  ch.m1_m2_m4_frames_identical = JSON.stringify(pre.m1_frame) === JSON.stringify(post.m1_frame) && JSON.stringify(pre.m2_frame) === JSON.stringify(post.m2_frame) && JSON.stringify({ ...pre.m4_frame, localStorage: null }) === JSON.stringify({ ...post.m4_frame, localStorage: null });
  // M5 machine output: only the two presentation paths may differ
  const allowed = p => selfcheck ? false : (p === 'functional.display.rendered_label' || p === 'functional.candidate.ui');
  row.m5_result_diff = diffPaths(deTsDeep(devol(pre.result)), deTsDeep(devol(post.result)));
  ch.m5_result_diff_only_presentation_paths = row.m5_result_diff.every(allowed);
  if (!selfcheck) ch.m5_result_rendered_label_value = post.result.functional?.display?.rendered_label === post.m3_frame.label && post.result.functional?.candidate?.ui === V.POST.m3_ui;
  const decide = r => [r.status, r.semantic_version, r.hero, r.integration?.concern, r.integration?.disposition, r.integration?.reason_codes, r.integration?.guards, r.confidence, r.functional?.selected_rule, r.functional?.display?.label, r.functional?.native_classification, r.functional?.numbers, r.functional?.primary_state, r.functional?.primary_assessability];
  ch.m5_decision_fields_identical = JSON.stringify(deTsDeep(decide(pre.result))) === JSON.stringify(deTsDeep(decide(post.result)));
  row.m5_json_diff = diffPaths(deTsDeep(devol(parse(pre.json_text))), deTsDeep(devol(parse(post.json_text))));
  ch.m5_json_diff_only_presentation_paths = row.m5_json_diff.every(allowed);
  const xc = selfcheck ? pre.copy : m5Text(pre.copy, card);
  ch.m5_copy_as_expected = deTs(xc) === deTs(post.copy);
  if (!ch.m5_copy_as_expected) row.m5_copy_expected_vs_post = [deTs(xc), deTs(post.copy)];
  const xs = selfcheck ? pre.screen : { primary_paragraphs: pre.screen.primary_paragraphs.map(s => m5Text(s, card)), detail_pairs: m5Detail(pre.screen.detail_pairs, card), result_visible: pre.screen.result_visible, result_inner_text: m5InnerText(pre.screen.result_inner_text, card, pre.screen.detail_pairs) };
  const xp = selfcheck ? pre.print_dom : { primary_paragraphs: pre.print_dom.primary_paragraphs.map(s => m5Text(s, card)), detail_pairs: m5Detail(pre.print_dom.detail_pairs, card), result_visible: pre.print_dom.result_visible, result_inner_text: m5InnerText(pre.print_dom.result_inner_text, card, pre.print_dom.detail_pairs) };
  ch.m5_screen_as_expected = JSON.stringify(deTsDeep(xs)) === JSON.stringify(deTsDeep(post.screen));
  ch.m5_print_dom_as_expected = JSON.stringify(deTsDeep(xp)) === JSON.stringify(deTsDeep(post.print_dom));
  if (pre.pdf && post.pdf && !selfcheck) { const P = squash(post.pdf.text_normalized); ch.m5_pdf_has_no_stale_wording = STALE.every(s => !P.includes(squash(s))); ch.m5_pdf_has_new_rows = P.includes(squash(T.m5_new_detail_key)) && P.includes(squash(T.m5_card_row_key)); }
  if (!selfcheck) {
    const all = [post.copy, post.screen.result_inner_text, post.print_dom.result_inner_text, post.json_text].join('\n');
    ch.m5_no_stale_wording_any_surface = STALE.every(s => !all.includes(s));
    ch.m5_no_card_warning_claim_unless_rendered = post.m3_frame.label === T.discordant_label || !all.includes('M3 card: ' + T.discordant_label);
  }
  ch.no_page_errors = post.events.page_errors.length === 0 && post.product_console_errors.length === 0;
  if (!selfcheck && E) {
    if (E.card_label) ch.abs_card_label = post.m3_frame.label === E.card_label;
    if (E.m5_hero) ch.abs_m5_hero = post.result.hero.signal === E.m5_hero;
    if (E.m5_md_line) ch.abs_m5_md_line = (line(post.copy, 'Global MD (M3): ') || '').startsWith('Global MD (M3): ' + E.m5_md_line);
    if (E.m5_codes) ch.abs_m5_codes = JSON.stringify(post.result.integration.reason_codes) === JSON.stringify(E.m5_codes);
    if (E.risk) ch.abs_risk_frame = post.m3_frame.risk === E.risk;
  }
  return row;
}

function run(kind, set, preDir, postDir, out, selfcheck) {
  const fixtures = fixturesFor(set), objB = selfcheck ? 'PRE' : 'POST';
  const load = (dir, obj, id) => { const f = C.path.join(dir, obj + '_' + id + '.json'); return C.fs.existsSync(f) ? C.readJSON(f) : null; };
  const ledger = { block: 'G2E EVAL ' + kind + ' ' + set + (selfcheck ? ' (SELFCHECK: two PRE runs, identity transform)' : ''), evaluated_utc: C.now(), expectations_sha256: C.sha256(C.fs.readFileSync(C.FROZEN.G2E_EXP)), pre_dir: preDir, post_dir: postDir, rows: [] };
  for (const fx of fixtures) {
    if (kind === 'host' && set !== 'g2d' && set !== 'g2e' && set !== 'wp3' && fx.dates && fx.dates.length < 2) continue;   // G2-C host grids exclude n = 1
    const pre = load(preDir, 'PRE', fx.id), post = load(postDir, objB, fx.id);
    const row = kind === 'host' ? evalHost(fx, pre, post, set, selfcheck) : isM4(set) ? evalStandaloneM4(fx, pre, post) : evalStandaloneM3(fx, pre, post, selfcheck);
    row.status = !row.error && Object.values(row.checks).every(Boolean) && !row.notes.length ? 'PASS' : 'FAIL';
    row.failed = Object.entries(row.checks).filter(([, x]) => !x).map(([k]) => k);
    ledger.rows.push(row);
  }
  ledger.summary = { fixtures: ledger.rows.length, PASS: ledger.rows.filter(r => r.status === 'PASS').length, FAIL: ledger.rows.filter(r => r.status !== 'PASS').map(r => r.id + ': ' + r.failed.join(',') + (r.error ? ' ' + r.error : '')) };
  C.writeJSON(out, 'G2E_EVAL_' + kind.toUpperCase() + '_' + set.toUpperCase() + (selfcheck ? '_SELFCHECK' : '') + '.json', ledger);
  console.log(JSON.stringify(ledger.summary, null, 1));
}
const a = process.argv.slice(2);
C.mkout(a[a.length - 1]);
if (a[0] === 'selfcheck') run(a[1], a[2], a[3], a[4], a[5], true); else run(a[0], a[1], a[2], a[3], a[4], false);
