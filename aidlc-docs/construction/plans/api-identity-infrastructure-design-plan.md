# Infrastructure Design Plan -- unit `api-identity` (U1)

**Inputs:** the functional design (R1.5, R6.3), the NFR design (P6 rotation, P7 secret hygiene, P9 the metric and
policy; logical components), the infra code as it is: `infra/lib/stages.ts` (`SECRET_NAMES`, six entries, mounted
by `render.ts` as `secretKeyRef {name: <service>-<NAME>, key: 'latest'}`), `bootstrap.sh` (`SECRETS=(...)` created
empty per stage with `secretAccessor` for the runtime account; the `metric` helper; `apply-alerts.sh` run last),
`lib.sh` (`alerts_for` per stage), `monitoring/request-failed.json` (the log-metric policy template),
`infra/test/cloudrun.test.ts` ("exactly the six secrets", mirrors `SECRET_NAMES`), `monitoring.test.ts` (mirrors
`lib.sh`), CLAUDE.md's Vercel scope rule (Preview points at staging; production values never on a preview).

Two questions, each pre-filled with a proposal; leave or change the letter and say "approved" (or "done"). The
categories the rule names are covered by the questions or by the justified mappings below.

## Question 1
How the previous secret is provisioned so a rotation needs no YAML change (NFR design P6). Cloud Run mounts a
secret only if it exists with a version, and the stage table is static.

A) **Two secrets per stage, both always mounted.** `SECRET_NAMES` gains `API_TOKEN_SECRET` and
`API_TOKEN_SECRET_PREVIOUS`; `bootstrap.sh` creates both and gives `API_TOKEN_SECRET_PREVIOUS` an initial version
holding a fresh random 32-byte value that nobody keeps (a key no one holds is as good as no key: the api would
accept tokens only from a signer that does not exist). A rotation sets `PREVIOUS` to the old value and `CURRENT`
to the new one, then redeploys; after the window `PREVIOUS` gets a fresh random value again. The config treats
`API_TOKEN_SECRET_PREVIOUS` as optional-but-32-bytes-when-present, which it always is. Recommended: no conditional
rendering, the drift gate stays simple, the test's "exactly N secrets" assertion is updated once.

B) **One secret, two mounts by version alias.** `API_TOKEN_SECRET` mounts `latest`, `API_TOKEN_SECRET_PREVIOUS`
mounts the Secret Manager version alias `previous` of the same secret; a rotation adds a version and moves the
alias. Fewer secrets, but `render.ts` must emit a non-`latest` key for one entry, and Cloud Run's support for
alias keys in `secretKeyRef` is to be verified at code generation (fallback to A if unsupported).

C) Other (please describe after [Answer]: tag below)

[Answer]: A -- proposed

## Question 2
Who generates the secret values and sets them on both sides, and when.

A) **The operator, by hand, before PR 1's promotion**, following a runbook in `infra/README.md`: generate with
`openssl rand -base64 32` (one value per stage), `gcloud secrets versions add remonta-api[-staging]-API_TOKEN_SECRET
--data-file=-`, and in Vercel set `API_TOKEN_SECRET` on `remonta-app` in the Production scope (prod's value) and
the Preview scope (staging's value). `bootstrap.sh` only creates the empty secrets (as it does for the six today);
the api refuses to boot without a value, which the staging deploy of PR 1 proves at once. Recommended: the same
hands-on practice every other secret follows, and no script ever sees both sides' values.

B) **`bootstrap.sh` generates and stores the api-side values** (random, printed once for the operator to paste
into Vercel). Less typing, but the script then handles a live credential and prints it to a terminal.

C) Other (please describe after [Answer]: tag below)

[Answer]: A -- proposed

## Mappings fixed by earlier decisions (justified, not questions)

- **Deployment environment:** unchanged. Google Cloud project `remonta-api-510206`, `australia-southeast1`,
  staging and prod Cloud Run services from the table; Vercel `remonta-app` with its Production and Preview
  scopes. No new environment.
- **Compute:** unchanged. Verification adds no CPU worth sizing; the token route runs in the app's existing
  serverless functions. No scaling change.
- **Storage:** none. No table, no column, no bucket. The only stored values are the secrets (Secret Manager,
  user-managed replication in the region, as the six today).
- **Messaging:** none. No queue or event; the outbox is untouched.
- **Networking:** unchanged. The api's CORS already allows `authorization`; no new origin, no custom domain, no
  gateway; the token route is same-origin in the app.
- **Monitoring:** one log metric `remonta-api-auth-failed` (filter `resource.type="cloud_run_revision" AND
  jsonPayload.auth="rejected"`, created by `bootstrap.sh`'s `metric` helper) and one policy
  `monitoring/auth-failed.json` modelled on `request-failed.json`: `ALIGN_SUM` 300 s, `REDUCE_SUM` by service,
  `COMPARISON_GT 20`, duration 0 s, `autoClose` 1800 s, severity ERROR, the existing email channel; `lib.sh`'s
  `alerts_for prod` gains `auth-failed` (staging keeps its minimal set); applied by `apply-alerts.sh prod`.
- **Shared infrastructure:** Secret Manager and the email channel are shared with the existing services; the
  secret is per stage and never shared across stages; the Preview scope receives staging's value only.
- **Tests and gates:** `cloudrun.test.ts` asserts the eight secrets (six + two) and that none is plain env;
  `monitoring.test.ts` asserts the new policy file's shape and `lib.sh`'s list; `render:check` regenerates
  `service.*.yaml`; `infra/README.md` gains the secret and rotation runbooks; `docs/admin/README.md` points at them.

## Execution checklist

- [x] 1. Confirm the two answers above; resolve any ambiguity in a clarification file
- [x] 2. `aidlc-docs/construction/api-identity/infrastructure-design/infrastructure-design.md`: the mapping of each
  logical component to a service, the secret and policy definitions, the file-by-file changes in `infra/`
- [x] 3. `deployment-architecture.md`: the deployment sequence for PR 1 (secrets first, staging, checklist,
  promotion), the Vercel scopes, the rotation runbook as it will be written, rollback
- [x] 4. Present for approval
