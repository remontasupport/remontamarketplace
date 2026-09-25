# Requirements Clarification Questions

**Stage**: INCEPTION — Requirements Analysis (follow-up round)
**Created**: 2026-09-09

Thank you — all 20 questions are answered. Two things need a second pass before I can write
`requirements.md`:

1. **One direct contradiction** between A1 and A2, which your A3 answer reframes entirely.
2. **Eight mandatory questions from the Resiliency extension**, which you opted into (F2 = A).
   That extension requires these decisions be made by you, not inferred by me.

Please answer below the `[Answer]:` tags as before.

---

## Section J — Contractor Data (contradiction + new information)

### The contradiction

- **A1 = A**: move `ContractorProfile` **into the application database**; marketing then reads it back via an API.
- **A2 = D**: "Not applicable — my answer to A1 keeps the data where the sync already writes."

These cannot both hold. A1 = A *moves* the data out of the marketing database, so A2 cannot be
"not applicable". If the table moves, something must decide where the Zoho sync writes.

### The new information, which probably dissolves it

- **A3**: "The ContractorProfile are just fake ones, I created those by inserting to the table"

That changes the question, because it means there may be no real data to move at all.

### What I found in the code

The marketing branch has **real, substantial** Zoho → `ContractorProfile` machinery:

| File (on `main`) | What it does |
|---|---|
| `src/app/api/sync-contractors/route.ts` | Batched sync (BATCH_SIZE 50, 3 retries), geocoding, Blob file handling |
| `src/app/api/webhooks/zoho-contractor/route.ts` | Live webhook handling Zoho `insert` / `update` / `delete` |
| `src/app/api/contractors-by-area/route.ts` | Reads `ContractorProfile` |

This is not scaffolding — it is production-shaped code. So either that sync is **not currently
running** and your hand-inserted rows are all the table holds, or it **is running** and your rows
sit alongside real synced ones.

### Question J1
Is the Zoho → `ContractorProfile` sync currently live in production?

A) **No, it is dormant.** The sync and webhook exist but are not running. Every row in `ContractorProfile` is test data I inserted by hand.

B) **Yes, it is running.** Real contractors sync from Zoho, and my hand-inserted rows are additional test records mixed in.

C) **It ran previously but is now stopped.** The table holds a mix of stale real data and my test rows.

D) I am not certain — this needs checking before deciding.

X) Other (please describe after [Answer]: tag below)

[Answer]: Yes it is currently renning in production but It can be eliminate now, by meaning eliminating, we can let an error to the website markwting while building the api that points to the workerprofile.

### Question J2
Given the data is (at least partly) disposable test data, what should actually happen?

A) **No data migration at all.** Point the web app's contractor search at the real `WorkerProfile` records in the application database, drop the `ContractorProfile` dependency from the app entirely, and discard the fake rows. Marketing keeps `ContractorProfile` and its Zoho sync untouched.

B) **Move the table as originally answered.** Migrate `ContractorProfile` into the application database, fake rows and all, and have marketing read it back via an API.

C) **Move the table but discard the fake rows** — migrate the schema only, re-populate from Zoho afterwards.

D) **Retire `ContractorProfile` entirely** — it is superseded by `WorkerProfile`; remove the model, the sync and the webhook from both products.

X) Other (please describe after [Answer]: tag below)

[Answer]: Point the web app's contractor search at the real `WorkerProfile` records in the application database, and drop the `ContractorProfile` dependency from the app entirely

> **My recommendation is A.** The web app touches `ContractorProfile` in exactly 3 queries, and if
> those rows are fake, the app's contractor search is currently showing fabricated workers to
> users. Pointing it at real `WorkerProfile` data removes the cross-product database dependency,
> requires no data migration, and leaves marketing's Zoho ownership (your answer to Q3) intact.
> It also resolves the TD-5 security finding at the same time, since that unguarded page is the
> only consumer.

### Question J3
If the app's contractor search moves to `WorkerProfile`, should it show only published, verified workers?

