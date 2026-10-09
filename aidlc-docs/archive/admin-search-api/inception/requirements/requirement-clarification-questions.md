# Requirements Clarification Questions -- admin worker search on `apps/api`

One answer needs clarifying before the requirements are written. Write the letter after the `[Answer]:` tag.

## Ambiguity 1: free-text location (Q5)
You answered Q5 with "i STILL WANT A FREE TEXT BUT WILL USE OUR WORKER LOCATIONS". I read this as: the admin keeps
typing a location freely (the autocomplete still helps, but is not required); the api resolves the text against
**our own `au_localities` table** (the same ranking the suburb box uses: name prefix, then later word, "suburb
postcode", digits = postcode), never Google; the workers come from `worker_locations`. Two cases are open.

### Clarification Question 1
When the text matches **several** localities (for example "Richmond" exists in NSW, VIC, QLD, TAS and SA; a postcode
such as "2150" covers several suburbs), what does the api do?

A) **Use the best-ranked match and say which** -- the response's `appliedFilters.location` names the locality that was
used ("Richmond NSW 2753") so the admin can see it and refine with a state or postcode. Recommended: one request,
never silent.

B) **Search around all matches** -- a worker counts if within X km of *any* locality the text matches, sorted by the
nearest of them. "2150" then means the postcode's whole area; "Richmond" means five places at once.

C) **Refuse until unambiguous** -- the api answers 400 with the candidate list and the page asks the admin to pick
one.

D) Other (please describe after [Answer]: tag below)

[Answer]: My fault, use the new localities we have

### Clarification Question 2
When the text matches **no** locality ("Queensland", a misspelling, a street address):

A) **No distance filter, said plainly** -- the search runs without the radius, the response marks
`appliedFilters.location` as unresolved, and the page shows "No suburb matched 'Queensland'; showing all". Nothing
silent.

B) **An empty result with a clear message** -- the api answers 200 with zero rows and the reason.

C) **A validation error** -- the api answers 400 "unknown location" and the page keeps the previous results.

D) Other (please describe after [Answer]: tag below)

[Answer]: 
