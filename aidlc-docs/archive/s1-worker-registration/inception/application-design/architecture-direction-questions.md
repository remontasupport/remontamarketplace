# Architecture Direction — Questions

You asked for three things: (1) every API secure, (2) a centralised way to define APIs, so that adding an API doesn't mean creating new files, and (3) an advanced architecture, not just layer-by-layer. They're recorded as **NFR-ARCH-01..03** in `requirements.md` §6.8.

Each can be done in more than one way, and the choice changes the whole design, so please pick one per question. Put the letter after `[Answer]:` and say "answered". Reverse Engineering carries on while you decide; these answers are needed before **Application Design** starts.

---

## Question 1 — What should "centralised, no new file per API" mean?

A) **One contract per business area, and the system builds everything else from it.** Each area (Identity, Registration, Onboarding, Compliance, Account, Notifications) has **one contract file** listing all its endpoints: URL, input and output shapes (reused from `packages/schemas`), who may call it, rate limit, what gets audited. The business logic for each endpoint is one function in that area's existing handler file. From the contract, the system automatically creates the routes, the validation, the security checks, the API documentation (OpenAPI) and the typed client that `apps/app` uses. **Adding an API = add one entry to the contract + one function. No new files.** (Recommended)

B) **Literally one file for every endpoint in the whole API.** This is the most central option, but the file grows to hundreds of entries, and two developers editing it at once will keep colliding

C) **A generic configuration-driven engine.** New "resources" are described in configuration, with no code at all. This is fast for simple create/read/update/delete, but it can't express rules like "publish only if the always-required documents are approved", so most of this project's endpoints would need exceptions

X) Other (please describe after [Answer]: tag below)

[Answer]: A (answered in chat 2026-09-25: "One contract per area")

---

## Question 2 — Which architecture style?

A) **Modular monolith with bounded contexts, hexagonal inside each module, events through an outbox.** In detail:
- One deployable service, split internally into **independent business modules** (bounded contexts) that talk only through defined interfaces, never through each other's tables or code.
- Inside each module, **ports and adapters** (hexagonal): business rules are pure code with no NestJS, Prisma or AWS in them, so they're easy to test (and property-test). Database, storage, email and queue plug in as adapters.
- **Domain events + a transactional outbox:** when something happens (e.g. "document rejected"), the event is saved in the same database transaction as the change, then reliably delivered to whatever reacts (email, audit, n8n). No lost or duplicate side effects.
- **CQRS-lite:** separate, optimised read models for heavy admin lists (e.g. the pending queue), without full event sourcing.
- Any module can later be split out into its own service without rewriting it.

This fits 1–2 developers, a shared database and the fixed date. (Recommended)

B) **Microservices,** one deployed service per business area. The strongest isolation, but six deployments, six pipelines and network calls between them; with a shared database and a 1–2 month date it adds a lot of operational risk

C) **Full event sourcing + CQRS.** Every change is stored as an event and state is rebuilt from events. It gives a perfect history for audit, but it's the most complex option and hard to combine with `apps/app` still reading the same tables

D) **Clean architecture with layers inside each module.** Well known, but it's closest to the layer-by-layer design you said you don't want

X) Other (please describe after [Answer]: tag below)

[Answer]: a

---

## Question 3 — How strong should "every API is secure" be?

A) **Deny by default, with central policy-as-code and automated proof.** In detail:
- Every request passes one central pipeline: token check → session-revocation check → **policy check** → input validation → rate limit → handler → response filtering → audit.
- Access rules are written centrally as policies that combine **role + ownership + record state** (e.g. "a worker may read only their own documents"; "an admin may publish only if the always-required documents are approved"). They are not scattered through handlers.
- An endpoint without a policy **won't start** and **fails CI**.
- CI runs an automated test over **every** route (anonymous → 401, wrong role → 403, other owner → 403), plus a dependency scan and a security scan (DAST) of the preview.
- **AWS WAF** in front of the load balancer blocks common attacks and bursts before they reach the service.

(Recommended)

B) Same as A, **without** the WAF and the DAST scan (cheaper and quicker, less defence in depth)

C) Role checks only, centrally; ownership and state checks stay inside each handler (simpler, but that's where today's §2.4 bugs came from)

X) Other (please describe after [Answer]: tag below)

[Answer]: A, extended to all ten principles P1–P10 of NFR-ARCH-04, including WAF and DAST (answered in chat 2026-09-25)
