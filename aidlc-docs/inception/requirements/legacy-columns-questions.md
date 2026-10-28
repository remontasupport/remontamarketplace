# Requirements questions: legacy location columns, stage 1 (2026-10-28)

Map: `../legacy-columns-inventory.md`. Fill in each `[Answer]:` (a letter, or X and your words), here or in chat.

## Question 1: What the screens show for a worker with no HOME location (~69)
A) Their old city/state/postcode, until follow-up 17 places them (the readers use HOME first, then the old columns;
   stage 2 then needs those workers placed first)
B) Nothing: "Not specified" (profile) / "Australia" (cards); the readers use HOME only
X) Other

[Answer]:

## Question 2: The "location" item of profile completion
A) Complete when the worker has a HOME location (an unplaced worker sees "location missing" and fixes it by picking a
   suburb, which places them)
B) Keep today's rule (the old columns non-empty)
X) Other

[Answer]:

## Question 3: The reconciler's home placement (F1)
A) Only **create** a HOME row for a worker who has none, from the old columns (as today for the unplaced); never move
   an existing one
B) Stop it placing anyone; the unplaced wait for follow-up 17 or fix it themselves (Question 2 A)
X) Other

[Answer]:

## Question 4: Units and order (F4)
A) U3 `legacy-readers-app` (apps/app: assigned-worker cards, profile preview, profile page, admin contractor page and
   PDF) first; then U4 `legacy-readers-api` (worker profile, completion, admin lists and search, the reconciler, and
   stopping the double write), promoted after U3 is live
B) Other order (say which)

[Answer]:

## Question 5: Anything outside this repository that reads these columns? (F3)
Do n8n workflows, Zoho syncs, spreadsheets or reports read `worker_profiles.location/city/state/postalCode/latitude/
longitude` straight from the database? Stage 1 keeps them (frozen for workers who move), so this only decides stage 2.
A) No / not that I know of
B) Yes (which)
C) I need to check

[Answer]:
