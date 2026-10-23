# Requirements questions: worker activation (2026-10-23)

Your request: "The worker can be active if the admin only set it to active so by default they are not active."
Decided already: a **new admin-set flag**, separate from the account's login status (an inactive worker still signs in
and finishes their profile), and **every existing worker starts inactive** too.

What exists today (inventory):

- The card's **Active** switch writes `users.status` ACTIVE <-> SUSPENDED. SUSPENDED blocks sign-in, the api token,
  password set-up and impersonation.
- Three lists show only `users.status = ACTIVE`: the **admin search** (`apps/api`), the **client worker search**
  (`/api/client/workers`) and the **public worker list** on the marketing site (`/api/public/workers`).
- "Show Inactive Workers" on the admin dashboard lists the SUSPENDED accounts.
- Separately, **Verify Compliance** sets `worker_profiles.isPublished` (1 of 1,765 workers today).

Fill in each `[Answer]:` with a letter (or X and your words). Answer in the file or in chat, whichever is easier.

---

## Question 1: Where does "inactive" hide a worker?
A) Clients and the public only: inactive workers are hidden from the client search and the public list; admins still
   find everyone in the admin search, with their status shown
B) Everywhere: also hidden from the admin search (found only through an "inactive workers" list)
C) Admin only: a label in the admin dashboard; clients and the public still see every worker
X) Other (please describe after [Answer]: tag below)

[Answer]: a

## Question 2: Impact of the reset
With Question 1 = A or B and every worker reset to inactive, the **client search and the public list show no workers
at all** until admins switch them on, one by one. Is that what you want?
A) Yes: reset everyone; the lists are empty until we activate workers
B) Reset everyone, but first give admins a way to activate many at once (e.g. tick several cards, "Activate selected")
C) Reset everyone except the workers already marked Verify Compliance (isPublished)
X) Other (please describe after [Answer]: tag below)

[Answer]: Just set them to Inactive, the workers can still sign in, admins can still search but they need to tick the worker whether they are active or not.

## Question 3: The admin search's default view
A) Show all workers, with a filter "Status: All / Active / Inactive" (default All) and the switch on each card
B) Show active only by default; the filter reveals inactive ones
C) Show inactive only by default (a review queue), with the filter for the others
X) Other (please describe after [Answer]: tag below)

[Answer]: a

## Question 4: Suspension (blocking sign-in)
The switch will no longer suspend accounts. What happens to suspension?
A) Keep it as a separate action on the worker's admin page ("Suspend account" / "Restore"), and "Show Inactive
   Workers" becomes "Suspended accounts"
B) Remove suspension from the admin dashboard (no one needs it)
X) Other (please describe after [Answer]: tag below)

[Answer]: a

## Question 5: Today's suspended accounts
A) They stay suspended (can't sign in) and also become inactive
B) Un-suspend them: they become ordinary inactive workers who can sign in
X) Other (please describe after [Answer]: tag below)

[Answer]: a

## Question 6: Activation and Verify Compliance (isPublished)
A) Independent: Active and Verify Compliance are two separate admin decisions
B) Activation requires Verify Compliance first (the switch is disabled until compliance is verified)
C) Merge them: Verify Compliance becomes the same flag as Active
X) Other (please describe after [Answer]: tag below)

[Answer]: a

## Question 7: What the worker sees
A) Nothing changes for the worker
B) A note on their dashboard while inactive ("Your profile is awaiting approval by Remonta")
C) B, plus an email when an admin activates them
X) Other (please describe after [Answer]: tag below)

[Answer]: B

## Question 8: Record of who changed it
A) Store who activated/deactivated and when (shown on the worker's admin page), plus an audit row
B) An audit row only
C) No record needed
X) Other (please describe after [Answer]: tag below)

[Answer]: C

## Question 9: Who can switch it
A) ADMIN and SUPER_ADMIN (as today's switch)
B) SUPER_ADMIN only
X) Other (please describe after [Answer]: tag below)

[Answer]:A

---

## Question: Security Extensions
Should security extension rules be enforced for this cycle? (Last cycle: A)

A) Yes — enforce all SECURITY rules as blocking constraints (recommended for production-grade applications)
B) No — skip all SECURITY rules (suitable for PoCs, prototypes, and experimental projects)
X) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question: Resiliency Extensions
Should the resiliency baseline be applied? (Last cycle: A, SLA 99.9 %, RTO ≤ 30 min, RPO ≤ 5 min, single region)
It is a set of directional, design-time best practices (AWS Well-Architected, Reliability Pillar); it does not certify
any availability, RTO or RPO target.

A) Yes — apply the resiliency baseline as directional best practices and design-time guidance
B) No — skip the resiliency baseline
X) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question: Property-Based Testing Extension
Should property-based testing (PBT) rules be enforced? (Last cycle: A)

A) Yes — enforce all PBT rules as blocking constraints
B) Partial — PBT only for pure functions and serialization round-trips
C) No — skip all PBT rules
X) Other (please describe after [Answer]: tag below)

[Answer]: A
