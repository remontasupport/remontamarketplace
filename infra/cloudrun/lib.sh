# Shared by bootstrap.sh and apply-alerts.sh (sourced, not run): the stage tables and
# the helpers both scripts need, in one place so they cannot drift.
#
# Keep the two tables in step with infra/lib/stages.ts; the test suite
# (infra/test/monitoring.test.ts) reads them from this file.

STAGES=(staging prod)
service_for() { case "$1" in staging) echo remonta-api-staging ;; prod) echo remonta-api ;; esac; }
alerts_for() { case "$1" in staging) echo "instance-down outbox-dead-letter" ;; prod) echo "instance-down outbox-dead-letter 5xx-ratio latency-p95 request-failed will-not-start" ;; esac; }

say() { printf '\n== %s\n' "$*"; }
exists() { "$@" >/dev/null 2>&1; }

# The email notification channel the alert policies send to. find_channel prints its
# resource name or nothing; create_channel creates it and prints the name.
find_channel() {
  gcloud beta monitoring channels list --filter="type=\"email\" AND labels.email_address=\"$1\"" --format='value(name)' | head -n1
}
create_channel() {
  gcloud beta monitoring channels create --display-name="Remonta api alerts" --type=email --channel-labels="email_address=$1" --format='value(name)'
}

# Renders a policy file for a stage: the four placeholders become the stage's values.
#   render_policy <file> <service> <stage> <channel> <project>
render_policy() {
  sed "s/__SERVICE__/$2/g; s/__STAGE__/$3/g; s#__CHANNEL__#$4#g; s/__PROJECT_ID__/$5/g" "$1"
}

# The sign-up photo bucket per stage (U3). Keep in step with PHOTO_BUCKET in
# infra/lib/stages.ts (the test suite checks) and with cloudrun/storage/cors.<stage>.json.
bucket_for() { case "$1" in staging) echo remonta-api-photos-staging ;; prod) echo remonta-api-photos ;; esac; }
