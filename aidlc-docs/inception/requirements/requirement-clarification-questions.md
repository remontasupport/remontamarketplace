# Requirement Clarification Questions: worker-profile-api (2026-10-09)

Three answers in `requirement-verification-questions.md` need a second pass before the requirements can be written.
Fill in the letter after each `[Answer]:` tag; choose Other and describe when nothing fits.

## Ambiguity 1: the home address (Q8, "two addresses to their profile")

You wrote: the worker inputs their **home address**, so the profile has two addresses: the **service area** address
from the sign-up, and the home address.

What the code holds today, so the options are concrete:

- The sign-up suburb is one `worker_locations` row of kind `HOME` (the schema's name for it), precision `LOCALITY`,
  with `travelRadiusKm` (50 by default). The admin search's radius uses it. This is what you call the service area.
- The schema also has kind `SERVICE_AREA` and precision `ADDRESS`, but nothing writes either yet.
- The legacy columns on `worker_profiles` (`location`, `city`, `state`, `postalCode`, `latitude`, `longitude`) are what
  the **client search and the public list** still read. The api dual-writes them from the sign-up suburb. Today's
  dashboard address editor overwrites them with the street address (Google-geocoded), so editing the address today
  moves the worker in the client search.

### Clarification Question 1
What is the home address for?

A) Private: shown to the worker and to admins (contracts, compliance paperwork, records); never used by any search
or radius. The service area stays the only search input.

B) Also the search point: searches should measure from the home address rather than the service-area suburb.

C) Other (please describe after [Answer]: tag below)

[Answer]: A (given in chat, 2026-10-09: "ahh, yeah letter A")

### Clarification Question 2
How is the home address captured and stored?

A) A street line plus a suburb picked from `au_localities` (the api's suburb autocomplete; state and postcode come
with the suburb). Stored on the worker profile as new columns (street line + locality id). No geocoding. The legacy
columns are not touched: the service area keeps owning them.

B) The same input, but stored as a second `worker_locations` row (a new kind value, precision `ADDRESS`), with the
suburb's point, so it can be searched later if wanted. The legacy columns are not touched.

C) Free text geocoded with Google, as today, stored in the legacy columns (keeps today's behaviour: the home address
moves the worker in the client search).

D) Other (please describe after [Answer]: tag below)

[Answer]: A (given in chat, 2026-10-09: "ALL answers are A")

### Clarification Question 3
Can a worker change their **service area** (the sign-up suburb and the travel radius) from the dashboard?

A) Yes: a "Service area" section in Edit Profile (suburb from the list + radius 1-500 km), written through the api's
`placeHome` path, which dual-writes the legacy columns. This is the one path that moves a worker in the searches,
and it lets the 69 unplaced workers place themselves.

B) No: the service area is set at sign-up and changed by admins only (the admin set-suburb control stays a
follow-up).

C) Other (please describe after [Answer]: tag below)

[Answer]: A (given in chat, 2026-10-09: "ALL answers are A")

## Ambiguity 2: impersonation (Q10, "We can ignore this for now")

### Clarification Question 4
Which reading is right?

A) No special rule in this cycle: an admin impersonating a worker can read and write the worker's profile exactly as
the worker can. Nothing is built; the api's pipeline already records `impersonatorId` on every log line.

B) Something else (please describe after [Answer]: tag below).

[Answer]: A (given in chat, 2026-10-09: "ALL answers are A")

## Ambiguity 3: the sidebar (Q11, "Dashboard, Edit Profile (move the Personal Info to edit profile) Edit Services, then Mandatory and so on")

### Clarification Question 5
What does the **Edit Profile** menu hold?

A) One dropdown: the five Personal Info steps first (Your name, Profile photo, Your bio, Address, Other personal
info), then the present Edit profile sections (Preferred hours, Experience, and the additional-details group: Bank
account, Work history, Education, Good to know, Languages, Cultural background, Religion, Interests, About me,
Preferences, Personality). One page family behind one menu.

B) The dropdown holds only the five Personal Info steps; the present Edit profile page (hours, experience, additional
details) is reached by clicking the "Edit Profile" heading itself.

C) Other: write the sub-items in order after the [Answer]: tag.

[Answer]: A (given in chat, 2026-10-09: "ALL answers are A")

### Clarification Question 6
"Then Mandatory and so on": after Dashboard, Edit Profile, Edit Services, the rest keeps today's order: Mandatory,
Trainings, My Services, Additional Credentials, My Jobs, Account?

A) Yes.

B) No: write the order after the [Answer]: tag.

[Answer]: A (given in chat, 2026-10-09: "ALL answers are A")

## Noted, not asked

- **Q1 = B with Q15 = A.** The two routes that send per-user document lists under a public cache header stay as they
  are until the Mandatory/Trainings unit replaces them. The Security Baseline (blocking) will carry this as an
  accepted open item with that unit named as its fix. If you change your mind, the hotfix is two lines.
- **Q6 = A and Q16 = A.** The capacity target (10,000 workers active over an hour, proven by a staging load test)
  is recorded as an acceptance gate of the cycle, not as a change to the resiliency targets.
