# U8 — `packages/db`: Prisma Relocation — Code Generation Plan

**Unit**: U8 (Phase C — Data and domain)
**Depends on**: U7 ✅ complete and verified in production
**Traces to**: FR-3.3, FR-4.3 (partial — dead models), R-5
**Status**: **PART 2 — GENERATION.** Q1=A, Q2=B, Q3=A, Q4=A.

> **R-5 — the most likely build break in the migration.** The plan isolates this unit
> deliberately. Its failure mode is a build that succeeds while every runtime query fails —
> the same class as U6, and the reason U4's monitoring being deferred still matters.

---

## 1. Stage Assessment

| Stage | Decision | Reasoning |
|---|---|---|
| Functional Design | **SKIP** | No new business logic. File relocation; repository functions are U9. |
| NFR Requirements | **SKIP** | No new performance, security or scalability requirement. |
| NFR Design | **SKIP** | Follows. |
| Infrastructure Design | **CONSIDER** | Borderline. U8 changes deployment bundling — `outputFileTracingIncludes`, `serverExternalPackages`, `includeFiles`. That is infrastructure-adjacent, but it modifies existing configuration rather than designing new topology, and the design already exists. Proposed **SKIP**, recorded here because it is the one unit where the call is not obvious. |
| **Code Generation** | **EXECUTE** | Always. |

---

## 2. What Was Measured

### The schemas as they actually stand

| Schema | Models | Datasource | Consumers |
|---|---|---|---|
| `apps/app/prisma/auth-schema.prisma` | 24 | `AUTH_DATABASE_URL` | **98 files** |
| `apps/app/prisma/schema.prisma` | 8 | `DATABASE_URL` | **2 files** |
| `apps/web/prisma/schema.prisma` | 3 | `DATABASE_URL` | 1 file |
| `apps/app/prisma/schema.target.prisma` | 32 | — | design reference, not generated |

Migrations: 7 in `apps/app`, 3 in `apps/web`.

### The legacy schema is almost entirely dead

Both files that import the legacy client query **only `contractorProfile`**. Nothing else in
those 8 models is reached through it.

The overlap is exact:

```
ContractorProfile, ContractorsbyArea, Job    → also in apps/web (retired in U15 under D-38)
Document, Category, Subcategory,
CategoryDocument, SubcategoryDocument        → also in auth-schema  ← the "five dead models"
```

**And the five have drifted.** Line counts differ between the two declarations
(Document 16/14, Category 12/9, Subcategory 15/12, CategoryDocument 23/15,
SubcategoryDocument 15/12). Two divergent definitions of the same tables, one of which nothing
reads. That is worth deleting on its own merits, not just for tidiness.

### Two stale bundling entries, introduced by U6

`apps/app/next.config.ts`:

```ts
outputFileTracingIncludes: {
  '/**': ['./node_modules/@prisma/client/**/*', './src/generated/auth-client/**/*'],
},
serverExternalPackages: ['@prisma/client', '.prisma/client'],
```

Since U6 gave each schema an explicit `output`, the app no longer resolves its clients through
`node_modules/@prisma/client` at all — it imports `@/generated/client` and
`@/generated/auth-client`. So:

- `./node_modules/@prisma/client/**/*` now traces a path the app does not use
- **`./src/generated/client/**/*` is missing entirely** — the main client's new home is not listed
- `serverExternalPackages` names packages that are no longer imported directly

Production works today only because `vercel.json`'s `includeFiles: "src/generated/**"` covers both
clients. **The `next.config.ts` configuration is carrying stale entries and a gap** — a latent
problem introduced by my own U6 change and not noticed until this survey.

---

## 3. The Constraint That Should Shape This Unit

**Vercel's `includeFiles` is resolved relative to the project's Root Directory**, which for the
application is now `apps/app`.

```
current:   "src/generated/**"        → apps/app/src/generated/**      ✓ inside the root
if moved:  "../../packages/db/**"    → OUTSIDE the root               ✗
```

