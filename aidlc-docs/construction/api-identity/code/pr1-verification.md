# PR 1 verification record -- api-identity, api side + infra

Branch `feat/api-identity`, 5 commits (`0a8dcae`, `bd177af`, `385b46b`, `4077adc`, `30410ce`). PR #41, merged `c95435c` 2026-10-08 05:01Z. Opened by the user
from the compare link (no `gh` on this machine).

## Operator steps (before merge)

| Step | Done | Evidence |
|---|---|---|
| `bootstrap.sh remonta-api-510206` from the branch | 2026-10-08 | the run's output pasted in chat: both token secrets created per stage, `*_PREVIOUS` seeded as version 1, metric created, `remonta-api auth-failed` policy created on prod, everything else unchanged |
| `API_TOKEN_SECRET` values added | 2026-10-08 04:44Z (staging), 04:45Z (prod) | `gcloud secrets versions list`: one enabled version each |
| Vercel `remonta-app` `API_TOKEN_SECRET` set (Preview = staging, Production = prod) | 2026-10-08 | user confirmation ("done") |

## CI on the PR

| Check | Result |
|---|---|
| API Quality (Node 20, 22; PostGIS + fake GCS) | success, success (head `30410ce`) |
| Infra Quality | success |
| App Quality (20, 22), Web Quality (20, 22) | success x4 (no app/web source change) |
| Supply chain, CodeQL (javascript-typescript, actions), Semgrep (+ `--test`) | success |
| Vercel previews | built ("Vercel Preview Comments" success) |

## Merge and staging

| Step | Result |
|---|---|
| Merged (merge commit) | #41 -> `c95435c`, 2026-10-08 05:01Z |
| `deploy-api` -> staging revision | run 37730295784 success 05:07:31Z; `remonta-api-staging-00015-sgw` ready |
| health 200; `apps/api listening`; no `will not start` | 200 in 0.34 s; "apps/api listening" 05:07:14Z on 00015; no ERROR line, no refusal (the secret resolved) |
| public entries unchanged | `GET /v1/service-categories` 200; `GET /v1/localities?q=parra` 200 with ids; the sign-up form itself (captcha-gated) is exercised by the user on a preview when convenient; nothing on its path changed |
| tampered token -> 401 + `bad-signature` line | deferred to PR 2's checklist (no role-restricted entry exists yet); CI's `attribution.test.ts` is the proof today |
| production unchanged | `remonta-api` still `00005-j74`, health 200 |

## Promotion

PRs 1 and 2 are promoted together as one image after PR 2's staging checklist.
