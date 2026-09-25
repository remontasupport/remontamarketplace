# Services and Orchestration

**Stage**: INCEPTION — Application Design
**Date**: 2026-09-09

Defines the service layer, where orchestration lives, and how multi-domain operations coordinate.

---

## The Three-Layer Model

AD-04 through AD-08 produce a strict three-layer arrangement:

```
+---------------------------------------------------------------+
|  TRANSPORT           apps/app                                  |
|  Server Actions, route handlers, Server Components             |
|                                                                |
|  Responsibilities:                                             |
|    1. Resolve the session into an Actor                        |
|    2. Coarse role assertion                                    |
|    3. Input parsing and validation (Zod)                       |
|    4. Cache revalidation (revalidatePath / revalidateTag)      |
|    5. Map Result onto HTTP status or action return             |
|    6. Cross-domain orchestration                               |
|                                                                |
|  Forbidden: business rules, data access, ownership checks      |
+---------------------------------------------------------------+
                              |
                    Actor + validated input
                              v
+---------------------------------------------------------------+
|  DOMAIN              packages/domain-*                         |
|  Six framework-neutral packages over a shared kernel           |
|                                                                |
|  Responsibilities:                                             |
|    1. Object-level authorization (assertOwns, assertSelfOrRole)|
|    2. Business rules and invariants                            |
|    3. Domain state transitions                                 |
|    4. Result construction                                      |
|                                                                |
|  Forbidden: Next.js, React, Prisma, session reads, HTTP        |
+---------------------------------------------------------------+
                              |
                       repository calls
                              v
+---------------------------------------------------------------+
|  DATA                packages/db                               |
|  Repository functions over Prisma                              |
|                                                                |
|  Responsibilities:                                             |
|    1. Query construction and execution                         |
|    2. Transaction boundaries                                   |
|    3. Record mapping                                           |
|                                                                |
|  Forbidden: authorization, business rules, Actor awareness     |
+---------------------------------------------------------------+
```

The rule that makes this hold: **each layer may only call the layer below it.** A repository never
calls a domain function; a domain package never reaches into transport.

---

## Where Orchestration Lives (AD-08)

Orchestration — coordinating several domain calls into one user-facing operation — belongs in
**transport**, not in the domain packages.

The reason is AD-01. With domain split into six separate workspace packages, putting cross-domain
orchestration inside one of them would force a dependency between domain packages, and those
dependencies would quickly form a cycle: worker needs verification, verification needs worker.
Keeping orchestration in transport means **domain packages never depend on each other**, which is
what makes the split worth having.

### Consequence

`apps/app/src/services/*` survives as `"use server"` wrappers **plus orchestration** (C1=C). A
wrapper that coordinates two domains is still transport code — it just does more than delegate.

---

## Orchestrated Operations

The operations that span more than one domain. Each is a candidate for detailed treatment in
Functional Design.

### O-1: Worker selects service categories

**Trigger**: worker completes the service-selection wizard step
**Domains**: `domain-worker` → `domain-verification`

```
transport: selectWorkerServicesAction(selections)
  1. resolveActor, assertRole(WORKER | ADMIN)
  2. domain-worker.selectWorkerServices(actor, selections)
  3. domain-verification.deriveRequirements(actor, workerProfileId)
  4. revalidatePath("/dashboard/worker/requirements/setup")
```

**Why orchestrated**: selecting a category determines which documents become required, including
CONDITIONAL ones keyed on flags such as `providesTransport`. The two domains must not depend on
each other, so transport sequences them.

**Consistency concern**: steps 2 and 3 are separate operations. If 3 fails, services are saved
without requirements derived. Functional Design must decide between a compensating action, a
transactional boundary spanning both, or idempotent re-derivation on next read. **Recommended:
idempotent re-derivation** — `deriveRequirements` should be safe to call repeatedly, which also
handles the case of a worker changing their selections later.

### O-2: Admin approves worker verification

**Trigger**: admin approves overall verification after reviewing documents
**Domains**: `domain-verification` → `domain-worker` → `domain-identity`

```
transport: approveVerificationAction(workerProfileId)
  1. resolveActor, assertRole(ADMIN)
  2. domain-verification.approveVerification(actor, workerProfileId)
  3. domain-verification.publishWorkerProfile(actor, workerProfileId)
  4. domain-identity.appendAuditLog(...)          // via domain-identity
  5. integrations.sendEmail(worker, "verification approved")
  6. revalidatePath + cache invalidation for search results
```

**Why orchestrated**: publication, audit and notification are three different concerns. Step 5 is
an external call and must not fail the operation — the worker is approved whether or not the email
sends (SECURITY-15 fail-safe: a notification failure must not roll back a state change).

### O-3: Worker registration

**Trigger**: worker completes the registration form
**Domains**: `domain-identity` → `domain-worker`

```
transport: POST /api/auth/register
  1. resolveActor -> anonymous
  2. verify reCAPTCHA                              // app-local integration
  3. validate input (Zod)                          // SECURITY-05
  4. domain-identity.registerWorker(actor, data)   // creates User
  5. domain-worker.createProfile(actor, userId, data)
  6. integrations.sendEmail(user, "welcome")
```

