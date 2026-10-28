#!/usr/bin/env bash
# Run apps/api on http://127.0.0.1:4000 against a copy of real data (dev-env.sh). Terminal 1.
#   bash scripts/local/run-api.sh            (builds first; pass --no-build to skip)
set -euo pipefail
. "$(dirname "${BASH_SOURCE[0]}")/dev-env.sh"
cd "$ROOT/apps/api"
[ "${1:-}" = "--no-build" ] || pnpm run build
# Emails are printed here, never sent (codes included). No bucket runs locally: photo uploads fail if tried.
export EMAIL_MODE=log N8N_REGISTRATION_WEBHOOK_URL= N8N_SERVICE_REQUEST_WEBHOOK_URL=off
export PHOTO_BUCKET=local-dev-photos PHOTO_PUBLIC_BASE_URL=http://localhost:4443/local-dev-photos GCS_API_ENDPOINT=http://localhost:4443
echo "api -> $DB_LABEL (host $DB_HOST), port 4000; emails are printed below, not sent"
exec node --env-file=.env dist/main.js
