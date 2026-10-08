# Component Methods -- admin worker search on `apps/api`

Signatures and purposes. Business rules (exact normalisation, the SQL per filter, error mapping, limit values) are
detailed in U1's and U2's Functional Design. Types are TypeScript as the packages write them.

## packages/api-contract -- C1 `auth.ts`

```ts
export const API_TOKEN_ISSUER = 'remonta-app'
export const API_TOKEN_AUDIENCE = 'remonta-api'
export const API_TOKEN_TTL_S = 300                 // 5 minutes (NFR-03: at most 10)
export const API_TOKEN_ALG = 'HS256'
export const apiTokenClaimsSchema = z.strictObject({
  sub: z.string().min(1),                           // user id
  role: z.enum(ROLES),
  act: z.string().min(1).optional(),                // impersonating admin's user id
  iss: z.literal(API_TOKEN_ISSUER),
  aud: z.literal(API_TOKEN_AUDIENCE),
  iat: z.number().int(), exp: z.number().int(), jti: z.string().min(8),
})
export type ApiTokenClaims = z.infer<typeof apiTokenClaimsSchema>
export function principalOf(c: ApiTokenClaims): { userId: string; role: Role; impersonatorId?: string }
```

## packages/api-contract -- C2 `admin.contract.ts`

```ts
// query (strict; arrays arrive comma-separated and are split and trimmed; empty = absent)
workerSearchQuerySchema = {
  page: int >= 1 (default 1), pageSize: int 1..100 (default 20),
  sortBy: enum('createdAt','firstName','lastName','city','state','distance') (default createdAt), sortOrder: enum('asc','desc') (default desc),
  search?: string max 100, localityId?: int > 0, withinKm?: int 1..500, unplaced?: boolean,
  typeOfSupport?: string, gender?: string, hasVehicle?: string, workerType?: string, age?: string,
  languages?: csv, therapeuticSubcategories?: csv, experienceWith?: csv,
}
workerRowSchema = { id, userId, firstName, lastName, mobile, email: string|null, gender, age: int|null, languages: string[],
  services: string[], city, state, postalCode, photos, experience, introduction, createdAt, updatedAt, isActive: boolean,
  distanceKm?: number, location?: { localityLabel: string; precision: 'LOCALITY'|'ADDRESS'; travelRadiusKm: int } }
workerSearchResponseSchema = { data: workerRow[], pagination: { total, page, pageSize, totalPages, hasNext, hasPrev },
  appliedFilters: { locality?: { id, label }, withinKm?, unplaced?, ...the active filters }, unplacedCount: int }

searchWorkers:         GET /v1/admin/workers            query workerSearchQuerySchema   -> 200 workerSearchResponseSchema
listUsers:             GET /v1/admin/users              query { search: string 2..100; role?: enum(ROLES)|'all' } -> 200 { users: userRow[] (<= 50) }
listSuspendedWorkers:  GET /v1/admin/workers/suspended  query { page, pageSize }         -> 200 { data: suspendedRow[], pagination }
  meta (all three): access { roles: ['ADMIN'] } · bot 'none' · rateLimit [{ per: 'user', ... }, { per: 'ip', ... }] (values: NFR Requirements) · maxBodyKb 1
  errors: 400 (fields) · 401 · 403 · 429 (+retry-after) · 500 · 503 (+retry-after)
```

## apps/api -- C3 `JwtAuthenticator`, C4 config

```ts
export interface Principal { userId: string; role: Role; impersonatorId?: string }     // extended
export class JwtAuthenticator implements Authenticator {
  constructor(opts: { secret: Uint8Array; clock?: Clock; log: FastifyBaseLogger; skewS?: number })
  authenticate(headers: Record<string, string | string[] | undefined>): Promise<Principal | null>
}
// config.ts
API_TOKEN_SECRET: z.string().min(32)                                                   // required; never logged
```

## apps/api -- C5 `search-query.ts` (pure)

