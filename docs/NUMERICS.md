# Numerical notes (revision candidate G2-E)

Scope: the statistical helpers of M3 (`candidate/vf-progression/index.html`, algorithm 2.3.1) and M4 (`candidate/rnfl-progression/index.html`, algorithm 1.3.1). The checks below compare the helpers with SciPy 1.18.1 over **selected, frozen input grids**. They do not constitute a general numerical validation of the modules, and they do not assess the clinical appropriateness of the thresholds.

## 1. Regression and time scale

- **M3:** ordinary least-squares (OLS) regression of global mean deviation (MD) on time in years. Time is computed as days / 365.25.
- **M4:** OLS regression of global average RNFL thickness on time.
- The user interfaces accept at most 12 entries per series, so the regression has at most 10 degrees of freedom when used through the page.

## 2. M3 two-sided Student-t p-value (corrected in the candidate)

- **Defect (before the correction):** for small but non-zero t statistics (for example |t| = 1e-6 or 0.001), the helper returned values far from the exact p-value; for example, for t = 0.001 and df = 3 it returned 0.2281 instead of 0.9993. The cause was the branch used for the symmetric case of the incomplete beta function. For |t| ≤ 1e-8 and at t = 0 the result was already 1.
- **Correction (M3 algorithm 2.3.1):** the symmetric branch was corrected. Regression method, slope bands, sufficiency rules and classification thresholds are unchanged.
- **Check:** 496 grid points (t from 0 to ±1e6, including values on both sides of the 0.05 and 0.10 critical values; df 1–10, reachable through the page, and 15, 20, 30, 60, 100, 200, reachable only by calling the engine directly). Tolerance |p − p_ref| ≤ max(1e-6, 1e-5 · p_ref). Result: 496/496 within tolerance (426/496 before the correction); p non-increasing in |t| for 16/16 df values; symmetry, range [0, 1] and p(0) = 1 hold.
- **Effect on outputs:** the exported and displayed p-value of nearly flat series changes (for example 0.1724 → 0.9994). Significance requires a negative slope, so for the frozen series the engine's significance did not change; two additional series selected after the evaluation (supplement A-02) show a change from *significant* to *non_significant* and of native confidence from *high* to *medium*.
- **Not changed:** the M3 critical-value function `tCritical95` interpolates between tabulated degrees of freedom; at df 17 and 18 it differs from the exact value by about 0.003, above the tolerance used. It affects only the confidence interval and cannot be reached through the page (df ≤ 10, all tabulated).

## 3. M4 p-value representation (corrected in the candidate)

- **Defect (before the correction):** the exported p-value was rounded to two decimals and the Method panel showed four decimals of that rounded value. A series with p = 0.047 was classified *significant* but exported as 0.05 and displayed as "0.0500".
- **Correction (M4 algorithm 1.3.1, UI 1.8.2):** `structural_rate.p_value` is exported unrounded (the value used for every decision: p < 0.05 significant; p < 0.10 trend). The text shows "Not available" when p cannot be computed, "< 0.0001" below 0.0001, and four decimals otherwise, never on the other side of 0.05 or 0.10 than the unrounded value (0.04996 → "0.0499"). Significance rules, regression and thresholds are unchanged.
- **Check:** 14 frozen series, standalone page and integrated host: 14/14. The five earlier contradictions between the exported or displayed p-value and the significance label are absent.
- **Boundary:** for a series constructed to give p = 0.05 exactly, the M4 incomplete-beta helper returns 0.0499999996 (SciPy: 0.0500000000000001). At exactly 0.05 the classification depends on numerical accuracy of about 1e-9.
- **Two measurements:** with two scans, the p-value and the confidence limits are `null` ("Not available"); a deterministic two-scan rule governs the classification.

## 4. Ranges not reachable through the pages

| Item | Behaviour | Reachable through the page? |
|---|---|---|
| M4 p-value for df ≥ 30 | Normal approximation instead of Student-t; differs from the exact value by up to about 0.01 (for example p(t = 2, df = 30) = 0.0455 instead of 0.0546) | No (at most 12 scans, df ≤ 10). Possible only by calling `computeM4_StructuralTrend` directly with 32 or more points. |
| M4 `_pval` called directly with a negative t and df ≥ 30 | Returns values above 1 | No (the only caller passes \|t\|) |
| M4 and M3 critical values at df 17–18 | Interpolated; off by about 0.003 | No |

In the G2-B numerical table (922 rows, 891 graded) re-executed on the candidate, 797 graded rows pass and 94 fail. The 94 are all in the table above: 90 M4 rows of the df ≥ 30 normal approximation, 2 M4 and 2 M3 interpolated critical-value rows. No row that passed before the corrections fails after them.

Records: `evidence/g2e_campaign_20261020/g2b_g2c_batteries_rerun/` (helper grid, numerical table and its transitions, M4 p-value series).
