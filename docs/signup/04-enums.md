# 04 — Enums and status values

Postgres enums from `packages/db/prisma/schema.prisma`, plus the text-valued statuses and contract
literals the sign-up uses. **Bold** = the value a new sign-up gets.

## 1. `UserRole` — `users.role`

| Value | Meaning |
|---|---|
| **`WORKER`** | Support worker / contractor (every sign-up here) |
| `CLIENT` | Client (participant or family) |
| `COORDINATOR` | Support coordinator |
| `ADMIN` | Remonta staff |

## 2. `AccountStatus` — `users.status`

| Value | Meaning |
|---|---|
| **`ACTIVE`** | Can sign in. Sign-ups are active at once (the email was verified before submit). |
| `SUSPENDED` | Blocked by an admin |
| `LOCKED` | Locked after failed sign-ins (see `accountLockedUntil`) |
| `PENDING_VERIFICATION` | Waiting for verification (not used by this sign-up) |

## 3. `AuditAction` — `audit_logs.action`

| Value | Written by |
|---|---|
| **`ACCOUNT_REGISTERED`** | The new sign-up (apps/api), once per new account |
| `LOGIN_SUCCESS` | Sign-in; also what the pre-S1 sign-up wrote for a registration (rows before 2026-10-02) |
| `LOGIN_FAILED`, `LOGOUT` | Sign-in / sign-out |
| `PASSWORD_CHANGE`, `PASSWORD_RESET_REQUEST`, `PASSWORD_RESET_SUCCESS` | Password flows |
| `EMAIL_CHANGE`, `EMAIL_VERIFIED`, `PROFILE_UPDATE` | Account changes |
| `ACCOUNT_LOCKED`, `ACCOUNT_UNLOCKED` | Lockout |
| `ROLE_CHANGE`, `IMPERSONATION_START`, `IMPERSONATION_END` | Admin actions |

## 4. `OnboardingStage` — `worker_onboarding.stage`, `worker_onboarding_transitions.fromStage/toStage`

Derived from facts (documents, expiry, publication); never set by a client or by hand
(`apps/api/src/modules/onboarding/domain/stage.ts`). First matching rule wins:

| # | Rule | Stage |
|---|---|---|
| 1 | A document rejected or expired | `ACTION_REQUIRED` |
| 2 | Published, and a mandatory document missing | `ACTION_REQUIRED` |
| 2 | Published, nothing missing (even with a replacement awaiting review) | `PUBLISHED` |
| 3 | Every mandatory document approved and current | `VERIFIED` |
| 4 | Nothing uploaded | **`SIGNED_UP`** |
| 5 | Some uploaded, some missing | `DOCUMENTS_IN_PROGRESS` |
| 6 | All uploaded, some awaiting review | `DOCUMENTS_SUBMITTED` |

A worker with no mandatory obligations is never `VERIFIED` or `PUBLISHED` by this rule ("nothing to
check" is not "checked").

## 5. `OnboardingTransitionSource` — `worker_onboarding_transitions.source`

| Value | Meaning |
|---|---|
| **`API`** | Changed by apps/api in the same transaction as the fact (the sign-up) |
| `RECONCILER` | Corrected by the onboarding reconciler job (every 5 minutes) |
| `BACKFILL` | Written by the one-off S1 backfill for existing workers |

## 6. `LocationKind` — `worker_locations.kind`

| Value | Meaning |
|---|---|
| **`HOME`** | Where the worker is; exactly one per worker; carries the travel radius |
| `SERVICE_AREA` | Reserved; nothing writes it yet (radius-only option chosen 2026-09-25) |

## 7. `LocationPrecision` — `worker_locations.precision`

| Value | Meaning |
|---|---|
| **`LOCALITY`** | The suburb's centroid (sign-up: no geocoding call) |
| `ADDRESS` | A geocoded street address (onboarding may refine to this later) |

## 8. `LocationSource` — `worker_locations.source`

| Value | Meaning |
|---|---|
| **`REGISTRATION`** | Placed by the sign-up |
| `ONBOARDING` | Refined by the worker during onboarding |
| `ADMIN` | Set by staff |
| `RECONCILER` | Set by a job |
| `BACKFILL` | Written by the S1 backfill for existing workers |

## 9. `OutboxStatus` — `outbox_events.status`

| Value | Meaning | Next |
|---|---|---|
| **`PENDING`** | Waiting to be delivered (new, or waiting for a retry at `nextAttemptAt`) | `PROCESSING` |
| `PROCESSING` | Claimed by the dispatcher; `lockedUntil` is the lease | `DONE`, `PENDING` (retry) or `DEAD`; an expired lease is claimed again |
| `DONE` | Delivered (`processedAt` set); deleted after 30 days | — |
| `DEAD` | Failed 6 times, or failed permanently; logged as an alert; **kept until someone looks** | — |

## 10. `worker_profiles.verificationStatus` (text, not a DB enum)

A plain text column with default `NOT_STARTED`. Values used in the code:

| Value | Meaning |
|---|---|
| **`NOT_STARTED`** | New worker, nothing submitted for verification |
| `IN_PROGRESS` | Documents being added |
| `PENDING_REVIEW` | Submitted, waiting for an admin |
| `APPROVED` | Approved by an admin |
| `REJECTED` | Rejected by an admin |

This is the legacy verification flag apps/app uses; `worker_onboarding.stage` (§4) is the S1 marker that
replaces it over time.

## 11. Contract literals and other fixed values

| Name | Value(s) | Where |
|---|---|---|
| `state` (localities) | `NSW` `VIC` `QLD` `WA` `SA` `TAS` `ACT` `NT` `OT` | 4.1 response |
| `consentWordingVersion` | `worker-profile-share-v1` | 4.7 request, stored on the profile |
| `consentProfileShare` | `true` | 4.7 request |
| Submit response `status` | `accepted` | 4.7 |
| reCAPTCHA actions | `worker_email_code`, `worker_register` | 4.4, 4.7 |
| Breach check result | `clear`, `breached`, `unknown` | audit metadata `breachedPasswordCheck` (`clear` or `unknown`) |
| Outbox event `type` | `WorkerRegistered`, `RegistrationAttemptOnExistingAccount` | [05](05-events-and-emails.md) |
| Error `code` | `INVALID_REQUEST` `UNAUTHENTICATED` `FORBIDDEN` `NOT_FOUND` `CONFLICT` `PAYLOAD_TOO_LARGE` `UNSUPPORTED_MEDIA_TYPE` `RATE_LIMITED` `INTERNAL` `UNAVAILABLE` | [02 §2](02-api-reference.md#2-errors) |
| Photo types | `image/jpeg` `image/png` `image/webp` `image/heic` | 4.6 |
