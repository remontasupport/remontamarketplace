# Frontend Components -- unit `edit-profile` (U2)

What PR 3 builds in `packages/form-engine` and `apps/app`, and what PR 4 deletes. Rules R8, R9; application
design C14-C16, C19-C21; stories US-WP-01..16, 25, 33.

## 1. The form engine (`packages/form-engine`, C14/C15)

### `section.ts` -- the section mode

```ts
interface SectionDefinition<C> {
  name: string                 // 'name' | 'bio' | ... -- the draft key and the page slug
  title: string
  contract: Contract<C>
  readEntry: keyof C           // 'getProfile'
  pick: string                 // the key of the read body this section seeds from: 'names', 'bio', 'personalInfo', 'abn', 'homeAddress', 'serviceArea', 'photos', 'sections.availability', ...
  writeEntry: keyof C          // the PUT entry
  fields: FieldDef[]
  constants?: Record<string, unknown>   // e.g. { group: 'languages' }
  pathParams?: Record<string, string>   // e.g. { group: 'languages' } for the additional-info entries
}
defineSection(def)   // import-time checks (R9.1); the body shape = the write entry's; the pick path must exist in the read response's shape
seedSection(def, readBody): FormValues
sectionBody(def, values): unknown
```

`submit.ts` gains `submitSection` (no CAPTCHA, a PUT or POST with path params) sharing the retry, back-off,
`Retry-After`, offline and field-error logic of the registration submit. The draft store is keyed
`section:<name>`; `neverSaved` honoured.

### `kinds.ts` additions (one entry each: `defaults`, `schemas` from the contract shape, `toBody`, `fromRead`)

| Kind | Value | Used by |
|---|---|---|
| `select` | one of `options` | gender, vehicle, personality, month pickers |
| `multiSelect` | `string[]` of `options`, with `max` | languages, cultural background, religion, interests, preferences, unique services, specific areas (max 3) |
| `date` | `YYYY-MM-DD` | date of birth |
| `number` | integer within the contract's bounds | travel radius |
| `textarea` | text with a counter from the contract's max | bio, fun fact, descriptions |
| `timeRanges` | `{day, startMinute, endMinute}[]`; the picker adds/removes slots per day in 5-minute steps; the kind's schema is the contract's (overlap, ≤ 4) | preferred hours |
| `orderedList` | an array of sub-objects with `itemFields` (each a kind), add/remove/move up/down; the kind's schema is the contract's item schema | work history, education, experience domains |
| `maskedSecret` | entered in full; seeded from the masked read as the mask text (never the value); `neverSaved` | BSB, account number |
| `abn` | digits with spaces while typing (`sanitise`), the contract's checksum rule | ABN |
| `photoSlots` | `{ main, additional[] }` with the shrink-and-ticket flow of the registration's `photo` kind per slot; make-main and remove call their entries | profile photo |
| `locality` (existing) | the suburb picker from `GET /v1/localities` | home address, service area |

Existing `text`, `email`, `phone` are reused (name parts: `text`).

### The agreement test

`test/sections.test.ts`: for every section definition in the app, what the definition's schemas accept the
contract body accepts (P11), and `seedSection(sectionBody(values)) == values` for generated values (the seed /
body pair are inverses).

## 2. The app (`apps/app`, C16/C19/C20/C21)

### `src/features/worker/`

