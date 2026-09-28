# Application Design Plan

**Stage**: INCEPTION — Application Design
**Date**: 2026-09-09
**Depth**: Comprehensive
**Status**: COMPLETE — all 15 answered, artifacts generated

---

## Context

Application Design here means **defining the six package boundaries and their public interfaces**
before any code moves. The packages themselves are settled (D-36); what is not settled is what
goes in each one and what shape their interfaces take.

Established and not re-opened:
- Structure: `apps/{web,app,mobile}` + `packages/{db,schemas,domain,api-client,ui,config}` (D-36)
- Single database on `AUTH_DATABASE_URL`; `apps/web` holds no credential (D-34, D-35)
- Incremental delivery, both products deployable at every step (D-40, NFR-2.1)
- `ContractorProfile` retired; `WorkerProfile` is the single worker record (D-38)
- All three extensions enforced — 40 blocking rules (D-31, D-32, D-33)

The measured facts this design has to accommodate:
- **56 Server Actions** across 10 modules, all `"use server"` — cannot move to a package as-is
- **22 of 24** `src/lib` modules are server-clean — the domain layer is extractable
- **149 type errors**, 14 in `src/lib` and 8 in `src/services/worker` — in the code being moved
- **17 files** query Prisma directly in Server Components, bypassing the API layer

---

## Plan

### Part 1 — Design decisions (this document)
- [x] Analyse requirements and reverse-engineering context
- [x] Generate context-appropriate design questions
- [x] Collect answers from user
- [x] Analyse answers for ambiguity and contradiction
- [x] Issue follow-up questions if needed (none required — all answers were unambiguous letter choices)
- [ ] Obtain approval to generate artifacts

### Part 2 — Design artifacts (after answers)
- [x] Generate `components.md` — component definitions, responsibilities, interfaces
- [x] Generate `component-methods.md` — method signatures, input/output types
- [x] Generate `services.md` — service definitions and orchestration patterns
- [x] Generate `component-dependency.md` — dependency matrix, communication patterns, data flow
- [x] Generate `application-design.md` — consolidated design document
- [x] Validate design completeness and consistency
- [x] Produce extension compliance summary (SECURITY / RESILIENCY / PBT)

---

## Questions

Please answer below each `[Answer]:` tag. Where I have a strong recommendation I have said so and
why — you can simply take it.

---

## Section A — Component Identification

### Question A1
How should `packages/domain` be organised internally?

A) **Flat** — all domain functions in one namespace, files by concern (`worker.ts`, `client.ts`, `jobs.ts`, `verification.ts`).

B) **Sub-modules by business domain** — `domain/worker/`, `domain/client/`, `domain/coordinator/`, `domain/admin/`, `domain/jobs/`, `domain/verification/`, each with its own barrel export.

C) **Sub-packages** — separate workspace packages (`@remonta/domain-worker`, `@remonta/domain-jobs`) for stricter boundaries.

X) Other (please describe after [Answer]: tag below)

[Answer]: C

> **Recommendation: B.** The existing code already has natural domain seams — nine worker
> services, plus client/coordinator/admin logic currently inline in route handlers. Sub-modules
> match that without the overhead of publishing multiple packages. Option C would mean six more
> `package.json` files and version coordination for no boundary benefit inside one repo.

### Question A2
The integration clients — Zoho, Resend/Nodemailer email, Vercel Blob, Upstash Redis, geocoding, Twilio SMS, reCAPTCHA — currently live in `apps/app`'s `src/lib`. Where should they go?

Note: `apps/web` (marketing) has `/api/send-contact` and `/api/send-feedback`, so it **needs email** even after losing database access. Nothing else is currently shared.

A) **New `packages/integrations`** — all external service clients in one shared package, consumed by both apps.

B) **Inside `packages/domain`** — treat them as domain infrastructure; marketing gets email by calling an `apps/app` endpoint.

C) **Stay in `apps/app`**, except email which is duplicated in `apps/web` (status quo).

D) **Split** — shared ones (email) in `packages/integrations`, app-only ones (Zoho, Blob, Redis, geocoding, SMS, reCAPTCHA) stay in `apps/app`.

X) Other (please describe after [Answer]: tag below)

[Answer]: D

> **Recommendation: D.** Only email is genuinely shared. Putting six app-only clients in a shared
> package would invite `apps/web` to import things it should not have (Redis and Blob credentials,
> for instance), which works against D-35's isolation intent. Note this adds a seventh package —
> say if you would rather avoid that and take A.

### Question A3
The 17 files that query Prisma directly in Server Components (15 pages, 2 components) — how should they be handled?

A) **Leave as-is for now.** They stay in `apps/app`, importing `packages/db` directly. Fastest; keeps the current pattern.

B) **Route through `packages/domain`.** Pages call domain functions instead of Prisma directly. Consistent architecture, no new endpoints.

