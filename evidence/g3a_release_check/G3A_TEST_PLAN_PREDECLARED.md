# G3-A · Test plan for the staged release tree (declared before execution)

**Object under test:** the staging tree `B_STAGING_TREE/ofty-validation`, frozen in `STAGING_TREE_PRETEST_SHA256SUMS.txt` (284 files, 2026-10-20T11:50:37Z). Tests run on a **clean extraction** of a tar archive of that tree into a new folder (`cleanpath/`), never on the staging folder itself. The 13 files in `candidate/` are byte-identical to G2E-WV1 (inner ZIP `856eb721…7d75`); no source change was made in G3-A.

**Rules:** no oracle is changed after a result is seen; every failure is kept; a result different from the expectation below is reported as a deviation and assessed (STOP if a clinical or semantic regression is not explained). Synthetic data only; localhost only; no Git, GitHub or deployment action.

## T-A Integrity (clean path)

| ID | Check | Expected |
|---|---|---|
| A1 | `SHA256SUMS.txt` of the extracted tree | 284/284 |
| A2 | `candidate/SHA256SUMS.txt` = G2-E `AFTER_CHANGE_MANIFEST.sha256`; 13/13 | identical; OK |
| A3 | Historical files (`OFTY_SUITE_TEST_RUNNER.html`, `rules/*`, `scenarios/*`, `LICENSE`) byte-identical to `ofty-validation` tag `v1.0.0-paper2` and to `main` (`cf5c394`) | identical |
| A4 | `tests/g2e_reproduction/KIT_SHA256SUMS.txt` | 184/184 |

## T-B Public reproduction kit (exact commands of the README, from the clean path)

| ID | Command | Expected |
|---|---|---|
| B0 | `cd tests && npm ci` | installs playwright 1.56.0 from the lockfile. The Chromium build is the preinstalled revision 1194 (141.0.7390.37) referenced by `PLAYWRIGHT_BROWSERS_PATH`; `npx playwright install chromium` is not run because browser downloads are disabled in this environment (declared deviation from the README sequence). `NODE_PATH` is cleared so that only the local install is used. |
| B1 | `node h1_historical/run_h1_headless.cjs` | H1 hash OK; engine 1.0.0; 23 scenarios; 146 run / 146 passed / 0 failed; 192/192 combinations; no page error; no blocked request; exit 0 |
| B2 | `bash g2e_reproduction/run_reproduction.sh` | outcome REPRODUCED: v1.0 27/75 + 8/70 = 35/145 with only `export_as_expected` / `m3_envelope_as_expected` failing and only `functional.native.transport_version` differing; v1.1 75/75 + 70/70 = 145/145; all blocks exit 0; exit 0 |

## T-C Internal batteries on the staged candidate (not public; need C1 and M5TC)

Layout: `make_workspace_layout_g2e.sh` from the G2-E package, then the POST source folder of the layout is replaced by a symbolic link to `cleanpath/ofty-validation/candidate` (HADAPT-G3A-02; no harness file changed). Blocks and commands as in the G2-E `RUN_INDEX_G2C_RERUN.csv`. Expected (same as G2-E, because the candidate files are byte-identical):

| Block | Expected |
|---|---|
| WP2 helper grid | 496/496; monotone 16/16 |
| T3 + transitions vs G2-C PRE T3 | 797 pass / 94 fail; 41 FAIL→PASS; 0 PASS→FAIL |
| M5 version matrix | 12/12 |
| M4 WP3 + evaluation vs G2-C PRE WP3 | 14/14 |
| T1 pressure (v1.2 driver) | 50/50 |
| T2 S28 W-1 (v1.2 driver) | 28/28 |
| T1b | 2/2 |
| T1c host | 3/3 |
| T1d | PASS |
| T2b v1.2 (HADAPT-E01-b) | 4/8: the four M3 states fail `m3_payload_diff_only_versions` (known; fixed by OA-E02) |
| T2b v1.3 (OA-E02) | 8/8 |
| T4 | POST A and B PASS |
| T2c with the T2b v1.2 run | FAIL on `M5_W1_in_host_unchanged` and `T2b_not_assessable_PASS` |
| T2c with the T2b v1.3 run | FAIL on `M5_W1_in_host_unchanged` only |

## T-D Reviewer-environment probe (descriptive, no pass criterion)

Open the integrated host of the clean-path candidate in headless Chromium **without** Windows UA-CH emulation (Linux platform hint), complete M1–M4 with the T1c-H2 inputs, and record: the allow-list decision (`engine_id`, `status`), the reason codes, whether integration and export are allowed. Also record that the standalone M3 page computes a result without emulation.

## T-E Documentation consistency

| ID | Check | Expected |
|---|---|---|
| E1 | Every number in README §3–§6 and `docs/*.md` that refers to a test result matches the ledgers in `evidence/` or the T-B/T-C runs | all match |
| E2 | Versions and hashes stated in README, `docs/OBJECTS_AND_VERSIONS.md`, `candidate/README.md`, `CHANGELOG.md` match the files (candidate source constants; ofty repository snapshot) | all match |
| E3 | `CITATION.cff` is valid YAML and validates against the CFF 1.2.0 schema (cffconvert, if installable) | valid |
| E4 | Privacy/secret scan of every staged file: no patient data, no Rotterdam files, no tokens or keys, no absolute local paths, no e-mail other than the author's public contact, no screenshots or PDFs | clean; the Google Analytics tag in `candidate/index.html` is reported as a finding |

## Not executed (declared)

Genuine Windows; macOS, Firefox or Safari manual use; physical printing; operating-system clipboard; `npx playwright install` download; the MA3–MA6 source documents (only text extracts are available; corrections are prepared as text); any clinical evaluation; any Git, GitHub or website action.
