# Application Design — Consolidated

**Project**: Remonta Marketplace
**Stage**: INCEPTION — Application Design
**Date**: 2026-09-09
**Depth**: Comprehensive
**Status**: Awaiting approval

Consolidates `components.md`, `component-methods.md`, `services.md` and
`component-dependency.md`.

---

## 1. Summary

This design defines **13 packages and 3 applications**, the interfaces between them, and the
rules that keep those interfaces honest.

The shape is determined by four answers:

- **B1=A** — domain functions take an explicit `Actor`. This is what makes `packages/domain-*` framework-neutral and therefore reusable by HTTP handlers, Server Actions and a future mobile client alike. It fully resolves RISK-7.
- **B2=C** — authorization at two layers: coarse role checks in transport, object-level ownership checks in the domain. The domain check cannot be forgotten by a new transport, which is the gap that produced TD-1 and TD-4.
- **B4=B** — `packages/db` exposes repository functions; domain code never sees Prisma.
- **A1=C** — domain is six separate workspace packages rather than directories in one.

---

## 2. Design Decisions

| ID | Decision | Source |
|---|---|---|
| AD-01 | `domain` split into separate workspace sub-packages | A1=C |
| AD-02 | `packages/integrations` holds email only; app-specific clients stay in `apps/app` | A2=D |
| AD-03 | The 17 direct-Prisma Server Components route through domain packages | A3=B |
| AD-04 | Domain functions take an explicit `Actor` parameter | B1=A |
| AD-05 | Authorization is defence in depth — coarse role in transport, object-level in domain | B2=C |
| AD-06 | Hybrid errors — throw for authorization, `Result` for expected domain failures | B3=C |
| AD-07 | `packages/db` exposes repository functions; Prisma is not exported | B4=B |
| AD-08 | `apps/app/src/services` keeps thin wrappers plus orchestration | C1=C |
| AD-09 | `api-client` is hand-written | C2=C |
| AD-10 | Boundaries enforced by manifest omission plus CI check | D1=C |
| AD-11 | `apps/mobile` prevented from importing domain and db now | D2=A |
| AD-12 | UI primitives: Radix. MUI, Headless UI, chatscope retired | E1=A |
| AD-13 | Styling: Tailwind only. styled-components and Emotion retired | E2=A |
| AD-14 | Theming: shared Tailwind config, no separate token layer | E3=A |
| AD-15 | **`packages/domain-core` added** as the shared kernel required by AD-01 | Derived |

### AD-15 — the package AD-01 requires

Splitting domain into separate workspace packages means `Actor`, `Result`, `DomainError` and the
authorization primitives cannot live in any one of them, since all six need them.
`packages/domain-core` holds them.

Under A1=B these would have been an internal module with no extra manifest. **This is the one
structural addition this design makes beyond what was explicitly chosen**, and it is flagged for
confirmation rather than assumed.

---

## 3. Package Inventory

| Package | Purpose | Depends on |
|---|---|---|
| `config` | Shared eslint, tsconfig, prettier, Tailwind theme | — |
| `schemas` | Zod schemas, shared types, domain enums. No Next/React/DOM/Prisma | `config` |
| `domain-core` | `Actor`, `Result`, `DomainError`, authorization primitives | `schemas` |
| `db` | Prisma schema, migrations, repository functions | `schemas` |
| `integrations` | Email only (Resend) | `schemas` |
| `ui` | Radix + Tailwind primitives. Both web apps, not mobile | `config` |
| `api-client` | Hand-written typed fetch client | `schemas` |
| `domain-identity` | Users, auth, password, sessions, audit, impersonation | `domain-core`, `db` |
| `domain-worker` | Worker profile and onboarding (~50 of 56 actions) | `domain-core`, `db` |
| `domain-verification` | Compliance documents, verification lifecycle, feature access | `domain-core`, `db` |
| `domain-demand` | Participants, service requests, worker selection | `domain-core`, `db` |
| `domain-jobs` | Job sync, job board, applications | `domain-core`, `db` |
| `domain-search` | Worker discovery, dual visibility policies | `domain-core`, `db` |

| Application | Purpose | Depends on |
|---|---|---|
| `apps/web` | Marketing site. **No database access** | `api-client`, `ui`, `schemas`, `integrations`, `config` |
| `apps/app` | The application. All routes and Server Actions | all domain packages, `ui`, `schemas`, `integrations`, `config` |
| `apps/mobile` | Expo scaffold, structure only | `api-client`, `schemas`, `config` |

---

## 4. The Three-Layer Model

**Transport** (`apps/app`) resolves the actor, applies coarse role checks, validates input,
revalidates cache, maps `Result` to responses, and orchestrates across domains.

**Domain** (`packages/domain-*`) enforces object-level authorization, applies business rules and
state transitions, returns `Result`. Imports no framework, no Prisma, reads no session.