C) **Convert to API endpoints.** Pages fetch from HTTP like everything else. Most work, but makes that data mobile-reachable.

X) Other (please describe after [Answer]: tag below)

[Answer]: B

> **Recommendation: B.** It removes the direct-Prisma-in-presentation anti-pattern and keeps data
> access in one layer, without the cost of C. Option C is the only one that makes this data
> mobile-reachable — but D-29 defers mobile, so that cost is not justified yet. B leaves C
> straightforward later, since the domain function becomes the endpoint's body.

---

## Section B — Component Methods and Interfaces

### Question B1 — the key interface decision
Domain functions currently call `getServerSession()` internally to identify the caller. That couples them to Next.js. How should the caller be identified once the logic lives in `packages/domain`?

A) **Explicit actor parameter.** Every domain function takes the acting user as its first argument: `updateWorkerBio(actor: Actor, data: UpdateBioData)`. Transport layers (Server Action wrappers, route handlers, future mobile endpoints) resolve the session and pass it in.

B) **Implicit — keep reading the session inside.** Domain functions call a session provider. Less churn now, but the package stays framework-coupled and cannot serve mobile.

C) **Context object / async local storage.** A request context is established at the transport boundary and read by domain functions without an explicit parameter.

X) Other (please describe after [Answer]: tag below)

[Answer]: A

> **Recommendation: A.** This is the decision that determines whether `packages/domain` is
> genuinely reusable. With an explicit actor, the same function serves a Server Action, an HTTP
> handler and a mobile endpoint unchanged, and it becomes trivially testable — which matters
> because PBT is enabled (D-33) and property tests need functions without hidden dependencies.
> Option B would leave RISK-7 only half-resolved.

### Question B2
Where should authorization be enforced?

A) **In the domain functions.** Each function asserts the actor's permission itself. Authorization travels with the logic, so no transport can forget it.

B) **At the transport boundary.** Route handlers and Server Action wrappers call `requireRole` before delegating; domain functions trust their caller.

C) **Both** — transport does coarse role checks, domain does object-level ownership checks (does this actor own this resource).

X) Other (please describe after [Answer]: tag below)

[Answer]: C

> **Recommendation: C**, and this is a compliance matter as much as a design one. SECURITY-08
> requires object-level authorization to prevent IDOR, and SECURITY-11 requires defence in depth
> with no single control as sole line of defence. Today authorization is **only** at the transport
> boundary, per handler — and that is exactly how TD-1 (an unguarded admin endpoint performing
> mass writes) and TD-4 (a role check whose path string drifted) happened. Option C puts ownership
> checks where they cannot be skipped.

### Question B3
How should domain functions report failure?

A) **Throw exceptions.** Matches the current style (`requireRole` throws). Transport layers catch and map to HTTP status or Server Action errors.

B) **Return a Result type** — `{ ok: true, data } | { ok: false, error }`. Explicit, type-safe, no forgotten try/catch, but more verbose and a bigger change.

C) **Hybrid** — throw for programmer errors and authorization failures, return Results for expected domain failures (validation, not-found, conflict).

X) Other (please describe after [Answer]: tag below)

[Answer]: C

> **Recommendation: C.** SECURITY-15 requires fail-closed behaviour and explicit error handling on
> every external call. Throwing on authorization failure is the right default because a missed
> catch then denies rather than permits. Returning Results for expected failures makes them
> visible in the type signature, which is what `packages/api-client` and mobile will consume.

### Question B4
Should `packages/db` export the Prisma client directly, or wrap it?

A) **Export the client.** `packages/domain` writes Prisma queries directly. Simplest, no abstraction layer, full Prisma expressiveness.

B) **Repository functions.** `packages/db` exposes `findWorkerById`, `listPublishedWorkers`, and so on; domain calls those and never sees Prisma.

C) **Export the client, but keep query helpers alongside** for complex reused queries such as the faceted worker search.

X) Other (please describe after [Answer]: tag below)

[Answer]: B

> **Recommendation: C.** Full repository abstraction (B) is a large amount of new code for a
> codebase that already has 149 type errors to clear, and Prisma is already a data-access
> abstraction. But the faceted worker search in `worker-search.ts` (363 lines, the largest lib
> module) genuinely warrants a named helper rather than being rebuilt at each call site.

---

## Section C — Service Layer and Orchestration

### Question C1
What remains in `apps/app`'s `src/services` after domain extraction?

A) **Thin `"use server"` wrappers only** — each of the 56 actions becomes a two-or-three-line wrapper that resolves the session and calls a domain function.

B) **Nothing** — delete the directory; client components call domain functions through new API routes instead.

C) **Wrappers plus orchestration** — wrappers stay, and any logic that coordinates several domain calls plus a `revalidatePath` stays with them.

X) Other (please describe after [Answer]: tag below)

[Answer]: C

