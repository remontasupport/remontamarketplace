// The PR 2 staging checklist for the admin entries (aidlc-docs/construction/admin-search/code/pr2-verification.md).
//
//   cd apps/api && node --import tsx scripts/staging-admin-check.ts [--base=<api url>] [--skip-drill] [--skip-time]
//
// Reads the STAGING token secret and database URL through `gcloud secrets versions access` (or from
// STAGING_API_TOKEN_SECRET / STAGING_AUTH_DATABASE_URL when set; the plain variables are ignored because a
// developer shell usually exports the local database), mints short-lived tokens for one
// admin and one worker of the staging database, and runs every check that needs them. It prints
// results only: never a secret, never a token. Set PREVIEW_URL and PREVIEW_COOKIE to also run the
// parity comparison against a preview's old route; without them only the timing replay runs.
import { execSync, spawnSync } from 'node:child_process'
import { SignJWT } from 'jose'
import { Prisma, createDb } from '../src/platform/persistence/db'
import { normaliseQuery } from '../src/modules/admin/domain/search-query'
import { searchStatement } from '../src/modules/admin/persistence/worker-search-sql'
import { workerSearchQuerySchema } from '@remonta/api-contract'

function flag(name: string): string | undefined {
  const a = process.argv.find((x) => x.startsWith(`--${name}=`))
  return a ? a.slice(name.length + 3) : undefined
}
const BASE = flag('base') ?? 'https://remonta-api-staging-154148201608.australia-southeast1.run.app'
const PROD = 'https://remonta-api-154148201608.australia-southeast1.run.app'
const skipDrill = process.argv.includes('--skip-drill')
const skipTime = process.argv.includes('--skip-time')

/**
 * The STAGING value only. The ordinary AUTH_DATABASE_URL / API_TOKEN_SECRET variables are ignored on purpose:
 * a developer shell usually exports the local Docker database (CLAUDE.md), and this script must never run
 * against it. An explicit STAGING_<NAME> variable wins over gcloud.
 */
function secret(name: string): string {
  const explicit = process.env[`STAGING_${name}`]
  if (explicit) return explicit
  // One fixed command string: on Windows gcloud is a .cmd and Node will not spawn it without a shell (EINVAL);
  // `name` is one of two constants in this file, never input.
  if (!/^[A-Z_]+$/.test(name)) throw new Error(`bad secret name ${name}`)
  const out = execSync(`gcloud secrets versions access latest --secret=remonta-api-staging-${name}`, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'],
  })
  return out
}

/** The shape of a stored value, never its bytes: the api uses the value as stored, newline included. */
function shapeOf(raw: string): string {
  const trailing = raw.length - raw.trimEnd().length
  const leading = raw.length - raw.trimStart().length
  const tail = raw.slice(raw.trimEnd().length).replace(/\r/g, '\\r').replace(/\n/g, '\\n').replace(/ /g, '\\s')
  return `${raw.length} chars (${raw.trim().length} without whitespace; leading ${leading}, trailing ${trailing}${trailing ? ` = "${tail}"` : ''})`
}