The generated auth client is **124 MB** including the Linux query engine. If U8 relocates the
*generated client* into `packages/db`, the artifact Vercel must bundle moves outside the directory
`includeFiles` can address.

That is not a hypothetical. It is the same class of failure that produced **five consecutive
deployment failures during U5** — and whose root cause inside Vercel was never established. We
have direct evidence that this platform fails at bundling in ways that produce an empty build log.

**This is what makes Question 1 the decision of the unit.**

---

## 4. Questions

### Question 1 — Does the generated client move, or only the schema?

A) **Schema and migrations move; generation still outputs into `apps/app`.**
`packages/db/prisma/schema.prisma` becomes the single source of truth, with
`output = "../../../apps/app/src/generated/auth-client"`. Ownership moves; the deployed artifact
stays where `includeFiles` can reach it.
**Achieves** FR-3.3 (`packages/db` owns the schema and migrations).
**Avoids** re-entering the failure mode that cost five deployments in U5.
**Cost**: a package whose generated output lands in a consumer — unusual, and it must be
commented or it will read as a mistake.

B) **Everything moves, including the generated client.** `packages/db` holds schema, migrations
and client. Architecturally clean and what the design literally says.
**Cost**: `includeFiles` can no longer address the artifact. Would need `outputFileTracingIncludes`
alone to carry a 124 MB client across a package boundary — unproven on this platform, and the one
place we know it fails silently.

C) **Defer U8 until the Vercel bundling behaviour is understood** — raise the support ticket first
(it is already an open follow-up from U5), then decide with facts rather than around them.

X) Other (please describe after [Answer]: tag below)

[Answer]: A — schema and migrations move; generation still outputs into apps/app. AI recommendation accepted. Keeps the deployed artifact inside the Vercel Root Directory that includeFiles can address.

---

### Question 2 — Does `node-linker=hoisted` come off in U8?

It was added in U5 to make Vercel deploy at all. It disables pnpm's phantom-dependency detection,
and has been off through U6 and U7 — the units that created packages, which is when undeclared
imports appear.

A) **Remove it in U8 and face the Vercel failure properly** — support ticket with the failing
deployment IDs, then a fix based on the answer. Restores the guard before U9–U11 add six more
packages.
**Cost**: reopens an unresolved platform problem inside the unit already carrying the highest
build risk. Two hard problems in one unit.

B) **Keep it for now; remove it in its own unit** once U8's relocation is verified. Keeps R-5
isolated, which is why the plan separated U8 in the first place.
**Cost**: three more units built without the guard.

C) **Remove it, but verify on a preview branch first** — same as A, staged so the linker change is
proven before the relocation lands.

X) Other (please describe after [Answer]: tag below)

[Answer]: B — keep node-linker=hoisted for now; remove it in its own unit. AI recommendation accepted. U8 already carries the highest build risk; pairing it with the unresolved Vercel problem would make a failure ambiguous.

---

### Question 3 — The five dead models

`Document`, `Category`, `Subcategory`, `CategoryDocument`, `SubcategoryDocument` are declared in
**both** the legacy schema and `auth-schema`, have **drifted**, and nothing reads the legacy copies.

A) **Delete them from the legacy schema in U8.** In scope per the unit definition, removes a
genuine source of confusion, and changes no live table.

B) **Defer to U15**, where `ContractorProfile` retirement removes the legacy schema wholesale.

X) Other (please describe after [Answer]: tag below)

[Answer]: A — delete the five dead declarations in U8. AI recommendation accepted. They have drifted, nothing reads them, and no live table changes.

---

### Question 4 — `apps/web`'s own Prisma

Marketing has its own 3-model schema on `DATABASE_URL`. **D-34** consolidates both apps onto a
single database and **D-35** says marketing holds no database credential — but those land in
U14/U15.

