// The worker-area load test (U1 worker-area, R7, L7, NFR pattern P10; runbook in
// aidlc-docs/construction/worker-area/infrastructure-design/infrastructure-design.md §4).
//
//   cd apps/api && pnpm exec tsx scripts/load-worker.ts --base-url <staging api url> \
//       --workers 200 --rate 25 --minutes 10 --burst 5 --report <file.json>
//
// Staging only: the base URL's host must contain "staging" and the database host must
// not be production's (exit 2 otherwise). Reads STAGING_API_TOKEN_SECRET and
// STAGING_AUTH_DATABASE_URL (the plain variables are ignored, as staging-admin-check.ts
// does), picks N active workers with a profile, mints a 5-minute token each (re-minted
// after 4 minutes), and drives autocannon under a fixed rate: a 60 s warm-up (not
// counted), phase A for --minutes at --rate, phase B for 60 s at --rate x --burst, then
// a 60 s recovery window at --rate. 70 % of requests are profile reads, half of those
// conditional (If-None-Match with the worker's last ETag); the 30 % section-write share
// exists from U2 on -- in U1 the mix is reads only and the report says so. A 429/503
// with Retry-After puts that worker in back-off for the given seconds (the test measures
// shedding, it does not fight it). Never prints a token, never writes production data,
// never exceeds --rate x --burst. Exit 0 only when every threshold row passes (U1-PRF-03).
import { execSync } from 'node:child_process'
import { writeFile } from 'node:fs/promises'
import type { IncomingHttpHeaders } from 'node:http'
import autocannon from 'autocannon'
import { SignJWT } from 'jose'
import { createDb } from '../src/platform/persistence/db'

// ---- Options and guards (pure, tested) ---------------------------------------------

export interface LoadOptions {
  baseUrl: string
  workers: number
  rate: number
  minutes: number
  burst: number
  warmupSeconds: number
  report?: string
  /** --reads-only: U1's mix (no writes). */
  readsOnly: boolean
}

export function parseArgs(argv: readonly string[]): LoadOptions {
  const flag = (name: string) => {
    const i = argv.findIndex((a) => a === `--${name}` || a.startsWith(`--${name}=`))
    if (i === -1) return undefined
    const a = argv[i]!
    return a.includes('=') ? a.slice(a.indexOf('=') + 1) : argv[i + 1]
  }
  const num = (name: string, fallback: number, min: number, max: number) => {
    const raw = flag(name)
    const n = raw === undefined ? fallback : Number(raw)
    if (!Number.isFinite(n) || n < min || n > max) throw new Error(`--${name} must be a number in ${min}..${max}`)
    return n
  }
  const baseUrl = flag('base-url')
  if (!baseUrl) throw new Error('--base-url is required')
  return {
    baseUrl: baseUrl.replace(/\/+$/, ''),
    workers: num('workers', 100, 1, 5000),
    rate: num('rate', 25, 1, 2000),
    minutes: num('minutes', 10, 0.1, 120),
    burst: num('burst', 1, 1, 20),
    warmupSeconds: num('warmup-seconds', 60, 0, 600),
    report: flag('report'),
    readsOnly: argv.includes('--reads-only'),
  }
}

/** The production Neon hosts (scripts/local/dev-env.sh). */
const PRODUCTION_DB_HOSTS = [/ep-delicate-recipe/, /ep-polished-thunder/]

/** R7.1: the problems that stop the run; empty when staging is the target. */
export function guardTargets(baseUrl: string, databaseUrl: string): string[] {
  const problems: string[] = []
  let apiHost = ''
  try {
    apiHost = new URL(baseUrl).hostname
  } catch {
    problems.push(`base URL is not a URL`)
  }
  if (apiHost && !/staging/.test(apiHost)) problems.push(`base URL host "${apiHost}" is not a staging host`)
  let dbHost = ''
  try {
    dbHost = new URL(databaseUrl).hostname
  } catch {
    problems.push('database URL is not a URL')
  }
  if (dbHost && PRODUCTION_DB_HOSTS.some((p) => p.test(dbHost))) problems.push(`database host "${dbHost}" is production's`)
  if (dbHost && /^(localhost|127\.0\.0\.1)$/.test(dbHost)) problems.push(`database host "${dbHost}" is local: the load test targets the staging copy`)
  return problems
}

export type RequestKind = 'read' | 'read-conditional' | 'write'

/** R7.2: 70 % reads (half conditional), 30 % section writes once U2 ships; until then the write share is a read. */
export function chooseRequest(roll: number, writesAvailable: boolean): RequestKind {
  if (roll < 0.35) return 'read'
  if (roll < 0.7) return 'read-conditional'
  return writesAvailable ? 'write' : 'read'
}

