// The worker area's checklist runner (worker-profile-api U1, 2026-10-12; docs/worker/README.md §7):
//
//   cd apps/api && node --import tsx scripts/worker-check.ts [--stage=prod]
//
// Mirrors staging-admin-check.ts: the stage's token secret and database URL through
// `gcloud secrets versions access` (staging by default, prod with --stage=prod), a minted
// five-minute token for the first active worker, the newest placed worker with services,
// the first admin and a WORKER account without a profile, then the 14 checks of PR 1's
// verification. Read-only. Prints results only: never a secret, never a token.
import { execSync } from 'node:child_process'
import { profileSchema } from '@remonta/api-contract'
import { SignJWT } from 'jose'
import { createDb } from '../src/platform/persistence/db'

const STAGE = process.argv.includes('--stage=prod') ? 'prod' : 'staging'
const STAGING = 'https://remonta-api-staging-154148201608.australia-southeast1.run.app'
const PROD = 'https://remonta-api-154148201608.australia-southeast1.run.app'
const BASE = STAGE === 'prod' ? PROD : STAGING
const SECRET_PREFIX = STAGE === 'prod' ? 'remonta-api' : 'remonta-api-staging'

function secret(name: string): string {
  if (!/^[A-Z_]+$/.test(name)) throw new Error('bad name')
  return execSync(`gcloud secrets versions access latest --secret=${SECRET_PREFIX}-${name}`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] })
}
const results: { step: string; ok: boolean; detail: string }[] = []
const record = (step: string, ok: boolean, detail: string) => {
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
async function call(path: string, headers: Record<string, string> = {}, base = BASE) {
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
  return { status: res.status, headers: res.headers, body, text, ms }
}
const auth = (t: string, extra: Record<string, string> = {}) => ({ authorization: `Bearer ${t}`, ...extra })

async function main() {
  const rawKey = secret('API_TOKEN_SECRET')
  let key = rawKey.trim()
  const dbUrl = secret('AUTH_DATABASE_URL').trim()
  const host = new URL(dbUrl).hostname
  if (STAGE === 'staging' && /ep-delicate-recipe|ep-polished-thunder|localhost/.test(host)) throw new Error(`refusing host ${host}`)
  console.log(`stage ${STAGE}: ${BASE}`)
  console.log(`database host: ${host}; secret as stored: ${rawKey.length} chars (${key.length} trimmed)`)
  const db = createDb(dbUrl, { poolSize: 2, poolTimeoutS: 30 })
  const [worker] = await db.$queryRaw<{ id: string }[]>`SELECT u.id FROM users u JOIN worker_profiles p ON p."userId" = u.id WHERE u.role = 'WORKER' AND u.status = 'ACTIVE' ORDER BY u."createdAt" LIMIT 1`
  const [admin] = await db.$queryRaw<{ id: string }[]>`SELECT id FROM users WHERE role = 'ADMIN' AND status = 'ACTIVE' ORDER BY "createdAt" LIMIT 1`
  const [orphan] = await db.$queryRaw<{ id: string }[]>`SELECT u.id FROM users u LEFT JOIN worker_profiles p ON p."userId" = u.id WHERE u.role = 'WORKER' AND p.id IS NULL ORDER BY u."createdAt" LIMIT 1`
  const [placed] = await db.$queryRaw<{ id: string }[]>`SELECT u.id FROM users u JOIN worker_profiles p ON p."userId" = u.id JOIN worker_locations l ON l."workerProfileId" = p.id AND l.kind = 'HOME' JOIN worker_services s ON s."workerProfileId" = p.id WHERE u.role = 'WORKER' AND u.status = 'ACTIVE' ORDER BY u."createdAt" DESC LIMIT 1`
  await db.$disconnect()
  if (!worker || !admin) throw new Error('no worker or admin on staging')
  console.log(`worker ${worker.id}, placed worker ${placed?.id ?? '(none)'}, admin ${admin.id}, orphan ${orphan?.id ?? '(none)'}\n`)

  const health = await call('/v1/health')
  record(`${STAGE} health`, health.status === 200, `${health.status} in ${health.ms.toFixed(0)} ms`)

  // The secret-bytes dance from staging-admin-check.ts: the api signs with the value as stored.
  let probe = await call('/v1/worker/profile', auth(await mint(worker.id, 'WORKER', key)))
  if (probe.status === 401) {
    for (const [label, candidate] of Object.entries({ 'as stored': rawKey, LF: `${key}\n`, CRLF: `${key}\r\n`, CR: `${key}\r` })) {
      if (candidate === key) continue
      const r = await call('/v1/worker/profile', auth(await mint(worker.id, 'WORKER', candidate)))
      if (r.status === 200) {
        record('secret bytes', false, `the api signs with the value plus "${label}"; continuing with it`)
        key = candidate
        probe = r
        break
      }
    }
  }
  const who = placed?.id ?? worker.id
  const workerToken = await mint(who, 'WORKER', key)
  const adminToken = await mint(admin.id, 'ADMIN', key)

  const read = await call('/v1/worker/profile', auth(workerToken))
  const parsed = read.status === 200 ? profileSchema.safeParse(read.body) : undefined
  const p = parsed?.success ? parsed.data : undefined
  record('WORKER read -> 200 in the contract shape', read.status === 200 && !!parsed?.success, `${read.status} in ${read.ms.toFixed(0)} ms; ${parsed && !parsed.success ? parsed.error.issues.map((i) => i.path.join('.')).join(',') : 'parses'}`)
  if (p) {
    console.log(`      displayRole="${p.displayRole}" services=${p.services.length} serviceArea=${p.serviceArea ? p.serviceArea.label : 'null'} verificationStatus=${p.verificationStatus}`)
    console.log(`      completion=${JSON.stringify(p.completion)}`)
    console.log(`      mandatory=${p.requirements.mandatory.map((i) => `${i.id}:${i.status}`).join(' ')}`)
    console.log(`      trainings=${p.requirements.trainings.map((i) => `${i.id}:${i.status}`).join(' ')}`)
    console.log(`      sections: availability ${p.sections.availability.length}, experience ${p.sections.experience.length}, jobs ${p.sections.jobHistory.length}, education ${p.sections.education.length}, additionalInfo ${p.sections.additionalInfo ? 'yes' : 'null'}, bankAccount ${p.sections.bankAccount ? 'masked' : 'null'}`)
    record('no raw bank numbers in the body', !/"bsb"|"accountNumber"/.test(read.text), 'checked')
  }
  record('cache headers', read.headers.get('cache-control') === 'private, max-age=60' && !!read.headers.get('etag') && read.headers.get('vary') === 'Authorization', `cache-control="${read.headers.get('cache-control')}" etag=${read.headers.get('etag') ? 'present' : 'absent'} vary="${read.headers.get('vary')}"`)
  const etag = read.headers.get('etag')
  const again = etag ? await call('/v1/worker/profile', auth(workerToken, { 'if-none-match': etag })) : undefined
  record('If-None-Match -> 304, same ETag', !!again && again.status === 304 && again.headers.get('etag') === etag && again.text === '', again ? `${again.status} in ${again.ms.toFixed(0)} ms, body ${again.text.length} bytes` : 'no etag')
  const twice = await call('/v1/worker/profile', auth(workerToken))
  record('same body twice (P4)', twice.status === 200 && twice.headers.get('etag') === etag, `etag ${twice.headers.get('etag') === etag ? 'equal' : 'DIFFERENT'}`)

  const none = await call('/v1/worker/profile')
  record('no token -> 401', none.status === 401, `${none.status}`)
  const asAdmin = await call('/v1/worker/profile', auth(adminToken))
  record('ADMIN token -> 403', asAdmin.status === 403, `${asAdmin.status}`)
  const tampered = workerToken.slice(0, -2) + (workerToken.endsWith('A') ? 'B' : 'A') + workerToken.slice(-1)
  const bad = await call('/v1/worker/profile', auth(tampered))
  record('tampered token -> 401', bad.status === 401, `${bad.status}`)
  if (orphan) {
    const o = await call('/v1/worker/profile', auth(await mint(orphan.id, 'WORKER', key)))
    record('WORKER without a profile -> 404 envelope', o.status === 404 && (o.body as { error?: { code?: string } })?.error?.code === 'NOT_FOUND', `${o.status} ${JSON.stringify(o.body).slice(0, 80)}`)
  }
  const q = await call('/v1/worker/profile?userId=x', auth(workerToken))
  record('query parameter -> 400', q.status === 400, `${q.status}`)
  const adminList = await call('/v1/admin/workers?page=1', auth(adminToken))
  record('admin search still 200', adminList.status === 200, `${adminList.status} in ${adminList.ms.toFixed(0)} ms`)

  // Ten quick reads for a latency feel.
  const times: number[] = []
  for (let i = 0; i < 10; i++) times.push((await call('/v1/worker/profile', auth(workerToken))).ms)
  times.sort((a, b) => a - b)
  record('ten reads', true, `min ${times[0]!.toFixed(0)} ms, median ${times[5]!.toFixed(0)} ms, max ${times[9]!.toFixed(0)} ms (from this machine)`)

  // The other stage keeps answering.
  const other = STAGE === 'prod' ? STAGING : PROD
  const otherHealth = await call('/v1/health', {}, other)
  record(`the other stage (${STAGE === 'prod' ? 'staging' : 'prod'}) health`, otherHealth.status === 200, `${otherHealth.status}`)

  const failed = results.filter((r) => !r.ok)
  console.log(`\n${failed.length === 0 ? 'ALL PASS' : `${failed.length} FAILED`} (${results.length} checks)`)
  process.exit(failed.length ? 1 : 0)
}
main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
