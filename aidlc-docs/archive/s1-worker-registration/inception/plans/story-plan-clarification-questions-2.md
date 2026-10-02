# Story Plan — Follow-up Questions, Round 2 (bank details)

Follow-ups 1, 2a and 2b are clear. Follow-up 3 = **C** means no one sees bank details on screen; they go only to a payroll or accounting system. The stories need two more facts before they can be written.

---

### Follow-up 3.1 — Which system receives the bank details?

A) **Xero** (as a payroll employee / supplier contact record)

B) Another payroll system (please name it after [Answer]:)

C) Not decided yet

X) Other (please describe after [Answer]: tag below)

[Answer]: c

### Follow-up 3.2 — When is that integration built?

This would be a **new outbound integration** in the first release. Remember the first release keeps its date by narrowing scope (Clarification 10 = A).

A) **Later release.** In the first release, workers still enter bank details; they are stored encrypted, and **nobody** (admins included) can read them. The integration comes first in the next release. The worker can see a masked version of their own details (e.g. `BSB ***-123, account ****5678`) and replace them (Recommended)

B) **First release.** The integration is built now. The same masking rule for the worker applies. It adds scope that may threaten the date

C) First release, but as a **manual export** only: an admin downloads a file for payroll, and every export is recorded. No live connection to the payroll system

X) Other (please describe after [Answer]: tag below)

[Answer]: a
