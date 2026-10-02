# Legacy sign-up removal -- decisions before anything is deleted

Read `legacy-signup-removal-inventory.md` first: section A is what would be deleted, B what stays, C what you accept.
Answer each question by writing the letter after the `[Answer]:` tag; say "done" when finished.

## Question 1
The form engine (`packages/form-engine`) has a general "legacy mode": a form definition may carry a `legacy` adapter
with the old rules and the old request, so a form moved onto the engine can switch back. The worker sign-up is the
only form using it today, and CLAUDE.md names it as the way the other hand-built forms move over. What should happen
to that capability?

A) **Keep the engine's legacy-mode capability; delete only the worker sign-up's use of it** (its `legacy` adapter, the
page's legacy branch, the switch, the legacy routes and helpers). Smaller, lower-risk change; the migration path for
the other forms stays. Recommended.

B) **Remove legacy mode from the engine too**: `Backend` becomes api-only, `Mode`, `LegacyAdapter` and every `legacy`
branch in `kinds.ts`, `form.ts`, `draft.ts`, `useFormWizard`, `FormWizard` and their tests go. Cleaner engine, larger
refactor, and CLAUDE.md's "Moving a legacy form over" guidance is rewritten.

C) Other (please describe after [Answer]: tag below)

[Answer]: 

## Question 2
Today, if `NEXT_PUBLIC_API_URL` or `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` is missing, the page falls back to the legacy
form. With the legacy form gone, what should the page do when the api is not configured? (Production has both
variables. Local dev has no `NEXT_PUBLIC_API_URL`, so this is what a developer sees locally without the api.)

A) **Show a short "Sign-up is temporarily unavailable" card and log the missing variable on the server.** Users never
see a broken form; a misconfigured deployment is visible in the logs. Recommended.

B) **Fail fast: the page throws**, so Next shows its error page and the deployment is obviously broken.

C) **Keep the switch as a kill switch**: `switch:registration` = `legacy` (or a new value `off`) shows the
"unavailable" card instead of the old page. Keeps an Upstash dependency for a page that no longer has two modes.

D) Other (please describe after [Answer]: tag below)

[Answer]: 

## Question 3
Deleting the legacy page removes the instant rollback for the api sign-up (Upstash key back to `legacy`). The api
went live this morning (2026-10-02 10:20Z) and the state file suggested about a week of real sign-ups before this
clean-up. Your request says to do it now.

A) **Proceed now.** Rollback becomes a Vercel promote of the previous deployment plus the api's own revision rollback.

B) **Prepare the PR now but merge it after a week of real sign-ups.**

C) Other (please describe after [Answer]: tag below)

[Answer]: 

## Question 4
Extensions for this cycle (the last cycle used Security: yes, blocking; Resiliency: yes, blocking; PBT: partial).

A) **Same as the last cycle.**

B) Security yes, Resiliency yes, PBT no (this cycle only deletes code; no pure function or serialization is added).

C) Other (please describe after [Answer]: tag below)

[Answer]: 
