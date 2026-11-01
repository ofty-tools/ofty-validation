# Release check (G3-B, 20 October 2026)

Checks of this release before publication, after the reviewer navigation page replaced the earlier `candidate/index.html` and the M1 Advanced module was removed. The test plan with its oracles and expected results (`G3B_TEST_PLAN_PREDECLARED.md`) and the three test scripts in `tools/` were frozen at 14:18:10 UTC (`FROZEN_PLAN_SHA256SUMS.txt`), before any change to the release tree. In this folder the plan is at the top level, not in `frozen/` as the list says; check it with `sha256sum G3B_TEST_PLAN_PREDECLARED.md` against the first line of the list. Times are UTC and self-recorded.

The tests ran twice, each time on a clean extraction of a frozen copy of the tree:

- **Round 1** (tree frozen 14:20:44): files at the top level of this folder.
- **Round 2** (tree frozen 14:46:05), in `postfc/`: after an independent documentation fact-check, one sentence of the navigation page (which modules carry staging labels) and four documentation files were corrected, and the tests were run again on the corrected tree. Same scripts, same oracles; P0 and P4-PRE were not repeated.

| Test | What | Round 1 | Round 2 | Matches the predeclared expectation |
|---|---|---|---|---|
| P0 | Integrity of the starting tree (G3-A staging tree) | 361/361 and 13/13 verify | — | yes |
| P1, P8 | `tools/hash_continuity.py`: the 8 retained G2-E files; the new navigation page; M1 Advanced; file set of `candidate/`; hash lists | all checks true | all checks true | yes |
| P2, P3 | `tools/nav_test.cjs`, Playwright 1.56.0, headless Chromium 141.0.7390.37 on Linux, `candidate/` served on 127.0.0.1 | the navigation page opens M1–M4 and the M5 host (title checks); the orchestrator alias reaches the host; the back links of M1–M4 return to the navigation page | same | yes |
| P4 | Same script: requests and source of the navigation page | 1 local request, 0 to other origins, 0 cookies; no script, analytics, external link or resource. M1–M4 load Google Fonts (`fonts.googleapis.com`), reported and not changed | same | yes |
| P4-PRE | Same script on the unchanged G3-A staging tree (descriptive) | FAIL, as expected: the earlier page loaded Google Analytics and Google Fonts, used absolute website links and lacked the relative module links (the click test stopped with a timeout) | — | yes (expected failure) |
| P5 | `tools/privacy_scan.py` | no secrets, no patient data, no images or archives, no unsupported regulatory statement | same (hits inside this folder are search patterns, see below) | yes |
| P6 | `CITATION.cff` against the CFF 1.2.0 schema | — | VALID | yes |
| P7 | `npm ci` (playwright 1.56.0; Chromium preinstalled, `npx playwright install` not run); `tests/h1_historical/run_h1_headless.cjs`; `tests/g2e_reproduction/run_reproduction.sh` | H1: engine 1.0.0, 146/146, 192/192, no page error, no request. Kit: v1.0 27/75 + 8/70 = **35/145**; v1.1 **145/145**; REPRODUCED | same results (kit 14:46:40–14:53:00) | yes |

The pass results concern synthetic inputs and developer-specified expectations; they are not clinical validation. Host tests emulated the Windows platform hint on Linux; no Windows execution took place.

**After the runs.** This folder (and its lines in `SHA256SUMS.txt`) was added after the runs. Apart from this folder and the regenerated root `SHA256SUMS.txt`, the release is byte-identical to the round-2 tree, including the 9 files of `candidate/`, every file of `tests/`, the H1 runner, `rules/`, `scenarios/` and all documentation.

**Contents.** `frozen/` holds the two starting-tree inventories used by `tools/hash_continuity.py`; they list the files of the G3-A staging tree, including the M1 Advanced paths removed here. `P7_g2e_reproduction/` and `postfc/P7_g2e_reproduction/` hold the summary, run index, run log, 30 evaluation ledgers and 15 capture ledgers of each kit run; screenshots and PDFs are not included. `PROVENANCE.tsv` lists each record with its original hash; machine-specific paths were replaced by placeholders such as `<RELEASE_TREE>` and `<RUN_OUTPUT>`, and both hashes are listed. In `G3B_RUN_INDEX.csv` the last column of the rows that start before 14:32 is the exit status of the time-stamp command, not of the test (a recording error found after the runs); the outcome of each test is in its own record. The privacy scanner, the test plan, the navigation script and their outputs contain search patterns (tracking identifiers, path fragments, credential words, the excluded regulatory wording); a scan of the release therefore reports hits in these files, which are search terms or records of the earlier page, not content of that kind.
