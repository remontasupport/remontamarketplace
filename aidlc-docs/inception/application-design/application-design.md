# Application design -- the worker profile on `apps/api` (consolidated)

**Decisions** (`../plans/application-design-plan.md`, approved 2026-10-09): Q1 one read + one PUT per section;
Q2 a `storageKey` column and an admin link entry; Q3 a `section` mode and new kinds in the form engine; Q4 completion
as a pure domain function with today's app function as the oracle; Q5 uploads lifted into `platform/storage` with an
upload-kind table; Q6 one profile query and a typed client; Q7 the sidebar as a typed array with an order test.

The four detailed documents: `components.md` (C1-C25 with purpose, responsibilities, interfaces, by unit),
`component-methods.md` (signatures and types), `services.md` (S1-S8 orchestration), `component-dependency.md`
(matrix, communication, data flows, the unit/PR mapping).

## The shape in one picture

```
apps/app (worker dashboard)                           apps/api                                   stores
┌──────────────────────────────┐   bearer JWT    ┌──────────────────────────────────┐
│ features/worker/             │ ──────────────► │ pipeline (auth, role WORKER,     │
│  api.ts  createClient(worker)│  GET profile    │  limits, strict parse, audit,    │
│  useWorkerProfile()  ───────────────────────── │  private cache + ETag)           │
│  definitions/<section>.ts    │  PUT section    │ modules/worker/                  │      Postgres (Neon, pooled)
│  SectionPage (engine section │ ──────────────► │  handlers → own-profile → ...    │ ───► worker_profiles (+home cols)
│   mode + field kinds)        │                 │  get-profile  completion(domain) │      worker_locations (HOME)
│ features/navigation/         │  POST tickets   │  sections/*  addresses  bank     │      verification_requirements
│  workerMenu.ts (D11 order)   │ ──────────────► │  documents   jobs                │       (+storageKey)
│ pages: dashboard, my-jobs,   │                 │ platform/storage: ObjectStore,   │ ───► GCS bucket (private;
│  preview as client pages     │ multipart POST  │  UploadsService + UPLOAD_KINDS   │      signed POST / signed GET)
└──────────────┬───────────────┘ ──────────────────────────────────────────────────────►
               │ (admin page)                    │ platform/outbox → crm.handlers   │ ───► Vercel Blob (photo clean copies)
               └── GET /v1/admin/documents/{id}/link ──► admin module               │ ───► n8n (SafeHttpClient, allow-listed)
                                                 └──────────────────────────────────┘
```

## Components by unit (summary)

| Unit | Contract | Api | Engine / App | Infra, scripts, db |
|---|---|---|---|---|
| U1 `worker-area` | `workerContract` skeleton, `getProfile`, `profileSchema`, `workerRead/workerWrite` meta helpers | `modules/worker/`: handlers, `own-profile`, `get-profile` + `profile-read`, `domain/completion` (+ oracle test); health exemption | -- | `stages.ts` ceiling/`MAX_IN_FLIGHT`/pool; README pooler check; `scripts/load-worker.ts` |
| U2 `edit-profile` | the 15 section entries and their schemas | `sections/*`, `addresses` (`placeHome` reuse), `domain/bank-account`, photos via the existing ticket/process code | `defineSection` + 10 kinds; `features/worker/` (client, profile query, definitions, SectionPage); `workerMenu.ts`; new field components; the admin page's home-address block and masked bank account | migration: `homeStreetLine`, `homeLocalityId` |
| U3 `services-documents` | services, requirements, documents (typed metadata), link, tickets, confirmations; admin `getDocumentLink` | `platform/storage` (ObjectStore, UploadsService, UPLOAD_KINDS; registration delegates), `documents`, `allowedRequirementTypes`, purge generalised | services and documents pages on the engine; admin doc views call the link entry; `/api/upload/worker-photo` gets auth + limit | migration: `storageKey` |
| U4 `dashboard-jobs` | jobs, applications | `jobs`, `notifications/crm.handlers` (`JobApplied`, `WorkerRegistered`) | dashboard, my-jobs, ApplyModal/WithdrawButton on the api | `N8N_JOB_APPLICATION_WEBHOOK_URL` secret |

## Invariants the design fixes (for Functional Design and the property tests)
- Every worker entry resolves the profile from the token; no request names a user or profile id (C4).
- Whole-section replace in one transaction; `sortOrder` from array position; idempotent (C7).
- The home address never writes the legacy location columns; the service area always does, through `placeHome`
  (C8).
- The bank account is masked on every read path, including the profile read and the admin page (C9).
- Documents never expose `storageKey`; reads are signed, short-lived; the admin's read is audited (C11, C12).
- Uploads are bound to an owner key, a kind's content types and size, and a ticket lifetime; confirmation checks
  the object (C11).
- The CRM is reached only from the outbox; the browser never calls n8n (C24).
- The sidebar is data; its order is tested (C19).
- The registration wizard's behaviour and tests do not change when the upload code moves (C11 seam).

## Open to Functional Design (per unit)
- U1: the exact `profileSchema` fields per section summary; the completion rules as a table against today's
  function; `profileIdOf` for an admin impersonating (the principal is the worker: nothing special).
- U2: the per-section field rules and lists (gender, languages, cultural background, religion, interests,
  preferences, personality values); the availability slot limits; the ABN checksum; the photo column format;
  `pick` keys per section.
- U3: the document kinds and their metadata variants; the allowed set per service from the catalogue; signed URL
  TTL; the purge window per kind.
- U4: the jobs query and page size; the `JobApplied` payload and the registration payload; idempotency when a
  WITHDRAWN application is re-applied.
- NFR Requirements (U1): the limit values, the capacity arithmetic, the load tool, statement timeouts.
