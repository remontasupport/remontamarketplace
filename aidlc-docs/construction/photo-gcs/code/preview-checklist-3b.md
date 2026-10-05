# Preview checklist -- PR 3b (the wizard switch), requirements §6.2

Preview: the Vercel preview of `feat/photo-gcs-wizard` (calls the staging api, revision with image `fbc6705`).
Test address: `clent.b@remontaservices.com.au` (user, 2026-10-05). Fill in as each line is run. **PR #38 was merged 2026-10-05 before results were reported here**; the production rows below still need a phone run.

| # | Check | Result | When | Notes |
|---|---|---|---|---|
| 1 | Sign in (staging-only user), a dashboard loads, an old Blob photo displays | | | |
| 2 | Photo from a phone on mobile data: progress bar visible, preview filled | | | |
| 3a | HEIC on iPhone: a JPEG arrives, upload succeeds | | | |
| 3b | HEIC on Android or desktop: the HEIC message, no `photo-tickets` request | | | |
| 4 | Full sign-up with the test address: code, account, outbox `DONE` (`PhotoUploaded`) | | | |
| 4b | `photos` = Blob URL `workers/<profileId>/<id>.jpg`; `-256.jpg` beside it | | | |
| 4c | `staging/<id>` gone from `remonta-api-photos-staging` | | | |
| 4d | Downloaded copy: no EXIF, no GPS | | | |
| 5 | Duplicate-email notice on a second attempt | | | |
| 6 | Production domain unchanged meanwhile | | | |

## Production (after merge)

| # | Check | Result | When | Notes |
|---|---|---|---|---|
| P1 | One internal sign-up from a phone; the processed copy appears | | | |
| P2 | Cloud Run request log: ticket and confirm under 300 ms; no photo route above 1.5 s | | | |
