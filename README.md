# OFTY Glaucoma Suite — Verification Repository

Verification infrastructure for the OFTY Glaucoma Suite (v1.0), a deterministic rule-based clinical decision support framework for structured glaucoma monitoring assessment.

This repository contains the test runner, rule schemas, scenario library, and combinatorial axes used to produce the 215-configuration verification result reported in the accompanying methodological paper.

---

## Citation

If you use this repository in your work, please cite:

> Ragosta A. A Deterministic Rule-Based Architecture for Glaucoma Decision Support: Design and Combinatorial Verification. *Methods of Information in Medicine* (in press, 2026).

A `CITATION.cff` file is provided for tools that read Citation File Format.

---

## Repository contents

| Path | Description |
|------|-------------|
| `OFTY_SUITE_TEST_RUNNER.html` | Browser-based test runner that loads the deployed M5 engine and executes all 215 verification configurations |
| `rules/M1_rules.json` | 5 deterministic rules for M1 (Pressure Contextualization) |
| `rules/M2_rules.json` | 7 deterministic rules for M2 (Target IOP Estimation) |
| `rules/M3_rules.json` | 7 deterministic rules for M3 (Functional Progression) |
| `rules/M4_rules.json` | 8 deterministic rules for M4 (Structural Progression) |
| `rules/M5_rules.json` | 4 deterministic rules for M5 (Orchestrator) |
| `scenarios/manual_scenarios.json` | 23 manually curated archetypal verification scenarios for M5 |
| `scenarios/combinatorial_axes.json` | Cartesian product axis definitions for the 192 combinatorial verification configurations |
| `CHANGELOG.md` | Version history of the repository and the deployed suite |
| `CITATION.cff` | Citation File Format metadata |
| `LICENSE` | MIT License |

---

## What is OFTY?

OFTY is a publicly deployed deterministic rule-based clinical decision support framework for glaucoma monitoring, with five modules:

- **M1** — Pressure Contextualization (IOP/CCT adjustment)
- **M2** — Target IOP Estimation (stage-based, guideline-derived)
- **M3** — Functional Progression Analysis (VF MD slope)
- **M4** — Structural Progression Analysis (RNFL trend)
- **M5** — Orchestrator (cross-module integration)

Each module is implemented as a self-contained client-side HTML document that operates entirely in the browser. There is no server-side computation, no data transmission, no login, and no persistent storage.

The deployed suite is publicly accessible at: **https://ofty.vercel.app**

| Module | URL |
|--------|-----|
| M1 | https://ofty.vercel.app/m1 |
| M2 | https://ofty.vercel.app/m2 |
| M3 | https://ofty.vercel.app/m3 |
| M4 | https://ofty.vercel.app/m4 |
| M5 | https://ofty.vercel.app/m5 |

---

## Reproducing the verification run

### Quick start

1. Clone this repository:
   ```
   git clone https://github.com/ofty-tools/ofty-validation.git
   cd ofty-validation
   ```

2. Open `OFTY_SUITE_TEST_RUNNER.html` in a current browser (Chrome, Firefox, or Safari).

3. The test runner loads the deployed M5 engine from https://ofty.vercel.app and executes:
   - 23 manual archetypal scenarios (stored in `scenarios/manual_scenarios.json`)
   - 192 combinatorial configurations from the Cartesian product axes (stored in `scenarios/combinatorial_axes.json`)

4. Pass/fail results for each configuration are displayed in the browser interface, with an aggregated summary.

### Expected result

For the v1.0 release of the OFTY Glaucoma Suite:

```
Manual scenarios:        23 / 23  passed (146/146 assertions)
Combinatorial:          192 / 192 passed
Total:                  215 / 215 configurations passed
```

### Offline reproduction

The test runner can also be executed against a locally cloned copy of the M5 engine (`ofty-tool-5.html`). This allows offline verification without network access to the deployed suite.

---

## Verification methodology

The verification approach follows a two-path methodology:

**Path A — Per-module stress testing (M1–M4)**: boundary testing, edge-case identification, and clinical red-teaming applied during module development.

**Path B — Combinatorial verification of M5**: orchestrator behavior verified through the Cartesian product of upstream module classification states:
- 6 M3 functional progression states
- 8 M4 structural progression states
- 4 IOP-versus-target states

Total: 6 × 8 × 4 = 192 combinatorial configurations.

Each configuration is evaluated against a structural assertion set encoding the logical invariants that the orchestrator must respect (e.g., "concordant progression with IOP above target must never produce an integrated classification below high-risk tier").

For full details see the methodological paper.

---

## Verification ≠ Clinical validation

This repository documents **in-silico verification** — the conformance of the implementation to its deterministic specification. It does **not** constitute clinical validation.

Clinical validation (the appropriateness of the rule set for real-world patient outcomes) requires retrospective cohort comparison and is planned as a dedicated follow-up study.

The OFTY framework is a structured interpretative reference. It does not generate diagnoses, treatment recommendations, or automated clinical decisions, and it is not intended to supersede expert clinical judgement.

---

## License

This repository is released under the MIT License (see `LICENSE`). The deployed module engines (`ofty.vercel.app`) are released under the same terms.

You are free to inspect, replicate, modify, and incorporate the contents into other projects with attribution.

---

## Contact

**Andrea Ragosta, MD, FEBO**
Department of Ophthalmology
Fundación Hospital de Jove
Gijón, Asturias, Spain
dott.andrea.ragosta@gmail.com

---

## Repository tag

This release is tagged `v1.0.0-paper2` to identify the exact state corresponding to the verification configurations reported in the accompanying paper submission.