A) Yes — only `isPublished = true` and verification APPROVED, matching the public directory rules.

B) Show all workers regardless of publication status, since this is an admin-facing search.

C) Published only, but ignore verification status.

X) Other (please describe after [Answer]: tag below)

[Answer]: B

---

## Section K — Resiliency Extension (mandatory)

You opted into the Resiliency baseline (F2 = A). That extension explicitly requires these eight
decisions to be made by you rather than chosen on your behalf. They drive Application Design, NFR
Requirements, NFR Design and Infrastructure Design later.

Context for your answers: both products are **Vercel-hosted serverless** with **Neon PostgreSQL**.
Much of the traditional infrastructure surface (load balancers, VPCs, auto-scaling groups) does
not exist here, so several of these are simpler than they look.

### Question K1: RTO/RPO Goals and Disaster Recovery Strategy
What are your Recovery Time Objective (RTO) and Recovery Point Objective (RPO) goals? These determine the appropriate Disaster Recovery strategy and infrastructure redundancy level.

A) RPO/RTO: Hours — Backup & Restore strategy. Lowest cost ($). Data backed up, no services deployed. Redeploy from IaC and restore from backups on failure. Suitable for non-critical workloads.

B) RPO/RTO: 10s of minutes — Pilot Light strategy. Cost: $$. Data live, services idle. Infrastructure deployed but not running, scaled up on failover. Suitable for important workloads.

C) RPO/RTO: Minutes — Warm Standby strategy. Cost: $$$. Data live, services run at reduced capacity. Scaled up during failover. Suitable for business-critical applications.

D) RPO/RTO: Near real-time — Multi-site Active/Active strategy. Highest cost ($$$$). Data live, live services in multiple regions simultaneously. Suitable for mission-critical, zero-downtime requirements.

E) N/A — Single-region deployment is acceptable, no cross-region DR needed. Rely on multi-zone availability within one region.

X) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question K2: Change Management Process
How should production changes for this workload be governed? AI-DLC will conform the design to your answer rather than inventing a process.

A) Use our existing organizational change management process — provide the name/tool (e.g., ServiceNow, Jira Change, internal CAB). AI-DLC will reference it and ensure deployable artifacts fit that process (change records, approval gates).

B) No formal process exists yet — AI-DLC should propose a lightweight change management process (change record + approval + rollback note) for the team to adopt.

C) N/A — this workload is exempt from formal change management (e.g., internal tooling). Document the exemption rationale.

X) Other (please describe after [Answer]: tag below)

[Answer]: B

### Question K3: CI/CD and Deployment Tooling
What CI/CD tooling and deployment process should this workload use?

A) Use our existing CI/CD pipeline — provide the tool (e.g., GitHub Actions, GitLab CI, Jenkins, CodePipeline). AI-DLC will produce artifacts compatible with it.

B) No pipeline exists — AI-DLC should propose a CI/CD pipeline definition appropriate to the chosen IaC and runtime.

X) Other (please describe after [Answer]: tag below)

[Answer]: B

> Note: Reverse Engineering found **no CI pipeline** in the repository — no `.github/workflows` or
> equivalent. Deployment is Vercel's Git integration. Given your D1 = A answer (quality gates
> first), B is the likely fit.

### Question K4: Rollback Mechanism
How should a failed production deployment be rolled back?

A) Redeploy previous IaC/artifact version (version-pinned rollback)

B) Blue/green swap back to the previous environment

C) Canary auto-rollback on health/metric regression

D) Database-aware rollback required (schema/data migration reversal) — flag for explicit design

E) Use our organization's existing rollback procedure — provide reference

X) Other (please describe after [Answer]: tag below)

[Answer]: D

> Note: Vercel provides instant rollback to a previous deployment natively, which maps to A.
> However, this migration involves Prisma schema changes across two databases, so D may apply to
> the migration phases specifically. You can answer with both if that fits.

### Question K5: Deployment Style
What deployment strategy is acceptable for this workload's risk profile?

