# U1 `search-api`: business rules (2026-10-28)

## Eligibility

- **BR-E1 Client entry:** the account is ACTIVE and the profile has a first and a last name (every unsuspended worker,
  activated or not: user 2026-10-23). Unchanged.
- **BR-E2 Public entry:** activated and ACTIVE (`LISTABLE_WORKER`). Unchanged.
- **BR-E3 Default listing (client only):** with no `search`, no `location` and no `services`, only workers with a
  non-empty introduction. Unchanged. (A `location` that matches nothing still counts as "given": today's behaviour.)

## Keyword search (client only, ported as it is)

- **BR-K1** Split on spaces and commas; keep letters and digits; lower case; drop words under 2 characters and the stop
  words (today's list, unchanged); at most 5 tokens. If nothing is left, the whole trimmed text is one token.
- **BR-K2** A token is a *service* token when a category or sub-category name equals it, or (4+ characters) contains it.
  The names are read from `categories` and `subcategories` and held in memory for 1 hour (today: Redis, 1 hour).
- **BR-K3** Service token: a service's category name, `qualifications` or `uniqueService` contains it.
  Text token: first name, last name, introduction, hobbies, fun fact, the additional-info personality or fun fact
  contains it, or it is exactly one of the additional-info interests or work preferences. Case-insensitive; the
  token's `%`, `_` and `\` are matched literally.
- **BR-K4** Every token must match (AND across tokens, OR inside one).
- **BR-K5** If the names cannot be read, every token is a text token (degrade; today an error would 500).

## Services

- **BR-S1 Client:** the worker has a service whose category name is in `services`. **Public:** the slug's category name
  (unknown slugs used as given, `all` ignored). Unchanged.

## The place (FD-Q1 A)

`location` is normalised (trim, single spaces, case-insensitive). The first rule that applies decides; a rule that
finds zero or several places gives **no place** (and the next rule is not tried).

- **BR-P1 Picked suggestion** (`"Suburb, ST 1234"`, comma optional, state as in the matcher's aliases): the matcher
  `matchLegacyLocation` on the current localities of that postcode; matched → that suburb's centre.
- **BR-P2 Postcode alone** (3 or 4 digits; 3 gets a leading 0): the centre of the current localities with that
  postcode; none → no place.
- **BR-P3 Name alone, optionally with a state** ("Parramatta", "Richmond VIC"): the current localities whose search name
  equals the text (and in that state if given); exactly one → its centre.
- **BR-P4** Anything else (a city that is not a suburb, a misspelling, an ambiguous name) → no place.
- **BR-P5 No place → the search runs without a place** (no radius, newest first, no `distanceKm`), as today when Google
  finds nothing. A failure to read the localities is treated the same (degrade, logged).

## Distance

- **BR-D1** With a place: only workers with a HOME row whose point is within `within` km of the place
  (`ST_DWithin` on geography, metres). Workers without a HOME row are left out (FR-4). The searcher's radius only (Q4 A).
- **BR-D2** `distanceKm` (public only) = `ST_Distance` / 1000, rounded to 1 decimal.

## Order and paging

- **BR-O1** No place: newest profile first, then id.
- **BR-O2** With a place: nearest first, then newest first, then id (FD-Q2 A).
- **BR-O3** Count and page in the same statement (`COUNT(*) OVER()`); a page past the end returns no rows and the real
  total. Order is total, so a worker is never on two pages nor skipped while the data stand still.
