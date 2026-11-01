# Historical materials of the submission and known discrepancies

The historical files are kept exactly as published at tag `v1.0.0-paper2` (`OFTY_SUITE_TEST_RUNNER.html`, `rules/`, `scenarios/`, `LICENSE`). Their README and CHANGELOG of that time remain readable through the tag; the CHANGELOG entry is also kept verbatim in the current `CHANGELOG.md`. Nothing in this file changes a historical result; it describes what the historical materials are and where earlier descriptions were inaccurate.

## 1. What H1 is

- `OFTY_SUITE_TEST_RUNNER.html`, 77,109 bytes, SHA-256 `fbd64e4270cc7aab2646e8929f0441e0b44894c0f2d330efffbe4d1f73000463`; runner v2.1.
- It contains the M5 engine, version 1.0.0 (`M5_VERSION = '1.0.0'`), and the tests. It loads no external script, fetches no data and has no configuration block that selects another engine.
- The 23 scenarios are defined in the file itself (`TR_SCENARIOS`). Fixture constructors `_trM1`–`_trM4` build synthetic payloads that go through the M5 adapters and input envelope to the embedded `computeM5`. Scenario S15 calls `computeM5(null)` to exercise the invalid-envelope guard. No M1–M4 algorithm is executed.
- **Scenario pass:** 146 expected assertion instances: 23 classification, 23 pattern, 23 risk, 20 pressure status, 28 required flags, 15 excluded flags, 5 text substrings, 9 additional checks. The expected values were written by the developer of the rules. S21 checks only that its interpretation is non-empty and contains one phrase; it does not test non-prescriptive wording.
- **Combinatorial pass:** 6 M3 states (five native classes plus *module absent*) × 8 M4 states (seven native classes plus *module absent*) × 4 pressure contexts (17, 14 and 11 mmHg against a 13–15 mmHg range, and unknown) = 192 combinations, each checked with five predicates:

| Predicate | Check |
|---|---|
| A1 | No exception is thrown |
| A2 | The integrated classification belongs to the 14-value set and is not `indeterminate` unless both M3 and M4 are absent or unclassifiable |
| A3 | Integrated risk belongs to {low, relevant, high, indeterminate, myopia_limited} |
| A4 | Integrated confidence belongs to {high, medium, low, indeterminate} |
| A5 | The interpretation is a non-empty string |

  No predicate checks the expected value of an output for a given combination.
- **Fixed parameters:** wherever M2 is supplied the target range is 13–15 mmHg; in every scenario that supplies both, the M1 adjusted IOP equals the M2 current IOP; the M1 impact class is never `high`; M4 data quality is always `adequate`; no pressure lies on a target bound. These choices mean that, for example, the tests cannot show which pressure value M5 uses.

## 2. Execution evidence and its dating

| Evidence | Date | Status |
|---|---|---|
| Pass results 23/23 scenarios (146/146 assertions) and 192/192 combinations | Reported at submission (CHANGELOG of `v1.0.0-paper2`, manuscript and appendices) | No contemporaneous execution log, console export or screenshot was found |
| Re-executions of the unchanged H1 file in two separate audit environments | 10 October 2026 (post-submission) | Archived; 146/146 and 192/192 |
| A post-submission mutation exercise (13 hand-seeded changes to the embedded engine) | 10 October 2026 | Not prespecified; described in the revision documentation |
| `tests/h1_historical/run_h1_headless.cjs` | Any run is post-submission | Re-execution only |

## 3. Discrepancies in the historical documentation

| # | Historical statement | Where | What is the case |
|---|---|---|---|
| 1 | The runner "loads the deployed M5 engine" from the website | README of `v1.0.0-paper2`; Multimedia Appendix 6 | H1 contains its own M5 1.0.0 and loads nothing |
| 2 | Offline reproduction "against a locally cloned copy of the M5 engine (`ofty-tool-5.html`)"; a configuration block to redirect the runner | README of `v1.0.0-paper2`; Multimedia Appendix 6 | H1 has no such configuration |
| 3 | The deployed M5 was 1.0.1, "bit-for-bit identical to v1.0.0" | CHANGELOG of `v1.0.0-paper2`; Multimedia Appendices 3–5 | H1 tests M5 1.0.0. The historical M5 page (H2: `ofty-tools/ofty` commit `fffdcc6`, `glaucoma/orchestrator/index.html`, SHA-256 `d933da30…ac89`) says "v1.0.1" in its header, but its engine constant is 1.0.2. Its 14 interpretation templates and 12 of 18 engine functions common to H1 differ textually from H1; behavioural equivalence was not established. No file with engine constant 1.0.1 was found. |
| 4 | All configurations re-executed against "deployed v1.0.1" with identical results | Multimedia Appendix 5 | No record of that execution was found |
| 5 | "215 / 215 configurations" | README, CHANGELOG, CITATION of `v1.0.0-paper2` | Two passes with different units (23 scenarios carrying 146 assertion instances; 192 combinations carrying five predicates each); 215 is a mixed-unit label |
| 6 | "Structural assertion set encoding the logical invariants" of the 192 configurations | README of `v1.0.0-paper2` | The predicates check exceptions, output domains, a restricted catch-all and non-empty text (§1) |
| 7 | `scenarios/manual_scenarios.json` holds the 23 scenarios executed, with 146 assertions | README of `v1.0.0-paper2`; Multimedia Appendix 3 | H1 does not read the file. It declares 146 assertions, but its per-scenario counts sum to 143, and its scenarios differ from H1's |
| 8 | `scenarios/combinatorial_axes.json` defines the 192 configurations | README of `v1.0.0-paper2` | H1 does not read the file; its axis states and predicates differ from H1's |
| 9 | S15 is a case with all modules null | Multimedia Appendix 3 | S15 passes a null envelope (`computeM5(null)`) |
| 10 | 31 rules split 19 guideline/trial-derived and 12 design-derived | Manuscript; `rules/*.json` headers | The per-rule `category` fields of `rules/*.json` give 18/13. A retrospective classification of October 2026 gives 2 evidence-derived, 17 evidence-informed and 12 design-derived (Multimedia Appendix 2, version 2.2) |
| 11 | Venue *Methods of Information in Medicine* or *JMIR Medical Informatics* | README, CHANGELOG, CITATION of earlier versions | *JMIR Formative Research*, manuscript #105677 |

These historical files are kept unchanged so that what was published can be checked. They should not be read as the executed specification; the executed specification is H1.