// ---- Thresholds (NFR requirements Q2, U1-PRF-03) ----------------------------------------

export interface PhaseStats {
  requests: number
  latency: { p50: number; p95: number; p99: number }
  /** Latency over admitted answers only (2xx/304) when the phase can shed. */
  admittedLatency?: { p95: number }
  status: Record<string, number>
  errors: number
  timeouts: number
  /** Seconds after the phase start of the last 503 seen, or null. */
  lastUnavailableAtS: number | null
}

export interface ThresholdRow {
  phase: 'sustained' | 'burst' | 'recovery'
  rule: string
  actual: string
  pass: boolean
}

const count = (s: PhaseStats, pred: (code: number) => boolean) => Object.entries(s.status).reduce((n, [c, k]) => n + (pred(Number(c)) ? k : 0), 0)

export function evaluate(phases: { sustained: PhaseStats; burst?: PhaseStats; recovery?: PhaseStats }): { rows: ThresholdRow[]; pass: boolean } {
  const rows: ThresholdRow[] = []
  const s = phases.sustained
  rows.push({ phase: 'sustained', rule: 'p95 <= 300 ms', actual: `${s.latency.p95} ms`, pass: s.latency.p95 <= 300 })
  rows.push({ phase: 'sustained', rule: 'p99 <= 800 ms', actual: `${s.latency.p99} ms`, pass: s.latency.p99 <= 800 })
  const s429 = count(s, (c) => c === 429)
  const s5xx = count(s, (c) => c >= 500)
  rows.push({ phase: 'sustained', rule: 'no 429', actual: String(s429), pass: s429 === 0 })
  rows.push({ phase: 'sustained', rule: 'no 503 / 5xx', actual: String(s5xx), pass: s5xx === 0 })
  rows.push({ phase: 'sustained', rule: 'no errors or timeouts', actual: `${s.errors} errors, ${s.timeouts} timeouts`, pass: s.errors === 0 && s.timeouts === 0 })
  if (phases.burst) {
    const b = phases.burst
    const other5xx = count(b, (c) => c >= 500 && c !== 503)
    rows.push({ phase: 'burst', rule: 'no 5xx other than 503', actual: String(other5xx), pass: other5xx === 0 })
    const p95 = b.admittedLatency?.p95 ?? b.latency.p95
    rows.push({ phase: 'burst', rule: 'p95 of admitted <= 1000 ms', actual: `${p95} ms`, pass: p95 <= 1000 })
    rows.push({ phase: 'burst', rule: 'no errors or timeouts', actual: `${b.errors} errors, ${b.timeouts} timeouts`, pass: b.errors === 0 && b.timeouts === 0 })
  }
  if (phases.recovery) {
    const r = phases.recovery
    const last = r.lastUnavailableAtS
    rows.push({ phase: 'recovery', rule: 'no 503 after 30 s', actual: last === null ? 'none' : `last at ${last.toFixed(0)} s`, pass: last === null || last <= 30 })
    const r5xx = count(r, (c) => c >= 500 && c !== 503)
    rows.push({ phase: 'recovery', rule: 'no 5xx other than 503', actual: String(r5xx), pass: r5xx === 0 })
  }
  return { rows, pass: rows.every((x) => x.pass) }
}

export function formatRows(rows: ThresholdRow[]): string {
  return rows.map((r) => `${r.pass ? 'PASS' : 'FAIL'}  ${r.phase.padEnd(10)} ${r.rule.padEnd(30)} ${r.actual}`).join('\n')
}

// ---- The run -----------------------------------------------------------------------------

/** Tokens are minted for five minutes; refresh after four (R7.2). */
export const TOKEN_REFRESH_AFTER_MS = 240_000

/** The workers whose token is older than the refresh age (pure, tested). */
export function staleTokens<W extends { mintedAt: number }>(workers: readonly W[], now: number): W[] {
  return workers.filter((w) => now - w.mintedAt > TOKEN_REFRESH_AFTER_MS)
}

interface Worker {
  id: string
  token: string
  mintedAt: number
  etag: string | null
  backoffUntil: number
  /** The worker's own preferred hours, read once at the start: the write share saves them back unchanged (U2). */
  hoursBody: string | null
}

function secret(name: string): string {
  const explicit = process.env[`STAGING_${name}`]
  if (explicit) return explicit.trim()
  if (!/^[A-Z_]+$/.test(name)) throw new Error(`bad secret name ${name}`)
  return execSync(`gcloud secrets versions access latest --secret=remonta-api-staging-${name}`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] }).trim()
}