**Data** (`packages/db`) constructs and executes queries, manages transactions, maps records.
Knows nothing of actors, authorization or business rules.

Each layer calls only the layer below.

### Canonical transport wrapper

```ts
"use server";

export async function updateWorkerBioAction(data: UpdateBioData) {
  const actor = await resolveActor();
  assertRole(actor, UserRole.WORKER, UserRole.ADMIN);
  const result = await updateWorkerBio(actor, data);
  if (result.ok) revalidatePath("/dashboard/worker/profile-building");
  return result;
}
```

---

## 5. The Security Boundary

FR-10.7 and RISK-2 — the all-worker search must never be anonymously reachable — is expressed
**structurally**, in four independent layers:

1. **Two functions, not one flag.** `searchWorkersPublic` forces `visibility: "public"` internally; `PublicSearchCriteria` has no field to override it. `searchWorkersAdmin` calls `assertRole(actor, ADMIN)` as its first statement.
2. **`api-client` exposes no admin method.** `apps/web` has no way to call the admin search.
3. **`apps/web` cannot import domain packages** (P-2), so it cannot bypass the client.
4. **`apps/web` holds no database credential** (P-1), so it cannot bypass the domain.

A defect in any one layer does not expose unpublished, unverified worker profiles. This is what
SECURITY-11's defence-in-depth requirement asks for, and it directly addresses the current state
where `/remontaadmin/findsupport` is labelled admin-only while having no guard at all.

---

## 6. Cross-Domain Orchestration

P-4 forbids domain packages importing one another, so operations spanning domains are orchestrated
in transport. Six are identified in `services.md`:

| ID | Operation | Domains |
|---|---|---|
| O-1 | Worker selects service categories | worker → verification |
| O-2 | Admin approves verification | verification → worker → identity → email |
| O-3 | Worker registration | identity → worker |
| O-4 | Client submits service request | demand → Zoho |
| O-5 | Zoho job sync | jobs |
| O-6 | Marketing renders public directory | none — HTTP to `apps/app` |

Three carry consistency concerns for Functional Design to resolve:
- **O-3 requires a transaction** — a `User` without a `WorkerProfile` is a broken account
- **O-1 should use idempotent re-derivation** rather than compensation
- **O-4 should let the Zoho push fail without failing the user's submission** (RESILIENCY-10)

`packages/db` therefore exposes `withTransaction`, which domain code uses without knowing it wraps
Prisma's `$transaction`.

---

## 7. Extension Compliance Summary

All three extensions are enabled with blocking enforcement (D-31, D-32, D-33). Assessed against
the artifacts this stage produced — a design, not code. Rules verifiable only against running code
or infrastructure are marked N/A **for this stage** and carry forward.

### SECURITY

| Rule | Status | Note |
|---|---|---|
| SECURITY-01 Encryption at rest and in transit | **N/A this stage** | Infrastructure Design |
| SECURITY-02 Access logging on intermediaries | **N/A this stage** | Vercel-managed; Infrastructure Design |
| SECURITY-03 Application logging | **Compliant** | `services.md` separates audit from operational logging and forbids PII and credentials in both |
| SECURITY-04 HTTP security headers | **N/A this stage** | NFR Design; NFR-3.2 already requires all-route coverage |
| SECURITY-05 Input validation | **Compliant** | Zod validation at transport before domain entry; `schemas` is the shared contract |
| SECURITY-06 Least privilege | **Compliant** | P-1 and P-2 deny marketing all database access; AD-02 keeps Redis, Blob and Zoho credentials out of `apps/web` |
| SECURITY-07 Network configuration | **N/A** | No VPC or security groups; Vercel-managed |
| SECURITY-08 Application access control | **Compliant** | AD-05 mandates object-level ownership checks in domain; `assertOwns` / `assertSelfOrRole` defined in `domain-core`; deny-by-default via throwing authorization errors |
| SECURITY-09 Hardening and misconfiguration | **Compliant** | `DomainError.message` specified as user-safe; `toErrorResponse` returns generic messages for unrecognised errors |
| SECURITY-10 Supply chain | **N/A this stage** | U1 quality foundation; AD-12 and AD-13 reduce the dependency surface |
| SECURITY-11 Secure design | **Compliant** | Authorization isolated in `domain-core`; four-layer defence in depth on the search boundary; rate limiting specified for public endpoints |
| SECURITY-12 Authentication and credentials | **Compliant** | `domain-identity` is the dedicated isolated module; no hardcoded credentials in the design |
| SECURITY-13 Integrity verification | **N/A this stage** | CI/CD; Infrastructure Design |
| SECURITY-14 Alerting and monitoring | **N/A this stage** | NFR Design; NFR-4.3 requires auth-failure alerting |
| SECURITY-15 Exception handling and fail-safe defaults | **Compliant** | AD-06 makes authorization failures throw so a missed check fails closed; global error handler specified |

