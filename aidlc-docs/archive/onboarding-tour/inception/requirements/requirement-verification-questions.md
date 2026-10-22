# Onboarding tour: requirements questions (2026-10-21)

Please fill in each `[Answer]:` with a letter (or X and your own words). Background for each question is in
`aidlc-docs/inception/inventory/onboarding-tour-inventory.md`. Where an option is marked (recommended), that is the one
I would pick and why.

## Question 1
How should the app remember that a worker has already seen the tour?

A) On the worker's account, through `apps/api` (recommended): it shows once per worker on any phone or computer. Needs
a small api change (one field, one save, a migration), so it goes through staging and a promotion before the app.

B) In the browser only: no api change, but it shows again on a new device, a different browser, or after clearing
browser data.

X) Other (please describe after [Answer]: tag below)

[Answer]: a

## Question 2
Who sees the tour automatically?

A) Every worker, once, the next time they sign in after release (existing workers included)

B) Only workers who sign up after the release

C) Only workers whose profile is not complete yet (new or existing)

X) Other (please describe after [Answer]: tag below)

[Answer]: a

## Question 3
How does the tour start?

A) It starts by itself on the dashboard home after sign-in

B) A small welcome card asks "Take a quick tour?" with Start and "Not now" (recommended: the worker chooses, and
"Not now" counts as seen)

X) Other (please describe after [Answer]: tag below)

[Answer]: b

## Question 4
Which sidebar items are tour steps, in this order?

A) The profile-completion groups only: My Profile, Services, Compliance, Additional Credentials

B) Every item: Dashboard, My Profile, Services, Compliance, Additional Credentials, My Jobs, Account

C) The profile-completion groups, then a last step on the profile completion checklist on the dashboard home

X) Other (please describe after [Answer]: tag below)

[Answer]: c

## Question 5
When a group such as My Profile is highlighted, what does the worker see?

A) The group heading highlighted, with a short card of text next to it (what it is, why to complete it)

B) The same, and the group opens so its sections (Personal Information, Professional Information, ...) are visible

C) The same as B, plus a "Go there" button that leaves the tour and opens that page

X) Other (please describe after [Answer]: tag below)

[Answer]: a

## Question 6
Which buttons does each step have?

A) Next, Back, Skip tour; the last step says Finish (recommended)

B) Next and Skip tour only

X) Other (please describe after [Answer]: tag below)

[Answer]: a

## Question 7
Can a worker replay the tour later?

A) Yes, a "Take the tour again" link in Account

B) Yes, a small help button (?) in the dashboard header

C) No replay

X) Other (please describe after [Answer]: tag below)

[Answer]: b

## Question 8
On a phone the sidebar is hidden behind the menu button. What should the tour do there?

A) Open the menu drawer and highlight the items inside it, the same steps as on a computer (recommended)

B) Show the steps as a simple card sequence without highlighting

C) No tour on phones

X) Other (please describe after [Answer]: tag below)

[Answer]: a

## Question 9
The dashboard home already shows the profile completion checklist (and a congratulations pop-up when complete). How
should the tour fit with it?

A) The tour first; the checklist stays where it is underneath (recommended)

B) Hide the checklist until the tour is finished or skipped

X) Other (please describe after [Answer]: tag below)

[Answer]: a

## Question 10
Who writes the text on each step?

A) I draft a short title and one or two sentences per step; you review and change them

B) You supply the text

X) Other (please describe after [Answer]: tag below)

[Answer]: a

## Question 11
How should the tour be built?

A) A small component of our own on the libraries already in the app (Radix popover, Tailwind), in the brand navy; the
steps as data next to the menu declaration (recommended: no new dependency, matches the "declare it once" rule)

B) An existing tour library (for example driver.js)

X) Other (please describe after [Answer]: tag below)

[Answer]: a

## Question 12
When should the tour be released?

A) After `feat/account-app` is released, as its own small release (recommended: one change at a time, easy rollback)

B) Together with `feat/account-app`, in the same release

X) Other (please describe after [Answer]: tag below)

[Answer]: b

## Question 13
Should we record how workers use the tour (finished, skipped, at which step)?

A) No, only whether it has been seen

B) Yes, finished or skipped and the last step reached, stored with the "seen" flag

X) Other (please describe after [Answer]: tag below)

[Answer]: a

## Question: Security Extensions
Should security extension rules be enforced for this project?

A) Yes — enforce all SECURITY rules as blocking constraints (recommended for production-grade applications)

B) No — skip all SECURITY rules (suitable for PoCs, prototypes, and experimental projects)

X) Other (please describe after [Answer]: tag below)

[Answer]: a

## Question: Resiliency Extensions
Should the resiliency baseline be applied to this project?

**What this extension is.** Enabling it applies a set of **directional, design-time best practices** for building resilient systems, derived from the **AWS Well-Architected Framework (Reliability Pillar)** and resilience-review guidance. It steers requirements, design, and code toward fault tolerance, high availability, observability, and recoverability — covering 15 practice areas across business goals, change management, observability, high availability, disaster recovery, and continuous improvement.

**What this extension is NOT.** Enabling it does **not** make your workload production-ready, nor does it certify or guarantee any availability, RTO, or RPO target. It is a **starting point** that scaffolds good resiliency decisions early — it is not a substitute for a formal **AWS Well-Architected Review** of the built system.

Treat the output as a well-grounded **first draft of your resiliency posture** to build on and validate — not a finished, production-certified result.

A) Yes — apply the resiliency baseline as directional best practices and design-time guidance (recommended for business-critical workloads, as an informed starting point that you can validate and harden before go-live)

B) No — skip the resiliency baseline (suitable for PoCs, prototypes, and experimental projects where rapid iteration matters more than reliability)

X) Other (please describe after [Answer]: tag below)

[Answer]: a

## Question: Property-Based Testing Extension
Should property-based testing (PBT) rules be enforced for this project?

A) Yes — enforce all PBT rules as blocking constraints (recommended for projects with business logic, data transformations, serialization, or stateful components)

B) Partial — enforce PBT rules only for pure functions and serialization round-trips (suitable for projects with limited algorithmic complexity)

C) No — skip all PBT rules (suitable for simple CRUD applications, UI-only projects, or thin integration layers with no significant business logic)

X) Other (please describe after [Answer]: tag below)

[Answer]: a

(Last cycle's answers, for reference: Security A, Resiliency A, PBT A.)
