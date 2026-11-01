# G2-E · Frozen test plan: M3/M5 semantic alignment

**Status:** frozen before any edit of the G2E-WV1 working copy. The freeze time is the header of `FROZEN_PLAN_SHA256SUMS.txt`.
**Mandate:** handoff `OFTY_PAPER2_G2E_M3_M5_SEMANTIC_ALIGNMENT_CLAUDE_HANDOFF_20261020.zip`, SHA-256 `a031187f…f910`. The author's GO was given on 20 October 2026.

## 1. Objects

| Name | What | Identity |
|---|---|---|
| PRE = G2D-WV1 | `final_source/G2D-WV1` of the local G2-D package (inner ZIP `039d444c…a3f8`, transport `a3b9283b…c192`), read-only | Byte-identical to `BASELINE_G2D_UNMODIFIED/` (13/13) |
| POST = G2E-WV1 | Copy of PRE + `patch/apply_g2e_patches.py` | Exactly two files change: `vf-progression/index.html`, `gate2/index.html` |
| G2C-WV1, G2B-WV1, C1, M5TC | History and regression slots | As in G2-D |

**Logged checks** (`runs/*_INPUT_IDENTITY_CHECK.log`):
- the full G2-D package is present locally and verifies 2518/2518;
- the handoff reference evidence, harness and frozen G2-D plan are byte-identical to it.

## 2. Baseline reproduction on PRE (before the freeze)

Runs `runs/*_BASELINE_PRE_STANDALONE` and `*_BASELINE_PRE_HOST`; fixtures in `designtools/baseline_e_fixtures.json`.

| Case | Observed on PRE |
|---|---|
| O-6 significant fast (noisy n12) | M3 card "Discordant indicators — clinical review needed"; export `display.label` "Stable"; no field states the rendered label. M5 COPY: "Not reconciled (displayed: No progression detected; native classification indicates progression)". The caution says "…whereas the displayed current interpretation is stable…", the narrative says "…between its native classification and its displayed interpretation", and the detail row "Source display interpretation" reads "Stable". **The stale M5 wording is reproduced.** |
| A1 non-significant moderate (G2D-O6-nonsig) | M3 card "No progression detected"; M5 A1 conflict with the same "displayed:" wording plus `non_significant_trend` |
| A1 plateau branch (new, design aid P-a, M3 branch L3568) | M3 card "No progression detected"; M5 "Historical progression followed by a plateau (displayed: No progression detected)"; codes `history_vs_current_plateau`, `inconsistent_functional_pattern`, `non_significant_trend` |
| n = 1 with central threat / monocular / both | Card "Not assessable" with risk **High / Moderate / High** and the modifier notes. No export; in the host, M3 is not published and M5 is not ready. **The protective escalations are present on PRE.** |

**Design aid** (PRE only, `designtools/run_candidates_e.cjs`, `diag/design_plateau_PRE`): all five n = 5 step-plateau candidates gave a non-significant native slope. No significant M5-plateau-branch case was found, so the plateau branch is tested with a non-significant case. The significant O-6 cases all reach the M5 *unresolved* branch, including the M3 plateau rule L3139.

## 3. Changes under test (frozen patch `patch/apply_g2e_patches.py`; 11 M3 edits and 6 M5 edits)

| ID | Change |
|---|---|
| G2E-01 (M3) | One central decision `cardLabel` (= the existing G2-D expression) feeds the card, the COPY and the new export field `functional.display.rendered_label`. `functional.display.label` keeps its key, values and meaning (pattern-rule label read by M5). Export contract `transport_version` gate2-m3-0.2.0 → 0.2.1 (additive); M3 UI 2.6.1 → 2.6.2. M3 visible output does not change. |
| G2E-02 (M5 page only) | **A1 wording.** The unresolved and plateau lines attribute "No progression detected" to the M3 pattern-rule label. The M3 card is named only from `rendered_label`: "M3 pattern-rule label and card: No progression detected", or "M3 pattern-rule label: No progression detected; M3 card: <label>". Without `rendered_label`, no card claim is made. The A1 caution and the narrative clause say "pattern-rule interpretation". |
| | **Detail rows.** "Source display interpretation" → "Source pattern-rule label (M3)", plus a new row "M3 card label" (`rendered_label`, or "Not available"). |
| | **Version.** M5 UI staging label v0.4.7 → v0.4.8. |
| | **Not touched:** `gate2/semantic.cjs`; the M5 rule, codes, hero, concern, disposition, guards and confidence. |
| Confidence (item 4) | Documentation only. No UI text and no value change. |

## 4. Fixtures

**G2-E set** (`G2E_EXPECTATIONS.fixtures`, 12; expected values established on PRE):

