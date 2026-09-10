# Unit ↔ Requirement Map

**Stage**: INCEPTION — Units Generation (Part 2)
**Date**: 2026-09-10

**Adaptation note** (D4=A): User Stories was skipped at the user's request, so there are no
stories to map. This artifact replaces `unit-of-work-story-map.md` and serves the same purpose —
proving that **every requirement lands in a unit** and **every unit exists for a reason**.

---

## 1. Functional Requirements → Units

| Requirement | Units | Coverage |
|---|---|---|
| **FR-1.1** Structure `apps/` + `packages/` | U6, U7 | ✅ |
| **FR-1.2** `apps/web` = marketing | U6 | ✅ |
| **FR-1.3** `apps/app` = application | U6 | ✅ |
| **FR-1.4** `apps/mobile` reserved | U7 | ✅ |
| **FR-1.5** Turborepo orchestration | U5 | ✅ |
| **FR-1.6** pnpm workspaces | U5 | ✅ |
| **FR-2.1** History not preserved; old repo read-only | U6 | ✅ |
| **FR-2.2** Verify each app builds and deploys | U6 | ✅ |
| **FR-2.3** Stale branches abandoned | U7 | ✅ |
| **FR-3.1** `packages/ui` tokens and primitives | U12 | ✅ |
| **FR-3.2** `packages/schemas`, no framework deps | U7 | ✅ |
| **FR-3.3** `packages/db` owns schema and repositories | U8, U9 | ✅ |
| **FR-3.4** `packages/domain-*` framework-neutral | U10, U11 | ✅ |
| **FR-3.5** `packages/api-client` | U13 | ✅ |
| **FR-3.6** `packages/config` | U7 | ✅ |
| **FR-3.7** Nine drifted endpoints reconciled | U11, U15 | ✅ |
| **FR-3.8** Both web apps render identically | U12 | ✅ |
| **FR-4.1** New worker-search endpoint | U14 | ✅ |
| **FR-4.2** Returns all workers (admin) | U14 | ✅ |
| **FR-4.3** Remove `/api/contractors`, legacy client, dead models | U8 (models), U14 (routes) | ✅ |
| **FR-4.4** `SearchSupport.tsx` re-pointed | U14 | ✅ |
| **FR-4.5** No contractor data migrated | U15 | ✅ |
| **FR-4.6** Marketing retains sync — *superseded by D-38* | U15 | ✅ (retired) |
| **FR-4.7** Build-then-replace, no marketing downtime | U14 | ✅ |
| **FR-5.1** Remove `fix-qualifications` (TD-1) | U14 | ✅ |
| **FR-5.2** Guard `/remontaadmin/findsupport` (TD-5) | U14 | ✅ |
| **FR-5.3** Fix coordinator role check (TD-4) | U14 | ✅ |
| **FR-5.4** Rate-limit worker-photo upload (TD-2) | U14 | ✅ |
| **FR-6.1** Remove build-error suppression | U1 | ✅ |
| **FR-6.2** Baseline existing type errors | U1 | ✅ |
| **FR-6.3** CI can fail a merge | U3 | ✅ |
| **FR-6.4** Unit and integration test framework | U2 | ✅ |
| **FR-6.5** Property-based testing framework | U2 | ✅ |
| **FR-6.6** Dependency vulnerability scanning | U3 | ✅ |
| **FR-7.1** Two Vercel projects, per-app roots | U6 | ✅ |
| **FR-7.2** Turborepo build with remote caching | U5 | ✅ |
| **FR-7.3** Blue/green deployment semantics | U6 | ✅ (Vercel-native) |
| **FR-7.4** Both apps on `AUTH_DATABASE_URL`; `apps/web` no credential | U15 | ✅ |
| **FR-7.5** Marketing database retired | U15 | ✅ |
| **FR-8.1** Change management process | U4 | ✅ |
| **FR-8.2** CI/CD pipeline definition | U3 | ✅ |
| **FR-8.3** Database-aware rollback procedure | U4 (documented), U15 (applied) | ✅ |
| **FR-8.4** DR testing schedule | U4 | ✅ |
| **FR-8.5** Incident response and COE process | U4 | ✅ |
| **FR-9.1** `contracts` consumable by React Native | U7, U13 | ✅ |
| **FR-9.2** Server Actions **not** promoted to HTTP | — | ✅ (out of scope, D-29) |
| **FR-9.3** Mobile technology deferred | U7 | ✅ (stub only) |
| **FR-10.1** Marketing footprint is two models | U15 | ✅ |
| **FR-10.2** Marketing directory → `/api/public/workers` | U14 | ✅ |
| **FR-10.3** Retire marketing's duplicate job sync | U15 | ✅ |
| **FR-10.4** Retire `ContractorProfile` and routes | U15 | ✅ |
| **FR-10.5** No worker data duplicated across databases | U15 | ✅ |
| **FR-10.6** Verify-then-drop sequence | U15 | ✅ |
| **FR-10.7** Endpoint segregation | U11 (built), U14 (enforced) | ✅ |

