# C1 `completion-api`: logical components (2026-10-21)

| Component | Kind | New? |
|---|---|---|
| `domain/completion-items.ts` | pure functions (the declaration, the view, `storedFlags`) | new |
| `GET /v1/worker/completion` (`getCompletion`) | contract entry + handler | new |
| `completion-sync` | scheduled job on the existing scheduler | new |
| `backfill:completion` | script on the S1 backfill runner | new |
| `COMPLETION_MODEL`, `COMPLETION_SYNC_INTERVAL_MS` | stage settings (`infra/lib/stages.ts`) + config validation | new |
| `remonta-api-completion-sync-failed` + `completion-sync-failing` policy | log-based metric + alert | new |
| `persistCompletion`, `replaceSection`, `readProfileRows`, `requirementGroups`, `uploadableDocuments` | existing | reused unchanged |

No new service, queue, cache, bucket or secret. The log-based metric is created by `apply-alerts.sh` with the policy
(as the existing ones).