> **Recommendation: C.** `revalidatePath` is a Next.js cache concern and does not belong in a
> framework-neutral package, so something Next-aware has to sit between the client and the domain.
> Option B would mean rewriting every calling component, which conflicts with incremental delivery
> (D-40).

### Question C2
Should `packages/api-client` be generated from a specification, or hand-written?

A) **Hand-written**, typed against `packages/schemas`. Full control, no new tooling, needs manual upkeep as endpoints change.

B) **Generated from an OpenAPI spec** that the app's routes produce. Stays in sync automatically, but requires introducing spec generation across 86 routes.

C) **Hand-written now, generated later** if the endpoint surface grows.

X) Other (please describe after [Answer]: tag below)

[Answer]: C

> **Recommendation: C.** Mobile is deferred (D-29), so the client's initial surface is small —
> the worker directory for marketing, plus whatever mobile needs first. Introducing OpenAPI
> generation across 86 routes now would be a project of its own.

---

## Section D — Dependencies and Boundaries

### Question D1
How should the rule that `apps/web` must never import `packages/db` be enforced?

A) **Tooling.** An ESLint boundary rule or `dependency-cruiser` check, failing CI on violation.

B) **Package manifest only** — `apps/web` simply does not declare `packages/db` as a dependency; pnpm's strict isolation then makes the import fail at build.

C) **Both** — manifest omission plus a CI check for clear failure messages.

D) **Convention and code review.**

X) Other (please describe after [Answer]: tag below)

[Answer]: C

> **Recommendation: C.** pnpm alone (B) does most of the work and is why it was chosen (D-08), but
> a lint rule gives a comprehensible error instead of an opaque resolution failure. Not D: this
> codebase's existing security findings came from exactly that kind of discipline-only boundary,
> and there is one developer with no second reviewer (D-20).

### Question D2
`apps/mobile` will consume `packages/schemas` and `packages/api-client`. Should the design actively prevent it from importing `packages/domain` and `packages/db`?

A) **Yes, enforced now** — mobile is a client and must reach data only over HTTP.

B) **No** — leave it open; mobile is only a scaffold and the constraint can be added when real work starts.

X) Other (please describe after [Answer]: tag below)

[Answer]: A

> **Recommendation: A.** The constraint is free to add while `apps/mobile` is empty, and expensive
> to retrofit once code exists. It is also the boundary that keeps `packages/schemas` honest about
> having no server dependencies.

---

## Section E — Design Patterns

### Question E1
`packages/ui` standardises on one primitive library. Which survives?

Current state in `apps/app`: Radix UI (10 packages, the base for 27 shadcn-style components in `src/components/ui`), MUI 7 (mainly date pickers), Headless UI, and chatscope (admin chatbot only).

A) **Radix** — keep the shadcn pattern already in place; port the MUI date pickers to `react-day-picker`, which is already a dependency.

B) **MUI** — richer out of the box, but means rebuilding all 27 existing primitives.

C) **Headless UI** — lightest, fewest components, most rebuilding.

X) Other (please describe after [Answer]: tag below)

[Answer]: A

> **Recommendation: A.** 27 components already exist on Radix, and `react-day-picker` is already
> installed, so the MUI surface to replace is small. Choosing B or C means rebuilding work that
> already exists and works.

### Question E2
And one styling approach — currently Tailwind 4, styled-components 6, and Emotion 11 all coexist.

A) **Tailwind only.** Already primary and already tooled (`prettier-plugin-tailwindcss`). Dropping MUI (E1=A) removes Emotion's reason to exist; styled-components usage must be migrated.

B) **Tailwind plus styled-components** for complex components.

C) **CSS Modules** for shared components, Tailwind in apps.

X) Other (please describe after [Answer]: tag below)

[Answer]: A

> **Recommendation: A.** Emotion is only present as an MUI peer dependency, so E1=A removes it.
> That leaves styled-components as the sole thing to migrate. Under D-14 the shared package
> standardises on one stack while existing app code migrates opportunistically — so this decision
> constrains `packages/ui` immediately and `apps/app` gradually.

### Question E3
Should `packages/ui` include a design-token layer, or Tailwind config alone?

A) **Tailwind config in `packages/config`** — shared theme (colours, typography, spacing) consumed by both apps. Simplest, one source of truth.

B) **CSS custom properties** exported by `packages/ui`, with Tailwind mapped onto them. Enables runtime theming.

C) **Both** — tokens as CSS variables, Tailwind config referencing them.

X) Other (please describe after [Answer]: tag below)

[Answer]: A

> **Recommendation: A**, unless runtime theming is a real requirement. D-13 requires the two
> products look identical, which a shared Tailwind theme achieves directly. Option C is the right
> answer only if dark mode or white-labelling is coming — say so if it is.

---

## Section F — Open

### Question F1
Anything about the intended package design, interfaces, or boundaries that I have not asked and should account for?

[Answer]: 
