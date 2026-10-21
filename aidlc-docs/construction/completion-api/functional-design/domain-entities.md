# C1 `completion-api`: domain entities (2026-10-21)

Answers: `construction/plans/completion-api-functional-design-plan.md` Q1-Q3 (all A); the proposed design stood.

## E1 `CompletionItem` (the declaration, `domain/completion-items.ts`)

```ts
type CompletionGroup = 'my-profile' | 'services' | 'compliance'
interface CompletionItem {
  id: string              // a My Profile sidebar slug, or 'services-chosen', 'service-documents:<categoryId>', 'service-area', 'compliance:<requirement id>', 'training:<requirement id>'
  group: CompletionGroup
  required: boolean
  done: boolean
}
```

The My Profile items are a static table (18 rows, E2); the Services and Compliance items are produced per worker
from their services and requirement groups.

## E2 The My Profile table (CD3, FR-CMP-02; Q1 A)

| Slug | Required | Done when |
|---|---|---|
| `name` | yes | first and last name non-empty |
| `photo` | yes | a main photo |
| `bio` | yes | the bio has **50+ characters** (trimmed) |
| `date-of-birth` | yes | a date of birth, or a stored age (legacy rows) |
| `gender` | yes | gender non-empty |
| `languages` | yes | the additional-info languages non-empty; the legacy `worker_profiles.languages` when there is no additional-info row or it is empty |
| `experience` | yes | an experience row |
| `work-history` | yes | a job-history row |
| `education` | yes | an education row |
| `preferred-hours` | yes | an availability slot |
| `vehicle` | yes | answered (Yes or No) |
| `address` | no | the private home address set (a suburb) |
| `cultural-background` | no | non-empty list |
| `religion` | no | non-empty list |
| `interests` | no | non-empty list |
| `about-me` (Support & Activities) | no | non-empty support activities |
| `preferences` | no | non-empty work preferences |
| `personality` | no | a personality |

Slugs are the app's sidebar slugs (`workerMenu.ts` `EDIT_PROFILE_CHILDREN`), so the app maps each item to its link
without a second table. A contract test lists them; an app test asserts the sidebar's slugs equal the contract's.

## E3 Services items (FR-CMP-04; Q3 A)

- `services-chosen`: at least one service.
- `service-documents:<categoryId>`, one per chosen service: today's per-service rule (required types all uploaded;
  else, when only optional types exist, **at least one uploaded** (Q3 A); else done). Uploads count when SUBMITTED or
  APPROVED, as today.
- `service-area`: a HOME `worker_locations` row (the Service Area).

## E4 Compliance items (FR-CMP-05)

From `requirementGroups(...)` (the profile read's mandatory and training groups, in step order):
`compliance:<id>` per mandatory item and `training:<id>` per training, done when its status is `submitted` or
`approved`. **The group's completeness is today's two flags** (`complianceOf && trainingsOf`, unchanged rules); the
items say which step is next.

## E5 `CompletionView` (the entry's answer)

```ts
{
  percent: number                       // FR-CMP-03
  profileCompleted: boolean             // the three groups
  groups: { id: CompletionGroup; complete: boolean; done: number; total: number; firstUnfinished: string | null }[]  // 3, in menu order
  items: CompletionItem[]
  serviceDocuments: { categoryId: string; documents: { type: string; name: string; kind: 'QUALIFICATION' | 'TRAINING' | 'REGISTRATION' | 'INSURANCE'; required: boolean; uploaded: boolean }[] }[]
}
```

A strict object, every string bounded, lists capped (items ≤ 200, documents ≤ 50 per service).

## E6 `COMPLETION_MODEL` (the stored flags' meaning, NFR-C1)

A per-stage setting (`infra/lib/stages.ts`, the api's config), `legacy` (default) or `groups`:

| Stored | `legacy` (today) | `groups` (from C2's release) |
|---|---|---|
| `setupProgress.accountDetails` | today's rule (city/state/postcode…) | My Profile group complete |
| `setupProgress.compliance` | today | today |
| `setupProgress.trainings` | today | today |
| `setupProgress.services` | today's per-service rule | Services group complete (E3: + service area) |
| `profileCompleted` | the four | the three groups |

The entry always answers the groups model; the profile read's `completion` stays on today's rules (NFR-C1).

## Amendment 2026-10-21

E2: `languages` is **optional** (the requirements' CD3 amendment): 10 required pages. The rule for "filled" is unchanged.