| Fixture | Group |
|---|---|
| E-O6-sig-fast | O-6 significant fast |
| E-O6-sig-moderate | O-6 significant moderate |
| E-O6-sig-plateauFixC | O-6 significant, M3 plateau rule; M5 unresolved branch |
| E-A1-nonsig-moderate | M5 A1 without M3 warning |
| E-A1-plateau-L3568-nonsig | M5 plateau branch |
| E-clean-stable | CLEAN_DOMAIN control |
| E-HS1-n1, -ct, -mono, -ct-mono | n = 1 with no modifier, central threat, monocular, both |
| E-HS2-floor | Floor |
| E-native-insufficient | WP1-T4A-n3-24m: G2-B T4 / G2-C P1 |

**Regression sets**, re-run PRE vs POST:
- the 12 G2-D fixtures;
- G2-C WP1 (18), WP2 (12), A-02 (2), A-03 (1), WP3 (14 M4);
- G2-B T2b M4 states (4).

## 5. Oracles

The evaluator is `harness/G2E_EVAL.cjs`, frozen. Expected POST is the frozen transform of the PRE capture (`G2E_EXPECTATIONS.expected_post_transform` and `texts`):

| Surface | Expected |
|---|---|
| M3 standalone | Card, COPY, print and PDF text unchanged. Export = PRE + `rendered_label` (= PRE card label) + `transport_version` 0.2.1 + `candidate.ui` 2.6.2. `display.label` unchanged. No export where PRE had none. |
| M4 | Unchanged |
| Host M5 machine output (result, JSON) | Identical except `functional.display.rendered_label` and `functional.candidate.ui`. Hero, concern, disposition, codes, guards, confidence, selected rule, `display.label` and native fields identical. |
| Host M5 text (COPY, screen, print DOM) | PRE text with the frozen replacements, the detail-row change and the UI label |

**Absolute checks:**
- `rendered_label` = card label = COPY Progression label.
- No stale wording ("displayed: No progression detected", "displayed current interpretation", "its displayed interpretation", "Source display interpretation") on any M5 surface (COPY, screen, print DOM, PDF, JSON).
- No "M3 card: Discordant…" claim unless the M3 card shows it.
- Per-fixture expected card label, risk, M5 hero, codes and MD-line prefix; for n = 1, no "Low clinical risk", no export, and the modifier note present.
- Versions on every POST export.

**Evaluator validation on PRE only, before the freeze** (`diag/design_eval_validation`):
- two independent PRE runs, identity self-check: 12/12 standalone and 12/12 host;
- PRE A1 COPYs contain the stale strings the transform targets: 3 on unresolved cases, 1 on the plateau case.

## 6. G2-B/G2-C batteries on POST (HADAPT-E01/E02, `harness/make_g2c_rerun_binding_g2e.py`)

The binding is done before execution; every new file has a diff and the originals are unchanged.

**Expected results** (declared now):

| Battery | Expected on G2E-WV1 |
|---|---|
| WP2 helper grid (M3 Student-t vs SciPy) | 496/496, monotone 16/16 |
| T3 + transitions vs the G2-C PRE T3 | PASS: 797/94, 41 FAIL→PASS, 0 PASS→FAIL |
| M5 version matrix | 12/12 (`semantic.cjs` unchanged) |
| WP3 M4 standalone (G2-C evaluator, PRE = G2-C PRE run) | 14/14 |
| T1 (50, AS-M1), T2 (28, AS-M2) via v1.2_G2E + s81_modules_g2e | 50/50, 28/28 |
| T1b via wrapper | 2/2 |
| T1c real host | 3/3 |
| T1d | PASS |
| T2b via G2C_MODULES_v1.2_G2E | 8/8 |
| T4 | POST PASS (A, B); PRE G2B-WV1 STOP reproduced |
| **T2c** | **FAIL on exactly one check, `M5_W1_in_host_unchanged`.** That check requires the M5 page hash to equal G2B-WV1's, and the M5 page is an authorized G2-E change. The W1 sentence-presence part of the same check holds. All other T2c checks PASS. |

**Not run, with reason:** the G2-C PRE(G2-B run)-vs-POST capture comparisons (OA-02 T1/T2). They compare M5 N-side text to G2-B runs after version normalization only, so the authorized M5 wording would fail them by design. The strict O/N comparisons of T1/T2 under HADAPT-E02 cover the same surfaces.

Any other failure is a deviation and is investigated; a regression without authorized explanation is a STOP.

## 7. Environment and limits

- Linux, Node 22, Playwright 1.56, headless Chromium 141. Standalone runs use a fixed clock; host runs emulate the Windows UA-CH platform on Linux Chromium (not a Windows execution).
- Synthetic data only. Localhost only. Print = print-media DOM and Chromium PDF; COPY = clipboard stub.
- No Git, GitHub or LIVE action. FROZEN dossiers, G2-B/G2-C/G2-D evidence and historical snapshots are not modified.

## 8. Run order

1. Freeze.
2. PRE captures, all sets, standalone and host; then the PRE capture hash list.
3. Apply the patch.
4. POST captures and G2-E evaluations.
5. G2-B/G2-C batteries.
6. Post-run integrity check.

Failures are kept; nothing is re-run silently.
