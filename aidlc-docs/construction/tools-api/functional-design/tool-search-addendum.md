# Tool search: functional design addendum (U1 api + U2 app, 2026-10-22)

**Request (user, verbatim):** "perfect, now on the tools, can you add a search field where in the admin can search by
word? how can we design this feature? I want the search to be accurate."
**Decisions (user, 2026-10-22):** it searches workers' listed tools **and** their own tools · a word matches
**anywhere in the text** · a **reviewed synonym list** counts as the same tool · several words must **all** match
**within one tool**, in any order.

## TS-1 One matcher, shared

`packages/schemas/src/data/serviceTools.ts` gains `TOOL_SYNONYMS` (id -> other names, below) and a pure
`toolSearchOf(text, service?)`. The admin page uses it to narrow the buttons as the admin types; the api uses the same
function to build its query. So what the page shows and what the api finds can never disagree.

## TS-2 Normalising the text (both the query and every name compared)

1. Lower-case (en-AU); hyphens, slashes and dots become spaces ("ride-on" = "ride on"); runs of spaces become one.
2. Split into words; words of one character are dropped ("a", "&"); at most 5 words; the query must keep at least one
   word (else the search box is ignored, never an error).
3. Plurals: a word ending in "ches", "shes", "xes" or "sses" loses "es" (brushes -> brush); else a word of 4+ letters
   ending in "s" (not "ss") loses the "s" (mowers -> mower, gloves -> glove). Since a match is "anywhere in the text",
   the singular still finds the plural ("glove" finds "Gloves and protective gear").

## TS-3 What matches

A **name** matches the query when **every** query word appears somewhere in it (substring, any order).

- **A listed tool matches** when its label or any of its synonyms is a matching name. Example: "gurney" matches
  Pressure washer (a synonym); "saw" matches Chainsaw (anywhere in the text); "pressure washer" matches Pressure washer.
- **A worker's own tool matches** when it is a matching name itself ("hose" finds an own tool "Garden hose"), **or**
  when it contains a full name (label or synonym) of a listed tool the query matched. Example: "pressure washer" also
  finds a worker who typed "Gurney 2000" as their own tool, because "gurney" is a name of Pressure washer.
- **A worker matches** when, on the row of a service that has a list (the "Type of support" service when it is one of
  the two; both otherwise), they ticked a matching listed tool **or** have a matching own tool.
- It combines with the ticked tools and every other filter by AND.

## TS-4 The api (`GET /v1/admin/workers`)

- New query field `toolSearch`: plain text, 1-60 characters (400 otherwise). `appliedFilters.toolSearch` echoes it
  only when given (the old app never sends it, so never receives it: N1 holds).
- The filter registry gains one row: the matcher's listed ids become `ws."toolIds" && $ids::text[]`; each own-tool
  pattern becomes `EXISTS (SELECT 1 FROM unnest(ws."otherTools") o WHERE <normalised o> LIKE '%w1%' AND ... )` with
  every word bound as a parameter and LIKE's wildcards escaped. The own tools are normalised in SQL the same way
  (lower, the punctuation replaced) before the LIKE.
- Cost: one EXISTS per worker over at most 2 rows and 5 own tools each; no index needed at today's size (N5).

## TS-5 The admin page (U2)

- In the Tools box (shown for its type of support): a search box above the buttons, "Search tools", with the hint
  "Finds the word in the tools, their other names, and tools workers added themselves."
- As the admin types, the buttons narrow to the matching listed tools, and a line shows the other names that count
  ("Also matches: gurney, pressure cleaner"). Ticking still works on the narrowed buttons.
- The text is part of the filters: sent on **Apply Filters**, kept in the URL (`toolSearch`), cleared by Clear filters
  and by changing the type of support.
- The result cards are unchanged (Q2 A).

## TS-6 Properties (PBT)

- Normalising is idempotent; the plural rule never makes a word that fails to find the word it came from.
- The page's narrowing and the api's listed-id set are the same function's output (asserted, not re-implemented).
- SQL oracle (database, CI): for random own tools and queries, the search equals the matcher run in memory.

## TS-7 Delivery

The api part is a new small PR (`feat/worker-tools-search-api`) to `main`: staging, then **promote that newer sha**
instead of `c523f53` (U1 is not promoted yet, so one promotion carries both). The page part goes on
`feat/worker-tools-app`, still merged only after the promotion.

## The synonym list to approve (TS-1)

| Tool | Other names that count as the same |
|---|---|
| Vacuum cleaner | vacuum, vac, hoover |
| Mop and bucket | mop |
| Steam mop | steam cleaner |
| Broom and dustpan | broom, dustpan, dust pan |
| Microfibre cloths | microfiber, cloths, rags |
| Cleaning products | cleaning chemicals, detergent, disinfectant |
| Eco-friendly cleaning products | eco products, green cleaning products, natural cleaning products |
| Scrubbing brushes and sponges | scrubbing brush, scrubber, sponge |
| Window cleaning kit | squeegee, window cleaner |
| Carpet cleaner | carpet shampooer, rug doctor |
| Oven and BBQ cleaning kit | oven cleaner, bbq cleaner |
| Extendable duster | duster, cobweb brush |
| Step ladder | stepladder |
| Gloves and protective gear | gloves, ppe |
| Push lawn mower | lawn mower, lawnmower, mower |
| Ride-on mower | ride on mower, rideon, mower |
| Whipper snipper | whippersnipper, line trimmer, brushcutter, brush cutter, strimmer, weed eater |
| Hedge trimmer | hedge cutter, hedger |
| Leaf blower | blower, blower vac |
| Chainsaw | chain saw |
| Pressure washer | pressure cleaner, high pressure cleaner, gurney, water blaster |
| Pruning shears and loppers | secateurs, pruners, loppers |
| Rake, shovel and garden hand tools | rake, shovel, spade, hoe, trowel |
| Wheelbarrow | barrow |
| Ladder | extension ladder |
| Trailer | box trailer |
| Power drill | drill, cordless drill |
| Hand tools | hammer, screwdriver, spanner, toolkit, tool kit |
| Gutter cleaning kit | gutter cleaner, gutter |

Note: "mower" counts for both mowers, so searching "mower" finds workers with either one.
