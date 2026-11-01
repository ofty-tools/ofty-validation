# Evidence

Machine-readable records of synthetic test runs of the revision candidate. They are records of what was run and observed; they are not clinical evidence.

| Folder | Content | Object | When |
|---|---|---|---|
| `g2e_campaign_20261020/` | The G2-E campaign: the 15 evaluation ledgers under the frozen evaluator v1.0 and the 15 under the amended v1.1; summary ledgers of the earlier batteries re-executed on the candidate (helper grid, numerical table and transitions, M5 version matrix, M4 p-value series, pressure cases T1/T1b/T1c/T1d, limitation scenarios T2, parity T2b before and after OA-E02, fixed-string check T2c before and after OA-E02, M3 card-versus-export T4); run indexes; the frozen test plan and its hash list; the amendment records | G2E-WV1 (13 files; its 8 source files kept in this release are byte-identical to `candidate/`) | 20 October 2026, 10:07–10:37 UTC |
| `g3a_release_check/` | Run of the public reproduction kit and of the H1 script on the G3-A staging tree (13 G2-E files in `candidate/`) | G3-A staging tree | See its README |
| `g3b_release_check/` | Navigation, no-tracking, integrity and privacy checks and re-runs of the public kit and of the H1 script on this release (8 G2-E files + navigation page; see its README for the trees used) | This release | See its README |

Notes:
- `PROVENANCE.tsv` in `g2e_campaign_20261020/` lists, for every file, its path in the original campaign package and its SHA-256 there. Six files contained absolute paths of the campaign machine; in those copies the machine-specific prefix was replaced by `<WORKSPACE>`, and both hashes are listed.
- Screenshots, PDFs and full per-case captures of the campaign are not included here because of their size; they are kept in the campaign archive (SHA-256 of the archive: `856eb721a8da329d3a32d51601a7a183fd744af00bfe7d8f34fef43779fe7d75`).
- `frozen_plan/FROZEN_PLAN_SHA256SUMS.txt` and `amendments/AMENDMENTS_SHA256SUMS.txt` are process records that list paths of the campaign package; most of those files are not in this repository (the kit copies are in `tests/g2e_reproduction/`), so these lists cannot be checked with `sha256sum -c` here.
- Failing results are kept: the v1.0 evaluation ledgers (35/145), the T2b ledger before OA-E02 (4/8) and the T2c ledgers.
