#!/usr/bin/env bash
# Apply packages/db's pending migrations to a stage's database before the stage's service is
# replaced (deploy-api.yml; worker-profile-api U2). Expand-only migrations only (the
# migrations README): the running revision keeps working while the new one starts.
#
#   .github/scripts/api-migrate.sh <staging|prod> <gcp project id>
#
# The database URL is the stage's AUTH_DATABASE_URL secret (the deploy account may read that
# one secret; infra/cloudrun/bootstrap.sh step 5). Prisma migrates over a DIRECT connection,
# never the pooler, so the pooled host (`...-pooler.`) is turned into the direct one and the
# pgbouncer flag dropped. Prints the migration names only, never the URL.
set -euo pipefail
STAGE="${1:?stage}"
PROJECT="${2:?project id}"
case "$STAGE" in
  staging) SECRET="remonta-api-staging-AUTH_DATABASE_URL" ;;
  prod) SECRET="remonta-api-AUTH_DATABASE_URL" ;;
  *) echo "unknown stage $STAGE" >&2; exit 2 ;;
esac

POOLED="$(gcloud secrets versions access latest --secret="$SECRET" --project="$PROJECT" | tr -d '\r\n')"
DIRECT="$(printf '%s' "$POOLED" | sed -E 's/-pooler\././; s/([?&])pgbouncer=true&?/\1/; s/[?&]$//')"
export AUTH_DATABASE_URL="$DIRECT" DIRECT_DATABASE_URL="$DIRECT"
echo "migrating $STAGE: host $(printf '%s' "$DIRECT" | sed -E 's#.*@([^/:?]+).*#\1#')"

cd "$(dirname "$0")/../.."
# The schema's `prisma` version, without installing the workspace: npx fetches the CLI once.
PRISMA_VERSION="$(node -e "console.log(require('./packages/db/package.json').devDependencies.prisma.replace(/^[^0-9]*/, ''))")"
npx --yes "prisma@${PRISMA_VERSION}" migrate status --schema=packages/db/prisma/schema.prisma || true
npx --yes "prisma@${PRISMA_VERSION}" migrate deploy --schema=packages/db/prisma/schema.prisma
