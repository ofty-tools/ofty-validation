# M3 → M5 export contract (revision candidate G2-E)

Applies to `candidate/vf-progression/index.html` (M3 algorithm 2.3.1, UI 2.6.2, export contract `gate2-m3-0.2.1`) and to the integrated M5 host `candidate/gate2/` (engine `gate2-semantic-0.3.1`, host UI v0.4.8-ui-aprime-staging-A1). It does not describe the historical H1/H2 objects or the public website. Line numbers refer to the files in `candidate/`.

## 1. Four things the M3 result reports

| Concept | Where in the export | Meaning | Computed by |
|---|---|---|---|
| **Native classification** | `classification`, `statistical_significance`, `data_quality`, `progression_rate`, and the same values under `functional.native.*` | Ordinary least-squares regression of global MD on time with the native rules: slope bands, significance, sufficiency | M3 engine (algorithm 2.3.1) |
| **Pattern-rule label** | `functional.display.label`: `Stable`, `Suspicious trend`, `Progressing`, `Not assessable` | Result of the M3 page's pattern rules (fluctuation, plateau, reliability, floor, clinical overrides) after all label rules. **M5 reads this value.** `Stable` is shown to users as "No progression detected". | M3 page, `calculate()` (`finalLabel`) |
| **Rendered card label** | `functional.display.rendered_label` (new in `gate2-m3-0.2.1`) | The progression label **exactly as shown** on the M3 card and in the copied text. It equals the user-facing form of the pattern-rule label, except in the discordance case of §4, where it is "Discordant indicators — clinical review needed". | One decision (`cardLabel`, l.3771–3774) used by the card (l.3978), the copied text (l.4066) and the export (l.3840) |
| **Display confidence** and **native confidence** | `functional.display.confidence`; `confidence_level` (also `functional.native.confidence_level`) | Display confidence is the M3 page's rule (number of fields, follow-up, reliability, inconsistency); for results the engine classes as insufficient it equals the native value. Native confidence is the engine's (data quality and significance). They can differ: for example, 12 fields over 22 months give display **High** and native **medium**. M5 reports both (`confidence.display_M3`, `confidence.native_M3`). | M3 page / M3 engine |

Rules of use:
- `functional.display.label` is **not** "what the clinician saw". Use `rendered_label` for that.
- `rendered_label` is presentation only. It is not a classification and M5 does not use it for any decision.
- M5 decisions use `display.label`, `display.assessability`, `display.confidence` and the native fields.

## 2. What is exported in each case

| Case | Export | `display.label` | `rendered_label` |
|---|---|---|---|
| Two or more fields, any result | yes | pattern-rule label | card label |
| Discordance (§4): pattern-rule `Stable` with significant native moderate or faster progression | yes | `Stable` | "Discordant indicators — clinical review needed" |
| Pattern-rule `Stable` with native moderate or faster progression that is **not** significant | yes | `Stable` | "No progression detected" |
| Structural floor display (variant C) or engine-insufficient series (`unclassifiable` / `insufficient`) | yes | `Not assessable` | `Not assessable` |
| A single field (the engine is not run) | **no export** (nothing is written for M5; the host shows M3 as not published) | — | — |

For a single field the M3 card shows *Not assessable* with risk *Indeterminate*; the clinical modifiers still raise the risk shown on the card (central threat → High, functionally monocular → Moderate, both → High). No export is produced and M5 does not receive an M3 result.

## 3. Version fields

