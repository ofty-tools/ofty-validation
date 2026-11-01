# G3-B · Predeclared test plan, oracles and expected results (frozen before any G3-B edit)

**Baseline:** S00 = `S00_G3A_STAGING_TREE_UNMODIFIED/ofty-validation` of the G3-B handoff (`09e1b931…6481`), byte-identical to `B_STAGING_TREE/ofty-validation` of the G3-A nested ZIP `407de85a…1abc` (WP0 log). Pre-change inventory: `S00_PRECHANGE_INVENTORY_362.sha256` (362 files). Work copy: `wv/G3B-WV1` (copy of S00). S00 made read-only.

**Changes authorized (only):** replace `candidate/index.html` with a new standalone reviewer navigator; remove the four `candidate/m1-advanced/*` files; documentation, inventories and checksum files. No change to the eight retained G2-E files, the H1 runner, `rules/`, `scenarios/`, `LICENSE`, `tests/` or the existing evidence records.

## Eight retained G2-E files (expected SHA-256, unchanged)

| File | SHA-256 |
|---|---|
| `candidate/gate2/index.html` | `e258018b8d7999aea23a35ddbaab896a8678518f084883a6efa066746cd79a83` |
| `candidate/gate2/semantic.cjs` | `9eaddd8d8be5d92602da6c04cfea9aaafb2fde95af295fc673d21f1db50b2eaf` |
| `candidate/gate2/session.js` | `090cd280316af00ff8c9c49030d49362f9044dbd03f999b891b5980cbbc37f12` |
| `candidate/iop-cct/index.html` | `eb551690b32127edd85a1c1aca9dfadaaa41fe5b2d7b9caeaeec46b1f47d1f6a` |
| `candidate/orchestrator/index.html` | `95bb607c7f4df63ea22e3f3e24e455780c08a7b0e23b41a823c622fad6b7eb77` |
| `candidate/rnfl-progression/index.html` | `3c671cf29097eca404e47e5e6ff35615a6e3986822436ce86d4c3b8eb1d1e847` |
| `candidate/target-iop/index.html` | `83a7cb9d1387235042c21e2253aa2237d962ae8f1219e70334d63c2f64d43db0` |
| `candidate/vf-progression/index.html` | `55f258c00fff5f573c2e05b3bf0e18ecfe62df950616d76f2c4764465c7d2cfa` |

Removed: `candidate/index.html` (old, `64b3def5…3526`) replaced by a new file; `candidate/m1-advanced/build.manifest.json` (`419766a2…`), `index.html` (`a6cb53b7…`), `m1_advanced_bundle.js` (`9f9a0fe4…`), `m1_advanced_schema.json` (`fbd983b1…`) removed.

## Link map (frozen)

| From | Link (exact `href`) | Must reach | Title oracle |
|---|---|---|---|
| new `candidate/index.html` | `./iop-cct/index.html` | M1 page | starts "OFTY Tool #1 — IOP/CCT Assessment" |
| new index | `./target-iop/index.html` | M2 page | starts "OFTY Tool #2 — Target IOP" |
| new index | `./vf-progression/index.html` | M3 page | starts "OFTY Tool #3 — VF Progression Analysis" |
| new index | `./rnfl-progression/index.html` | M4 page | starts "OFTY Tool #4 — OCT Progression Analysis" |
| new index | `./gate2/index.html` | M5 host | starts "OFTY Tool #5" |
| new index (optional) | `./orchestrator/index.html` | redirects to `/gate2/index.html` | — |
| M1–M4 pages (unchanged) | `../index.html` | the new index (same title) | — |

## Tests and expected results

| ID | Method | Expected |
|---|---|---|
| P0-BASE | `sha256sum -c` of S00 root and candidate lists | 361/361 and 13/13 (already observed in WP0; re-run at the end) |
| P1-HASH | `tools/hash_continuity.py` (frozen) | 8/8 retained identical; new index hash ≠ old; zero `m1-advanced` files; candidate file set exactly {8 retained, `index.html`, `README.md`, `SHA256SUMS.txt`} |
| P2-INDEX | `tools/nav_test.cjs` (frozen), Playwright 1.56.0, headless Chromium 141, local HTTP server on 127.0.0.1 | index HTTP 200; the five required `href`s present; no absolute/site links; each link opens the expected page (title oracle); alias, if present, reaches gate2 |
| P3-BACK | same script | each of M1–M4 has a `../index.html` link that lands on `/index.html` with the new index's title |
| P4-TRACK | same script + static scan | index source: no tracking, no `http(s)://`, no `<script>`, no stylesheet/font/image/iframe, no cookie/storage access; loading the index makes only local requests; 0 cookies. External requests of unchanged module pages (expected: Google Fonts from M1–M4) recorded and reported separately, not a failure |
| P4-PRE (descriptive) | same script on an untouched copy of S00 | **expected FAIL**: old index links are absolute site paths, it carries Google Analytics and external fonts; recorded as the pre-change observation |
| P5-PRIV | `tools/privacy_scan.py` (G3-A scanner + `/opt` paths, "not a medical device", M1 Advanced references) on the final public tree | no secrets, no patient/Rotterdam data files, no images/archives; no `m1-advanced` files; no "not a medical device"; remaining hits listed and explained |
| P6-DOC | Read-through and a text check: docs state 8 unchanged + 1 navigator; H1 146/146 and 192/192; 35/145 → 145/145 (OA-E01) and 4/8 → 8/8 (OA-E02) as post hoc; candidate ≠ LIVE; platform limits; independent fact-check | all present; no stale "13 candidate source files" claim about this release (13 in G2-E kept as history) |
| P7-REPRO | From a clean extraction of the final tree: `npm ci`; `node h1_historical/run_h1_headless.cjs`; `bash g2e_reproduction/run_reproduction.sh` (unchanged kit, unchanged `EXPECTED_RESULTS.json`) | H1: engine 1.0.0, 146/146/0, 192/192. Kit: v1.0 35/145 (27/75 + 8/70), v1.1 145/145; outcome REPRODUCED |
| P8-MANIFEST | `tools/hash_continuity.py` + `sha256sum -c` on the extracted final tree and the ZIP; package manifest | root list covers all files except itself and verifies; candidate list = 9 sources and verifies; no self-reference; ZIP CRC OK |
| P9-GIT | `git ls-remote` (read-only) at start and end; no Git write command used | refs unchanged (`main` cf5c394, tag f9ba72c); no commit, tag, push, release, Vercel action |

Rules: failures are kept; no oracle is changed after a result without an incident record; deviations are reported. Synthetic data only; no Rotterdam material; GitHub read-only.
