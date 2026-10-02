# Requirements Clarification Questions — Round 2

Your round 1 answers settled everything in Part 1. Three resiliency answers still conflict
with each other or with an earlier answer. Answer the same way as before.

---

### Contradiction 1: Recovery target vs. regional topology (Resiliency 1 = C, Resiliency 2 = C)
- **Resiliency 1 = C** is Warm Standby: recovery in minutes, with the second site running at reduced capacity and **scaled up on failover**. That pairs with **multi-region active-passive**.
- **Resiliency 2 = C** is **multi-region active-active**: both regions serve traffic at the same time. That pairs with Resiliency 1 = **D**.

Two more facts bear on this:
- **The database.** The backend shares the existing Neon database (Clarification 1 = A, Clarification 4 = A). That database is a single Postgres primary in Sydney. Active-active means **both regions write**. To my knowledge, Neon doesn't offer a writable copy in a second region (I'll verify this in NFR Requirements). So active-active would mean changing the database architecture, not just the backend.
- **Cost and time.** Active-active is the most expensive and complex option. Clarification 10 = A keeps the 1–2 month date with 1–2 developers.

The Australian regions available are Sydney (`ap-southeast-2`) and Melbourne (`ap-southeast-4`).

#### Clarification 2.1
What should the first release target?

A) **Single-region, multi-zone in Sydney** for the first release. The backend runs across at least two availability zones behind a load balancer, and the target is recovery within minutes when a zone fails. Cross-region recovery (Melbourne) is recorded as a later-release requirement (Recommended, given the date)

B) **Multi-region active-passive (Warm Standby).** Sydney serves traffic; Melbourne runs a scaled-down copy of the backend with a database copy or restore plan, and takes over within minutes if Sydney fails. Matches Resiliency 1 = C; needs cross-region database replication or restore designed in

C) **Multi-region active-active** as answered. Resiliency 1 becomes D, and the database must accept writes in both regions, which means redesigning the database architecture

X) Other (please describe after [Answer]: tag below)

[Answer]: A

### Contradiction 2: Rollback that reverses the database (Resiliency 5 = D) vs. expand/contract (Clarification 4 = A)
- **Resiliency 5 = D** means every failed deployment may need its **database migration reversed**.
- **Clarification 4 = A** (expand/contract) is designed so a migration **never needs reversing**. Each migration only adds, and old columns and tables stay until nothing uses them. Rolling back the app is then just deploying the previous version, because the older code still works with the expanded schema.
- Reversal is also costly in practice: Prisma Migrate doesn't generate "down" migrations, so every reversal script would be written and tested by hand.

#### Clarification 2.2
How should rollback work?

A) **Forward-only migrations + version-pinned app rollback.** Roll back by redeploying the previous container image (Resiliency 5 = A). Expand/contract guarantees the schema is compatible with both versions. The rare "contract" step, which removes old columns, gets its own reviewed deploy with a backup taken first (Recommended)

B) **Keep D.** Every migration ships with a hand-written, tested reversal script, and rollback runs it

X) Other (please describe after [Answer]: tag below)

[Answer]: A

### Ambiguity 3: Incident response process (Resiliency 7 = A) — which process?
Option A means "use our existing incident response process — provide the reference", but no reference was given. The rule requires the process to be **named**, so alerting and runbooks can connect to it. I couldn't find one in the repo; `CLAUDE.md` covers deployments and rollback, not incidents.

#### Clarification 2.3
Which incident response process should the backend's alerts and runbooks follow?

A) We have one. Name it after the tag: the tool (e.g. PagerDuty, Opsgenie, a Slack channel) plus who is on call and how incidents are recorded

B) We don't have a formal one. AI-DLC should propose a lightweight incident response and post-incident review process (Resiliency 7 = B)

X) Other (please describe after [Answer]: tag below)

[Answer]: B
