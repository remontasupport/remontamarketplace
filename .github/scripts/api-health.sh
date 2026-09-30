#!/usr/bin/env bash
# After `gcloud run services replace` for an api stage: wait until the service's
# latest revision is Ready and serving, then prove it answers its probe with 200.
# A revision that never becomes ready (a missing secret, a crash at boot) leaves
# Cloud Run serving the previous one; this script then fails the job visibly
# instead of reporting success.
#
# Usage: api-health.sh <staging|prod> <project-id>     (gcloud authenticated)
set -euo pipefail

stage="${1:?stage (staging|prod)}"
project="${2:?project id}"
region=australia-southeast1
case "$stage" in
  staging) service=remonta-api-staging ;;
  prod)    service=remonta-api ;;
  *) echo "unknown stage: $stage" >&2; exit 2 ;;
esac

describe() { gcloud run services describe "$service" --region "$region" --project "$project" --format="value($1)"; }

echo "waiting for $service to be Ready and serving its latest revision..."
for i in $(seq 1 60); do
  ready=$(describe 'status.conditions[0].status' || echo Unknown)
  latest_created=$(describe 'status.latestCreatedRevisionName')
  latest_ready=$(describe 'status.latestReadyRevisionName')
  if [ "$ready" = "True" ] && [ -n "$latest_ready" ] && [ "$latest_ready" = "$latest_created" ]; then
    echo "ready: $latest_ready"
    break
  fi
  if [ "$i" = "60" ]; then
    echo "the latest revision ($latest_created) did not become ready; serving: ${latest_ready:-none}" >&2
    describe 'status.conditions' >&2 || true
    exit 1
  fi
  sleep 5
done

url=$(describe 'status.url')
code=$(curl -sS -o /tmp/health.json -w '%{http_code}' --max-time 10 "$url/v1/health" || echo 000)
echo "health: $code $(cat /tmp/health.json 2>/dev/null || true)  ($url)"
[ "$code" = "200" ] || { echo "health check failed" >&2; exit 1; }
echo "service URL: $url  (NEXT_PUBLIC_API_URL for this stage)"
