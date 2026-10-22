# worker-tools: requirement questions (2026-10-22)

Your request: *"I want to add a lists of a cleaning tools and yard and maintenance tools to the worker's dashboard if
their services have cleaning and yard and maintenance"*. Background: `../inventory/worker-tools-inventory.md`.

Fill in each `[Answer]:` with a letter (or write your own after X). Answer in chat if easier.

## Question 1: What is the list for?
A) A checklist: the worker ticks the tools **they own / can bring**, and it is saved to their profile
B) Information only: a list of tools the worker is **expected to bring** (nothing to tick, nothing saved)
C) Both: the expected list shown, and the worker ticks which ones they have
X) Other (please describe after [Answer]: tag below)

[Answer]: 

## Question 2: Where on the dashboard?
A) Inside the existing Services step for each service (Services → Cleaning Services / Home and Yard Maintenance), under the certificate upload
B) A new item of its own in the sidebar ("My Tools"), shown only when either service is chosen
C) A card on the Dashboard home page
X) Other (please describe after [Answer]: tag below)

[Answer]: 

## Question 3: Which tools are on each list?
A) You will send the two lists
B) Draft them for me to approve (e.g. Cleaning: vacuum, mop and bucket, steam mop, cleaning chemicals, microfibre cloths, carpet cleaner...; Yard: lawn mower, whipper snipper, hedge trimmer, leaf blower, ladder, hand tools, trailer...)
X) Other (please describe after [Answer]: tag below)

[Answer]: 

## Question 4: Can the worker add a tool that is not on the list?
A) No, the fixed list only
B) Yes, an "Other" free-text entry as well
X) Other (please describe after [Answer]: tag below)

[Answer]: 

## Question 5: Who else sees the worker's tools? (if the list is saved)
A) Only the worker
B) Also admins on the worker's admin page
C) Also admins, and as a filter in the admin worker search ("has a lawn mower")
D) Also clients, on the worker's public / shared profile
X) Other (several letters are fine)

[Answer]: 

## Question 6: Does it count toward profile completion?
A) No, optional
B) Yes: at least one tool ticked for each of the two services the worker offers
X) Other (please describe after [Answer]: tag below)

[Answer]: 

## Question 7: When the worker removes the service, what happens to its ticked tools?
A) They are deleted with the service (as documents are today)
B) They are kept, in case the service is chosen again
X) Other (please describe after [Answer]: tag below)

[Answer]: 

## Question 8: Should the sign-up form ask about tools too?
A) No, the dashboard only
B) Yes, also at sign-up when either service is picked
X) Other (please describe after [Answer]: tag below)

[Answer]: 

## Question: Security Extensions
Should security extension rules be enforced for this project? (Last cycle: A.)

A) Yes — enforce all SECURITY rules as blocking constraints (recommended for production-grade applications)

B) No — skip all SECURITY rules (suitable for PoCs, prototypes, and experimental projects)

X) Other (please describe after [Answer]: tag below)

[Answer]: 

## Question: Resiliency Extensions
Should the resiliency baseline be applied to this project? (Last cycle: A; SLA 99.9 %, RTO ≤ 30 min, RPO ≤ 5 min, single region.)

**What this extension is.** Enabling it applies a set of **directional, design-time best practices** for building resilient systems, derived from the **AWS Well-Architected Framework (Reliability Pillar)** and resilience-review guidance. It steers requirements, design, and code toward fault tolerance, high availability, observability, and recoverability — covering 15 practice areas across business goals, change management, observability, high availability, disaster recovery, and continuous improvement.

**What this extension is NOT.** Enabling it does **not** make your workload production-ready, nor does it certify or guarantee any availability, RTO, or RPO target. It is a **starting point** that scaffolds good resiliency decisions early — it is not a substitute for a formal **AWS Well-Architected Review** of the built system.

Treat the output as a well-grounded **first draft of your resiliency posture** to build on and validate — not a finished, production-certified result.

A) Yes — apply the resiliency baseline as directional best practices and design-time guidance (recommended for business-critical workloads, as an informed starting point that you can validate and harden before go-live)

B) No — skip the resiliency baseline (suitable for PoCs, prototypes, and experimental projects where rapid iteration matters more than reliability)

X) Other (please describe after [Answer]: tag below)

[Answer]: 

## Question: Property-Based Testing Extension
Should property-based testing (PBT) rules be enforced for this project? (Last cycle: A.)

A) Yes — enforce all PBT rules as blocking constraints (recommended for projects with business logic, data transformations, serialization, or stateful components)

B) Partial — enforce PBT rules only for pure functions and serialization round-trips (suitable for projects with limited algorithmic complexity)

C) No — skip all PBT rules (suitable for simple CRUD applications, UI-only projects, or thin integration layers with no significant business logic)

X) Other (please describe after [Answer]: tag below)

[Answer]: 
