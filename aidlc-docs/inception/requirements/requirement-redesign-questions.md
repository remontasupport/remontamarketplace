# Requirements Redesign Questions -- filters combined with the location (2026-10-08)

Your request: every other filter must combine with the location ("gender + within 10 km of the suburb"), the
database structure assessed before any code, and the question whether each filter needs its own api.

**What is already decided and needs no answer:** the combination is one query, not one api per filter. The search
entry takes every filter as a query parameter and returns the intersection, ranked by distance and paged in the
database (requirements FR-ADM-02/03, story US-AS-02 and US-AS-06). A second entry serves the dropdown values. Two
more entries serve the user picker and the suspended list. Four entries in total, as planned.

**The database assessment** (chat answer of 2026-10-08, recorded in the audit) found the structure right for the
location, services, experience and documents, and weak but workable for gender, vehicle, worker type, age and
languages. Two decisions are yours.

## Question 1
Document filters. Today "document category = Police check" and "document status = Pending" are **independent**:
a worker matches if they have *some* document in that category and *some* document with that status, not
necessarily the same one (two separate EXISTS clauses, `api/admin/contractors/route.ts` `documentCategories`,
`documentStatuses`, `requirementTypes`). An admin looking for "workers whose police check is pending" gets workers
whose police check is approved but whose first-aid certificate is pending.

A) **Same document**: when two or more of category, status and type are selected, they apply to the **same**
`verification_requirements` row (one EXISTS with all three conditions). "Police check + Pending" means a pending
police check. Recommended: it is what the words mean; the parity script will list the rows that change.

B) **Keep today's independent semantics** (parity exact; the admin learns the quirk).

C) Other (please describe after [Answer]: tag below)

[Answer]: I don't see any document filter in the admin dashboard, can you explain this?

## Question 2
Schema changes in this cycle. The filters work on today's columns. Five are weaker than they should be:
`gender` and `hasVehicle` are free strings ("Male", "Yes"); `dateOfBirth` is a **string** (the age filter compares
text and silently drops a non-ISO value, with the integer `age` column as a fallback); the worker type lives inside
the `abn` JSON (`workerEngagementType.type`, no index); languages live in two columns (`worker_profiles.languages`
with an index, `worker_additional_info.languages` without), free text. Every one is written by `apps/app`'s
onboarding and read by other screens, so changing a type means touching the writers too.

A) **No schema change in this cycle.** The search reads today's columns with the same normalisation as today
(Title Case, the ISO guard on dates, the JSON path), which keeps parity provable; the five normalisations go on the
follow-up list for an onboarding cycle (new typed columns, backfilled, writers switched, old columns dropped).
Recommended: this cycle changes where the search runs and how the radius is computed, not the profile data.

B) **Additive indexes only**: A plus a migration adding the two indexes the filters lack (a GIN index on
`worker_services.subcategoryIds`; an expression index on the worker-type JSON path). Cheap, no writer changes; at
about 2,000 workers the gain is small today.

C) **Normalise now**: new typed columns for gender, vehicle, date of birth and worker type (plus one language
list), backfilled from today's values, `apps/app`'s writers switched, the search reading the new columns. Largest:
touches the onboarding screens and the client search; its own unit and PRs.

D) Other (please describe after [Answer]: tag below)

[Answer]: a

## Question 3 (follows your Q1 answer)
Explanation: the document filters exist only in code nobody can reach from the screen. `GET /api/admin/contractors`
accepts `documentCategories`, `documentStatuses` and `requirementTypes`; the page keeps them in its filter state,
reads them from the URL and clears them with "Clear Filters", but renders **no control** for them, and the "Apply"
button never sets them. The page also calls `GET /api/admin/filters` on every load, stores the answer in
`filterOptions`, and never reads it (`AdminDashboardClient.tsx:347,427`). So today the document filters work only
if someone types them into the URL, and the options endpoint is a wasted round trip. (The `.brd` listed them as live
because it read the route, not the screen.) What should this cycle do with them?

A) **Drop them.** The search entry takes exactly the filters the screen offers (suburb + within, name/mobile,
type of support, gender, vehicle, worker type, age, languages, therapeutic sub-categories, experience) and no
document filters; no filter-options entry; the page's dead fetch and dead state go in PR 3. Three entries remain
(search, users, suspended). Recommended: build what is used; a document-filter screen, if wanted later, gets its
entry designed with it (with the same-document semantics).

B) **Build the document filters properly in this cycle.** Keep them in the search entry with the same-document
semantics, keep the filter-options entry, and add three multi-selects (category, status, document type) to the
page's filter panel. One more screen change and a larger parity set.

C) **Keep them as they are**: URL-only in the api, same-document semantics, the options entry kept and still
unused by the page.

D) Other (please describe after [Answer]: tag below)

[Answer]: 
