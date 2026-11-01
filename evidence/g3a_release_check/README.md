# Release check (G3-A, 20 October 2026)

Test run on the release tree before publication. The test plan and its expected results (`G3A_TEST_PLAN_PREDECLARED.md`) were frozen at 11:51:15 UTC (`FROZEN_PLAN_SHA256SUMS.txt`), before any run. All runs used a clean extraction of the frozen release tree (284 files). Times are UTC and self-recorded.

| Test | What | Result | Matches the predeclared expectation |
|---|---|---|---|
| T-A | Integrity: release hash list 284/284; `candidate/` 13/13 equal to the G2-E manifest; historical files equal to tag `v1.0.0-paper2` and `main`; kit hash list 184/184 | all OK | yes |
| T-B0 | `npm ci` from the lockfile (playwright 1.56.0). The Chromium build 141.0.7390.37 was preinstalled; `npx playwright install` was not run (downloads disabled in the test environment) | installed | yes (declared deviation) |
| T-B1 | `tests/h1_historical/run_h1_headless.cjs` | engine 1.0.0; 146/146 assertion instances; 192/192 combinations; no page error; no network request | yes |
| T-B2 | `tests/g2e_reproduction/run_reproduction.sh` | v1.0: 27/75 + 8/70 = **35/145**; v1.1: **145/145**; outcome REPRODUCED | yes |
| T-C | Earlier batteries on the release `candidate/` (not public; need unpublished comparison objects) | helper grid 496/496, monotone 16/16; numerical table 797/94 with 41 FAIL→PASS and 0 PASS→FAIL; M5 version matrix 12/12; M4 p-value series 14/14; pressure cases 50/50; limitation scenarios 28/28; T1b 2/2; T1c 3/3; T1d PASS; T2b 4/8 before OA-E02 and 8/8 after; T4 PASS; T2c fails `M5_W1_in_host_unchanged` (by design) and, before OA-E02, `T2b_not_assessable_PASS` | yes |
| T-D | Integrated host on Linux headless Chromium **without** Windows emulation (descriptive) | engine `unlisted`, `browser_engine_unverified`; integrated result computed and shown; Copy, Print and JSON export disabled; standalone M3 page works | descriptive |
| T-E | Documentation cross-check of cited hashes and versions | all cited version strings found in the sources; all cited hashes match files of the release, of the website repository history or of identified input archives (the 6 hashes reported as "unmatched" in `T-E_doc_crosscheck.log` are input archives: the G2-E and G3-A handoffs, the two G2-D archives, the G2-E closeout attestation and the G2-E audit report) | yes |

The pass results above concern synthetic inputs and developer-specified expectations. They are not clinical validation. Host tests other than T-D emulated the Windows platform hint; no Windows execution took place.

**Files changed after the freeze.** Between 11:53 and 12:04 UTC, while the runs used the frozen clean extraction, documentation in the staging copy was corrected (no code, test or candidate file): `CITATION.cff` (required CFF field `message` added; the schema check of T-E had failed without it), `README.md` §4 and `docs/KNOWN_LIMITATIONS.md` (browser allow-list behaviour from T-D), `docs/OBJECTS_AND_VERSIONS.md` (locations of the historical modules), and, after the runs, wording fixes from the independent fact-check. The final `SHA256SUMS.txt` lists the published files; the 13 source files and `SHA256SUMS.txt` of `candidate/`, every file of `tests/`, the H1 runner, `rules/` and `scenarios/` are byte-identical to the tested tree (only the documentation file `candidate/README.md` was reworded).

`PROVENANCE.tsv` lists each record with its original hash; machine-specific paths were replaced by placeholders such as `<RELEASE_TREE>` and `<RUN_OUTPUT>`.