**Blocking security findings: none.**

### RESILIENCY

| Rule | Status | Note |
|---|---|---|
| RESILIENCY-01 Workload identification | **Compliant** | Package inventory classifies criticality; `component-dependency.md` maps upstream and downstream |
| RESILIENCY-02 Availability and recovery targets | **Compliant** | RTO/RPO hours, Backup and Restore (D-21) |
| RESILIENCY-03 Change management | **N/A this stage** | Proposed in U9 (D-22) |
| RESILIENCY-04 Automated deployment and rollback | **N/A this stage** | Infrastructure Design (D-24, D-25) |
| RESILIENCY-05 Monitoring and alerting | **N/A this stage** | NFR Design |
| RESILIENCY-06 Health checks | **N/A this stage** | Infrastructure Design; NFR-4.5 |
| RESILIENCY-07 Resiliency monitoring | **N/A this stage** | NFR Design |
| RESILIENCY-08 Multi-zone and multi-region | **Compliant** | Single-region multi-zone (D-26) |
| RESILIENCY-09 Auto-scaling | **N/A** | Vercel serverless scales implicitly |
| RESILIENCY-10 Dependency isolation | **Compliant** | O-4 specifies Zoho failure must not fail submission; O-6 requires the marketing directory to degrade gracefully when `apps/app` is unavailable |
| RESILIENCY-11 DR strategy | **Compliant** | Backup and Restore (D-21) |
| RESILIENCY-12 Backup and replication | **N/A this stage** | Infrastructure Design; NFR-1.3 |
| RESILIENCY-13 Failover procedures | **N/A this stage** | Infrastructure Design |
| RESILIENCY-14 Chaos and DR testing | **N/A this stage** | Proposed in U9 (D-27) |
| RESILIENCY-15 Incident response | **N/A this stage** | Proposed in U9 (D-28) |

**Blocking resiliency findings: none.**

### Property-Based Testing

| Rule | Status | Note |
|---|---|---|
| PBT-01 Property identification during design | **Compliant** | Candidate properties identified below |
| PBT-02 Round-trip properties | **Compliant (design)** | Zod parse/serialise in `schemas`; availability minutes-from-midnight conversion |
| PBT-03 Invariant properties | **Compliant (design)** | Authorization invariant: no anonymous actor reaches unpublished worker data. Availability uniqueness on `(day, start, end)` |
| PBT-04 Idempotency | **Compliant (design)** | O-1 `deriveRequirements`; O-5 `upsertJobsByZohoId` |
| PBT-05 Oracle and model-based | **N/A this stage** | Per-unit Functional Design |
| PBT-06 Stateful property testing | **Compliant (design)** | Two state machines identified: `RequirementStatus` and `ServiceRequestStatus` |
| PBT-07 Generator quality | **Compliant (design)** | AD-04 makes domain functions pure of hidden dependencies — `Actor` is an explicit parameter and therefore directly generatable |
| PBT-08 Shrinking and reproducibility | **N/A this stage** | Framework configuration in U1 |
| PBT-09 Framework selection | **N/A this stage** | U1; no test framework exists today |
| PBT-10 Complementary strategy | **N/A this stage** | U1 |

**Blocking PBT findings: none.**

**Note**: AD-04 is what makes property-based testing viable here. A domain function reading the
session internally cannot have its actor generated; taking `Actor` as a parameter means the
authorization invariants in PBT-03 can be tested exhaustively across generated actor and resource
combinations. The interface decision and the testing strategy reinforce each other.

### Candidate properties for U1 and beyond

1. For any generated `Actor` of kind `anonymous` and any criteria, `searchWorkersPublic` never returns a worker with `isPublished = false`
2. For any non-owner, non-admin actor, every `domain-worker` mutator throws `ForbiddenError`
3. `deriveRequirements` applied twice yields the same requirement set as applied once
4. `upsertJobsByZohoId` applied twice yields the same row count as applied once
5. Availability round-trip: `minutes → {startTime, endTime} → minutes` is the identity
6. No `RequirementStatus` transition sequence reaches APPROVED without passing through SUBMITTED

---

## 8. Open Items

| Item | Status |
|---|---|
| `packages/domain-core` (AD-15) takes the workspace to 13 packages | **Confirm** |
| A1=C plus A2=D means 13 packages for a solo developer; A1=B would have been 7 | **Confirm** |
| AD-07 requires repository functions across 24 models — deliberate additional work | Noted |
| Transaction primitive `withTransaction` required by O-3 | For Functional Design |
| O-1 consistency approach (idempotent re-derivation recommended) | For Functional Design |
| Marketing directory degradation when `apps/app` is unavailable | For Functional Design |
| Exhaustive mapping of all 56 Server Actions to domain functions | For Functional Design |
| F1 was left blank — assumed nothing further | Noted |
