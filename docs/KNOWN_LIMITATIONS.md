# Known limitations of the revision candidate G2-E

This list concerns `candidate/`. Limitations of the historical runner H1 are in `docs/HISTORICAL_MATERIALS_AND_ERRATA.md`.

## Status and scope

- Research prototype; not intended or cleared for clinical use; clinical validity and regulatory status have not been established by these tests; not intended for patient use. All tests used synthetic data and developer-specified expectations.
- Not the public website. The source repository of the website (`ofty-tools/ofty` at commit `bac6f39`) contains older module versions (`docs/OBJECTS_AND_VERSIONS.md`); the website itself is not covered by this release.
- Interface texts carry staging labels ("DRAFT / REQUIRES_AUTHOR_FINAL_COPY_APPROVAL · synthetic staging only", "unpublished staging build; not a software release", "isolated Gate 3 UI staging candidate"), the export carries `final_copy_status: REQUIRES_AUTHOR_FINAL_COPY_APPROVAL`, and the M5 JSON download is named `OFTY_GATE3_ASSESSMENT.json`. The user-facing wording has not had its final approval.

## Environment

- **Integrated host browser allow-list.** The M5 host accepts Microsoft Edge or Chromium ≥ 120 on Windows only, identified through User-Agent Client Hints; the allow-list entries are marked `staging_target_pending_verification`. On other platforms (observed on headless Chromium under Linux without emulation) the host computes and shows the integrated result but reports `browser_engine_unverified` and disables copy, print and JSON export.
- **No genuine Windows execution.** The automated host tests ran on Linux headless Chromium 141 with the Windows platform hint emulated.
- **Print and clipboard.** Printing was tested as browser print-to-PDF; copying through a stub of the clipboard. No physical printer or operating-system clipboard was tested.
- **External resources.** The unchanged M1–M4 pages load web fonts from Google. The navigation page `candidate/index.html` makes no network request and contains no scripts, tracking or external resources. The automated tests blocked every external request.

## Clinical logic and its outputs

- **Global indices only.** M3 uses global MD and M4 average RNFL thickness. No focal, sectoral, pointwise or event-based analysis is implemented; the result cards say so.
- **Thresholds and rules** are author-selected; many are evidence-informed rather than evidence-derived (Multimedia Appendix 2). They have not been validated against clinical outcomes.
- **M2 target policy B-narrow-O1-0.4.1** differs from the submitted M2 1.0.0 (`docs/CHANGES_SINCE_SUBMISSION.md` §2). The ten case-specific M2 exceptions remain.
- **M1** still computes the CCT-based estimate and shows it as an ancillary value; it is not used by M5. Current guidance advises against CCT-based correction algorithms.
- **Pressure provenance.** The application cannot verify that an entered IOP was measured by Goldmann applanation. A conflict check between M1 and M2 observations exists in the M5 logic but cannot be triggered from the interface.
- **Two different discordance conditions.** The M3 card shows "Discordant indicators — clinical review needed" only for a *significant* moderate or faster native decline with a pattern-rule "no progression"; M5 rule A1 fires for a native moderate or faster decline whether or not it is significant (`docs/M3_M5_EXPORT_CONTRACT.md` §4).
- **Display versus native confidence** can differ (for example High versus medium for 12 fields over 22 months). The difference is documented and reported by M5, but not explained on the M3 card.
- **Single visual field.** No export is produced and M5 receives no M3 result; the M3 card shows *Not assessable* with risk *Indeterminate*, raised by the central-threat and monocular modifiers.
- **M5 plateau branch.** In the October 2026 test set no case with a *significant* native decline reached the M5 "history followed by a plateau" branch (the plateau designs were all non-significant); that branch shares its wording logic with the tested unresolved-conflict branch.
- **M4 with two scans** returns no p-value; a deterministic two-scan rule can still retain *fast progression* when both scans are of good reliability and the change is at least 8 µm.
- **Numerical ranges** not reachable through the pages (M4 df ≥ 30; interpolated critical values at df 17–18) are approximate (`docs/NUMERICS.md` §4). M5 shows "Native p-value: 0" in a technical row when the 4-decimal exported p-value is below 0.00005.
- **Shared workstations.** Safeguards against carrying one patient's results into another session (automatic expiry, a patient-identity check) were not part of the revision corrections and were not tested.

## Metadata

- `functional.native.transport_version` duplicates the top-level `transport_version` (pre-existing structure).
- `functional.candidate.source_lineage_sha256` identifies the M3 2.2.0 file from which the candidate line derives, not the candidate file itself.
- Version labels in the source comments read "G2-B/G2-C/G2-D/G2-E working variant, unreleased": these name the revision step at which each change was made.

## Interface wording (not changed in this release)

- The M5 summary line for a discordant case is long (pattern-rule label, card label and native statement on one line).
- The M3 copied text repeats "Discordant indicators — clinical review needed" (progression line and start of the interpretation).
- The M5 technical row "Source pattern-rule label (M3)" shows the internal value ("Stable") while users see "No progression detected" on a normal M3 card.

These are scheduled for the author's interface review, which precedes any update of the public website.
