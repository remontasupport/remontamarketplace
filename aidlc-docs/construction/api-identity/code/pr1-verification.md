# PR 1 verification record -- api-identity, api side + infra

Branch `feat/api-identity`, 5 commits (`0a8dcae`, `bd177af`, `385b46b`, `4077adc`, `30410ce`). Opened by the user
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
| API Quality (Node 20, 22; PostGIS + fake GCS) | pending |
| Infra Quality | pending |
| App Quality, Web Quality | pending (no app/web source change; the lockfile and CLAUDE.md changed) |
| Package boundaries, Supply chain, CodeQL, Semgrep | pending |
| Vercel previews | pending |

## Merge and staging

| Step | Result |
|---|---|
| Merged (merge commit) | pending |
| `deploy-api` -> staging revision | pending |
| health 200; `apps/api listening`; no `will not start` | pending |
| a sign-up on a preview works (public entries unchanged) | pending |
| tampered token -> 401 + `bad-signature` line (needs PR 2's entries; until then CI's attribution test is the proof) | pending |
| production unchanged | pending |

## Promotion

PRs 1 and 2 are promoted together as one image after PR 2's staging checklist.
