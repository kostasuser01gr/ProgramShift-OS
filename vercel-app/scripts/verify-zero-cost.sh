#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="${GOOGLE_CLOUD_PROJECT:-program-shift-260609-40b7}"
PROJECT_FILE=".vercel/project.json"

for command in gcloud vercel jq; do
  command -v "$command" >/dev/null || {
    echo "Missing required command: $command" >&2
    exit 1
  }
done

if [[ -n "${VERCEL_ORG_ID:-}" ]]; then
  ORG_ID="$VERCEL_ORG_ID"
elif [[ -f "$PROJECT_FILE" ]]; then
  ORG_ID="$(jq -r '.orgId // empty' "$PROJECT_FILE")"
else
  echo "Set VERCEL_ORG_ID or run vercel link before this check." >&2
  exit 1
fi

if [[ -z "$ORG_ID" ]]; then
  echo "Could not determine the linked Vercel organization." >&2
  exit 1
fi

BILLING_ENABLED="$(
  gcloud billing projects describe "$PROJECT_ID" \
    --format='value(billingEnabled)'
)"

if [[ "$BILLING_ENABLED" != "False" ]]; then
  echo "FAIL: Google Cloud billing is enabled for $PROJECT_ID." >&2
  exit 1
fi

VERCEL_PLAN="$(vercel api "/v2/teams/$ORG_ID" | jq -r '.billing.plan')"
VERCEL_TRIAL="$(vercel api "/v2/teams/$ORG_ID" | jq -r '.billing.trial // empty')"

if [[ "$VERCEL_PLAN" != "hobby" || -n "$VERCEL_TRIAL" ]]; then
  echo "FAIL: Vercel must remain on Hobby with no active trial." >&2
  exit 1
fi

ALLOWED_APIS="$(
  printf '%s\n' \
    servicemanagement.googleapis.com \
    serviceusage.googleapis.com \
    sheets.googleapis.com |
    sort
)"
ENABLED_APIS="$(
  gcloud services list --enabled --project="$PROJECT_ID" \
    --format='value(config.name)' |
    sort
)"

if [[ "$ENABLED_APIS" != "$ALLOWED_APIS" ]]; then
  echo "FAIL: Google API allowlist changed." >&2
  diff -u <(printf '%s\n' "$ALLOWED_APIS") <(printf '%s\n' "$ENABLED_APIS") || true
  exit 1
fi

echo "PASS: Google billing detached, Vercel Hobby/no trial, API allowlist intact."
