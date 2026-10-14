# Shared by run-api.sh and run-app.sh: the code on this machine against a COPY of real data, never production.
# Source it; do not run it.
#
# The database, from apps/api/.env:
#   DEV_DATABASE_URL        your own Neon branch of the production auth database (CLAUDE.md "Local development on
#                           real data"); refresh it with Neon's "Reset from parent" whenever you want today's data.
#   REHEARSAL_DATABASE_URL  the fallback: rehearse-w1, the copy staging and every preview share.
#   DEV_MAIN_DATABASE_URL   optional: a branch of the jobs database for apps/app's DATABASE_URL (default: the above).
#
# Everything that leaves this machine is switched off, because the rows belong to real people: the api prints
# emails instead of sending them (EMAIL_MODE=log), and Blob, SMS, Zoho, n8n, Pusher and Upstash get dead values,
# so a delete can never remove a production photo and nothing reaches a worker or the CRM.
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
# A missing variable is an empty value, not a failure (the run scripts use set -euo pipefail).
envval() { { grep "^$1=" "$ROOT/apps/api/.env" || true; } | head -1 | cut -d= -f2- | tr -d '\r"'; }
refuse_production() {
  case "$2" in
    *ep-delicate-recipe*|*ep-polished-thunder*) echo "$1 points at production; refusing (use a Neon branch of it)" >&2; exit 1 ;;
  esac
}

DEV_DB="$(envval DEV_DATABASE_URL)"
if [ -n "$DEV_DB" ]; then
  DB_LABEL="your dev branch"
else
  DEV_DB="$(envval REHEARSAL_DATABASE_URL)"
  DB_LABEL="rehearse-w1 (shared with staging; set DEV_DATABASE_URL for your own copy)"
fi
if [ -z "$DEV_DB" ]; then echo "set DEV_DATABASE_URL (or REHEARSAL_DATABASE_URL) in apps/api/.env" >&2; exit 1; fi
refuse_production "the dev database" "$DEV_DB"
DEV_MAIN_DB="$(envval DEV_MAIN_DATABASE_URL)"
DEV_MAIN_DB="${DEV_MAIN_DB:-$DEV_DB}"
refuse_production "DEV_MAIN_DATABASE_URL" "$DEV_MAIN_DB"
DB_HOST="$(echo "$DEV_DB" | sed -E 's#.*@([^/:]+).*#\1#')"

# One secret for both sides (the app mints, the api verifies). Override with LOCAL_API_TOKEN_SECRET (32+ chars).
export API_TOKEN_SECRET="${LOCAL_API_TOKEN_SECRET:-local-dev-only-token-secret-0123456789abcdef}"
# Shell values win over --env-file and over Next's .env files: these override whatever the env files hold.
export AUTH_DATABASE_URL="$DEV_DB" DIRECT_DATABASE_URL="$DEV_DB"
DEAD=disabled-on-local-dev-000000000000
DEAD_URL=http://127.0.0.1:9/disabled-on-local-dev
export BLOB_READ_WRITE_TOKEN="vercel_blob_rw_$DEAD"
