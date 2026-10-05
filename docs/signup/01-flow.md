# 01 — The sign-up flow

## 1. One backend

`/registration/worker` (`apps/app/src/app/registration/worker/page.tsx`) renders the form engine wizard
(`features/forms/FormWizard.tsx`), which sends every call to `apps/api` on Cloud Run (§2 below). The api is
named by two public variables, read on the server per request (`apps/app/src/lib/registration-backend.ts`):

| Variable | Production | Vercel Preview |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | the `prod` Cloud Run service | the `staging` service |
| `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` | the production v3 key | the staging key (`vercel.app`) |

If either is missing the page renders "Sign-up is temporarily unavailable" and logs which variable, instead
of a form that cannot work. There is no other sign-up path: the pre-S1 page, its routes
(`POST /api/auth/register-async`, `POST /api/auth/check-email`) and the Upstash switch `switch:registration`
were removed on 2026-10-02, after the api had served production since that morning. History:
`aidlc-docs/archive/s1-worker-registration/` and [03 §5](03-data-model.md#5-legacy-sign-up-historical).

## 2. Step by step

| # | Screen (form step) | The worker does | Call to apps/api | Writes? |
|---|---|---|---|---|
| 0 | "Welcome to Remonta" intro | Clicks Continue | — | — |
| 1 | "Where are you located?" | Types 2+ letters of a suburb or postcode, picks one | `GET /v1/localities?q=…` (debounced 300 ms, every keystroke) | no |
| 2 | "Please provide your details" | Types first name, last name, mobile | — | — |
| 2 | (same) | Types email, leaves the field | `POST /v1/registrations/worker/email-availability` | no |
| 2 | (same) | Clicks **Send code** (only if the address is available) | `POST /v1/registrations/worker/email-codes` (with a reCAPTCHA token) → a signed ticket | no (an email is sent) |
| 2 | (same) | Types the 6-digit code, clicks **Verify** | `POST /v1/registrations/worker/email-codes/verify` | no |
| 2 | (same) | Types the password (enabled only after the email is verified) | — | — |
| 3 | "What services can you offer?" | Picks services; sub-services through a dialog | `GET /v1/service-categories` (once, cached) | no |
| 4 | Photo + consent | Uploads a photo | `POST …/photo-tickets` → the browser POSTs the file straight to the bucket (a progress bar) → `POST …/photo-confirmations` → `photoUploadId` (U3; HEIC is refused on the device) | **yes**: `registration_photo_uploads` (+ the file in the bucket until the sign-up claims it) |
| 4 | (same) | Ticks the consent, clicks **Complete Signup** | `POST /v1/registrations/worker` (with a fresh reCAPTCHA token) | **yes**: everything in [03 §2](03-data-model.md#2-tables-written-by-a-sign-up) |
| 5 | `/registration/worker/success` | — | — | — |

After step 4 the account exists and can sign in at once. Emails and other follow-ups run in the
background from the outbox ([05](05-events-and-emails.md)).

### What the page keeps between visits

Nothing. The wizard keeps its progress in the tab's `sessionStorage` only: a page refresh or the offline
pause restores the step and the answers, and closing the tab or the browser deletes them, so a worker who
comes back later starts at step 1. Even within the tab the email verification (ticket and code) and the
password are never saved. Until 2026-10-02 the draft lived in `localStorage` and survived closing the
browser; an entry left by that release is deleted the first time the form loads.

### reCAPTCHA badge

Google's floating badge is hidden on every page (`app/globals.css`), and no replacement branding line is shown:
a product decision of 2026-10-02, made knowing that Google's terms ask for the "protected by reCAPTCHA" line
when the badge is hidden. reCAPTCHA itself still runs on the wizard.

### Text diagram

```
Browser (Vercel page)                         apps/api (Cloud Run)                     Postgres / Blob / Resend
---------------------                         --------------------                     ------------------------
suburb typing  ----- GET /v1/localities ----->  in-memory suburb list (from au_localities)
email blur     ----- POST email-availability ->  SELECT users (lower(email))           read
Send code      ----- POST email-codes ------->   sign ticket, send email  ------------> Resend (email)
Verify         ----- POST email-codes/verify ->  check ticket (no storage)
services step  ----- GET service-categories ->  SELECT Category + Subcategory          read
photo          ----- POST photo-tickets ------>  sign a policy (nothing stored)
               ----- POST file to the bucket --> (storage enforces key, type, size, expiry)
               ----- POST photo-confirmations -> inspect + 16 bytes, INSERT registration_photo_uploads
Complete       ----- POST /v1/registrations/worker
                                               validate, check ticket, breach check,
                                               ONE transaction ----------------------> users, worker_profiles, worker_services,
                                                                                       worker_locations, worker_onboarding,
                                                                                       worker_onboarding_transitions,
                                                                                       registration_photo_uploads (claim),
                                                                                       audit_logs, outbox_events
               <---- 202 accepted ------------
                                               outbox dispatcher (background) --------> Resend (welcome email)
```

## 3. Rules the flow guarantees

| Rule | Meaning |
|---|---|
| R1 no enumeration | The **submit** answers the same `202` for a new and an existing email; the password is hashed in both cases so timing is similar. (The availability check on step 2 does reveal existence — a deliberate decision, 2026-09-28.) |
| R2 truthful | The 202 message says the account is ready; it is. |
| R3 atomic | Every row of a sign-up commits together or not at all. |
| R4 photo claimed once | A staged photo can be used by one sign-up, within 24 h of upload. |
| R5 retry-safe | A browser retry after a commit lands in R1 (no second account, no notice email). |
| R6 email verified | The submit carries the code's ticket; the server re-checks it against the body's email before anything else. |

## 4. Where it runs

| Piece | Where |
|---|---|
| The page | Vercel, project `remonta-app` |
| apps/api staging | `https://remonta-api-staging-154148201608.australia-southeast1.run.app` (Cloud Run, project `remonta-api-510206`), database = Neon branch `rehearse-w1` |
| apps/api production | Cloud Run service `remonta-api` — **not deployed yet** |
| Deploys | Merge to `main` → GitHub Actions `deploy-api` → staging. Production only by a manual promotion (`workflow_dispatch`, stage = prod). |