```ts
export interface SearchQuery {
  page: number; pageSize: number; sortBy: SortField; sortOrder: 'asc' | 'desc'
  search?: string; localityId?: number; withinKm?: number; unplaced: boolean
  typeOfSupport?: string /* category id */; gender?: string /* Title Case */; hasVehicle?: 'Yes' | 'No'
  workerType?: 'tfn' | 'abn'; age?: { minAge: number; maxAge: number; minBirth: string; maxBirth: string }
  languages: string[] /* Title Case */; therapeuticSubcategories: string[]; experienceWith: CareDomain[]
}
export function normaliseQuery(raw: WorkerSearchQuery, now: Date): SearchQuery          // throws ApiError(400, fields) on sortBy=distance without a locality, withinKm without a locality, unknown experience
export function appliedFiltersOf(q: SearchQuery, locality?: { id: number; label: string }): AppliedFilters
export function birthWindowOf(range: string, now: Date): { minAge; maxAge; minBirth; maxBirth } | null   // today's rule
export function titleCase(s: string): string
```

## apps/api -- C6 `filters.ts`, C7 `worker-search-sql.ts`

```ts
export interface FilterSpec { name: string; applies(q: SearchQuery): boolean; sql(q: SearchQuery): Prisma.Sql }
export const FILTERS: readonly FilterSpec[]                                              // one row per filter of the requirements table
export function whereOf(q: SearchQuery): Prisma.Sql                                      // AND of active fragments + u.status = 'ACTIVE'

export interface Point { latitude: number; longitude: number }
export function searchStatement(q: SearchQuery, point: Point | null): Prisma.Sql        // select, joins, where, location term, order, limit/offset, COUNT(*) OVER()
export function unplacedCountStatement(q: SearchQuery): Prisma.Sql
export function runSearch(db: Db, q: SearchQuery, point: Point | null, opts: { statementTimeoutMs: number }):
  Promise<{ rows: RawWorkerRow[]; total: number; unplacedCount: number }>                // one transaction, SET LOCAL statement_timeout
```

## apps/api -- C8, C9 services; C10 handlers

```ts
export async function searchWorkers(deps: { db: Db; clock: Clock }, query: WorkerSearchQuery): Promise<WorkerSearchResponse>
export async function listUsers(deps: { db: Db }, query: UserSearchQuery): Promise<UserListResponse>
export async function listSuspendedWorkers(deps: { db: Db }, query: SuspendedListQuery): Promise<SuspendedListResponse>
export function shapeRow(raw: RawWorkerRow, now: Date, withDistance: boolean): WorkerRow  // age, languages fallback, services, isActive, distanceKm, location

export function adminHandlers(deps: { db: Db; clock: Clock }): HandlerSet<typeof adminContract>
// pipeline.ts (U1): after step 5, request.log = request.log.child({ userId: principal.userId, impersonatorId: principal.impersonatorId })
```

## apps/app -- C11, C12, C13

```ts
// app/api/auth/api-token/route.ts
export async function GET(): Promise<NextResponse<{ token: string; expiresAt: string } | ErrorBody>>   // 401 without a session; 429 by the app's limiter

// lib/api/token.ts
export interface TokenSource { getToken(): Promise<string>; invalidate(): void }
export function createTokenSource(opts?: { fetch?: typeof fetch; renewBeforeS?: number /* 60 */ }): TokenSource

// lib/api/admin.ts
export type ApiOutcome<T> = { kind: 'ok'; body: T } | { kind: 'unauthenticated' } | { kind: 'forbidden' }
  | { kind: 'rateLimited'; retryAfterSeconds: number } | { kind: 'unavailable' } | { kind: 'failed'; requestId?: string }
export const adminApi: {
  searchWorkers(query: WorkerSearchQuery, init?: { signal?: AbortSignal }): Promise<ApiOutcome<WorkerSearchResponse>>
  listUsers(query: UserSearchQuery): Promise<ApiOutcome<UserListResponse>>
  listSuspendedWorkers(query: SuspendedListQuery): Promise<ApiOutcome<SuspendedListResponse>>
}
```

## infra -- C15; scripts -- C16

```ts
// infra/lib/stages.ts
SECRET_NAMES = [..., 'API_TOKEN_SECRET']
// infra/cloudrun/monitoring/auth-failed.json: metric remonta-api-auth-failed, ALIGN_SUM 300 s, GT <threshold: NFR Requirements>, prod only
// apps/api/scripts/parity-admin-search.ts
pnpm --filter @remonta/api parity:admin-search --old=<preview base> --cookie=<session> --new=<staging api> --token=<jwt> --cases=<file>
```