async function mint(sub: string, key: Uint8Array, ttlS = 300): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  return new SignJWT({ sub, role: 'WORKER', iss: 'remonta-app', aud: 'remonta-api', jti: crypto.randomUUID() })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT', kid: 'current' })
    .setIssuedAt(now)
    .setExpirationTime(now + ttlS)
    .sign(key)
}

interface Recorder {
  status: Record<string, number>
  kinds: Record<RequestKind, number>
  backoffs: number
  skippedInBackoff: number
  admitted: number[]
  lastUnavailableAt: number | null
  startedAt: number
}

async function runPhase(name: string, opts: LoadOptions, workers: Worker[], key: Uint8Array, rate: number, durationS: number, writesAvailable: boolean): Promise<{ stats: PhaseStats; rec: Recorder }> {
  const rec: Recorder = { status: {}, kinds: { read: 0, 'read-conditional': 0, write: 0 }, backoffs: 0, skippedInBackoff: 0, admitted: [], lastUnavailableAt: null, startedAt: Date.now() }
  let cursor = 0
  const pick = (): Worker => {
    const now = Date.now()
    for (let i = 0; i < workers.length; i++) {
      const w = workers[(cursor + i) % workers.length]!
      if (w.backoffUntil <= now) {
        cursor = (cursor + i + 1) % workers.length
        return w
      }
    }
    rec.skippedInBackoff++
    cursor = (cursor + 1) % workers.length
    return workers[cursor]!
  }
  process.stdout.write(`${name}: ${durationS} s at ${rate} req/s ...\n`)
  // Tokens live five minutes and a phase may run ten: refresh the stale ones every 10 s, off the
  // request path (setupRequest is synchronous). The first run (2026-10-12) re-minted only between
  // phases and collected 1,800 × 401 in the second half of the sustained phase.
  const refresher = setInterval(() => {
    void (async () => {
      const now = Date.now()
      for (const w of staleTokens(workers, now)) Object.assign(w, { token: await mint(w.id, key), mintedAt: Date.now() })
    })()
  }, 10_000)
  let result
  try {
    result = await runAutocannon()
  } finally {
    clearInterval(refresher)
  }
  async function runAutocannon() {
  return autocannon({
    url: opts.baseUrl,
    connections: Math.min(100, Math.max(4, Math.ceil(rate / 2))),
    overallRate: rate,
    duration: durationS,
    timeout: 10,
    requests: [
      {
        method: 'GET',
        path: '/v1/worker/profile',
        setupRequest: (req, ctx: object) => {
          const context = ctx as Record<string, unknown>
          const w = pick()
          context.workerId = w.id
          const kind = chooseRequest(Math.random(), writesAvailable)
          rec.kinds[kind]++
          context.sentAt = performance.now()
          const headers: Record<string, string> = { authorization: `Bearer ${w.token}` }
          if (kind === 'read-conditional' && w.etag) headers['if-none-match'] = w.etag
          // The write share (U2): the worker's current hours saved back -- a real write transaction, data unchanged.
          if (kind === 'write' && w.hoursBody) return { ...req, method: 'PUT', path: '/v1/worker/availability', headers: { ...headers, 'content-type': 'application/json' }, body: w.hoursBody }
          return { ...req, method: 'GET', path: '/v1/worker/profile', headers }
        },
        onResponse: (status, _body, ctx: object, headers: IncomingHttpHeaders | undefined) => {
          const context = ctx as Record<string, unknown>
          rec.status[status] = (rec.status[status] ?? 0) + 1
          const w = workers.find((x) => x.id === context.workerId)
          if (status === 200 || status === 304) {
            rec.admitted.push(performance.now() - (context.sentAt as number))
            const etag = headers?.['etag']
            if (w && typeof etag === 'string') w.etag = etag
          }
          if (status === 503) rec.lastUnavailableAt = Date.now()
          if ((status === 429 || status === 503) && w) {
            const ra = Number(headers?.['retry-after'] ?? 2)
            w.backoffUntil = Date.now() + Math.max(1, Math.min(60, Number.isFinite(ra) ? ra : 2)) * 1000
            rec.backoffs++
          }
        },
      },
    ],
  })
  }
  const sorted = [...rec.admitted].sort((a, b) => a - b)
  const pct = (p: number) => (sorted.length ? Math.round(sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))]!) : 0)
  const stats: PhaseStats = {
    requests: result.requests.total,
    latency: { p50: result.latency.p50, p95: result.latency.p97_5 ?? result.latency.p99, p99: result.latency.p99 },
    admittedLatency: { p95: pct(95) },
    status: rec.status,
    errors: result.errors,
    timeouts: result.timeouts,
    lastUnavailableAtS: rec.lastUnavailableAt === null ? null : (rec.lastUnavailableAt - rec.startedAt) / 1000,
  }
  process.stdout.write(`  ${stats.requests} requests, status ${JSON.stringify(stats.status)}, p50 ${stats.latency.p50} ms p99 ${stats.latency.p99} ms, admitted p95 ${stats.admittedLatency!.p95} ms, back-offs ${rec.backoffs}\n`)
  return { stats, rec }
}

async function main(): Promise<void> {
  const opts = parseArgs(process.argv.slice(2))
  const dbUrl = secret('AUTH_DATABASE_URL')
  const problems = guardTargets(opts.baseUrl, dbUrl)
  if (problems.length) {
    console.error(`load-worker: refusing to run:\n  ${problems.join('\n  ')}`)
    process.exit(2)
  }
  const key = new TextEncoder().encode(secret('API_TOKEN_SECRET'))
  if (key.byteLength < 32) throw new Error('the token secret is shorter than 32 characters')

  const db = createDb(dbUrl, { poolSize: 2, poolTimeoutS: 30 })
  const rows = await db.$queryRaw<{ id: string }[]>`SELECT u.id FROM users u JOIN worker_profiles p ON p."userId" = u.id WHERE u.role = 'WORKER' AND u.status = 'ACTIVE' ORDER BY u."createdAt" LIMIT ${opts.workers}`
  await db.$disconnect()
  if (rows.length === 0) throw new Error('staging has no active worker with a profile')
  const workers: Worker[] = []
  for (const r of rows) workers.push({ id: r.id, token: await mint(r.id, key), mintedAt: Date.now(), etag: null, backoffUntil: 0, hoursBody: null })
  // Each worker's own hours, so a write saves back exactly what is stored (idempotent: staging data unchanged).
  for (const w of workers) {
    const res = await fetch(`${opts.baseUrl}/v1/worker/profile`, { headers: { authorization: `Bearer ${w.token}` } })
    if (res.ok) w.hoursBody = JSON.stringify({ slots: ((await res.json()) as { sections: { availability: unknown[] } }).sections.availability })
  }
  const writesAvailable = !opts.readsOnly && workers.some((w) => w.hoursBody !== null)
  console.log(`load-worker: ${opts.baseUrl}, ${workers.length} workers, rate ${opts.rate}/s for ${opts.minutes} min, burst x${opts.burst}; mix: ${writesAvailable ? '70 % reads (half conditional), 30 % PUT availability (each worker’s own hours saved back)' : 'reads only'}`)

  const report: Record<string, unknown> = { startedAt: new Date().toISOString(), baseUrl: opts.baseUrl, workers: workers.length, options: opts, mix: writesAvailable ? '70/30 read/write (PUT availability, idempotent)' : 'reads-only', phases: {} as Record<string, unknown> }
  const phases = report.phases as Record<string, unknown>
  if (opts.warmupSeconds > 0) phases.warmup = (await runPhase('warm-up (not counted)', opts, workers, key, Math.max(1, Math.round(opts.rate / 2)), opts.warmupSeconds, writesAvailable)).stats
  const sustained = (await runPhase('phase A sustained', opts, workers, key, opts.rate, Math.round(opts.minutes * 60), writesAvailable)).stats
  phases.sustained = sustained
  let burst: PhaseStats | undefined
  let recovery: PhaseStats | undefined
  if (opts.burst > 1) {
    burst = (await runPhase('phase B burst', opts, workers, key, Math.round(opts.rate * opts.burst), 60, writesAvailable)).stats
    phases.burst = burst
    recovery = (await runPhase('recovery', opts, workers, key, opts.rate, 60, writesAvailable)).stats
    phases.recovery = recovery
  }
  const verdict = evaluate({ sustained, burst, recovery })
  report.thresholds = verdict.rows
  report.pass = verdict.pass
  console.log(`\n${formatRows(verdict.rows)}\n\n${verdict.pass ? 'PASS' : 'FAIL'}: ${verdict.rows.filter((r) => !r.pass).length} threshold row(s) failed`)
  if (opts.report) {
    await writeFile(opts.report, JSON.stringify(report, null, 2))
    console.log(`report: ${opts.report}`)
  }
  process.exit(verdict.pass ? 0 : 1)
}

const entry = process.argv[1] ?? ''
if (/load-worker\.ts$/.test(entry)) {
  main().catch((err: unknown) => {
    console.error(err instanceof Error ? err.message : err)
    process.exit(1)
  })
}
