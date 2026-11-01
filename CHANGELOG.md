# Changelog

All notable changes to this repository are documented in this file. Earlier entries are kept as they were published; statements in them that were later found to be inaccurate are corrected in the newer entries, not edited in place.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) principles.

---

## [v1.1.0-paper2-r1] — date of publication to be set *(proposed tag name)*

Revision release for the manuscript under major revision at *JMIR Formative Research* (#105677). The historical files of `v1.0.0-paper2` are unchanged.

### Added
- `candidate/`: the post-submission revision candidate **G2-E**: 8 of its 13 source files, byte-identical, plus a navigation page for reviewers written for this release (`candidate/index.html`; no scripts, tracking or external resources). Not included: the G2-E copy of the website's Glaucoma Suite landing page (replaced by the navigation page) and the four files of the separate M1 Advanced module (outside the scope of the manuscript). `candidate/SHA256SUMS.txt` lists the 9 files. Versions: M1 1.0.0 (UI 1.2.0); M2 1.1.0-gate2.1 with target policy B-narrow-O1-0.4.1; M3 2.3.1 (UI 2.6.2, export contract gate2-m3-0.2.1); M4 1.3.1 (UI 1.8.2); M5 integration engine gate2-semantic-0.3.1 with host UI v0.4.8-ui-aprime-staging-A1. Not deployed on the public website; not intended or cleared for clinical use; clinical validity and regulatory status not established by these tests; interface texts still carry staging labels.
- `docs/`: object and version map; M3→M5 export contract; numerical notes; changes since submission; historical materials and errata; known limitations.
- `tests/h1_historical/`: headless re-execution of the historical runner H1.
- `tests/g2e_reproduction/`: reproduction kit for the candidate evaluation (frozen evaluator v1.0 and amended evaluator v1.1), with archived baseline captures and predeclared expected results.
- `evidence/`: machine-readable records of the October 2026 synthetic test campaigns of the candidate, including the failing results obtained before the post-hoc amendments OA-E01 and OA-E02, and the pre-publication release checks (`g3a_release_check/` on the staging tree with all 13 G2-E files; `g3b_release_check/` on this release).
- `SHA256SUMS.txt` for every file of the release except itself; `.gitignore` for local test outputs.

### Changed
- `README.md` rewritten. It distinguishes the historical runner H1, the historical M5 page H2, the revision candidate and the public website, and describes what H1 does and does not test.
- `CITATION.cff`: title, abstract, keywords, version and venue (*JMIR Formative Research*) updated; the required field `message` added; `url` (the website) and `date-released` removed (the date is set at publication).
- `CHANGELOG.md`: preamble updated; earlier entries kept verbatim.

### Corrections of earlier statements in this repository
- **"Loads the deployed M5 engine" (README of v1.0.0-paper2) is incorrect.** `OFTY_SUITE_TEST_RUNNER.html` (H1) contains its own copy of the M5 engine, version 1.0.0, and loads no external engine or data. The "offline reproduction against a local copy of `ofty-tool-5.html`" described in the earlier README is not possible with this file: it has no configuration to select another engine.
- **M5 version.** The entry for v1.0.0-paper2 below states that the deployed M5 was 1.0.1 and "bit-for-bit identical to v1.0.0". The engine tested by H1 is 1.0.0. The historical M5 page in the website repository at submission (`ofty-tools/ofty`, commit `fffdcc6`) is labelled "v1.0.1" in its header but its engine constant is 1.0.2, and its engine and interpretation texts differ from H1's (all 14 interpretation templates and 12 of 18 common engine functions differ textually). No file with engine constant 1.0.1 was found. Behavioural equivalence of H1 and that page was not established, so "bit-for-bit identical" is withdrawn.
- **"215 / 215 configurations passed"** (and the README statement that the runner loads the deployed engine). The 23 scenarios (146 expected assertion instances) and the 192 combinations (five predicates each) were executed by H1 against its embedded M5 1.0.0. They are two passes with different units; 215 is a mixed-unit label. No record of an execution against the deployed suite was found. The pass results of the submission are reported but have no contemporaneous execution log; re-executions of the unchanged H1 file were archived on 10 October 2026.
- **"Structural assertion set" of the 192 combinations.** The five predicates check absence of exceptions, output domains, a restricted use of the catch-all classification and non-empty text. They do not check the expected value of any output for a given combination.
- **`scenarios/manual_scenarios.json` and `scenarios/combinatorial_axes.json`** are descriptive. H1 does not read them. The scenario file declares 146 assertions but its per-scenario counts sum to 143 and its scenarios differ from those executed by H1; the axes file describes axis states and predicates that differ from H1's. Both files are kept unchanged as published.
- **Rule counts.** The `rules/*.json` files list 31 rules but carry two different splits: their module-level `source_categories` fields sum to 19 guideline-derived / 12 design-derived (the split of the submitted manuscript), while the per-rule `category` fields give 18 evidence- or guideline-derived / 13 design-derived. A later retrospective classification (evidence-derived 2, evidence-informed 17, design-derived 12) is documented in Multimedia Appendix 2 (version 2.2) of the revision. The rule files are descriptive and are not executed.
- **Venue.** The manuscript is under review at *JMIR Formative Research* (#105677), not *Methods of Information in Medicine* or *JMIR Medical Informatics* as stated in earlier versions of this file, the README and `CITATION.cff`.

Details: `docs/HISTORICAL_MATERIALS_AND_ERRATA.md`.

---

## [v1.0.0-paper2] — 2026-04-29

This is the first public release of the OFTY verification infrastructure, corresponding to the manuscript submission to *Methods of Information in Medicine*.

### OFTY Glaucoma Suite deployment state at this tag

| Module | Algorithm version | Notes |
|--------|-------------------|-------|
| M1 (Pressure Contextualization) | 1.0.0 | First public release |
| M2 (Target IOP Estimation) | 1.0.0 | First public release |
| M3 (Functional Progression) | 2.0.7 | Internal iterative refinement of the VF MD slope cascade during development (oscillation gate, monotonic-worsening guard, single-step-drop detection, plateau-recovery overrides). The user-facing Module_Version (v1.0) corresponds to this algorithm_version at first public release. |
| M4 (Structural Progression) | 1.2.3 | Internal refinement of the RNFL thinning cascade during development (floor-effect handling, myopia-limited modifier, artifact detection, age-related thinning guard). The user-facing Module_Version (v1.0) corresponds to this algorithm_version at first public release. |
| M5 (Orchestrator) | 1.0.1 | Patch increment over 1.0.0: provenance tracking added to `logic_trace`, native browser print support, JSON export, M2 stage override and current-IOP edit (UI-side, engine unchanged). The deterministic rule cascade is bit-for-bit identical to v1.0.0. |

### Verification result at this tag

```
Manual archetypal scenarios:    23 / 23  passed (146 / 146 assertions)
Combinatorial configurations:   192 / 192 passed
Total:                          215 / 215 configurations passed
```

### Repository contents at this tag

- `OFTY_SUITE_TEST_RUNNER.html` — browser-based test runner
- `rules/M1_rules.json` through `rules/M5_rules.json` — 31 deterministic rules across 5 modules
- `scenarios/manual_scenarios.json` — 23 archetypal verification scenarios
- `scenarios/combinatorial_axes.json` — Cartesian product axis definitions for 192 configurations
- `README.md`, `CITATION.cff`, `LICENSE`

---

## Notes on versioning

The OFTY framework uses semantic versioning per its Module Architecture Standard (MAS Section S1.3):

- **Patch (x.y.Z+1)** — bug fixes, refactoring without behavioural change, or additive output schema changes
- **Minor (x.Y+1.0)** — clinically relevant rule refinements requiring re-verification
- **Major (X+1.0.0)** — architectural redesigns invalidating prior outputs

User interface changes do not trigger version increments. The `Module_Version` (suite-level, currently v1.0) is independent from individual `Algorithm_Version` strings recorded in each module's output.
