# Reproduction kit: evaluation of the revision candidate G2-E

This kit re-runs, on the files in `candidate/`, the evaluation that compared the candidate G2-E with its predecessor G2D-WV1 in October 2026. It uses the same capture harness and the same two evaluators as that campaign.

## What it checks

For each of 145 synthetic fixtures (75 on the standalone M3/M4 pages, 70 in the integrated host), the evaluator compares the candidate's outputs with an **expected output computed from the archived output of the predecessor** by a frozen rule:
- M3 card, copied text, print view and PDF text are unchanged;
- the M3 export gains `functional.display.rendered_label` (equal to the card label) and the new contract and UI versions, nothing else;
- M4 outputs are unchanged;
- in the host, the M5 result and JSON differ only at `functional.display.rendered_label` and `functional.candidate.ui`; M5 decision fields are identical; M5 text changes only by the defined wording replacements; no outdated wording remains on any surface;
- for the 12 G2-E fixtures, absolute expected values (card label, risk, absence of "Low clinical risk", presence or absence of an export, modifier notes, M5 headline, codes and summary line).

The fixtures are those of the G2-E plan (12) and of the earlier steps: G2-D (12), G2-C grids WP1 (18; 17 in the host, where the single-field fixture is skipped as in the earlier campaigns and covered by the G2-E fixtures), WP2 (12), A-02 (2), A-03 (1), M4 p-value series WP3 (14) and four M4 states of T2b (standalone only).

## Two evaluators, both kept

| Evaluator | Status | Expected outcome |
|---|---|---|
| `harness/G2E_EVAL.cjs` (v1.0) | Frozen before the change | 35/145 (27/75 standalone, 8/70 host). The 110 failing fixtures fail only `export_as_expected` or `m3_envelope_as_expected`, and the only differing path is `functional.native.transport_version` |
| `harness_amendments/G2E_EVAL_v1.1_OAE01.cjs` (v1.1) | Post-hoc amendment OA-E01, written after the v1.0 result; approved by the author on 20 October 2026 as a correction of version-metadata expectations only | 145/145 |

v1.1 differs from v1.0 only by setting the new contract version in the pre-existing copy `functional.native.transport_version` (`harness_amendments/G2E_EVAL_v1.1_OAE01.cjs.diff`; record `G2E_OAE01_RECORD.json`). It was not pre-committed. The related amendment OA-E02 of the parity check T2b is documented in `G2E_OAE02_RECORD.json` and its diff; that check is not part of this kit.

`EXPECTED_RESULTS.json` states the expected outcome of every block under both evaluators. It was written into the repository before any run of this release.

## Requirements and commands

- Node.js 22 and npm; bash; `pdftotext` (poppler-utils, used to read print-to-PDF output); `sha256sum` (coreutils).
- Playwright 1.56.0 (pinned in `tests/package.json` and `tests/package-lock.json`) and its Chromium build 141.0.7390.37.

```
cd tests
npm ci
npx playwright install chromium
bash g2e_reproduction/run_reproduction.sh            # writes tests/g2e_reproduction/out/<UTC timestamp>/
```

Output: one folder per capture and evaluation block, a log per block, `RUN_INDEX.csv`, `RUN_LOG.txt` and `SUMMARY.json`. The script exits with 0 only if the outcome matches `EXPECTED_RESULTS.json` (criteria R1–R4 in that file).

## What is in the kit

| Path | Content | Origin |
|---|---|---|
| `harness/G2E_CAPTURE.cjs`, `harness/capture_lib_g2e.cjs`, `harness/G2E_EVAL.cjs` | Capture harness and frozen evaluator | Byte-identical to the G2-E campaign |
| `harness/common.cjs` | Shared utilities | G2-E file with path bindings only (`HADAPT-G3A-01.md`, `harness/common.cjs.diff`) |
| `harness_amendments/` | Evaluator v1.1 and the OA-E01/OA-E02 records and diffs | Byte-identical |
| `frozen/` | Frozen fixture and expectation files of the G2-E, G2-D, G2-C and G2-B plans | Byte-identical to the frozen files of those plans |
| `baseline_pre_captures/` | Archived captures of the predecessor G2D-WV1 (JSON only; screenshots and PDFs omitted) | Byte-identical to the G2-E campaign's PRE captures, which were hash-recorded before the change (`PRE_CAPTURES_PROVENANCE.tsv`) |
| `EXPECTED_RESULTS.json`, `run_reproduction.sh`, `check_expected.cjs`, `KIT_SHA256SUMS.txt` | Predeclared outcome, driver, outcome check, integrity list | Written for this release |

## Environment notes and limits

- Pages are served from 127.0.0.1; every other request (web fonts) is aborted. Standalone pages run with a fixed clock (2026-10-14T10:00:00Z).
- **Host runs emulate the Windows platform hint** (User-Agent Client Hints) because the integrated host accepts only allow-listed engines on Windows. This is not a Windows execution.
- Copy is captured through a clipboard stub; print through Chromium print-to-PDF.
- The predecessor's source (G2D-WV1) is not published; the kit uses its archived captures. The evaluation therefore reproduces the comparison against the archived predecessor output, not a fresh capture of the predecessor.
- The expected outputs are developer-specified. A reproduced result shows that the candidate behaves as specified for these synthetic inputs; it does not show clinical appropriateness.
- Other test batteries of the revision (pressure cases, limitation scenarios, parity states, numerical tables) need unpublished earlier candidates as comparison objects and are not included; their records are in `evidence/g2e_campaign_20261020/`.
