# U1 `tools-api`: domain entities

## E1 The tool declaration (`packages/schemas/src/data/serviceTools.ts`)

Pure data, no imports beyond TypeScript (P-5). Read by `api-contract`, `apps/api` and `apps/app`.

```ts
export const SERVICE_TOOLS = {
  'cleaning-services': [ { id: 'vacuum-cleaner', label: 'Vacuum cleaner' }, ... ],     // 14, F1 order
  'home-yard-maintenance': [ { id: 'push-mower', label: 'Push lawn mower' }, ... ],    // 15, F1 order
} as const
export type ToolService = keyof typeof SERVICE_TOOLS            // the services that have a list
export const TOOL_SERVICES: readonly ToolService[]
export const TOOL_IDS: readonly string[]                        // every id, unique across all lists (BR-1)
export const toolServiceOf(id): ToolService | undefined
export const OTHER_TOOLS_MAX = 5, OTHER_TOOL_MAX_CHARS = 60
export function normaliseOtherTools(raw: readonly string[], service: ToolService): string[]   // BR-6
```

| Cleaning Services id | Label | Home and Yard Maintenance id | Label |
|---|---|---|---|
| `vacuum-cleaner` | Vacuum cleaner | `push-mower` | Push lawn mower |
| `mop-and-bucket` | Mop and bucket | `ride-on-mower` | Ride-on mower |
| `steam-mop` | Steam mop | `whipper-snipper` | Whipper snipper |
| `broom-and-dustpan` | Broom and dustpan | `hedge-trimmer` | Hedge trimmer |
| `microfibre-cloths` | Microfibre cloths | `leaf-blower` | Leaf blower |
| `cleaning-products` | Cleaning products | `chainsaw` | Chainsaw |
| `eco-cleaning-products` | Eco-friendly cleaning products | `pressure-washer` | Pressure washer |
| `scrubbing-brushes` | Scrubbing brushes and sponges | `pruning-shears` | Pruning shears and loppers |
| `window-cleaning-kit` | Window cleaning kit (squeegee, extension pole) | `garden-hand-tools` | Rake, shovel and garden hand tools |
| `carpet-cleaner` | Carpet cleaner | `wheelbarrow` | Wheelbarrow |
| `oven-bbq-cleaning-kit` | Oven and BBQ cleaning kit | `ladder` | Ladder |
| `extendable-duster` | Extendable duster | `trailer` | Trailer |
| `step-ladder` | Step ladder | `power-drill` | Power drill |
| `gloves-protective-gear` | Gloves and protective gear | `hand-tools` | Hand tools (hammer, screwdrivers, spanners) |
| | | `gutter-cleaning-kit` | Gutter cleaning kit |

## E2 Storage: two columns on `worker_services`

| Column | Type | Default | Meaning |
|---|---|---|---|
| `toolIds` | `text[] NOT NULL` | `'{}'` | ticked ids of the row's service list, in list order |
| `otherTools` | `text[] NOT NULL` | `'{}'` | normalised free-text tools (BR-6) |

Migration `<date>_worker_services_tools`: `ALTER TABLE worker_services ADD COLUMN ... DEFAULT '{}'` twice; expand-only,
no backfill, no index (BR-12: the filter goes through the existing unique `(workerProfileId, categoryId)` index).
Rows of services without a list keep both empty.

## E3 Contract shapes (`packages/api-contract`)

```ts
serviceToolsSchema   = z.strictObject({ categoryId: z.enum(TOOL_SERVICES), toolIds: z.array(z.enum(TOOL_IDS)).max(30), otherTools: z.array(z.string()).max(5) })
serviceToolsBodySchema = z.strictObject({ toolIds: z.array(z.enum(TOOL_IDS)).max(30),
                                         otherTools: z.array(plainText(0, 200)).max(20) })   // raw; BR-6 narrows to 5 x 60
serviceToolsViewSchema = z.strictObject({ services: z.array(serviceToolsSchema).max(2) })
serviceToolsParamsSchema = z.strictObject({ categoryId: z.enum(TOOL_SERVICES) })
adminWorkerServicesSchema = z.strictObject({ services: z.array(z.strictObject({
  categoryId: str(80), categoryName: str(120), subcategoryNames: z.array(str(120)).max(50),
  toolIds: z.array(z.enum(TOOL_IDS)).max(30), otherTools: z.array(z.string()).max(5) })).max(50) })
adminWorkerParamsSchema = z.strictObject({ workerId: z.string().regex(/^[A-Za-z0-9_-]{1,40}$/, 'Not a worker id') })
workerSearchQuerySchema += tools: csv(z.enum(TOOL_IDS), TOOL_IDS.length).optional()
```

## E4 The entries

| Entry | Method, path | Access, meta | 200 |
|---|---|---|---|
| `worker.getServiceTools` | `GET /v1/worker/services/tools` | `workerRead({ noCache: true })` | `serviceToolsViewSchema` |
| `worker.putServiceTools` | `PUT /v1/worker/services/:categoryId/tools` | `workerWrite(PROFILE_UPDATE, { maxBodyKb: 4 })` | `serviceToolsSchema` |
| `admin.getWorkerServices` | `GET /v1/admin/workers/:workerId/services` | `adminRead({ user: 120, ip: 300 })` | `adminWorkerServicesSchema` |
| `admin.searchWorkers` | unchanged path; `tools` added to the query | unchanged | **unchanged** response |

`GET /v1/worker/profile` and `workerServiceSchema` are **not** changed (BR-11).