**Consistency concern**: steps 4 and 5 create two records that must both exist — a `User` without
a `WorkerProfile` is a broken account. This needs a **transaction spanning both**, which means
`packages/db` must expose a transaction primitive that repositories can enlist in. Functional
Design must specify it. This is the strongest argument for the transaction helper noted below.

### O-4: Client submits a service request

**Trigger**: client or coordinator submits a request for a participant
**Domains**: `domain-demand` → external Zoho

```
transport: POST /api/client/service-request
  1. resolveActor, assertRole(CLIENT | COORDINATOR)
  2. validate input
  3. domain-demand.createServiceRequest(actor, data)   // asserts participant ownership
  4. push to Zoho CRM                                  // app-local integration
  5. domain-demand.updateServiceRequest(actor, id, { zohoRecordId })
```

**Consistency concern**: if step 4 fails, the request exists locally with no `zohoRecordId`.
Recommended: accept this and make Zoho push retryable, rather than failing the user's submission
on an external outage (RESILIENCY-10, dependency isolation).

### O-5: Zoho job sync

**Trigger**: hourly Vercel cron
**Domains**: `domain-jobs`

```
transport: GET /api/cron/sync-jobs
  1. verify CRON_SECRET -> Actor { kind: "system", reason: "cron:sync-jobs" }
  2. acquire distributed lock (Redis, replacing the in-memory mutex — TD-6)
  3. fetch leads from Zoho
  4. domain-jobs.syncJobsFromZoho(actor, leads)
  5. invalidate job caches
  6. release lock
```

**Note**: the current in-memory `isSyncing` flag is per-instance and cannot prevent concurrent
serverless invocations (TD-6). Moving the lock to Redis — already a dependency — resolves it.

### O-6: Marketing renders the public worker directory

**Trigger**: visitor loads a marketing directory page
**Domains**: none directly — `apps/web` has no domain access

```
apps/web page (Server Component)
  1. apiClient.workers.listPublic(query)
  2. -> HTTPS -> apps/app GET /api/public/workers
  3.    resolveActor -> anonymous
  4.    domain-search.searchWorkersPublic(actor, criteria)
  5.    returns WorkerBio projection only
```

**This is the FR-10.7 boundary in operation.** `apps/web` has no database credential, no domain
package, and an `api-client` that exposes no admin method. Three independent barriers, satisfying
SECURITY-11's defence-in-depth requirement.

**Availability note**: this makes the marketing directory dependent on `apps/app` being up.
Given RTO/RPO in hours (D-21) that is acceptable, but the page must degrade gracefully rather than
error — Functional Design should specify cached or empty-state behaviour on upstream failure
(RESILIENCY-10).

---

## Transactions

AD-07 places query execution in `packages/db`, but O-3 shows operations that must span multiple
repository calls atomically. `packages/db` therefore exposes a transaction primitive:

```ts
withTransaction<T>(fn: (tx: RepositoryContext) => Promise<T>): Promise<T>;
```

`RepositoryContext` provides the same repository functions bound to a transaction. Domain code
calls `withTransaction` without knowing it wraps Prisma's `$transaction`, preserving the AD-07
boundary.

**Operations requiring a transaction**: O-3 (user plus profile creation), any requirement
derivation that replaces an existing set, and the `replace*` collection methods on the four W1
child tables.

---

## Cross-Cutting Services

### Authorization
Split by AD-05. Coarse role checks in transport; object-level ownership in domain via
`assertOwns` / `assertSelfOrRole`. `packages/domain-core` owns the primitives so the rule is
defined once (SECURITY-11: security-critical logic isolated in a dedicated module).

### Caching
Two distinct mechanisms, both transport concerns:
- **Next.js cache** — `revalidatePath` / `revalidateTag` in Server Action wrappers
- **Redis** — result caching for expensive faceted searches, invalidated after relevant mutations

Domain packages are cache-unaware. A domain function that mutates worker publication does not know
that search results must be invalidated — the orchestrating wrapper does.

### Logging and audit
Two different things, deliberately separated:
- **Audit** (`domain-identity.appendAuditLog`) — durable business record of who did what. Domain concern.
- **Operational logging** — structured logs with correlation ID and level, for diagnostics. Transport concern, configured per app (SECURITY-03).

Audit entries must never carry PII beyond the actor id, and operational logs must never carry
credentials or tokens (SECURITY-03, SECURITY-14).

### Rate limiting
Transport-only, at the route handler, using the existing Upstash limiter. Required on all
public-facing endpoints (SECURITY-11, NFR-3.4) — including `/api/public/workers`, which becomes
publicly reachable and serves `apps/web` on every directory page load.

### External integrations
Shared email lives in `packages/integrations`. App-specific clients — Zoho, Blob, Redis,
geocoding, SMS, reCAPTCHA — stay in `apps/app` (AD-02). Domain packages do not call external
services directly; transport orchestrates the call and passes results in. This keeps domain
packages pure, which is what makes them property-testable (PBT-07).
