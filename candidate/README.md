# Revision candidate G2-E

Post-submission candidate of the OFTY M1–M5 source, prepared during the revision of manuscript #105677 (*JMIR Formative Research*). Research prototype; not intended or cleared for clinical use; clinical validity and regulatory status have not been established by the tests in this repository; not deployed on the public website.

`SHA256SUMS.txt` lists 9 files: **8 source files byte-identical** to the candidate approved by the author on 20 October 2026 (`G2E_M3_M5_SEMANTIC_ALIGNMENT_CANDIDATE_20261020`, which had 13 files), and **1 navigation page** (`index.html`) written for this release. The 8 source files were not edited; staging labels in their interface texts are therefore still present. Of the other 5 G2-E files, the copy of the website's Glaucoma Suite landing page (analytics tag; links to website paths) was replaced by the navigation page, and the 4 files of the separate M1 Advanced module (outside the scope of the manuscript; not used by M5) are not included.

| Path | Module | Version |
|---|---|---|
| `iop-cct/index.html` | M1 IOP/CCT | 1.0.0, UI 1.2.0 |
| `target-iop/index.html` | M2 target IOP | 1.1.0-gate2.1, policy B-narrow-O1-0.4.1 |
| `vf-progression/index.html` | M3 visual field | 2.3.1, UI 2.6.2, export contract gate2-m3-0.2.1 |
| `rnfl-progression/index.html` | M4 RNFL | 1.3.1, UI 1.8.2 |
| `gate2/semantic.cjs`, `gate2/index.html`, `gate2/session.js` | M5 integration engine and host | gate2-semantic-0.3.1; host UI v0.4.8-ui-aprime-staging-A1 |
| `orchestrator/index.html` | Redirect to `gate2/` | — |
| `index.html` | Navigation page for reviewers (written for this release; not a G2-E source file) | Links to M1–M5; no scripts, tracking or external resources |

Serve over HTTP to use it (`python3 -m http.server 8000 --bind 127.0.0.1` in this folder, then open `http://127.0.0.1:8000/`). See the repository `README.md` §4 for the browser restriction of the integrated host, and `docs/` for versions, the export contract, the changes since submission and the known limitations.
