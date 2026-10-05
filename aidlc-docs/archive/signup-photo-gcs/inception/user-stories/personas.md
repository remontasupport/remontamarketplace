# Personas -- sign-up photo on Google Cloud Storage

**Sources:** `story-generation-plan.md` (Q2 A: reuse S1's personas by reference, add one system actor and two
worker variations); S1's `personas.md` (archive `s1-worker-registration/inception/user-stories/`).

## Reused by reference

| Persona | From S1 | What they do in this cycle |
|---|---|---|
| **P1 Worker** | A support worker, cleaner, gardener, nurse, therapist or trainer signing up without help, usually on a phone | Picks a profile photo during sign-up, watches it upload while finishing the form, and submits |
| **P2 Administrator** | Remonta staff who review workers and publish profiles | Sees the processed photo on the worker's record and in the admin list; sees old photos unchanged |
| **S1 `apps/app`** | The Next.js application | Renders the wizard, runs the shrink step and the direct upload, displays stored photo URLs |

## Added for this cycle

### S4 -- `apps/api` (system actor)

> *"Hand out a ticket, check what arrived, clean it up, and never carry the bytes."*

| | |
|---|---|
| **Who** | The NestJS service on Cloud Run in Sydney, the sign-up's only backend |
| **Does** | Issues upload tickets bound to one key, type and size; confirms an upload by inspecting the object; claims the photo into the profile; processes it in the background through the outbox; purges what is never used; keeps the pre-switch Blob rows tidy; logs each stage with the request id |
| **Never** | Receives the photo's bytes on the request path; logs a ticket signature, an IP, or file content; serves a photo itself |

### S5 -- Operator (Remonta support, the person reading alerts)

| | |
|---|---|
| **Who** | Whoever receives `support@remontaservices.com.au`: today the product owner |
| **Does** | Reads Cloud Monitoring emails; expects an alert to mean something is wrong, not that one upload was slow; applies corrected policies |

## Worker variations called out in acceptance criteria

| Variation | Why it matters |
|---|---|
| **V7 -- Phone on mobile data, in-app browser** | The production slow uploads came from an iPhone inside the Facebook in-app browser on mobile data. Upload time is the person's bandwidth to Sydney; progress must be visible; a dropped connection must retry; leaving the step must not leave a half-upload that later blocks submit |
| **V8 -- HEIC source** | (a) iPhone or iPad: Safari and every in-app browser hand over JPEG once HEIC is absent from the accept list, so the person never sees a HEIC message. (b) Android phones that shoot HEIC, and desktops with a copied phone photo: the browser cannot decode it, the shrink step returns it unchanged, and the person must be told exactly what to do. (c) Mac Safari: decodes HEIC, so the shrink step turns it into a JPEG silently |
| **V6 (from S1) -- Existing worker at switch-over** | Reframed here as "upload staged just before the switch": a person who picked a photo minutes before the promotion and submits minutes after must still complete |