A) Direct / in-place (lowest cost, highest blast radius) — acceptable for non-critical workloads

B) Rolling (gradual instance replacement)

C) Blue/green (zero-downtime cutover, higher cost)

D) Canary (progressive traffic shift with automated rollback)

X) Other (please describe after [Answer]: tag below)

[Answer]: What do you recommend?

### Question K6: Regional Topology
Does this workload require multi-region deployment, or is single-region with multi-zone redundancy sufficient?

A) Single-region, multi-zone — tolerates zone failure, not full-region failure. Lower cost. (Aligns with RTO/RPO options A/B/E.)

B) Multi-region active-passive — survives region failure with failover. Higher cost. (Aligns with Warm Standby / Pilot Light cross-region.)

C) Multi-region active-active — survives region failure with no downtime. Highest cost. (Aligns with Active/Active.)

X) Other (please describe after [Answer]: tag below)

[Answer]: I am not sure, the ai dlc decide what's best

> Note: your Neon database is in `ap-southeast-2` (Sydney). Answer B or C would require changes
> well beyond the scope of this migration.

### Question K7: Resiliency Testing Approach
How will resiliency mechanisms (failover, recovery) be validated?

A) Use our existing DR testing / game day / chaos engineering practice — provide the reference. AI-DLC will document test scenarios that fit it.

B) No practice exists — AI-DLC should propose a DR testing schedule and chaos experiment plan for adoption.

C) Defer to the Operations phase — capture test scenarios now, execute during Operations.

X) Other (please describe after [Answer]: tag below)

[Answer]: B

### Question K8: Incident Response Process
How are production incidents handled for this workload?

A) Use our existing incident response process — provide the reference (e.g., PagerDuty runbooks, internal IR/on-call process). AI-DLC will align alerting and runbooks to it.

B) No formal process exists — AI-DLC should propose a lightweight incident response and Correction of Errors (COE) process for adoption.

X) Other (please describe after [Answer]: tag below)

[Answer]: B

---

## Section L — Scope Confirmation (one risk worth naming)

Your answers combine into a larger scope than may be obvious, so I want to confirm it rather than
assume it.

- **C2 = A**: consolidate all four UI libraries and three styling approaches as part of this work
- **C3 = A**: both products must look visually identical
- **D1 = A**: restore type checking and CI as a prerequisite phase
- **D4 = C**: build the monorepo in parallel and cut over when ready
- **E1 = B**: fix four security findings during the migration
- **F1/F2/F3 = A**: all three extensions enforced as blocking constraints

Taken together that is: a parallel monorepo build, a full UI system consolidation across
163 components, a type-safety and CI programme from zero, four security fixes, and three
blocking compliance regimes — before the mobile work you have also scoped.

The UI consolidation is the item I would question. It is the largest single piece, it touches
every component in both products, and it is not required by the monorepo split — a shared package
can be introduced with one stack while existing code migrates gradually (that was option C2 = B).

### Question L1
Having seen the combined scope, do you want to keep C2 = A?

A) **Yes, keep full consolidation** — do it once, properly, accepting the larger effort and timeline.

B) **Change to C2 = B** — the shared package uses one stack; existing app code migrates opportunistically afterwards. Smaller and lower risk, gets the monorepo landed sooner.

C) **Split it** — land the monorepo first with C2 = B, then run UI consolidation as a distinct follow-on effort.

X) Other (please describe after [Answer]: tag below)

[Answer]: C

### Question L2
Roughly how many people will work on this, and is this the team's main focus or alongside feature work?

A) Solo, and this is the main focus

B) Solo, alongside ongoing feature work on both products

C) Small team (2–4), main focus

D) Small team (2–4), alongside ongoing feature work

X) Other (please describe after [Answer]: tag below)

[Answer]: A

> Why I ask: D4 = C (parallel build) means maintaining two copies of both products until cutover.
> If feature work continues during that window, every change must land twice. That is the main
> failure mode for parallel migrations, and it affects how I sequence the plan.
