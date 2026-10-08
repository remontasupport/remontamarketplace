# Instant Search Design -- questions (2026-10-08)

Your requirement, verbatim: "As much as possible, I don't want the admin to call the api every requests, or query
every request, if the most common filter is called, I want the return to be instant, this will help us reduce the
api cost and will help the return to be fast."

## The design in one page

**Three layers, each removing a round trip.**

```
Admin's browser                         apps/api (Cloud Run)                       Neon (PostGIS)
----------------------------------      ---------------------------------------    ---------------------
WORKER SNAPSHOT in memory               WORKER DIRECTORY in memory                 worker_profiles, users,
(slim row per active worker,            (the same rows, loaded at boot,            worker_locations (HOME),
 ~2,000 rows, ~150 KB gzipped)          refreshed by a watermark check             au_localities, worker_services,
                                         every 30 s; full reload only when          worker_experience,
every filter change, radius, sort,      something changed; ETag = content hash)    worker_additional_info
page: computed HERE, 0 requests
                                        GET /v1/admin/workers/snapshot
revalidate: on page focus, every        If-None-Match -> 304 (a few bytes)         ONE query per actual change
2 min, after an admin action            or 200 + the new snapshot                  (not per search, not per
(If-None-Match; 304 = nothing to do)    served from memory, no database call        admin, not per filter)
```

1. **Browser snapshot.** When the dashboard opens, it fetches one slim snapshot of every active worker (the
   columns the list shows plus the home coordinates and the filter attributes) with the token. From then on,
   every filter change, the suburb and distance, the sort and the paging are computed in the browser: **zero
   requests, instant**. The "most common filter" and the rarest one cost the same: nothing.
2. **Api directory.** The api keeps the same rows in memory (the pattern `LocalityDirectory` already uses for the
   15,467 suburbs). It checks a watermark (the latest `updatedAt` across the tables that feed a row) every 30 s
   with one cheap query and reloads only when something changed. The snapshot entry serves from memory with an
   ETag; a browser that already has that version gets a 304. **The database is queried once per change, not once
   per search.** The search entry (`searchWorkers`) stays for server-side callers (the parity script, a future
   mobile app) and is served from the same directory: no database call either.
3. **Revalidation.** The page revalidates on focus, every 2 minutes, and right after an admin action (suspend,
   publish) with a conditional request; a 304 costs a few bytes. A "updated 40 s ago" indicator with a refresh
   button makes freshness visible.

**What stays from the approved design.** The token (U1) protects the snapshot and search entries; `worker_locations`
and `au_localities` remain the only source of coordinates (the directory is built from the HOME rows, so the
accuracy wins stand: our own suburb table, no Google, no silent fallback, no hidden cap, unmapped workers counted);
the filter registry, the normalisation rules and the parity script stand; the cut-over order stands.

**What changes.** The radius is no longer computed by PostGIS per request: it is a geodesic distance computed from
the same centroids in the browser (and in the api's directory for the search entry). The difference between the
geodesic formula and PostGIS's spheroid is under 0.3 % (tens of metres at 10 km); PostGIS stays as the oracle in
the property tests. Requirements FR-GEO-02/03 and NFR-01 are amended accordingly; new requirements cover the
snapshot, the directory, freshness and the snapshot's content.

**Cost.** Today: one Google geocode (cached), two Prisma queries and a Redis round trip per search. Proposed: one
snapshot per admin session (~150 KB gzipped, a few hundred ms once), 304s thereafter, and in the api one watermark
query every 30 s plus a reload per actual change (a few per day). Neon compute time per admin search goes to zero;
Cloud Run cost is unchanged (the instance is always on by design).

**Scale.** About 2,000 active workers today. At 20,000 the snapshot is ~1.5 MB gzipped and the browser filtering is
still instant; beyond that the page would switch to the server-side search entry (same directory, still no
database per request) with paging, which is why that entry is kept.

**Privacy.** The snapshot holds what the admin list already displays (names, mobile, email, suburb, attributes).
It lives in the page's memory only, never in browser storage, and only behind an admin token; it is discarded
when the tab closes.

## Question 1
Where "instant" comes from.

A) **Browser snapshot + api directory** (the three layers above). Every filter, radius, sort and page is local;
the api serves the snapshot from memory; the database sees one query per change. Recommended.

B) **Api directory only.** Each filter change is one api call answered from memory in a few milliseconds, no
database; the page stays a thin client. Simpler page, more requests (one per change), never a database per search.

C) **Caches only.** Keep the per-request PostGIS search and add a private HTTP cache (ETag, `max-age` 60 s) plus an
api-side memo of recent responses. Repeats are instant; every new filter combination is still a query.

D) Other (please describe after [Answer]: tag below)

[Answer]: c

## Question 2
Freshness of the snapshot (how stale may the admin's list be).

A) **About a minute**: the api checks the watermark every 30 s; the page revalidates on focus, every 2 minutes and
after an admin action; an "updated N s ago" indicator with a refresh button. Recommended.

B) **Near real time**: the api checks every 5 s and the page revalidates every 30 s. More 304 traffic; still no
database per search.

C) **Manual only**: the page loads the snapshot once; the admin presses refresh.

D) Other (please describe after [Answer]: tag below)

[Answer]: a

## Question 3
What a snapshot row contains.

A) **The list's columns plus the filter attributes**: id, names, mobile, email, gender, age (computed), vehicle,
worker type, languages, services (ids), therapeutic sub-category ids, experience domains, home suburb label and
coordinates, precision, travel radius, created/updated, photo URL. Introduction and experience text stay on the
detail page (already a separate screen). Recommended: small, and nothing the list does not show.

B) **Everything today's row returns**, introduction and experience text included (roughly three times the size).

C) Other (please describe after [Answer]: tag below)

[Answer]: a

## Question 4
The server-side search entry (`searchWorkers`).

A) **Keep it, served from the directory** (no database per request): the parity script uses it, a future mobile
app or a larger worker base can page through it, and the browser falls back to it if the snapshot ever gets too
big. Recommended.

B) **Drop it**: only the snapshot entry exists; the parity script compares the old route with the browser's own
filtering logic run in Node.

C) Other (please describe after [Answer]: tag below)

[Answer]: a
