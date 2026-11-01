# OFTY Glaucoma Suite — Paper 2 repository (historical test materials and revision candidate)

This repository supports the manuscript *Glaucoma Clinical Decision Support: Combinatorial Verification of a Modular Rule-Based Architecture for Implementation Fidelity* (A. Ragosta), under major revision at *JMIR Formative Research* (manuscript #105677). It contains two separate things, which should not be confused:

1. **Historical materials of the submitted manuscript**, kept unchanged: the test runner H1 and the descriptive JSON files. They are the state tagged `v1.0.0-paper2`.
2. **A post-submission revision candidate** (`candidate/`, label G2-E): corrected M1–M5 source code prepared during the revision, with its synthetic test evidence and a reproduction kit.

> **Status of the software.** OFTY is a **research prototype**, **not intended or cleared for clinical use**. Its clinical validity and regulatory status have **not** been established by the tests in this repository, which use synthetic data and developer-specified expectations. It is not intended for patient use. The candidate in `candidate/` is **not** the public website (ofty.vercel.app) and is not deployed there. The interface texts of the candidate still carry staging labels such as "DRAFT / REQUIRES_AUTHOR_FINAL_COPY_APPROVAL" and "unpublished staging build; not a software release": they mean that the user-facing wording has not had its final approval and that this is not a clinical software release.

---

## 1. What is where

| Path | Content | Status |
|---|---|---|
| `OFTY_SUITE_TEST_RUNNER.html` | **H1**: historical test runner v2.1 with an **embedded** copy of the M5 engine version 1.0.0 | Unchanged since tag `v1.0.0-paper2` (SHA-256 `fbd64e42…0463`) |
| `rules/*.json`, `scenarios/*.json` | Descriptive rule and scenario files published with the submission | Unchanged. **Descriptive only; not read by H1** (see §3) |
| `candidate/` | The revision candidate **G2-E**: **8 source files** of M1–M5 and the integrated M5 host, byte-identical to the candidate approved on 20 October 2026, plus **1 navigation page** (`candidate/index.html`) written for this release | New in this release (`candidate/SHA256SUMS.txt` lists the 9 files) |
| `docs/` | Object and version map, export contract, numerical notes, changes since submission, historical errata, known limitations | New |
| `tests/` | `h1_historical/` (headless re-execution of H1) and `g2e_reproduction/` (reproduction of the candidate evaluation) | New |
| `evidence/` | Machine-readable records of the candidate test campaigns | New |
| `CHANGELOG.md`, `CITATION.cff`, `LICENSE` | Version history (with corrections of earlier statements), citation metadata, MIT licence | Updated / unchanged |
| `SHA256SUMS.txt` | SHA-256 of every file in this release except itself | New |

## 2. Software objects and versions

A test result applies only to the object that was tested. The objects below are distinct (details and hashes: `docs/OBJECTS_AND_VERSIONS.md`).

| Label | Object | M5 version | Tested by |
|---|---|---|---|
| **H1** (HIST-T) | Runner v2.1 in this repository with M5 1.0.0 embedded | 1.0.0 | The pass results reported in the submitted manuscript (23 scenarios; 192 combinations) |
| **H2** (HIST-D) | Historical M5 page (deployment at submission inferred from repository history; `ofty-tools/ofty`, commit `fffdcc6`, `glaucoma/orchestrator/index.html`; header says "v1.0.1", engine constant 1.0.2) | 1.0.2 | Not tested; compared statically with H1 |
| **C1 → G2-E** | Post-submission candidate line; G2-E is the version in `candidate/` | `gate2-semantic-0.3.1` (integrated host) | The synthetic campaigns in `evidence/` (October 2026) |
| **LIVE** | The public website ofty.vercel.app, source `ofty-tools/ofty` (`main`) | 1.2.0 (source header) at commit `bac6f39`; the website itself was not inspected | Not covered by this repository |

The pass results of H1 do not transfer to H2, to the candidate or to the website, and the candidate's test results do not transfer to H1, H2 or the website.

## 3. The historical runner H1

H1 is a single HTML file. It contains the M5 1.0.0 engine and its tests. **It loads no external script, fetches no data and has no configuration block that selects another engine.** Earlier versions of this README and of Multimedia Appendix 6 stated that the runner "loads the deployed M5 engine" and could be pointed at a local copy of an engine file; both statements were incorrect (see `docs/HISTORICAL_MATERIALS_AND_ERRATA.md`).

What H1 tests:
- **Scenario pass:** 23 developer-defined scenarios carrying **146 expected assertion instances** (classification, pattern, risk, pressure status, required and excluded flags, 5 text substrings, 9 additional checks). The expected values were written by the developer of the rules.
- **Combinatorial pass:** 6 M3 states × 8 M4 states × 4 pressure contexts = **192 combinations**, each checked with five predicates A1–A5 (no exception; classification in the allowed set and not the catch-all unless both domains are absent or unclassifiable; risk, confidence and text domains). No predicate checks the expected value of an output for a given combination. The sixth M3 state and the eighth M4 state are *module absent*.
- The two passes use different units. "215" (23 + 192) and the runner's own on-screen total are mixed-unit labels.
- Inputs are fixed synthetic payloads built inside H1 (`_trM1`–`_trM4`). No M1–M4 algorithm is executed. In every scenario that supplies both, the M1 adjusted IOP equals the M2 current IOP, so H1 cannot show which of the two M5 uses.

How to run it:
- **Manually:** open `OFTY_SUITE_TEST_RUNNER.html` in a current browser. The tests run on page load; results appear on the page and in the browser console. No network access is needed.
- **Headless:** `node tests/h1_historical/run_h1_headless.cjs` (requirements in §6). Expected: M5 engine 1.0.0, 146/146 assertion instances, 192/192 combinations.

**Dating.** The pass results were reported at submission (changelog of tag `v1.0.0-paper2`; the manuscript). No contemporaneous execution log of that run is available. Re-executions of the unchanged file were archived on 10 October 2026, after submission; any run of the script above is also a post-submission re-execution.

The files in `rules/` and `scenarios/` are descriptive documents. They were not executed by H1 and differ from what H1 executes (for example, `manual_scenarios.json` declares 146 assertions, but its per-scenario counts sum to 143 and its scenarios differ from H1's). They are kept as published.

## 4. The revision candidate G2-E (`candidate/`)

The candidate contains corrections made after submission in response to the reviewers. They are **corrections of the candidate, not historical results**: none of them was present in H1, H2 or the submitted manuscript, and none is on the public website. The full list, with test evidence and caveats, is in `docs/CHANGES_SINCE_SUBMISSION.md`. In brief:

- **Pressure comparison (reviewer comment AS-M1).** M1 shows the measured Goldmann IOP as the primary value and its CCT-based number only as an ancillary estimate; M2 asks for the measured Goldmann IOP. M5 compares the measured Goldmann IOP entered and attested in M2 with the M2 target range and never uses the M1 estimate; this M5 behaviour was introduced in the post-submission candidate C1 (see below) and re-tested with the corrections. The historical H1/H2 behaviour (the M1 CCT-adjusted value was the comparator when available) is not changed in the historical files.
- **Global-index limitation (AS-M2).** M3 and M4 state on every result card and in the copied text that they use global MD or average RNFL only and may miss focal or sectoral progression; M5 keeps its integrated limitation statement on screen, in the copied text, in print and in the JSON export.
- **M3 insufficient series.** A series that the M3 engine classifies as insufficient is shown as *Not assessable*, without a stability, progression or risk category derived from the trend.
- **M3 p-value.** The two-sided Student-t p-value is corrected for very small t statistics.
- **M4 p-value.** The p-value is exported unrounded and displayed with 4 decimals, never on the other side of 0.05 or 0.10 than the value used for significance.
- **M3 presentation.** A single field shows *Indeterminate* rather than *Low* clinical risk; a slope shown with a *Not assessable* result is labelled descriptive only; when the MD regression shows a statistically significant moderate or faster decline but the pattern rules report no progression, the card shows *Discordant indicators — clinical review needed*.
- **M3 → M5 export contract.** The export adds `functional.display.rendered_label` (the label shown on the card) next to `functional.display.label` (the pattern-rule label read by M5). Contract `gate2-m3-0.2.1`. See `docs/M3_M5_EXPORT_CONTRACT.md`.

The candidate also carries changes made after submission and before these corrections, notably the M2 target policy **B-narrow-O1-0.4.1**: for mild and moderate primary open-angle glaucoma, and for normal-tension glaucoma with confirmed progression in mode B, a thick CCT no longer raises the target range. M2 in the candidate (1.1.0-gate2.1) is therefore not the submitted M2 1.0.0. See `docs/CHANGES_SINCE_SUBMISSION.md` §2.

### Versions in the candidate

| Module | File | Algorithm | UI / other |
|---|---|---|---|
| M1 IOP/CCT | `candidate/iop-cct/index.html` | 1.0.0 | UI 1.2.0 |
| M2 target IOP | `candidate/target-iop/index.html` | 1.1.0-gate2.1 | target policy B-narrow-O1-0.4.1 |
| M3 visual field | `candidate/vf-progression/index.html` | 2.3.1 | UI 2.6.2; export contract gate2-m3-0.2.1 |
| M4 RNFL | `candidate/rnfl-progression/index.html` | 1.3.1 | UI 1.8.2 |
| M5 integration | `candidate/gate2/semantic.cjs` (engine), `candidate/gate2/index.html` (host), `candidate/gate2/session.js` | gate2-semantic-0.3.1 | host UI v0.4.8-ui-aprime-staging-A1 |

`candidate/orchestrator/index.html` only redirects to the integrated host. `candidate/index.html` is a **navigation page written for this release** (not one of the G2-E source files): it links to the five modules, gives the status notice, and contains no scripts, tracking or external resources. The G2-E candidate approved on 20 October 2026 had 13 files; for this release its copy of the website's Glaucoma Suite landing page (which carried the website's analytics tag and links to website paths) was replaced by this navigation page, and the four files of the separate M1 Advanced module, which is outside the scope of the manuscript and not used by M5, were left out. The other 8 files are unchanged.

### Running the candidate locally

The pages must be served over HTTP (not opened as files):

```
cd candidate
python3 -m http.server 8000 --bind 127.0.0.1
```

Then open `http://127.0.0.1:8000/` (the navigation page), or directly `/iop-cct/` (M1), `/target-iop/` (M2), `/vf-progression/` (M3), `/rnfl-progression/` (M4) or `/gate2/` (integrated M5 host); the M1–M4 pages link back to the navigation page. The navigation page makes no network request; the unchanged M1–M4 pages load web fonts from Google. No patient data are needed or should be entered.

**Browser restriction of the integrated host.** The M5 host (`/gate2/`) accepts only browser engines on an allow-list (Microsoft Edge or Chromium ≥ 120 on Windows, identified through User-Agent Client Hints), marked `staging_target_pending_verification`. On other browsers or operating systems (observed on headless Chromium under Linux before publication) the host still computes and shows the integrated result, but marks the browser engine as unverified (`browser_engine_unverified`) and disables Copy, Print report and Download JSON. The automated tests in this repository run on headless Chromium under Linux with the Windows platform hint **emulated**; they are not a Windows execution. The single-module pages (M1–M4) are not restricted.

## 5. Test evidence for the candidate

The candidate was tested on synthetic data in October 2026 (records in `evidence/`, summary in `docs/CHANGES_SINCE_SUBMISSION.md`). The main evaluation compared each output of the candidate with the output of its predecessor (G2D-WV1) transformed by a frozen rule:

| Evaluator | Standalone pages | Integrated host | Total |
|---|---|---|---|
| v1.0 (frozen before the change) | 27/75 | 8/70 | **35/145** |
| v1.1 (amendment OA-E01, written after the result) | 75/75 | 70/70 | **145/145** |

All 110 v1.0 failures had one cause: the frozen expected export omitted the new contract version in a second, pre-existing copy of the field (`functional.native.transport_version`). Amendment OA-E01 adds that value and nothing else. A related check of the earlier test battery (T2b) gave 4/8 before and 8/8 after the same correction (OA-E02). **Both amendments were written after the failures were seen; they were not pre-committed.** The author approved them on 20 October 2026 as corrections of version-metadata expectations only. The original failing outputs are kept in `evidence/`.

Other batteries re-executed on the candidate include: M3 Student-t helper against SciPy 496/496; the AS-M1 pressure cases 50/50; the M5 integrated-limitation scenarios (AS-M2) 28/28; the M3/M4 card, copy and export parity states 8/8 (after OA-E02); the M5 version matrix 12/12; and the M4 p-value series 14/14. One check of that battery (T2c `M5_W1_in_host_unchanged`) fails by design, because it requires the M5 host page to be byte-identical to an earlier version and that page was changed. These are tests against developer-specified expectations for selected synthetic inputs. They are not clinical validation and do not show that the rules are clinically appropriate.

## 6. Reproducing the tests

Requirements: Node.js 22, `npm`, `bash`, `sha256sum` (coreutils), `pdftotext` (poppler-utils) and the Chromium build used by Playwright 1.56.0.

```
cd tests
npm ci
npx playwright install chromium           # Chromium 141.0.7390.37 for Playwright 1.56.0
node h1_historical/run_h1_headless.cjs    # historical runner H1
bash g2e_reproduction/run_reproduction.sh # candidate evaluation, about 10 minutes
```

`run_reproduction.sh` verifies the hashes, captures the candidate in 15 blocks, evaluates every block with the frozen evaluator v1.0 and with v1.1, and compares the outcome with `tests/g2e_reproduction/EXPECTED_RESULTS.json`, which was written before any run of this release. A faithful reproduction gives **35/145 under v1.0 and 145/145 under v1.1**. Details, adaptations and limits: `tests/g2e_reproduction/README.md`. Records of the release-check runs: `evidence/g3a_release_check/` (G3-A staging tree, 13 G2-E files) and `evidence/g3b_release_check/` (this release: 8 G2-E files + navigation page).

The earlier batteries (pressure, limitation and parity sets) need two earlier unpublished candidates as comparison objects and are not part of the public kit; their records are in `evidence/`.

## 7. Data

This repository contains no patient data. The exploratory real-world analysis described in the manuscript used the Rotterdam longitudinal visual field dataset under its own licence; neither those data nor any derived clinical material are included here.

## 8. Licence, citation and contact

MIT Licence (`LICENSE`). Citation metadata: `CITATION.cff`.

Andrea Ragosta, MD, FEBO — Admiravisión Ophthalmology Department, Clínica Sagrada Familia, Barcelona, Spain — <dott.andrea.ragosta@gmail.com>

## 9. Versions of this repository

| Tag | Content |
|---|---|
| `v1.0.0-paper2` | State at submission (tagged commit `f9ba72c`, 29 April 2026): H1, descriptive JSON files, README, CHANGELOG, CITATION. Never moved. |
| `v1.1.0-paper2-r1` | This release: historical files unchanged, revision candidate G2-E, documentation, tests and evidence. *(Tag name proposed; set at publication.)* |
