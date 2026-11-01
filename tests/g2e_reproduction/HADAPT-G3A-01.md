# HADAPT-G3A-01 — adaptation of the G2-E harness for the public reproduction kit

**Declared before any test run of this release.** Only `harness/common.cjs` differs from the G2-E campaign file; the diff is `harness/common.cjs.diff`.

| Change | Reason |
|---|---|
| Playwright is resolved from the kit's `node_modules` (or the `OFTY_PLAYWRIGHT_DIR` environment variable) instead of a fixed path of the campaign machine | Portability |
| `ROOTS.POST` = `<repository>/candidate` | The released candidate is the object under test |
| `ROOTS.PRE` = `null`; the other campaign roots (G2C, G2B, C1, M5TC) are removed | Those sources are not published; the kit evaluates against the archived PRE captures and never captures PRE |
| `FROZEN.*` point to `tests/g2e_reproduction/frozen/` | The frozen files are copied byte-identically into the kit |
| Header comment | States the adaptation |

Unchanged: the utility functions, the HTTP server and request blocking, the browser and context settings, the fixed clock, the version table, and every capture and evaluation function. `G2E_CAPTURE.cjs`, `capture_lib_g2e.cjs`, `G2E_EVAL.cjs` and `G2E_EVAL_v1.1_OAE01.cjs` are byte-identical to the campaign files.

The capture command is the campaign's (`node G2E_CAPTURE.cjs <standalone|host> POST <set> <out>`); the evaluation command is the campaign's with the PRE directory pointing to `baseline_pre_captures/<mode>_<set>`.
