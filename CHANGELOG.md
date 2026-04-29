# Changelog

All notable changes to the OFTY Glaucoma Suite verification infrastructure are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) principles, adapted for a verification repository tied to a deployed clinical decision support framework.

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
