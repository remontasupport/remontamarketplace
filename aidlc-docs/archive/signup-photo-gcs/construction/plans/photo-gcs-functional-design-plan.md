# Functional Design Plan -- unit `photo-gcs` (U3)

**Inputs:** requirements FR-01..FR-13, FR-16..FR-20, NFR-05..NFR-11; stories US-PH-01..16; application design
(components C1-C18, decisions AD-1..AD-10, flows S-A..S-G). Scope: the sign-up path only.

Three decisions are open after Application Design. Each is pre-filled with a proposal; leave or change the letter
and say "approved" (or "done").

## Question 1
The retry budget of `stagePhoto` (engine, C4) when the direct upload or the confirm fails.

A) **Two tries on the same ticket, then one fresh ticket.** Transport failure or a 5xx from storage: retry the
upload with the same ticket, with the engine's back-off, up to two more times while the ticket is alive. A confirm
answering 409 (object missing) is treated the same way. If the ticket has expired, or the retries on it are spent,
ask for a fresh ticket once and repeat; the abandoned `PENDING` row is left for the purge. 429 from the api honours
`Retry-After` as today. When the budget is spent the field shows "Your photo could not be uploaded. Please try
again or choose another photo." and the person's next pick starts clean. Recommended: survives a dropped mobile
connection without ever looping.

B) **Retries on the same ticket only**; when it expires the person is asked to pick the photo again (no automatic
fresh ticket). Simpler engine; a slow connection may hit the ten-minute wall.

C) Other (please describe after [Answer]: tag below)

[Answer]: A -- proposed

## Question 2
What confirm does with the size the browser declared when asking for the ticket (`sizeBytes`).

A) **Informational.** Storage already enforced the 5 MB cap through the policy; confirm records the object's real
size and type on the row and ignores the declared value except for logging a mismatch. Recommended: the declared
size exists to size the policy's range, not as a promise.

B) **A promise.** Confirm rejects (415) an object whose real size differs from the declared size by more than a
small tolerance, deleting it. Stricter; penalises browsers that re-encode between ticket and upload.

C) Other (please describe after [Answer]: tag below)

[Answer]: A -- proposed

## Question 3
The profile's photo between claim and the end of processing. The staging prefix is private (AD-9), so the uploaded
copy's URL cannot be shown; the processed copy appears a few seconds later.

A) **A short gap, and a safe fallback.** At claim the profile's `photos` stays empty and the row records the staged
key; the processing handler sets `photos` to the processed URL, normally within seconds. If processing fails
permanently (undecodable bytes), the handler copies the original object as it is to the public prefix and points
the profile at that, so the account never ends without a photo; the dead-letter alert still fires. Recommended:
nothing unverified or unprocessed is ever public by default, and the gap is shorter than any admin's reaction time.

B) **The staging prefix readable too**, so the profile shows the uploaded copy immediately as the requirements
first said. Simpler flow, but an unconfirmed object is reachable by anyone who knows its random key until the
purge, and metadata-bearing originals are public for a while.

C) **Process synchronously inside the registration request** (no gap). Adds the processing time to the sign-up
and couples the request path to `sharp` and the bucket, which the whole design avoids.

D) Other (please describe after [Answer]: tag below)

[Answer]: A -- proposed

## Fixed by earlier decisions (not questions)

- States and transitions: `PENDING` -> `STAGED` (confirm ok) | `REJECTED` (confirm failed); `STAGED` -> `CLAIMED`
  (registration); `PENDING`/`STAGED`/`REJECTED` -> deleted (purge). No other transition.
- The byte sniffer decides type everywhere; the declared content type only sizes the policy and must be one of the
  three accepted values.
- HEIC: refused before any network call on the device when detectable; refused by confirm (415) otherwise.
- Processing output: JPEG quality 85, longest edge 1600 px, never enlarged, orientation applied, every metadata
  block removed; thumbnail 256 px longest edge, same rules.
- Purge windows: `PENDING` after the ticket's 10 minutes; `REJECTED` at the next run; `STAGED` after 24 h.
- Rate limits: ticket 10/h per IP and 300/h global (the old entry's); confirm 30/h per IP and 1000/h global.

## Execution checklist

- [x] 1. Confirm the three answers; resolve any ambiguity in a clarification file
- [x] 2. `aidlc-docs/construction/photo-gcs/functional-design/domain-entities.md`: the upload row, its states,
  keys and URLs; the outbox event; what the profile holds
- [x] 3. `business-rules.md`: ticket rules, confirm decision table, claim rules, processing rules, purge rules,
  the error map (api status -> engine message -> field state), the retry budget
- [x] 4. `business-logic-model.md`: the algorithms step by step (ticket, confirm, claim, process, purge,
  `stagePhoto`), idempotence arguments, and the PBT-01 "Testable Properties" section per component
- [x] 5. `frontend-components.md`: the wizard's photo field, the uploader hook, progress state, the HEIC path,
  the shared component's new props, the engine's `Uploader` port
- [x] 6. Present for approval
