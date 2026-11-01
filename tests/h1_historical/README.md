# Headless re-execution of the historical runner H1

`run_h1_headless.cjs` opens `OFTY_SUITE_TEST_RUNNER.html` (unchanged since tag `v1.0.0-paper2`) in headless Chromium, blocks every network request, and reads the totals that H1 writes to the browser console when it runs on page load.

```
cd tests
npm ci
npx playwright install chromium
node h1_historical/run_h1_headless.cjs     # writes tests/h1_historical/out/<UTC timestamp>/
```

Output: `H1_RUN.json` (hash check, extracted totals, expected totals, page errors, blocked requests), `H1_CONSOLE.txt` (the full console output, including the interpretation texts H1 prints for human review) and a screenshot.

Expected totals: M5 engine 1.0.0; 23 scenarios; 146 assertion instances run, 146 passed, 0 failed; 192/192 combinations. They are the totals reported at submission and observed in the archived post-submission re-executions of 10 October 2026.

A run of this script is a **post-submission re-execution** of the unchanged file. It is not evidence of the run reported at submission, for which no contemporaneous log is available. H1 tests the embedded M5 1.0.0 only; its results do not apply to the historical M5 page H2, to the revision candidate or to the website. What H1 does and does not check is described in `docs/HISTORICAL_MATERIALS_AND_ERRATA.md`.

Opening the file directly in a browser runs the same tests; the totals appear on the page and in the developer console.