| Field | Value | Note |
|---|---|---|
| `transport_version` | `gate2-m3-0.2.1` | Contract version; 0.2.1 adds `functional.display.rendered_label` (additive). Not read by M5. |
| `functional.native.transport_version` | `gate2-m3-0.2.1` | A second copy, made because the export copies the whole native store (`native: JSON.parse(JSON.stringify(_m3Store))`, l.3834). Consumers should read the top-level field. |
| `algorithm_version`, `functional.candidate.algorithm` | `2.3.1` | M5 accepts only this M3 version (`semantic.cjs` l.133); other versions are reported as `context_blocked`. |
| `functional.candidate.ui` | `2.6.2` | M3 UI version |
| `functional.candidate.source_lineage_sha256` | `ba41b5df…a550` | SHA-256 of the M3 2.2.0 file from which this candidate line was derived (the M3 file on the public website at commit `bac6f39` of `ofty-tools/ofty`). It is **not** the hash of the candidate file; `functional.candidate.source_sha256` is `null`. |
| `final_copy_status` | `REQUIRES_AUTHOR_FINAL_COPY_APPROVAL` | Staging marker: the user-facing wording has not had its final approval. |

Example (fixture E-O6-sig-fast; full record in `evidence/g2e_campaign_20261020/supporting/G2E_CONTRACT_BEFORE_AFTER_SNIPPETS.json`):

```json
before (contract 0.2.0): "transport_version": "gate2-m3-0.2.0",
  "functional.display": {"label": "Stable", "assessability": "assessable", "reason": null, "confidence": "high", "concern": "high"}
after (contract 0.2.1):  "transport_version": "gate2-m3-0.2.1",
  "functional.display": {"label": "Stable", "assessability": "assessable", "reason": null, "confidence": "high", "concern": "high",
                         "rendered_label": "Discordant indicators — clinical review needed"}
```

The native fields (`fast_progression`, `significant`, native confidence `medium`) are the same before and after.

## 4. M3 discordance display and M5 rule A1 use different conditions (by design)

| | M3 card "Discordant indicators — clinical review needed" | M5 rule A1 (history-versus-current conflict) |
|---|---|---|
| Condition | pattern-rule `Stable` **and** native moderate or faster **and** `significant` **and** data not insufficient | pattern-rule `Stable` **and** native moderate or faster (significance not required) |
| Effect | M3 card and copied text show the discordance label; risk and confidence unchanged | M5 headline `history_vs_current_conflict`, guard A1, concern not graded, protective review |
| Example: noisy series of 12 fields, p < 0.0001 | shown | fires |
| Example: moderate slope, p = 0.56 | not shown (card "No progression detected") | fires; M5 adds `non_significant_trend` |

The author decided to keep the narrower M3 display condition and the broader protective M5 rule. They are not made equal. M5 states which label the M3 card actually showed (§5), so it does not attribute a warning to M3 that M3 did not display.

## 5. How M5 describes the M3 result

| Surface | Wording |
|---|---|
| Global MD line, A1 unresolved | `Not reconciled (<src>; native classification indicates progression)` |
| Global MD line, A1 plateau | `Historical progression followed by a plateau (<src>)` |
| Narrative clause | `…between its native classification and its pattern-rule interpretation` |
| Caution `unresolved_history_vs_current_interpretation` | `…whereas the M3 pattern-rule interpretation is stable…` |
| Detail rows | `Source pattern-rule label (M3): <display.label>` and `M3 card label: <rendered_label, or "Not available">` |

| `rendered_label` | `<src>` |
|---|---|
| absent (older producer payloads) | "M3 pattern-rule label: No progression detected" |
| "No progression detected" | "M3 pattern-rule label and card: No progression detected" |
| any other value | "M3 pattern-rule label: No progression detected; M3 card: <rendered_label>" |

M5 copies the whole `display` object into its result, so `functional.display.rendered_label` also appears in the M5 result and JSON export.

## 6. Compatibility

- Payloads without `rendered_label` (older producers, synthetic fixtures) are accepted; M5 then makes no statement about the M3 card ("M3 card label: Not available").
- `semantic.cjs` was not changed between contract 0.2.0 and 0.2.1. In the October 2026 evaluation the M5 result and JSON of every integrated case differed only at `functional.display.rendered_label` and `functional.candidate.ui` (evidence: `evidence/g2e_campaign_20261020/`).
