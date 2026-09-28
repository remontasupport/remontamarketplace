# Story Plan — Follow-up Questions

Thank you. Q1–Q9 are clear and consistent, and so is Q12. Three of the business answers leave a gap that would change what the stories say, so each one gets a follow-up question here. Answer them the same way as before: put a letter (or your own words) after `[Answer]:`, then say "answered".

---

### Follow-up 1 — from Q10 (the stricter catalogue, `categories.json`, is the correct one)

That catalogue has **7 service lines**. The live app offers **9**. Two of the live service lines have **no entry** in the catalogue, so the system can't work out which documents those workers need:
- **Home Modifications**
- **Fitness and Rehabilitation**

Also, the catalogue calls one line **Personal Trainer**, and the live app treats that as a separate service.

What should happen to these?

A) **Map them onto the nearest catalogue line:** Home Modifications uses the **Home and Yard Maintenance** document list; Fitness and Rehabilitation *is* **Personal Trainer** (same line, one name). Existing workers keep their selection. (Recommended)

B) **Add them to the catalogue as their own lines.** The business supplies each one's required-document list before Functional Design

C) **Stop offering them.** Existing workers who chose them are asked to pick a replacement service

X) Other (please describe after [Answer]: tag below)

[Answer]: a

---

### Follow-up 2 — from Q11 (an admin can publish with documents missing, but must give a reason)

Two things aren't covered yet.

**2a. Documents an admin should not be able to override.** Some checks are legal requirements for working with NDIS participants, e.g. the **NDIS Worker Screening Check**, and the **Working with Children Check** where children are supported. Can an admin publish over *any* missing document, or are some always required?

A) **Some are always required.** 100 points of ID, NDIS Worker Screening Check, police check, right to work and (where the catalogue requires it) Working with Children Check must be approved and current. The override applies only to the rest (training modules, insurance, resume, etc.). (Recommended)

B) Any document can be overridden with a reason

C) The business supplies the list of always-required documents before Functional Design

X) Other (please describe after [Answer]: tag below)

[Answer]: a

**2b. When a document expires *after* the profile is published**, what happens?

A) **The profile stays live but is flagged.** The worker is told to upload a new one, admins see the worker in an "expired documents" list, and each admin decision is recorded. If the expired document is one of the always-required ones from 2a, the profile is **taken offline automatically** until it's replaced. (Recommended)

B) The profile always stays live; admins are alerted and decide

C) The profile is always taken offline automatically until the document is replaced

X) Other (please describe after [Answer]: tag below)

[Answer]: a

---

### Follow-up 3 — from Q13 (bank details are needed)

Today nothing reads the bank details workers enter. Now that they're needed, the stories must say **who** uses them and **how**.

A) **Admins can reveal them on the worker's page on purpose** (a "show bank details" button, not shown by default). Every reveal is recorded with who and when. Nothing else reads them. (Recommended)

B) Admins see them on the worker's page like any other field (every view still recorded)

C) Nobody sees them on screen. They are only sent to a payroll or accounting system (please name it, e.g. Xero). That would add an integration to the first release

D) Both A and C

X) Other (please describe after [Answer]: tag below)

[Answer]: c
