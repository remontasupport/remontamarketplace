#!/usr/bin/env bash
# Run apps/app on http://localhost:3000 against the local api and a copy of real data (dev-env.sh). Terminal 2.
#   bash scripts/local/run-app.sh
set -euo pipefail
. "$(dirname "${BASH_SOURCE[0]}")/dev-env.sh"
cd "$ROOT/apps/app"
export DATABASE_URL="$DEV_MAIN_DB"
export NEXT_PUBLIC_API_URL=http://127.0.0.1:4000
# Nothing outbound: the app's own emails fail instead of sending, SMS codes are shown (dev mode), no CRM sync,
# no n8n webhooks, no realtime, no shared Redis cache.
export RESEND_API_KEY="re_$DEAD" SMS_DEV_MODE=true
export TWILIO_ACCOUNT_SID="$DEAD" TWILIO_AUTH_TOKEN="$DEAD" TWILIO_PHONE_NUMBER=+10000000000
export ZOHO_CLIENT_ID="$DEAD" ZOHO_CLIENT_SECRET="$DEAD" ZOHO_REFRESH_TOKEN="$DEAD" ZOHO_ACCOUNTS_URL="$DEAD_URL" ZOHO_CRM_API_URL="$DEAD_URL"
export APPLY_WEBHOOK_URL="$DEAD_URL" AI_SEARCH_WEBHOOK="$DEAD_URL" SYNC_API_SECRET="$DEAD"
export PUSHER_APP_ID="$DEAD" PUSHER_KEY="$DEAD" PUSHER_SECRET="$DEAD" NEXT_PUBLIC_PUSHER_KEY="$DEAD"
export UPSTASH_REDIS_REST_URL= UPSTASH_REDIS_REST_TOKEN=
echo "app -> api http://127.0.0.1:4000, $DB_LABEL (host $DB_HOST); open http://localhost:3000"
exec npx next dev
