# U1 `search-api`: Functional Design plan (2026-10-28)

Inputs: requirements FR-1..FR-6, NFR-1..NFR-7; execution plan U1; inventory. Code read: the two app routes,
`admin/persistence/worker-search-sql.ts`, `locations/domain/legacy-match.ts` + `candidates.ts`,
`apps/app/src/lib/suburbs/index.ts`, the contract meta (`cacheSeconds`, `privateCacheSeconds`, `adminMeta`).

Found while reading: both search bars' suggestions already come from `au_localities` (`lib/suburbs`), and a picked
suggestion is written as `"Suburb, ST 1234"`, the exact shape `matchLegacyLocation` reads first. A picked suburb
therefore always matches one row. Only text typed without picking needs a rule (Question 1). The bars' placeholder
invites it: "City, suburb, or postcode".

## Steps

- [ ] Domain entities: the query of each entry (fields, defaults, limits), the card of each entry (today's fields).
- [ ] Business rules: eligibility per entry; the keyword rules (ported as they are); the service filters; the
      introduction rule of the default listing; the place match (Q1); the radius; order and ties (Q2); paging.
- [ ] Business logic model: request → validate → match the place → one SQL statement (filters, `ST_DWithin`, order,
      `COUNT(*) OVER()`, page) under a statement timeout → cards. The HOME join and the distance terms shared with the
      admin search (moved to one place, both use it), not copied.
- [ ] NFR design (short): rate limits per entry; `cacheSeconds: 60` (public) and `privateCacheSeconds` (client); what
      the public card may carry; the degrade path (a match or keyword-terms failure → search without that part, never
      a 500); the staging comparison script (NFR-2): suburbs × radii × both entries, old route vs new entry.
- [ ] PBT properties: the matcher never returns a suburb for text it cannot pin to one; paging covers every result
      once; the order is total (no two runs differ).

## Questions

### Question 1: Text typed without picking a suggestion
Today Google turns anything typed into a point ("Sydney", "2000", "Gold Coast"). With no Google:
A) Accept what pins down one place: a picked `"Suburb, ST 1234"`; a postcode alone (the centre of that postcode's
   suburbs); a suburb name alone when only one suburb has it (or one in the state typed). Anything else ("Gold Coast",
   "Richmond") is searched without a place, as a failed lookup is today
B) Strict: only a picked suggestion counts; any other text is searched without a place
C) A, and Google as a last resort for text that pins nothing (keeps "Gold Coast" working, keeps the Google key and its
   cost on the api)
X) Other (please describe after [Answer]: tag below)

[Answer]:

### Question 2: Ties in "nearest first"
Most workers sit at their suburb's centre, so many share one distance (everyone in Parramatta is 0 km from Parramatta).
Today the order inside a tie is whatever the database returns.
A) Nearest first, then newest first (the order a search without a place already uses)
B) Nearest first, then by first name
X) Other (please describe after [Answer]: tag below)

[Answer]:
