# 02 — API reference (apps/api, sign-up endpoints)

All endpoints are defined once in `packages/api-contract/src/registration.contract.ts`; the server,
the typed browser client and `openapi.json` are all generated from that file.

## 1. Base URLs

| Stage | Base URL |
|---|---|
| Staging | `https://remonta-api-staging-154148201608.australia-southeast1.run.app` |
| Production | not deployed yet (Cloud Run service `remonta-api`) |
| Local | `http://127.0.0.1:4000` (see CLAUDE.md, "apps/api") |

Every endpoint is under `/v1/`. The bare base URL answers `404 NOT_FOUND` by design.

## 2. Errors

Every error, from every endpoint, has one shape (`packages/api-contract/src/errors.ts`):

```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "a generic message",
    "requestId": "0394a301-8e58-403c-bccc-5d4b07396035",
    "fields": { "email": ["Please enter a valid email address"] }
  }
}
```

- `fields` appears **only on 400**: messages per field, written for the worker to read.
- `message` is generic; details go to the server log under the same `requestId` (also in the `x-request-id` header).
- `429` and `503` carry a `Retry-After` header (seconds).

| Status | `code` | When |
|---|---|---|
| 400 | `INVALID_REQUEST` | Input fails validation, or a business rule refuses it (see each endpoint) |
| 401 | `UNAUTHENTICATED` | Not used by sign-up (all sign-up endpoints are public) |
| 403 | `FORBIDDEN` | reCAPTCHA refused the request; or a request that is not HTTPS |
| 404 | `NOT_FOUND` | Unknown path |
| 409 | `CONFLICT` | Not used by sign-up |
| 413 | `PAYLOAD_TOO_LARGE` | Body over the endpoint's limit; photo over 5 MB |
| 415 | `UNSUPPORTED_MEDIA_TYPE` | Photo not multipart, wrong declared type, or bytes that are not an image |
| 429 | `RATE_LIMITED` | A rate limit was hit (see §3) |
| 500 | `INTERNAL` | Unexpected failure; also the email provider refusing a send |
| 503 | `UNAVAILABLE` | Overloaded (load shedding), database down, reCAPTCHA or email provider unreachable |

### The pipeline every request goes through, in order

1. Request id, security headers, CORS allow-list, HTTPS only, load shedding
2. Body size limit
3. Rate limits (per IP, global) — **fail closed**
4. reCAPTCHA v3, on the two endpoints that need it — **fail closed**
5. Authentication (skipped: every sign-up endpoint is public) and per-user limits
6. Role policy (skipped: public)
7. Input validation (strict: unknown fields are refused)
8. Handler
9. Output checked against the contract
10. Audit enforcement (the submit must write its audit row)
11. Error mapping to the shape above

### CORS

Only browser origins on the allow-list may call the api: staging allows `https://*.vercel.app` (Vercel
previews); production will allow `https://app.remontaservices.com.au` only.

## 3. Summary table

| # | Method | Path | Purpose | reCAPTCHA action | Rate limit (per IP / global) | Cache | Max body |
|---|---|---|---|---|---|---|---|
| 4.1 | GET | `/v1/localities` | Suburb autocomplete | — | 120/min / 6000/min | 1 h | 1 KB |
| 4.2 | GET | `/v1/service-categories` | Services list | — | 60/min / 3000/min | 5 min | 1 KB |
| 4.3 | POST | `/v1/registrations/worker/email-availability` | Is this email free? | — | 60/h / 6000/h | — | 1 KB |
| 4.4 | POST | `/v1/registrations/worker/email-codes` | Email a 6-digit code | `worker_email_code` | 10/h / 1000/h | — | 4 KB |
| 4.5 | POST | `/v1/registrations/worker/email-codes/verify` | Check the code | — | 30/h / 5000/h | — | 1 KB |
| 4.6 | POST | `/v1/registrations/worker/photo` | Stage the profile photo | — | 10/h / 300/h | — | 5 MB |
| 4.7 | POST | `/v1/registrations/worker` | Create the account | `worker_register` | 5/h / 500/h | — | 16 KB |
| — | GET | `/v1/health` | Liveness (Cloud Run probe) | — | 60/min | — | 1 KB |

## 4. Endpoints

