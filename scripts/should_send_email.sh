#!/usr/bin/env bash
# should_send_email.sh
# --------------------
# Tentukan apakah workflow harus kirim email notification atau skip.
#
# Aturan dedup (untuk reduce noise di production yang jalan tiap jam):
#   1. Run PERTAMA (belum ada state lama)             → SEND
#   2. Status berubah (passed→failed ATAU failed→passed) → SEND (recovery / new bug)
#   3. Status sama TAPI failureHash berubah          → SEND (bug baru muncul)
#   4. Status sama, hash sama, < MAX_QUIET_HOURS jam → SKIP (noise reduction)
#   5. Status sama, hash sama, >= MAX_QUIET_HOURS jam → SEND (digest reminder)
#
# ENV input:
#   PREV_STATE_FILE   path ke state run sebelumnya (dari cache)
#   CURR_STATE_FILE   path ke state run sekarang (qa_state.json)
#   MAX_QUIET_HOURS   max jam suppress email kalau hash sama (default 6)
#
# Output ke $GITHUB_OUTPUT:
#   should_send=true|false
#   reason=<alasan>

set -uo pipefail

PREV="${PREV_STATE_FILE:-/tmp/prev_qa_state.json}"
CURR="${CURR_STATE_FILE:-qa_state.json}"
MAX_QUIET="${MAX_QUIET_HOURS:-6}"

emit() {
  local should="$1"
  local reason="$2"
  echo "Decision: should_send=$should — $reason"
  if [ -n "${GITHUB_OUTPUT:-}" ]; then
    echo "should_send=$should" >> "$GITHUB_OUTPUT"
    echo "reason=$reason" >> "$GITHUB_OUTPUT"
  fi
  exit 0
}

if [ ! -f "$CURR" ]; then
  emit "true" "qa_state.json tidak ada (test mungkin crash sebelum reporter jalan) — kirim email investigasi"
fi

CURR_STATUS=$(jq -r '.status' "$CURR" 2>/dev/null || echo "unknown")
CURR_HASH=$(jq -r '.failureHash' "$CURR" 2>/dev/null || echo "unknown")
CURR_TS=$(jq -r '.timestamp' "$CURR" 2>/dev/null || echo "")

if [ ! -f "$PREV" ]; then
  emit "true" "first run (no previous state)"
fi

PREV_STATUS=$(jq -r '.status' "$PREV" 2>/dev/null || echo "unknown")
PREV_HASH=$(jq -r '.failureHash' "$PREV" 2>/dev/null || echo "unknown")
PREV_TS=$(jq -r '.lastEmailedAt // .timestamp' "$PREV" 2>/dev/null || echo "")

# Rule 2: status transition
if [ "$CURR_STATUS" != "$PREV_STATUS" ]; then
  emit "true" "status changed: $PREV_STATUS → $CURR_STATUS"
fi

# Rule 3: hash changed (bug baru / signature beda)
if [ "$CURR_HASH" != "$PREV_HASH" ]; then
  emit "true" "failure signature changed ($PREV_HASH → $CURR_HASH)"
fi

# Rule 4 vs 5: hitung selisih jam sejak last email
if [ -z "$PREV_TS" ] || [ -z "$CURR_TS" ]; then
  emit "true" "missing timestamp, default SEND"
fi

# macOS/Linux compatible date diff (pakai python3 untuk parsing ISO)
HOURS_SINCE=$(python3 -c "
from datetime import datetime
try:
    prev = datetime.fromisoformat('$PREV_TS'.replace('Z', '+00:00'))
    curr = datetime.fromisoformat('$CURR_TS'.replace('Z', '+00:00'))
    print(int((curr - prev).total_seconds() // 3600))
except Exception:
    print(999)
" 2>/dev/null || echo "999")

if [ "$HOURS_SINCE" -ge "$MAX_QUIET" ]; then
  emit "true" "same hash but $HOURS_SINCE h since last email (>= $MAX_QUIET h digest reminder)"
fi

emit "false" "same status ($CURR_STATUS) + same hash ($CURR_HASH), only $HOURS_SINCE h since last email — suppress to reduce noise"
