#!/usr/bin/env bash
# Run apps/api on http://127.0.0.1:4000 against the staging copy. Terminal 1.
#   bash scripts/local/run-api.sh            (builds first; pass --no-build to skip)
set -euo pipefail
. "$(dirname "${BASH_SOURCE[0]}")/rehearsal-env.sh"
cd "$ROOT/apps/api"
[ "${1:-}" = "--no-build" ] || pnpm run build
# Photo settings that touch nothing real (no bucket runs locally; the photo paths just fail if used).
export PHOTO_BUCKET=local-dev-photos PHOTO_PUBLIC_BASE_URL=http://localhost:4443/local-dev-photos GCS_API_ENDPOINT=http://localhost:4443
export BLOB_READ_WRITE_TOKEN=local-dev-no-blob-writes-000000
echo "api -> staging copy (host $(echo "$AUTH_DATABASE_URL" | sed -E 's#.*@([^/:]+).*#\1#')), port 4000"
exec node --env-file=.env dist/main.js