**All 54 functional sub-requirements are assigned.** FR-9.2 is satisfied by deliberate exclusion.

---

## 2. Non-Functional Requirements → Units

| Requirement | Units | Coverage |
|---|---|---|
| **NFR-1.1** RTO/RPO hours, Backup and Restore | U4 | ✅ |
| **NFR-1.2** Single-region multi-zone | — | ✅ (current state, no change) |
| **NFR-1.3** Verified backup and restore procedure | U4 | ✅ **restore drill** |
| **NFR-1.4** No cross-region failover | — | ✅ (no change) |
| **NFR-2.1** Both products deployable throughout | **All units** | ✅ PS-1 |
| **NFR-2.2** Every step revertible without data loss | **All units** | ✅ PS-3 |
| **NFR-2.3** Schema changes have a reversal path | U4, U15 | ✅ |
| **NFR-3.1** Deny by default, server-side authorization | U10, U11, U14 | ✅ |
| **NFR-3.2** Security headers on all HTML routes | U4 | ✅ |
| **NFR-3.3** Schema-validated inputs with bounds | U10, U11 | ✅ |
| **NFR-3.4** Rate limiting on public endpoints | U14 | ✅ |
| **NFR-3.5** No secrets in source; **rotate Neon credential** | **Immediate** | ⚠️ see §4 |
| **NFR-3.6** Lock file, vulnerability scan, SBOM | U3, U5 | ✅ |
| **NFR-3.7** Remove unused dependencies | U12 | ✅ |
| **NFR-4.1** Structured logging | U4 | ✅ |
| **NFR-4.2** No PII or tokens in logs | U4 | ✅ |
| **NFR-4.3** Alerting on auth failures | U4 | ✅ |
| **NFR-4.4** 90-day log retention | U4 | ✅ |
| **NFR-4.5** Health checks | U4 | ✅ |
| **NFR-5.1** Test framework established | U2 | ✅ |
| **NFR-5.2** Property tests for round-trip, invariants, idempotency | U2, U9, U10 | ✅ |
| **NFR-5.3** PBT complements example-based tests | U2 | ✅ |
| **NFR-5.4** Shrinking and seed reproducibility | U2 | ✅ |
| **NFR-6.1** No duplication across apps | U7, U12, U13 | ✅ |
| **NFR-6.2** Packages declare own dependencies | U5, U7 | ✅ |
| **NFR-6.3** Ownership by directory, not branch | U6 | ✅ |
| **NFR-6.4** One primitive library, one styling approach | U12 | ✅ |
| **NFR-7.1** No performance regression | **All units** | ✅ k6 per PS-2 |
| **NFR-7.2** Turborepo remote caching | U5 | ✅ |
| **NFR-7.3** k6 scripts carried forward | U2 | ✅ |

**All 31 non-functional sub-requirements are assigned**, except NFR-3.5 — see §4.

---

## 3. Technical Debt → Units