A) **Leave `apps/web`'s Prisma untouched in U8.** U8 is the application's relocation. Marketing's
database access is a behaviour change governed by D-35.

B) Move marketing's schema into `packages/db` too, for one location.
**Cost**: `packages/db` would then be consumed by `apps/web`, which **P-1 explicitly forbids**.

X) Other (please describe after [Answer]: tag below)

[Answer]: A — leave apps/web's Prisma untouched. AI recommendation accepted (user, 2026-09-23). Moving it would make apps/web a consumer of @remonta/db, which P-1 forbids.

---

## 5. Recommendation

**Q1=A, Q2=B, Q3=A, Q4=A.**

Q1=A because the deployed artifact staying inside the Vercel Root Directory is the single thing
most likely to keep this unit from failing the way U5 did. It achieves what FR-3.3 asks —
`packages/db` owning the schema and migrations — without betting the unit on bundling behaviour
that has already failed five times and was never explained. If B is wanted, C should come first.

Q2=B because U8 already carries the highest build risk in the migration. Pairing it with an
unresolved platform problem means a failure could come from either, and telling them apart is
exactly what cost half a day during U5. The guard has been off for two units; one more is a known,
bounded cost, and removing it deserves a unit where it is the only variable.

Q3=A and Q4=A follow the unit definition and the boundary rules respectively.

---

## 6. Execution Steps (Part 2 — after answers)

### Step 1 — `packages/db`
- [ ] `package.json` as `@remonta/db`, private; `@prisma/client` and `prisma` as dependencies
- [ ] Move `apps/app/prisma/auth-schema.prisma` → `packages/db/prisma/schema.prisma`
- [ ] Move the 7 migrations
- [ ] Generator `output` per Q1
- [ ] Export the Prisma client from the package root **temporarily**, so existing call sites work
      (the unit definition is explicit that this is temporary; U9 removes it)

### Step 2 — Bundling configuration
- [ ] Fix `outputFileTracingIncludes` — remove the stale `node_modules/@prisma/client` entry, add
      the missing `src/generated/client`
- [ ] Reassess `serverExternalPackages` against what the app now actually imports
- [ ] Confirm `includeFiles` still addresses both clients

### Step 3 — Dead models (per Q3)
- [ ] Remove the five duplicate declarations from the legacy schema
- [ ] Confirm both legacy-client routes still work — they query only `contractorProfile`

### Step 4 — Call sites
- [ ] `apps/app` declares `@remonta/db`
- [ ] Shims at old locations (T2=A) so no call site changes
- [ ] `apps/web` does **not** declare it — P-1 enforced by the U7 boundary rules

### Step 5 — Verification
- [ ] `turbo ls` reports 5 packages
- [ ] Gates unchanged: app 149/518/54, web 76 + strict `tsc`
- [ ] `turbo run build` succeeds
- [ ] Boundary check still passes; `apps/web` importing `@remonta/db` still fails
- [ ] **Preview: sign in, load a database-backed page, submit a form** — R-5 means a green build
      proves nothing here
- [ ] Production verified after merge

### Step 6 — Documentation
- [ ] `aidlc-docs/construction/U8/code/U8-summary.md`
- [ ] `aidlc-state.md` updated

---

## 7. Production Safety

| Invariant | Assessment |
|---|---|
| **PS-1** Both apps deployable | Must hold at every step |
| **PS-2** Preview-verified | **Non-negotiable here.** R-5's failure mode is invisible to a build |
| **PS-3** Single `git revert` | Yes, with shims |
| **PS-4** Additive before subtractive | Shims keep old locations resolving |
| **PS-5** No destructive DB change | ✅ **No schema change — file relocation only** |
| **PS-6** Not both structure and behaviour | Holds; Q3 deletes declarations, not tables |
| **PS-7** Integrations disabled before removal | N/A |

**No live table is altered by this unit.** The five dead models are *declarations* in a schema
nothing reads; the tables they describe are owned by `auth-schema` and untouched.
