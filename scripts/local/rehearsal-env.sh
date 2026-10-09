# Shared by run-api.sh and run-app.sh: the new code on this machine against the STAGING copy
# (`REHEARSAL_DATABASE_URL` in apps/api/.env: the rehearse-w1 Neon branch, never production).
# Source it; do not run it.
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
REHEARSAL_DATABASE_URL="$(grep '^REHEARSAL_DATABASE_URL=' "$ROOT/apps/api/.env" | cut -d= -f2- | tr -d '\r"')"
if [ -z "$REHEARSAL_DATABASE_URL" ]; then echo "REHEARSAL_DATABASE_URL is not set in apps/api/.env" >&2; exit 1; fi
case "$REHEARSAL_DATABASE_URL" in
  *ep-delicate-recipe*|*ep-polished-thunder*) echo "REHEARSAL_DATABASE_URL points at production; refusing" >&2; exit 1 ;;
esac
# One secret for both sides (the app mints, the api verifies). Override with LOCAL_API_TOKEN_SECRET (32+ chars).
export API_TOKEN_SECRET="${LOCAL_API_TOKEN_SECRET:-local-dev-only-token-secret-0123456789abcdef}"
export AUTH_DATABASE_URL="$REHEARSAL_DATABASE_URL" DIRECT_DATABASE_URL="$REHEARSAL_DATABASE_URL"