| File | Holds |
|---|---|
| `api.ts` | `workerApi = createWorkerApi({ baseUrl: NEXT_PUBLIC_API_URL, tokenSource: apiToken })` -- `createClient(workerContract)` wrapped with the admin client's outcome mapping (`lib/api/admin.ts`'s `ApiOutcome`, the refresh-once-on-401), exported for the pages; no hand-written fetch |
| `profile.ts` | `useWorkerProfile()`: one React Query key `['worker', 'profile']`, `staleTime` 60 s (the api's private cache), `reload()` with `cache: 'reload'`; a `WorkerProfileProvider` at the dashboard layout so the sidebar and the pages share it |
| `useSection.ts` | `useSection(def)`: seed from the profile or the draft, the kind schemas on change, `save()` through `submitSection`, `draftRestored`, `saving`, `fieldErrors`; on success: clear the draft, seed from the response, `reload()` |
| `definitions/*.ts` | one `defineSection` per entry (below) |
| `SectionPage.tsx` | `"use client"`: takes a definition, renders the title, the restored-draft notice, the fields through `FieldSlot` (one case per kind), the Save button, the "Saved" state, the unreachable-api notice (NFR-07) |

### The section definitions (one file each, `definitions/`)

| Definition | pick | write entry | fields (kind) |
|---|---|---|---|
| `name` | `names` | `putName` | firstName (text), middleName (text, optional), lastName (text) |
| `photo` | `photos` | -- (the `photoSlots` kind calls `createPhotoTicket`, `confirmPhoto`, `makeMainPhoto`, `removePhoto`) | photos (photoSlots) |
| `bio` | `bio` | `putBio` | bio (textarea, counter /2000, a hint that 50+ counts toward the badge) |
| `address` | `homeAddress` + `serviceArea` (two definitions on one page: `homeAddress`, `serviceArea`) | `putHomeAddress`; `putServiceArea` | streetLine (text), localityId (locality); localityId (locality), travelRadiusKm (number) -- the page shows the unplaced reminder when `serviceArea` is null (Q10) |
| `personalInfo` | `personalInfo` | `putPersonalInfo` | dateOfBirth (date), gender (select GENDERS), hasVehicle (select Yes/No) |
| `abn` | `abn` | `putAbn` | abn (abn); the page shows "contract signed" from `signed` and links to the contract page |
| `hours` | `sections.availability` | `putAvailability` | slots (timeRanges) |
| `experience` | `sections.experience` | `putExperience` | domains (orderedList of: domain (select, fixed per row), isProfessional/isPersonal (checkbox), specificAreas (multiSelect from `experienceAreasOf(domain)`, max 3), otherAreas (multiSelect free), description (textarea)) -- rendered as today's expandable domain cards |
| `jobHistory` | `sections.jobHistory` | `putJobHistory` | entries (orderedList: jobTitle, company, startMonth/startYear, endMonth/endYear hidden when currentlyWorking) |
| `education` | `sections.education` | `putEducation` | entries (orderedList: institution, qualification, the dates, currentlyStudying) |
| `goodToKnow`, `languages`, `culturalBackground`, `religion`, `interests`, `aboutMe`, `preferences`, `personality` | `sections.additionalInfo` | `putAdditionalInfo` with `pathParams: { group }` and `constants: { group }` | the group's fields (multiSelect / textarea / select / checkbox) |
| `bankAccount` | `sections.bankAccount` | `putBankAccount` | accountName (text), bankName (text), bsb (maskedSecret), accountNumber (maskedSecret) -- all four `neverSaved` |

### The pages (PR 3)

| Route | Replaces | Renders |
|---|---|---|
| `/dashboard/worker/profile/[section]` | `/account/setup?step=` (5 steps) and `/profile-building?section=` (13 sections) | `SectionPage` with the definition named by the slug; unknown slug 404; the old URLs redirect to the new slugs (one `redirects` table in `next.config`) |
| `/dashboard/worker/profile` | `/profile-building` | the section index (the Edit Profile children as cards with their completion state) |

The dashboard layout wraps everything in `WorkerProfileProvider`. The two pages switch in PR 3 only; every other
dashboard page keeps its data path until its unit.

### `src/features/navigation/workerMenu.ts` (C19, R8)

```ts
export const WORKER_MENU: MenuItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: Home, href: '/dashboard/worker' },
  { id: 'edit-profile', label: 'Edit Profile', icon: User, badge: editProfileBadge, children: editProfileChildren },
  { id: 'edit-services', label: 'Edit Services', icon: Briefcase, href: '/dashboard/worker/services/manage' },
  { id: 'mandatory', label: 'Mandatory', icon: Shield, children: mandatoryChildren },
  { id: 'trainings', label: 'Trainings', icon: BookOpen, children: trainingChildren },
  { id: 'my-services', label: 'My Services', icon: Grid, children: myServicesChildren },
  { id: 'additional-credentials', label: 'Additional Credentials', icon: FileText, href: '/dashboard/worker/additional-documents' },
  { id: 'my-jobs', label: 'My Jobs', icon: Calendar, href: '/dashboard/worker/my-jobs' },
  { id: 'account', label: 'Account', icon: Settings, href: '/dashboard/worker/account' },
]
editProfileChildren(profile): the 17 section links in R8.2's order, each with its done state (from the read: a filled section)
editProfileBadge(profile): profile.completion.percent < 80 ? `${percent}%` : null, plus the unplaced dot
mandatoryChildren / trainingChildren(profile): from profile.requirements.*, hrefs as today (U3 changes them)
myServicesChildren(profile): from profile.services, hrefs as today
```
`components/dashboard/Sidebar.tsx` renders `WORKER_MENU` (desktop and the mobile drawer) and keeps no item of
its own; its own fetches (`/api/worker/profile/[userId]`, the preview action, the requirements) go: it reads
`useWorkerProfile()`. `workerMenu.test.ts`: P10 (the order; every static href resolves to a page file under
`src/app`; every child slug resolves to a definition).

### The admin worker page (C21)

`app/admin/contractors/[id]/page.tsx` (through the existing admin route `/api/admin/contractors/[id]`, which
selects the two new columns and joins the locality): a "Home address (private)" block (street line, suburb,
state, postcode) and the bank account masked (`maskBankAccount` applied server-side in the route, the same
function as the api's -- copied into `lib/` with a test that it equals the api's on the contract's examples).
Never a worker entry (NFR-03).

## 3. What PR 4 deletes (FR-PI-08, FR-EP-06, US-WP-33)

- `services/worker/profile.service.ts`: `updateWorkerName`, `updateWorkerPhoto`, `updateWorkerAdditionalPhotos`,
  `swapMainPhoto`, `updateWorkerBio`, `updateWorkerAddress`, `updateWorkerPersonalInfo`; `compliance.service.ts`:
  `updateWorkerABN`; `availability.service.ts` and `experience.service.ts` whole; `additionalInfo.service.ts`: the
  13 section actions and `getWorkerAdditionalInfo`; `app/api/worker/profile/update-step/route.ts`.
- `app/dashboard/worker/account/setup/` and `app/dashboard/worker/profile-building/` and
  `components/profile-building/sections/*` (the 13 rendered sections; `IndicativeRates`, `Locations`,
  `NdisScreening` were never rendered); `components/account-setup/steps/*` (the five steps and `Step6ABN`);
  `config/accountSetupSteps.ts`; the inline option lists (E4); `hooks/queries/useWorkerProfile.ts` and the
  `['worker-profile']` React Query usages of the moved pages; the Upstash keys `worker_profile` and
  `worker_profile_base` with their invalidations in the deleted actions; `revalidatePath` calls of the deleted
  actions.
- `GET /api/worker/profile/[userId]` once the sidebar reads the api (its other callers checked first: the home
  page polls it until U4 -- it stays until then; the route's write of nothing).
- A grep after the deletions: no import of a deleted module; `s-maxage` on authenticated routes unchanged by this
  unit (U3 owns the two).

## 4. Interaction flows

- **Open a section**: the layout's provider has the profile (or shows the unreachable-api notice); the page seeds
  the fields; a draft, if any, replaces the seed and the notice says so.
- **Type**: the kind's sanitiser and schema run per field; errors show under the field; the draft is written
  (not for `neverSaved`).
- **Save**: one PUT; "Saving…"; on 429/503 "Still saving" with the engine's back-off; offline pauses; on 400 the
  fields map; on 200 "Saved", the returned section seeds the fields, the draft clears, the profile reloads, the
  sidebar's badge and children update.
- **Photos**: pick → shrink on the device → ticket → direct POST → confirm with the slot → the section shows the
  staged image; the clean copy replaces it within a minute (the page refetches the profile on focus).
- **Address**: two forms on one page, saved separately; the unplaced reminder shows until the service area is saved.
