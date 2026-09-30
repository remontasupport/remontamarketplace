#!/usr/bin/env bash
# One-time preparation of a Google Cloud project for apps/api (D19). Idempotent: run
# it again after a change and it only creates what is missing.
#
#   ./infra/cloudrun/bootstrap.sh <project-id> [alert-email]
#
# Needs: gcloud authenticated as an Owner of the project (`gcloud auth login`), and a
# billing account already attached to the project. It never reads or writes a
# secret VALUE: the six secrets per stage are created empty, and the user adds the
# values afterwards (console, or `gcloud secrets versions add <name> --data-file=-`).
#
# What it sets up, in order:
#   1. APIs                          6. Workload Identity Federation for GitHub Actions (no keys)
#   2. Artifact Registry `remonta`   7. Log-based metrics the alerts read
#   3. Runtime service accounts      8. 90-day log retention
#   4. Empty secrets + accessor      9. Alert notification channel and policies per stage
#   5. Deploy service account       10. Prints the three GitHub repository variables
set -euo pipefail

PROJECT="${1:?usage: bootstrap.sh <project-id> [alert-email]}"
EMAIL="${2:-support@remontaservices.com.au}"
REGION=australia-southeast1
GITHUB_REPO=remontasupport/remontamarketplace
REGISTRY=remonta
DEPLOY_SA_ID=github-deploy
POOL=github
PROVIDER=remontamarketplace
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Keep in step with infra/lib/stages.ts (the test suite checks the names there).
STAGES=(staging prod)
service_for() { case "$1" in staging) echo remonta-api-staging ;; prod) echo remonta-api ;; esac; }
alerts_for() { case "$1" in staging) echo "instance-down outbox-dead-letter" ;; prod) echo "instance-down outbox-dead-letter 5xx-ratio latency-p95 request-failed will-not-start" ;; esac; }
SECRETS=(AUTH_DATABASE_URL RECAPTCHA_SECRET_KEY RESEND_API_KEY IP_HASH_SECRET BLOB_READ_WRITE_TOKEN N8N_REGISTRATION_WEBHOOK_URL)

say() { printf '\n== %s\n' "$*"; }
exists() { "$@" >/dev/null 2>&1; }

gcloud config set project "$PROJECT" >/dev/null
PROJECT_NUMBER=$(gcloud projects describe "$PROJECT" --format='value(projectNumber)')
DEPLOY_SA="$DEPLOY_SA_ID@$PROJECT.iam.gserviceaccount.com"

say "1. APIs"
gcloud services enable run.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com \
  iam.googleapis.com iamcredentials.googleapis.com sts.googleapis.com monitoring.googleapis.com \
  logging.googleapis.com cloudresourcemanager.googleapis.com

say "2. Artifact Registry $REGISTRY ($REGION), newest 20 tagged images kept"
exists gcloud artifacts repositories describe "$REGISTRY" --location="$REGION" ||
  gcloud artifacts repositories create "$REGISTRY" --repository-format=docker --location="$REGION" --description="apps/api images (tag = git sha)"
gcloud artifacts repositories set-cleanup-policies "$REGISTRY" --location="$REGION" --policy="$here/registry-cleanup.json" --no-dry-run >/dev/null

for STAGE in "${STAGES[@]}"; do
  SVC=$(service_for "$STAGE")
  RUN_SA="$SVC-run@$PROJECT.iam.gserviceaccount.com"
  say "3. Runtime service account for $STAGE: $RUN_SA (no roles; it may only read its secrets)"
  exists gcloud iam service-accounts describe "$RUN_SA" ||
    gcloud iam service-accounts create "$SVC-run" --display-name="apps/api $STAGE runtime"

  say "4. Secrets for $STAGE (empty; add values afterwards)"
  for NAME in "${SECRETS[@]}"; do
    S="$SVC-$NAME"
    exists gcloud secrets describe "$S" ||
      gcloud secrets create "$S" --replication-policy=user-managed --locations="$REGION" --labels="remonta-stage=$STAGE"
    gcloud secrets add-iam-policy-binding "$S" --member="serviceAccount:$RUN_SA" --role=roles/secretmanager.secretAccessor >/dev/null
  done
done

say "5. Deploy service account $DEPLOY_SA (Cloud Run admin, registry writer, may act as the runtime accounts)"
exists gcloud iam service-accounts describe "$DEPLOY_SA" ||
  gcloud iam service-accounts create "$DEPLOY_SA_ID" --display-name="GitHub Actions deploy (apps/api)"