| Finding | Severity | Unit |
|---|---|---|
| **TD-1** Unauthenticated admin mass-write endpoint | High | U14 |
| **TD-2** Unauthenticated Blob upload | Medium | U14 |
| **TD-3** No automated gate can fail a build | High | U1, U2, U3 |
| **TD-4** Coordinator role check never fires | Medium | U14 |
| **TD-5** `/remontaadmin/findsupport` unguarded | Medium | U14 |
| **TD-6** Sync mutex is per-instance | Low | U11 (Redis lock) |
| **TD-7** Duplicate capability in six areas | Medium | U12, U13 |
| **TD-8** Stale marketing schema copy | Low | U8 |
| **TD-9** Missing foreign keys | Medium | **Not scoped** — see §4 |
| **TD-10** Stale W1 comment | Low | U8 |
| **TD-11** Service layer in one domain only | Low | U10, U11 |
| **TD-12** Unused enums | Low | **Not scoped** — see §4 |
| **TD-13** Security headers dashboard-only | Low | U4 |

---

## 4. Not Covered by Any Unit

Recorded so the gaps are deliberate rather than accidental.

| Item | Status | Rationale |
|---|---|---|
| **NFR-3.5 — rotate the exposed Neon credential** | **Do immediately** | A live connection string was shared in conversation on 2026-09-09. This is not unit work; it should be done today, independently of this plan. |
| **TD-9 — missing foreign keys** on `JobApplication.workerId`, `ServiceRequest.requesterId`, `VerificationRequirement.reviewedBy` | Out of scope | Documented in requirements §7. Mitigated in practice by AD-05's object-level ownership checks, which U10 and U11 introduce. Worth a follow-on unit after the migration. |
| **TD-12 — unused enums** `VerificationStatus`, `RepresentativeType` | Out of scope | Cosmetic schema debt. |
| **Mobile implementation** | Out of scope | D-29 — scaffold only. |
| **Promoting 56 Server Actions to HTTP** | Out of scope | FR-9.2 — the primary mobile blocker, deliberately deferred. |
| **NextAuth v4 → Auth.js v5** | Out of scope | Required for mobile token auth, not for consolidation. |
| **Full UI consolidation of app-internal components** | Out of scope | D-14 splits it into a follow-on effort; U12 covers the shared package only. |
| **Search-visibility acceptance criteria** | Absorbed | Displaced by skipping User Stories; captured in U14's Functional Design. |

---

## 5. Coverage Summary

| Dimension | Total | Assigned | Deliberately excluded |
|---|---|---|---|
| Functional sub-requirements | 54 | 54 | 0 |
| Non-functional sub-requirements | 31 | 30 | 1 (NFR-3.5 — immediate action, not unit work) |
| Technical debt findings | 13 | 11 | 2 (TD-9, TD-12) |
| Units without a requirement | — | **0** | — |

**Every unit traces to at least one requirement, and every requirement traces to at least one
unit.** The single unassigned NFR is an action to take today rather than work to schedule.

---

## 6. Requirement Density by Unit

| Unit | Requirements carried | Note |
|---|---|---|
| U14 | **17** | Highest — all four security fixes plus the search re-point. Atomic and flag-gated for exactly this reason. |
| U4 | **16** | Observability, process artifacts, restore verification. The unit added in response to P7/P8. |
| U15 | **10** | Retirement and database consolidation. |
| U12 | 6 | UI reconciliation. |
| U6 | 6 | Relocation and deployment. |
| U7 | 6 | Leaf packages. |
| U5 | 5 | Workspace tooling. |
| U2 | 5 | Test frameworks. |
| U3 | 4 | CI. |
| U11 | 4 | Five domain packages. |
| U10 | 4 | Domain-core and first package. |
| U13 | 3 | Integrations and client. |
| U9 | 2 | Repositories. |
| U8 | 3 | Prisma relocation. |
| U1 | 2 | Type baseline. |

U14 and U4 carrying the most requirements is expected and correct: U14 is the only deliberate
behaviour change and bundles the security remediation that RISK-2 forbids splitting, while U4
absorbed the observability and process obligations that three blocking extension rules impose.
