# Software objects, versions and identities

A SHA-256 identifies a file; it says nothing about test outcome or deployment. A result is stated only for the object on which it was obtained.

## 1. Objects

| Label | Object | Where | Identity | Role |
|---|---|---|---|---|
| **H1** (HIST-T) | Historical test runner v2.1 with embedded M5 engine 1.0.0 | `OFTY_SUITE_TEST_RUNNER.html` (this repository; tag `v1.0.0-paper2`, commit `f9ba72c`) | 77,109 bytes, SHA-256 `fbd64e4270cc7aab2646e8929f0441e0b44894c0f2d330efffbe4d1f73000463` | Object of all M5 test results of the submitted manuscript |
| **H2** (HIST-D, M5) | Historical M5 page at submission; header "v1.0.1", engine constant 1.0.2 | `ofty-tools/ofty`, commit `fffdcc6` (20 June 2026), `glaucoma/orchestrator/index.html` | 205,791 bytes, SHA-256 `d933da307ef119ca0d50cdf5deff4e521e96f5c4c27955690420399f70d4ac89` | Compared statically with H1; not tested. Its deployment at submission is inferred from repository history. |
| HIST-D (M1–M4) | Historical upstream modules described in the manuscript | Not in this repository; present in the history of `ofty-tools/ofty` from 9 May 2026: `glaucoma/iop-cct/index.html` (commit `c393580`), `glaucoma/target-iop/index.html` (`2a91a1e`), `glaucoma/vf-progression/index.html` (`a4c01fb`), `glaucoma/rnfl-progression/index.html` (`60e780c`) | M1 1.0.0 `a04035ec1c7a44fb8bf963d10346b8608a888ab4fde5366236fa5facfceb10f3`; M2 1.0.0 `17f3db99d1035714f5f42b32c4bf3872581f31fa1f3be6de16df615b7c9c96e6`; M3 2.0.7 `d0beef254d81c4fe8b7c125a145d4bceb9143d802c4356a58ada2a088573b350`; M4 1.2.3 `721f169f7cb0707575ea7e726aaf383dbaf16e3613e741f6211efe5154080725` (as listed in Multimedia Appendix 2, section 10) | Described from source; not executed by H1 |
| **C1** | First post-submission candidate (unreleased) | Not published | Archive SHA-256 `b9115293d3b242581aad13e4444d360fc99c88c5066dfdc60bd5b6242ff22f4e` | Starting point of the revision line; its M3 2.3.0 was used in the exploratory Rotterdam analysis through a research interface |
| G2B-WV1 → G2C-WV1 → G2D-WV1 | Intermediate revision candidates (unreleased) | Not published | Recorded in the revision records | Each corrected and tested in turn |
| **G2-E** | Revision candidate of this release | `candidate/`: 8 of the 13 G2-E files, byte-identical, plus a navigation page written for this release | 13 files in G2-E; in this release 8 + 1 (`candidate/SHA256SUMS.txt`) | Object of the October 2026 synthetic test campaigns in `evidence/` (run on the 13-file G2-E tree; the landing page and the M1 Advanced files were present in that tree but were not test objects) |
| **LIVE** | Public website ofty.vercel.app | `ofty-tools/ofty` `main`, commit `bac6f39` (29 August 2026) | Module hashes below | Not tested by anything in this repository. The website itself was not inspected for this release; the hashes are those of the repository. |

## 2. Module versions

| Module | Submission (HIST) | LIVE source (`ofty-tools/ofty` @ `bac6f39`) | Candidate G2-E (`candidate/`) |
|---|---|---|---|
| M1 IOP/CCT | 1.0.0 | 1.0.0 — `glaucoma/iop-cct/index.html` `8717d4d5…` | 1.0.0, UI 1.2.0 — `iop-cct/index.html` `eb551690…1f6a` |
| M2 target IOP | 1.0.0 | 1.0.0 — `glaucoma/target-iop/index.html` `01d6cbc3…` | 1.1.0-gate2.1, target policy B-narrow-O1-0.4.1 — `target-iop/index.html` `83a7cb9d…3db0` |
| M3 visual field | 2.0.7 | 2.2.0 — `glaucoma/vf-progression/index.html` `ba41b5df…` | 2.3.1, UI 2.6.2, contract gate2-m3-0.2.1 — `vf-progression/index.html` `55f258c0…2cfa` |
| M4 RNFL | 1.2.3 | 1.3.0 — `glaucoma/rnfl-progression/index.html` `1cab1b1d…` | 1.3.1, UI 1.8.2 — `rnfl-progression/index.html` `3c671cf2…e847` |
| M5 integration | 1.0.0 in H1; 1.0.2 in H2 | 1.2.0 (header) — `glaucoma/orchestrator/index.html` `30522a1c…` | engine gate2-semantic-0.3.1 — `gate2/semantic.cjs` `9eaddd8d…2eaf`; host UI v0.4.8-ui-aprime-staging-A1 — `gate2/index.html` `e258018b…9a83`; `gate2/session.js` `090cd280…7f12` |
| Other | — | landing page `glaucoma/index.html` `64b3def5…`; `glaucoma/m1-advanced/` | G2-E contained copies of both, byte-identical to LIVE; **not in this release** (the landing page is replaced by a navigation page, `candidate/index.html`; M1 Advanced is outside the manuscript). `orchestrator/index.html` `95bb607c…` redirects to `gate2/` |

Full SHA-256 of the 9 files in `candidate/` (8 G2-E source files and the navigation page): `candidate/SHA256SUMS.txt`.

The M5 engine of the candidate accepts only these source versions (`candidate/gate2/semantic.cjs` l.133–135): M1 `1.0.0`, M2 `1.1.0-gate2.1` with target policy `B-narrow-O1-0.4.1`, M3 `2.3.1`, M4 `1.3.1`. Any other version is reported as `context_blocked`.

## 3. Lineage of the candidate

| Step | Date (2026) | What changed | Changed files |
|---|---|---|---|
| C1 | frozen by 16 October | Post-submission candidate: integrated M5 host (`gate2/`) with measured-GAT pressure comparator; M2 target policy B-narrow-O1; M3 2.3.0 and M4 1.3.0 changes listed in each module's in-page version history | — (starting point) |
| G2-B | 19 October | AS-M1 labelling in M1 and M2; AS-M2 limitation sentences in M3 and M4 | M1, M2, M3, M4 pages |
| G2-C | 19–20 October | M3 insufficient series shown as Not assessable; M3 Student-t p-value; M4 p-value precision; M5 version map | M3, M4 pages; `gate2/semantic.cjs` |
| G2-D | 20 October | M3 presentation: single field Indeterminate; descriptive-only slope; discordance label | M3 page |
| G2-E | 20 October | M3 export adds `rendered_label`; M5 wording distinguishes pattern-rule and card labels | M3 page; `gate2/index.html` |

Each step had its test plan frozen before the change, was tested on synthetic data and was reviewed in a separate documentary audit before the next step; the G2-E records are in `evidence/g2e_campaign_20261020/`. `docs/CHANGES_SINCE_SUBMISSION.md` describes the changes and their evidence.
