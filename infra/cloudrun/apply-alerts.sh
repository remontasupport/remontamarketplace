#!/usr/bin/env bash
# Applies one stage's alert policies (infra/cloudrun/monitoring/*.json, the source of
# truth) to Cloud Monitoring: creates a policy that is missing, updates one whose live
# definition differs from the file, leaves the rest alone. Never deletes.
#
#   bash infra/cloudrun/apply-alerts.sh <staging|prod> [--project <id>] [--email <address>] [--only <policy>] [--dry-run]
#
# bootstrap.sh calls this for each stage; run it alone after editing a policy JSON
# (merge first: the live policy must never run ahead of the reviewed file).
# --dry-run only lists and describes (read-only) and prints what would change.
# Needs: gcloud signed in with Monitoring Editor on the project, and node (it compares
# the file with the live policy, ignoring the server-assigned fields).
set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib.sh
source "$here/lib.sh"

usage() {
  echo "usage: apply-alerts.sh <staging|prod> [--project <id>] [--email <address>] [--only <policy>] [--dry-run]" >&2
  exit 2
}

STAGE="${1:-}"
case "$STAGE" in staging | prod) shift ;; *) usage ;; esac
PROJECT=""
EMAIL=support@remontaservices.com.au
ONLY=""
DRY=0
while [ $# -gt 0 ]; do
  case "$1" in
    --project) PROJECT="${2:?--project needs a value}"; shift 2 ;;
    --email) EMAIL="${2:?--email needs a value}"; shift 2 ;;
    --only) ONLY="${2:?--only needs a policy name}"; shift 2 ;;
    --dry-run) DRY=1; shift ;;
    *) usage ;;
  esac
done
[ -n "$PROJECT" ] || PROJECT=$(gcloud config get-value project 2>/dev/null || true)
[ -n "$PROJECT" ] || { echo "no project: pass --project <id> or run gcloud config set project" >&2; exit 2; }
command -v node >/dev/null || { echo "node is required (it compares the file with the live policy)" >&2; exit 2; }

SVC=$(service_for "$STAGE")
CHANNEL=$(find_channel "$EMAIL")
if [ -z "$CHANNEL" ]; then
  if [ "$DRY" = 1 ]; then
    echo "would create: email channel for $EMAIL"
    CHANNEL="__CHANNEL__"
  else
    CHANNEL=$(create_channel "$EMAIL")
    echo "created: email channel for $EMAIL"
  fi
fi

# Prints the paths at which the live policy differs from the rendered file. Fields the
# server assigns (name, records, enabled, condition names) are ignored, and so are
# fields the file does not set: the file is the source of truth for what it declares.
# Policy files are ASCII on purpose: a non-ASCII character piped through gcloud on
# Windows came back as "?" and read as a difference on every run.
differences() {
  node -e '
    const fs = require("fs")
    const file = JSON.parse(fs.readFileSync(process.argv[1], "utf8"))
    const live = JSON.parse(fs.readFileSync(process.argv[2], "utf8"))
    const out = []
    const walk = (want, have, path) => {
      if (Array.isArray(want)) {
        if (!Array.isArray(have) || have.length !== want.length) return out.push(`${path}: ${JSON.stringify(have)} -> ${JSON.stringify(want)}`)
        return want.forEach((w, i) => walk(w, have[i], `${path}[${i}]`))
      }
      if (want && typeof want === "object") {
        if (!have || typeof have !== "object") return out.push(`${path}: ${JSON.stringify(have)} -> ${JSON.stringify(want)}`)
        for (const k of Object.keys(want)) {
          if (k === "name") continue
          walk(want[k], have[k], path ? `${path}.${k}` : k)
        }
        return
      }
      // The API omits proto defaults (0, false, "") from what it returns.
      if (have === undefined && (want === 0 || want === false || want === "")) return
      if (want !== have) out.push(`${path}: ${JSON.stringify(have)} -> ${JSON.stringify(want)}`)
    }
    walk(file, live, "")
    process.stdout.write(out.join("\n"))
  ' "$1" "$2"
}

tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
created=0 updated=0 unchanged=0

for P in $(alerts_for "$STAGE"); do
  [ -z "$ONLY" ] || [ "$ONLY" = "$P" ] || continue
  NAME="$SVC $P"
  FILE="$here/monitoring/$P.json"
  [ -f "$FILE" ] || { echo "missing policy file: $FILE" >&2; exit 1; }
  render_policy "$FILE" "$SVC" "$STAGE" "$CHANNEL" "$PROJECT" >"$tmp/$P.json"
  EXISTING=$(gcloud alpha monitoring policies list --project "$PROJECT" --filter="displayName=\"$NAME\"" --format='value(name)' | head -n1)
  if [ -z "$EXISTING" ]; then
    if [ "$DRY" = 1 ]; then
      echo "would create: $NAME"
    else
      gcloud alpha monitoring policies create --project "$PROJECT" --policy-from-file="$tmp/$P.json" >/dev/null
      echo "created: $NAME"
    fi
    created=$((created + 1))
    continue
  fi
  gcloud alpha monitoring policies describe "$EXISTING" --project "$PROJECT" --format=json >"$tmp/$P.live.json"
  DIFF=$(differences "$tmp/$P.json" "$tmp/$P.live.json")
  if [ -z "$DIFF" ]; then
    echo "unchanged: $NAME"
    unchanged=$((unchanged + 1))
    continue
  fi
  printf '%s\n' "$DIFF" | sed 's/^/     /'
  if [ "$DRY" = 1 ]; then
    echo "would update: $NAME"
  else
    gcloud alpha monitoring policies update "$EXISTING" --project "$PROJECT" --policy-from-file="$tmp/$P.json" >/dev/null
    echo "updated: $NAME"
  fi
  updated=$((updated + 1))
done

[ "$DRY" = 1 ] && echo "dry run: $created to create, $updated to update, $unchanged unchanged ($STAGE)" ||
  echo "done: $created created, $updated updated, $unchanged unchanged ($STAGE)"
