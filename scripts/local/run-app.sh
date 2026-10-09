#!/usr/bin/env bash
# Run apps/app on http://localhost:3000 against the local api and the staging copy. Terminal 2.
#   bash scripts/local/run-app.sh
set -euo pipefail
. "$(dirname "${BASH_SOURCE[0]}")/rehearsal-env.sh"
cd "$ROOT/apps/app"
export DATABASE_URL="$REHEARSAL_DATABASE_URL"
export UPSTASH_REDIS_REST_URL= UPSTASH_REDIS_REST_TOKEN=
export NEXT_PUBLIC_API_URL=http://127.0.0.1:4000
echo "app -> api http://127.0.0.1:4000, staging copy; open http://localhost:3000/admin"
exec npx next dev