### 4.1 `GET /v1/localities` — suburb autocomplete

| Parameter | In | Type | Rules |
|---|---|---|---|
| `q` | query | string | Trimmed, inner spaces collapsed; 2–60 characters after that (raw max 200). Prefix match on suburb or postcode. |

**200**

```json
{ "localities": [
  { "id": 5410, "suburb": "Parramatta", "state": "NSW", "postcode": "2150", "label": "Parramatta NSW 2150" }
] }
```

| Field | Type | Notes |
|---|---|---|
| `id` | integer | `au_localities.id` — this is what the submit sends as `localityId` |
| `suburb` | string | |
| `state` | `NSW` `VIC` `QLD` `WA` `SA` `TAS` `ACT` `NT` `OT` | |
| `postcode` | string, 4 digits | |
| `label` | string | What the dropdown shows |

At most 10 results; current (not retired) suburbs only. Errors: 400 (`q` too short/long), 429.
Reads: an in-memory copy of `au_localities` (no per-request database query).

### 4.2 `GET /v1/service-categories` — services list

No parameters.

**200**

```json
{ "categories": [
  { "id": "support-worker", "name": "Support Worker", "requiresQualification": false,
    "subcategories": [ { "id": "…", "name": "Personal care", "requiresRegistration": null } ] }
] }
```

| Field | Type | Notes |
|---|---|---|
| `categories[].id` | string | `Category.id` — sent back in the submit's `services` |
| `categories[].name` | string | |
| `categories[].requiresQualification` | boolean | Used for the card description |
| `subcategories[].id` | string | `Subcategory.id` — sent back in `supportWorkerCategories` |
| `subcategories[].name` | string | |
| `subcategories[].requiresRegistration` | string or null | e.g. a registration body's name; used for the card description |

Order: Support Worker, Support Worker (High Intensity), Cleaning Services, Home and Yard Maintenance,
Therapeutic Supports, Nursing Services, then the rest by name. Sub-categories by name.
Reads: `Category`, `Subcategory`.

### 4.3 `POST /v1/registrations/worker/email-availability` — is this email free?

Body (JSON):

| Field | Type | Rules |
|---|---|---|
| `email` | string | Trimmed and lower-cased; a valid address, max 254 characters |

**200** `{ "available": true }` — `false` when an account already uses the address (case-insensitive).

Errors: 400 (invalid email), 429. Reads: `users` (one indexed lookup on `lower(email)`).
Reveals whether an account exists — a deliberate decision (2026-09-28); bounded by 60 an hour per IP.

### 4.4 `POST /v1/registrations/worker/email-codes` — email a code

Body (JSON):

| Field | Type | Rules |
|---|---|---|
| `email` | string | As in 4.3 |
| `captchaToken` | string | reCAPTCHA v3 token for action `worker_email_code`, 1–4096 characters |

**202** — a signed ticket; **nothing is stored on the server**:

```json
{ "token": "64 hex characters", "expiresAt": 1790825000000 }
```

| Field | Type | Notes |
|---|---|---|
| `token` | string, 64 hex | HMAC-SHA256 of `email:code:expiresAt` |
| `expiresAt` | integer | Epoch milliseconds; 10 minutes after the send |

The same 202 for any address. The email subject is "`<code>` is your Remonta verification code"
(sender `noreply@remontaservices.com.au`; it can land in Spam). A retried request with the same ticket does
not send a second copy.

Errors: 400, 403 (reCAPTCHA refused), 429, 500 (provider refused the send), 503 (provider unreachable,
`Retry-After: 30`; or reCAPTCHA unreachable).

### 4.5 `POST /v1/registrations/worker/email-codes/verify` — check the code

Body (JSON):

| Field | Type | Rules |
|---|---|---|
| `token` | string | 64 hex characters, from 4.4 |
| `expiresAt` | integer | From 4.4 |
| `email` | string | The same address |
| `code` | string | 6 digits; spaces allowed while typing (removed) |

**200** `{ "verified": true }`

Errors: 400 with `fields.code`:

| Case | Message |
|---|---|
| Expired | "This code has expired. Please request a new one." |
| Wrong code | "That code is not right. Please check the email and try again." |

Also 429. Nothing is stored; the browser keeps the ticket and the code and sends them with the submit
(`emailVerification`), where they are checked again.

