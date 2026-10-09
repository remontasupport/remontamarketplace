# Deployment Architecture -- unit `api-identity` (U1)

## 1. Topology (unchanged, with the new secret)

```
Vercel remonta-app                                     Google Cloud remonta-api-510206 (australia-southeast1)
  Production scope: API_TOKEN_SECRET = <prod value>      Secret Manager
  Preview scope:    API_TOKEN_SECRET = <staging value>     remonta-api-API_TOKEN_SECRET            (prod)
                                                           remonta-api-API_TOKEN_SECRET_PREVIOUS   (prod)
  /api/auth/api-token  --mints with the scope's value      remonta-api-staging-API_TOKEN_SECRET          (staging)
                                                           remonta-api-staging-API_TOKEN_SECRET_PREVIOUS (staging)
  admin pages --Bearer--> NEXT_PUBLIC_API_URL            Cloud Run remonta-api / remonta-api-staging
                           (Production -> prod api,         env API_TOKEN_SECRET, API_TOKEN_SECRET_PREVIOUS (secretKeyRef latest)
                            Preview -> staging api)         JwtAuthenticator verifies with current, then previous
                                                         Cloud Logging metric remonta-api-auth-failed
                                                         Cloud Monitoring policy "remonta-api auth-failed" (prod) -> email
```

The pairing rule: a Vercel scope and the api it points at must hold the same current value. Preview <-> staging,
Production <-> prod. A mismatch shows within minutes as `bad-signature` rejections (and, on prod, the alert).

## 2. Deployment sequence for PR 1 (identity, api side)

| Step | Who | Action | Proof |
|---|---|---|---|
| 0 | operator | Merge nothing yet. Run `bash infra/cloudrun/bootstrap.sh remonta-api-510206` from the PR branch (idempotent): creates the two new secrets per stage, seeds `*_PREVIOUS`, creates the metric, applies the alerts (prod gains `auth-failed`) | `gcloud secrets list` shows eight per stage; the policy exists |
| 1 | operator | Generate and add the current values: `openssl rand -base64 32 \| gcloud secrets versions add remonta-api-staging-API_TOKEN_SECRET --data-file=-` and the same for `remonta-api-API_TOKEN_SECRET` with a different value | `gcloud secrets versions list` shows version 1 enabled on each |
| 2 | operator | In Vercel `remonta-app`: `API_TOKEN_SECRET` = the staging value in the **Preview** scope, the prod value in the **Production** scope (no redeploy needed yet: nothing reads it until PR 3) | the dashboard shows both scopes |
| 3 | CI | PR 1 opened: `API Quality`, `Infra Quality` (render:check with the regenerated YAML, the eight-secret test), the others | green |
| 4 | merge | `deploy-api` builds the image and replaces staging with the new YAML (eight secret refs); the api boots only if both secrets resolve | "apps/api listening" in the logs; health 200 |
| 5 | operator + AI | Staging checklist: health 200; every public entry unchanged (a sign-up on a preview still works); a token minted by hand with the staging value (a documented one-liner using `jose` in `node`) is accepted on a role-restricted probe (PR 2's entries once merged, or the test-only route-security proof in CI); a tampered token answers 401 with the warn line visible in Cloud Logging; production unchanged | recorded in the construction notes |
| 6 | operator | Promote the image (`deploy-api` dispatch, `stage=prod`, the merge sha) after PR 2 has also passed its checklist (one promotion for both) | `remonta-api` revision running; health 200; no `auth-failed` email |

If step 4's boot fails ("API_TOKEN_SECRET: required"), the previous revision keeps serving (Cloud Run only shifts
traffic to a ready revision); fix the secret and redeploy.

## 3. Vercel side (PR 3, the app switch)

The variable is already set (step 2). PR 3's preview reads the Preview scope and talks to staging; after merge
production reads the Production scope and talks to prod. The rollback deployment id is re-recorded in CLAUDE.md
before the merge (follow-up 3).

## 4. Rollback

| Situation | Action |
|---|---|
| PR 1 misbehaves on staging | fix forward (staging only) or dispatch the previous sha to staging |
| After promotion, the api rejects every admin token | check the pairing rule first (Vercel Production vs `remonta-api-API_TOKEN_SECRET`); if the code is at fault, dispatch the previous image sha: admin entries disappear (404) until the app is also promoted back |
| A secret leaked | run the rotation runbook at once (section 5); old versions destroyed, not just disabled |

## 5. Rotation runbook (to be written into `infra/README.md`)

1. `NEW=$(openssl rand -base64 32)`. Api: `echo -n "$OLD" | gcloud secrets versions add <svc>-API_TOKEN_SECRET_PREVIOUS
   --data-file=-` (the current value becomes the previous), then `echo -n "$NEW" | gcloud secrets versions add
   <svc>-API_TOKEN_SECRET --data-file=-`; redeploy the service (`deploy-api` dispatch of the running sha: a
   re-run is a new revision that re-reads `latest`). Both tokens verify.
2. App: set `API_TOKEN_SECRET` = `NEW` in the matching Vercel scope; redeploy the app (promote the current
   deployment or push an empty commit). New tokens are signed with `NEW`.
3. After at least 5 minutes: `openssl rand -base64 32 | gcloud secrets versions add <svc>-API_TOKEN_SECRET_PREVIOUS
   --data-file=-` (a throwaway again); redeploy the api. Disable the older versions of both secrets; destroy them
   after a week.
4. Check: no `auth-failed` email during the window; `gcloud secrets versions list` shows one enabled version each.

Staging and prod rotate independently (their Vercel scopes differ).

## 6. Operations notes

- Instances read secrets at start: every secret change needs a new revision (a `deploy-api` dispatch of the same
  sha suffices; the deploy id makes it a new revision).
- The `auth-failed` policy's documentation names the reasons and the first check (the pairing rule).
- Saved Cloud Logging queries (`docs/admin/README.md`):
  `resource.type="cloud_run_revision" AND resource.labels.service_name="remonta-api" AND jsonPayload.auth="rejected"`
  (add `AND jsonPayload.reason="bad-signature"` to see a pairing problem), and
  `resource.type="cloud_run_revision" AND jsonPayload.userId="<id>"` for one admin's requests.