const results: { step: string; ok: boolean; detail: string }[] = []
function record(step: string, ok: boolean, detail: string): void {
  results.push({ step, ok, detail })
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${step}: ${detail}`)
}

async function mint(sub: string, role: 'ADMIN' | 'WORKER', key: string, ttlS = 300): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  return new SignJWT({ sub, role, iss: 'remonta-app', aud: 'remonta-api', jti: crypto.randomUUID() })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT', kid: 'current' })
    .setIssuedAt(now)
    .setExpirationTime(now + ttlS)
    .sign(new TextEncoder().encode(key))
}

interface Reply {
  status: number
  headers: Headers
  body: unknown
  ms: number
}
async function call(path: string, headers: Record<string, string> = {}, base = BASE): Promise<Reply> {
  const started = performance.now()
  const res = await fetch(`${base}${path}`, { headers })
  const ms = performance.now() - started
  const text = await res.text()
  let body: unknown = text
  try {
    body = text ? JSON.parse(text) : null
  } catch {
    /* not json */
  }
  return { status: res.status, headers: res.headers, body, ms }
}
const auth = (token: string, extra: Record<string, string> = {}) => ({ authorization: `Bearer ${token}`, ...extra })
const cacheHeaders = (r: Reply) => `cache-control="${r.headers.get('cache-control')}" etag=${r.headers.get('etag') ? 'present' : 'absent'} vary="${r.headers.get('vary')}"`

async function main(): Promise<void> {
  const rawKey = secret('API_TOKEN_SECRET')
  let key = rawKey.trim()
  const dbUrl = secret('AUTH_DATABASE_URL').trim()
  if (key.length < 32) throw new Error('the token secret is shorter than 32 characters; is gcloud pointed at remonta-api-510206?')
  const host = new URL(dbUrl).hostname
  if (/^(localhost|127\.0\.0\.1)$/.test(host)) throw new Error(`refusing to run against ${host}: this checklist targets the staging database only`)
  console.log(`database host: ${host}\ntoken secret as stored: ${shapeOf(rawKey)}`)
  const db = createDb(dbUrl, { poolSize: 2, poolTimeoutS: 30 })

  // 0. who to be
  const [admin] = await db.$queryRaw<{ id: string }[]>`SELECT id FROM users WHERE role = 'ADMIN' AND status = 'ACTIVE' ORDER BY "createdAt" LIMIT 1`
  const [worker] = await db.$queryRaw<{ id: string }[]>`SELECT id FROM users WHERE role = 'WORKER' AND status = 'ACTIVE' ORDER BY "createdAt" LIMIT 1`
  if (!admin || !worker) throw new Error('staging has no active ADMIN or no active WORKER user')
  console.log(`base: ${BASE}\nadmin user: ${admin.id}  worker user: ${worker.id}\n`)

  // 1. health
  const health = await call('/v1/health')
  record('health', health.status === 200, `${health.status} in ${health.ms.toFixed(0)} ms`)

  // 1b. which bytes the api signs with: the trimmed value (what Vercel holds) or the value exactly as stored
  let probe = await call('/v1/admin/workers?page=1', auth(await mint(admin.id, 'ADMIN', key)))
  if (probe.status === 401) {
    // gcloud on Windows prints in text mode, so the bytes it shows may differ from the stored bytes by a
    // carriage return; try the stored shape and the usual line endings.
    const endings: Record<string, string> = { 'as printed': rawKey, 'LF': `${key}\n`, 'CRLF': `${key}\r\n`, 'CR CR LF': `${key}\r\r\n`, 'CR': `${key}\r` }
    for (const [label, candidate] of Object.entries(endings)) {
      if (candidate === key) continue
      const r = await call('/v1/admin/workers?page=1', auth(await mint(admin.id, 'ADMIN', candidate)))
      if (r.status === 200) {
        record('secret bytes', false, `the api accepts only a token signed with the value plus a trailing "${label}" ending; Vercel holds the trimmed value, so the app and the api disagree. Fix: add a secret version without the trailing whitespace and redeploy. Continuing with that ending so the rest of the checklist runs.`)
        key = candidate
        probe = r
        break
      }
    }
  }
  if (probe.status === 401) record('secret bytes', false, `a freshly minted ADMIN token is refused (401) with the trimmed value and with every usual line ending: the running revision holds a different secret than Secret Manager's latest version`)
  else if (key === rawKey.trim()) record('secret bytes', rawKey === key, rawKey === key ? 'the stored value has no surrounding whitespace' : 'the api signs with the trimmed value (the whitespace shown is gcloud output translation only)')

  const adminToken = await mint(admin.id, 'ADMIN', key)
  const workerToken = await mint(worker.id, 'WORKER', key)
  const tampered = adminToken.slice(0, -2) + (adminToken.endsWith('A') ? 'B' : 'A') + adminToken.slice(-1)

  // 2. the auth trio and the tampered token
  const noToken = await call('/v1/admin/workers?page=1')
  record('no token -> 401', noToken.status === 401, `${noToken.status}`)
  const asWorker = await call('/v1/admin/workers?page=1', auth(workerToken))
  record('WORKER token -> 403', asWorker.status === 403, `${asWorker.status}`)
  const bad = await call('/v1/admin/workers?page=1', auth(tampered))
  record('tampered token -> 401', bad.status === 401, `${bad.status} (look for reason=bad-signature in Cloud Logging)`)
  const page1 = await call('/v1/admin/workers?page=1', auth(adminToken))
  const p1 = page1.body as { pagination?: { total: number }; unplacedCount?: number; data?: unknown[] }
  record('ADMIN token -> 200', page1.status === 200, `${page1.status}; total ${p1.pagination?.total} unplaced ${p1.unplacedCount} rows ${p1.data?.length}; ${cacheHeaders(page1)}`)

  // 3. private caching: ETag/304 on the search and the two lists
  // the users list requires at least two characters of search (admin.contract.ts)
  for (const path of ['/v1/admin/workers?page=1', '/v1/admin/users?search=an', '/v1/admin/workers/suspended?page=1']) {
    const first = await call(path, auth(adminToken))
    const etag = first.headers.get('etag')
    const again = etag ? await call(path, auth(adminToken, { 'if-none-match': etag })) : undefined
    const privateOk = /private/.test(first.headers.get('cache-control') ?? '') && /max-age=60/.test(first.headers.get('cache-control') ?? '')
    record(`${path} caching`, first.status === 200 && privateOk && !!etag && again?.status === 304, `${first.status}; ${cacheHeaders(first)}; If-None-Match -> ${again?.status ?? 'n/a'}`)
  }

  // 4. geography: a suburb, a radius, the distance sort
  const loc = await call('/v1/localities?q=parramatta%202150')
  const locality = (loc.body as { localities?: { id: number; suburb: string; state: string }[] }).localities?.[0]
  if (!locality) throw new Error(`no locality for parramatta on ${BASE}`)
  for (const km of [10, 50]) {
    const r = await call(`/v1/admin/workers?localityId=${locality.id}&withinKm=${km}&pageSize=100`, auth(adminToken, { 'cache-control': 'no-cache' }))
    const b = r.body as { data?: { distanceKm?: number }[]; pagination?: { total: number }; unplacedCount?: number }
    const rows = b.data ?? []
    const sorted = rows.every((x, i) => i === 0 || (rows[i - 1]!.distanceKm ?? 0) <= (x.distanceKm ?? 0))
    const within = rows.every((x) => (x.distanceKm ?? Infinity) <= km)
    record(`${locality.suburb} ${locality.state} within ${km} km`, r.status === 200 && sorted && within, `${r.status}; total ${b.pagination?.total}, unplaced ${b.unplacedCount}, page ${rows.length} rows, nearest ${rows[0]?.distanceKm ?? '-'} km, farthest ${rows.at(-1)?.distanceKm ?? '-'} km, sorted=${sorted} within=${within}, ${r.ms.toFixed(0)} ms`)
  }
  const anyDist = await call(`/v1/admin/workers?localityId=${locality.id}&pageSize=100`, auth(adminToken, { 'cache-control': 'no-cache' }))
  const ad = anyDist.body as { data?: { distanceKm?: number }[]; pagination?: { total: number } }
  record(`${locality.suburb} any distance`, anyDist.status === 200, `${anyDist.status}; total ${ad.pagination?.total}, nearest ${ad.data?.[0]?.distanceKm ?? '-'} km, ${anyDist.ms.toFixed(0)} ms`)
  const unknown = await call('/v1/admin/workers?localityId=999999999', auth(adminToken))
  record('unknown localityId -> 400', unknown.status === 400, `${unknown.status} ${JSON.stringify((unknown.body as { error?: { fields?: unknown } })?.error?.fields ?? '')}`)
  const strict = await call('/v1/admin/workers?nope=1', auth(adminToken))
  record('unknown parameter -> 400', strict.status === 400, `${strict.status}`)

  // 5. the plan of the slowest geo case (50 km with the distance sort) and the indexes
  const parsed = workerSearchQuerySchema.parse({ localityId: String(locality.id), withinKm: '50', pageSize: '100' })
  const q = normaliseQuery(parsed, new Date())
  const stmt = searchStatement(q, locality.id)
  const plan = await db.$queryRaw<{ 'QUERY PLAN': string }[]>(Prisma.sql`EXPLAIN (ANALYZE, BUFFERS) ${stmt}`)
  const planText = plan.map((r) => r['QUERY PLAN']).join('\n')
  const usesGist = /Index Scan|Bitmap Index Scan/.test(planText) && /worker_locations/.test(planText)
  console.log('\n--- EXPLAIN (ANALYZE, BUFFERS), parramatta 50 km, distance sort ---\n' + planText + '\n')
  const indexes = await db.$queryRaw<{ indexname: string; indexdef: string }[]>`SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'worker_locations' ORDER BY indexname`
  console.log('--- indexes on worker_locations ---\n' + indexes.map((i) => `${i.indexname}: ${i.indexdef}`).join('\n') + '\n')
  const gist = indexes.find((i) => /USING gist/i.test(i.indexdef) && /point/.test(i.indexdef))
  record('GiST index on worker_locations.point', !!gist, gist ? gist.indexname : 'none found')
  record('plan uses an index on worker_locations', usesGist, usesGist ? 'index scan present' : 'sequential scan only (fine while the table is small; re-check at 10k rows)')
  const execMs = /Execution Time: ([\d.]+) ms/.exec(planText)?.[1]
  record('statement execution time', Number(execMs ?? 0) < 500, `${execMs ?? '?'} ms`)

  // 6. S9: twelve concurrent distinct searches
  if (!skipDrill) {
    const drill = await Promise.all(
      Array.from({ length: 12 }, (_, i) => call(`/v1/admin/workers?search=${encodeURIComponent(['an', 'el', 'is', 'on', 'ar', 'en', 'li', 'ma', 'sa', 'ra', 'jo', 'da'][i]!)}&pageSize=50`, auth(adminToken, { 'cache-control': 'no-cache' }))),
    )
    const counts = drill.reduce<Record<number, number>>((acc, r) => ({ ...acc, [r.status]: (acc[r.status] ?? 0) + 1 }), {})
    const retryAfter = drill.filter((r) => r.status === 503 || r.status === 429).every((r) => r.headers.get('retry-after'))
    const slowest = Math.max(...drill.map((r) => r.ms))
    const after = await call('/v1/admin/workers?page=1', auth(adminToken, { 'cache-control': 'no-cache' }))
    record('S9 drill: 12 concurrent searches', Object.keys(counts).every((s) => ['200', '503', '429'].includes(s)) && retryAfter && after.status === 200, `statuses ${JSON.stringify(counts)}, slowest ${slowest.toFixed(0)} ms, Retry-After on every shed reply=${retryAfter}, recovery -> ${after.status}`)
  }

  // 7. production unchanged
  const prodHealth = await call('/v1/health', {}, PROD)
  const prodAdmin = await call('/v1/admin/workers?page=1', {}, PROD)
  record('production unchanged', prodHealth.status === 200 && prodAdmin.status === 404, `prod health ${prodHealth.status}; prod /v1/admin/workers ${prodAdmin.status} (404 = entry not promoted yet)`)

  await db.$disconnect()

  // 8. timing (and parity when a preview is given), through the parity script
  if (!skipTime) {
    const freshToken = await mint(admin.id, 'ADMIN', key)
    const common = ['--import', 'tsx', 'scripts/parity-admin-search.ts', `--new=${BASE}`, `--token=${freshToken}`]
    console.log('\n--- timing replay (parity script, --time) ---')
    const t = spawnSync(process.execPath, [...common, '--time'], { stdio: 'inherit' })
    record('timing replay exit', t.status === 0, `exit ${t.status}`)
    if (process.env.PREVIEW_URL && process.env.PREVIEW_COOKIE) {
      console.log('\n--- parity against the preview\'s old route ---')
      const p = spawnSync(process.execPath, [...common, `--old=${process.env.PREVIEW_URL}`, `--cookie=${process.env.PREVIEW_COOKIE}`], { stdio: 'inherit' })
      record('parity exit', p.status === 0, `exit ${p.status}`)
    } else {
      console.log('\n(parity against the old route skipped: set PREVIEW_URL and PREVIEW_COOKIE to run it)')
    }
  }

  const failed = results.filter((r) => !r.ok)
  console.log(`\n${results.length - failed.length}/${results.length} checks passed${failed.length ? `; failed: ${failed.map((f) => f.step).join(', ')}` : ''}`)
  process.exit(failed.length ? 1 : 0)
}

main().catch((err) => {
  console.error('staging-admin-check failed:', err instanceof Error ? err.message : err)
  process.exit(2)
})