### 4.6 `POST /v1/registrations/worker/photo` — stage the profile photo

Body: `multipart/form-data` with exactly one file field.

| Field | Type | Rules |
|---|---|---|
| `photo` | file | Max 5 MB. Declared type `image/jpeg`, `image/png`, `image/webp` or `image/heic`, **and** the bytes must be one of those (checked by content, not by name). |

**201** `{ "photoUploadId": "uuid" }` — never a URL.

The file is stored in Vercel Blob as `workers/registration/<uuid>.<ext>`; a row goes into
`registration_photo_uploads` ([03 §2.8](03-data-model.md#28-registration_photo_uploads)). The uploader's IP
is stored only as a keyed hash. An upload not used by a sign-up within 24 h can no longer be claimed and
is purged by a scheduled job.

Errors: 400 (other fields or files), 413 (over 5 MB), 415 (not multipart, wrong type, or bytes not an
image: "Please upload a JPEG, PNG, WebP or HEIC photo"), 429.

### 4.7 `POST /v1/registrations/worker` — create the account

Body (JSON, strict — unknown fields are refused):

| Field | Type | Required | Rules (as validated; the stored value is the normalised one) |
|---|---|---|---|
| `localityId` | integer | yes | Positive; an `au_localities.id` from 4.1. Server: must exist and not be retired. |
| `firstName` | string | yes | Trimmed, spaces collapsed; 1–50 characters; letters (any script), spaces, `'` `’` `-` only; at least one letter |
| `lastName` | string | yes | Same as `firstName` |
| `email` | string | yes | Trimmed, lower-cased, valid, max 254 |
| `emailVerification` | object | yes | `{ token, expiresAt, code }` from 4.4 / 4.5. Server: re-checked against `email`. |
| `mobile` | string | yes | An Australian mobile in any common form (`04xx xxx xxx`, `+61 4xx…`, `614…`, with spaces/dots/dashes/brackets). **Stored as E.164**, `+614XXXXXXXX`. |
| `password` | string | yes | 8–128 characters with upper case, lower case, a digit and one of `@!#$%^&*(),.?":{}\|<>`. Server: also refused if it appears in a known data breach (Have I Been Pwned range check). |
| `services` | string[] | yes | 1–10 `Category` ids, no duplicates. Server: each must exist. |
| `supportWorkerCategories` | string[] | no | Up to 30 `Subcategory` ids, no duplicates. Server: each must belong to one of `services`. |
| `photoUploadId` | uuid | yes | From 4.6. Server: unused and less than 24 h old. |
| `consentProfileShare` | `true` | yes | Must be exactly `true` |
| `consentWordingVersion` | string | yes | Must be exactly `worker-profile-share-v1` (the wording currently shown) |
| `zohoLeadId` | string | no | From the Zoho link (`?id=` on the page). 1–32 digits; anything else is dropped silently (logged) and the sign-up continues. |
| `captchaToken` | string | yes | reCAPTCHA v3 token for action `worker_register` |

**202** — for a new **and** an existing email (R1):

```json
{ "status": "accepted", "message": "Check your inbox — if this email is new, your account is ready and you can sign in now." }
```

Server-side checks, in order: reCAPTCHA (pipeline) → email ticket → breached password → services →
existing account? → (new account) the transaction: locality, photo claim, then all inserts
([03 §2](03-data-model.md#2-tables-written-by-a-sign-up)).

Errors (400 unless noted), with the `fields` key and message:

| Case | `fields` key | Message |
|---|---|---|
| Ticket expired or wrong | `emailVerification` | "Please verify your email address again" |
| Breached password | `password` | "This password has appeared in a data breach. Please choose a different one." |
| Unknown service id | `services` | "Please choose services from the list" |
| Sub-category outside the chosen services | `supportWorkerCategories` | "Please choose categories that belong to your selected services" |
| Locality unknown or retired | `localityId` | "Please choose your suburb from the list" |
| Photo missing, used or older than 24 h | `photoUploadId` | "Please upload your photo again" |
| Any schema rule above | the field's name | the rule's message |
| reCAPTCHA refused | — | 403 |
| Rate limit | — | 429 |

If the breach check service is unreachable, the password is accepted and a warning is logged.
