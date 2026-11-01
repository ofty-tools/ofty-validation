#!/usr/bin/env bash
# Reproduce the G2-E candidate evaluation on the released candidate/ tree.
#
# What it does:
#   1. verifies candidate/SHA256SUMS.txt and this kit's KIT_SHA256SUMS.txt;
#   2. captures the released candidate (POST) in 15 blocks: 8 standalone-page blocks and 7 integrated-host blocks;
#   3. evaluates each block against the archived PRE captures with the frozen evaluator v1.0 and the amended
#      evaluator v1.1 (OA-E01);
#   4. checks the outcome against EXPECTED_RESULTS.json (declared before any run) and writes SUMMARY.json.
#
# Requirements: bash, Node.js 22, the npm package playwright@1.56.0 with its Chromium build (see ../README.md),
# and pdftotext (poppler-utils). Synthetic data only. Pages are served from 127.0.0.1; every other request is aborted.
# Usage: tests/g2e_reproduction/run_reproduction.sh [output_dir]   (default: tests/g2e_reproduction/out/<UTC timestamp>)
set -u
KIT="$(cd "$(dirname "$0")" && pwd)"; REPO="$(cd "$KIT/../.." && pwd)"
TS="$(date -u +%Y%m%dT%H%M%SZ)"; OUT="${1:-$KIT/out/$TS}"
mkdir -p "$OUT"; OUT="$(cd "$OUT" && pwd)"
LOG="$OUT/RUN_LOG.txt"; IDX="$OUT/RUN_INDEX.csv"
echo "start_utc,end_utc,block,exit_code,output" > "$IDX"
say() { echo "$*" | tee -a "$LOG"; }

say "G2-E reproduction kit · start $(date -u +%FT%TZ)"
say "repository: $REPO"
say "node: $(node --version 2>&1)  pdftotext: $(pdftotext -v 2>&1 | head -1)  platform: $(uname -sm)"
( cd "$REPO/candidate" && sha256sum -c --quiet SHA256SUMS.txt ) >> "$LOG" 2>&1 && say "integrity: candidate/SHA256SUMS.txt OK" || { say "integrity: candidate/SHA256SUMS.txt FAILED"; exit 2; }
( cd "$KIT" && sha256sum -c --quiet KIT_SHA256SUMS.txt ) >> "$LOG" 2>&1 && say "integrity: KIT_SHA256SUMS.txt OK" || { say "integrity: KIT_SHA256SUMS.txt FAILED"; exit 2; }

block() {   # block <name> <command...>
  local name="$1"; shift; local s e rc
  s="$(date -u +%FT%TZ)"
  ( cd "$KIT/harness" && "$@" ) > "$OUT/$name.log" 2>&1; rc=$?
  e="$(date -u +%FT%TZ)"; echo "$s,$e,$name,$rc,$name" >> "$IDX"; say "[$name] exit=$rc"
}

SA_SETS="g2e g2d wp1 wp2 a02 a03 wp3 t2b_m4"; HOST_SETS="g2e g2d wp1 wp2 a02 a03 wp3"
for s in $SA_SETS;   do block "POST_standalone_$s" node G2E_CAPTURE.cjs standalone POST "$s" "$OUT/POST_standalone_$s"; done
for s in $HOST_SETS; do block "POST_host_$s"       node G2E_CAPTURE.cjs host POST "$s" "$OUT/POST_host_$s"; done
for s in $SA_SETS; do
  block "EVAL_v1.0_standalone_$s" node G2E_EVAL.cjs standalone "$s" "$KIT/baseline_pre_captures/standalone_$s" "$OUT/POST_standalone_$s" "$OUT/EVAL_v1.0_standalone_$s"
  block "EVAL_v1.1_standalone_$s" node ../harness_amendments/G2E_EVAL_v1.1_OAE01.cjs standalone "$s" "$KIT/baseline_pre_captures/standalone_$s" "$OUT/POST_standalone_$s" "$OUT/EVAL_v1.1_standalone_$s"
done
for s in $HOST_SETS; do
  block "EVAL_v1.0_host_$s" node G2E_EVAL.cjs host "$s" "$KIT/baseline_pre_captures/host_$s" "$OUT/POST_host_$s" "$OUT/EVAL_v1.0_host_$s"
  block "EVAL_v1.1_host_$s" node ../harness_amendments/G2E_EVAL_v1.1_OAE01.cjs host "$s" "$KIT/baseline_pre_captures/host_$s" "$OUT/POST_host_$s" "$OUT/EVAL_v1.1_host_$s"
done
node "$KIT/check_expected.cjs" "$OUT" | tee -a "$LOG"; rc=${PIPESTATUS[0]}
say "end $(date -u +%FT%TZ) · overall exit=$rc (0 = outcome matches EXPECTED_RESULTS.json)"
exit $rc