gcloud projects add-iam-policy-binding "$PROJECT" --member="serviceAccount:$DEPLOY_SA" --role=roles/run.admin --condition=None >/dev/null
gcloud projects add-iam-policy-binding "$PROJECT" --member="serviceAccount:$DEPLOY_SA" --role=roles/artifactregistry.writer --condition=None >/dev/null
for STAGE in "${STAGES[@]}"; do
  gcloud iam service-accounts add-iam-policy-binding "$(service_for "$STAGE")-run@$PROJECT.iam.gserviceaccount.com" \
    --member="serviceAccount:$DEPLOY_SA" --role=roles/iam.serviceAccountUser >/dev/null
done

say "6. Workload Identity Federation: GitHub Actions on $GITHUB_REPO main may act as $DEPLOY_SA"
exists gcloud iam workload-identity-pools describe "$POOL" --location=global ||
  gcloud iam workload-identity-pools create "$POOL" --location=global --display-name="GitHub Actions"
exists gcloud iam workload-identity-pools providers describe "$PROVIDER" --workload-identity-pool="$POOL" --location=global ||
  gcloud iam workload-identity-pools providers create-oidc "$PROVIDER" --workload-identity-pool="$POOL" --location=global \
    --display-name="$GITHUB_REPO" --issuer-uri="https://token.actions.githubusercontent.com" \
    --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.ref=assertion.ref" \
    --attribute-condition="assertion.repository == '$GITHUB_REPO' && assertion.ref == 'refs/heads/main'"
gcloud iam service-accounts add-iam-policy-binding "$DEPLOY_SA" --role=roles/iam.workloadIdentityUser \
  --member="principalSet://iam.googleapis.com/projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/$POOL/attribute.repository/$GITHUB_REPO" >/dev/null

say "7. Log-based metrics (the service's pino JSON lands in jsonPayload)"
metric() { exists gcloud logging metrics describe "$1" || gcloud logging metrics create "$1" --description="$2" --log-filter="$3"; }
metric remonta-api-outbox-dead-letter "an outbox event exhausted its retries" 'resource.type="cloud_run_revision" AND jsonPayload.alert="outbox-dead-letter"'
metric remonta-api-request-failed "a 500 from apps/api" 'resource.type="cloud_run_revision" AND jsonPayload.msg="request failed"'
metric remonta-api-will-not-start "apps/api refused to start (configuration or contract problem)" 'resource.type="cloud_run_revision" AND "apps/api will not start"'

say "8. Log retention 90 days (project _Default bucket)"
gcloud logging buckets update _Default --location=global --retention-days=90 >/dev/null

say "9. Alerts to $EMAIL"
CHANNEL=$(gcloud beta monitoring channels list --filter="type=\"email\" AND labels.email_address=\"$EMAIL\"" --format='value(name)' | head -n1)
if [ -z "$CHANNEL" ]; then
  CHANNEL=$(gcloud beta monitoring channels create --display-name="Remonta api alerts" --type=email --channel-labels="email_address=$EMAIL" --format='value(name)')
fi
for STAGE in "${STAGES[@]}"; do
  SVC=$(service_for "$STAGE")
  for P in $(alerts_for "$STAGE"); do
    NAME="$SVC $P"
    if [ -z "$(gcloud alpha monitoring policies list --filter="displayName=\"$NAME\"" --format='value(name)')" ]; then
      sed "s/__SERVICE__/$SVC/g; s/__STAGE__/$STAGE/g; s#__CHANNEL__#$CHANNEL#g; s/__PROJECT_ID__/$PROJECT/g" "$here/monitoring/$P.json" |
        gcloud alpha monitoring policies create --policy-from-file=- >/dev/null
      echo "   created: $NAME"
    else
      echo "   exists:  $NAME"
    fi
  done
done

say "10. GitHub repository VARIABLES (Settings -> Secrets and variables -> Actions -> Variables)"
cat <<EOF
GCP_PROJECT_ID=$PROJECT
GCP_WORKLOAD_IDENTITY_PROVIDER=projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/$POOL/providers/$PROVIDER
GCP_DEPLOY_SERVICE_ACCOUNT=$DEPLOY_SA

Next (per stage, before its first deploy): add the six secret values --
  for each of ${SECRETS[*]}:
    printf '%s' '<value>' | gcloud secrets versions add remonta-api-staging-<NAME> --data-file=-
Then merge to main: deploy-api deploys STAGING. Production is a promotion (workflow_dispatch).
EOF
