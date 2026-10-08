// Parity and timing of the admin worker search (U2, NFR-02, US-AS-16; NFR plan Q1 A).
//
//   pnpm --filter @remonta/api parity:admin-search -- --old=<preview base url> --cookie="<session cookie>" \
//        --new=<staging api url> --token=<admin jwt> [--cases=scripts/parity-cases.json] [--time]
//
// For every case: today's route (GET <old>/api/admin/contractors?<old query>, with the
// NextAuth cookie) and the new entry (GET <new>/v1/admin/workers?<canonical query>,
// with the bearer token, Cache-Control: no-cache so the memo is bypassed). It compares
// the sorted id sets and the totals. Without a suburb a difference fails the run; with a
// suburb a difference is listed for explanation (the known losses L1-L5, L7 of the
// inventory) and fails the run unless the case carries `expectDifference: true`.
// --time repeats each case 10 times against the new entry and prints p50/p95 (ms), paced under the
// entry's per-admin limit (120 per minute: one call every --pace=550 ms by default).
import { readFile } from 'node:fs/promises'
import { adminContract, canonicalQueryOf, createClient, registrationContract, type WorkerSearchQuery } from '@remonta/api-contract'

interface Case {
  name: string
  /** Today's query string, exactly as the dashboard sends it. */
  old: string
  /** The new entry's query (canonical values). */
  new: WorkerSearchQuery
  /** "suburb postcode" for the public localities entry; its id replaces `new.localityId` (0 in the file). */
  locality?: string
  /** A suburb is involved: differences are expected and must be explained, not fatal. */
  expectDifference?: boolean
}

interface OldResponse {
  success: boolean
  data: { id: string }[]
  pagination: { total: number }
}

function flag(name: string): string | undefined {
  const a = process.argv.find((x) => x.startsWith(`--${name}=`))
  return a ? a.slice(name.length + 3) : undefined
}

const oldBase = flag('old')
const cookie = flag('cookie')
const newBase = flag('new')
const token = flag('token')
const casesPath = flag('cases') ?? new URL('./parity-cases.json', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')
const timeMode = process.argv.includes('--time')
const paceMs = Number(flag('pace') ?? 550)
const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

if (!newBase || !token) {
  console.error('usage: parity-admin-search --new=<api base> --token=<jwt> [--old=<app base> --cookie=<cookie>] [--cases=<file>] [--time]')
  process.exit(2)
}

const cases = JSON.parse(await readFile(casesPath, 'utf8')) as Case[]
const localities = createClient(registrationContract, { baseUrl: newBase })
for (const c of cases) {
  if (!c.locality) continue
  const res = await localities.searchLocalities({ query: { q: c.locality } })
  const first = res.ok ? res.body.localities[0] : undefined
  if (!first) throw new Error(`${c.name}: no locality for "${c.locality}" on ${newBase}`)
  c.new = { ...c.new, localityId: first.id }
}
const api = createClient(adminContract, { baseUrl: newBase, headers: { authorization: `Bearer ${token}`, 'cache-control': 'no-cache' } })

async function callNew(c: Case): Promise<{ ids: string[]; total: number; ms: number }> {
  const started = performance.now()
  const res = await api.searchWorkers({ query: { ...c.new, pageSize: 100 } as never })
  const ms = performance.now() - started
  if (!res.ok) throw new Error(`${c.name}: new entry answered ${res.status} ${JSON.stringify(res.body)}`)
  return { ids: res.body.data.map((r) => r.id).sort(), total: res.body.pagination.total, ms }
}

async function callOld(c: Case): Promise<{ ids: string[]; total: number }> {
  const res = await fetch(`${oldBase}/api/admin/contractors?${c.old}${c.old ? '&' : ''}pageSize=100`, { headers: { cookie: cookie! } })
  if (!res.ok) throw new Error(`${c.name}: old route answered ${res.status}`)
  const body = (await res.json()) as OldResponse
  return { ids: body.data.map((r) => r.id).sort(), total: body.pagination.total }
}

const pct = (xs: number[], p: number) => {
  const s = [...xs].sort((a, b) => a - b)
  return s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))] ?? 0
}

let failures = 0
const allMs: number[] = []
console.log(`cases: ${cases.length}  new: ${newBase}  old: ${oldBase ?? '(skipped)'}  mode: ${timeMode ? 'timing' : 'parity'}`)
for (const c of cases) {
  const canonical = canonicalQueryOf(adminContract.entries.searchWorkers, c.new)
  if (timeMode) {
    const times: number[] = []
    for (let i = 0; i < 10; i++) {
      const started = performance.now()
      times.push((await callNew(c)).ms)
      const rest = paceMs - (performance.now() - started)
      if (rest > 0) await sleep(rest)
    }
    allMs.push(...times)
    console.log(`${c.name.padEnd(40)} p50 ${pct(times, 50).toFixed(0).padStart(5)} ms  p95 ${pct(times, 95).toFixed(0).padStart(5)} ms   ?${canonical}`)
    continue
  }
  const n = await callNew(c)
  if (!oldBase || !cookie) {
    console.log(`${c.name.padEnd(40)} new: ${n.total} rows   ?${canonical}`)
    continue
  }
  const o = await callOld(c)
  const same = o.total === n.total && o.ids.join() === n.ids.join()
  const onlyOld = o.ids.filter((id) => !n.ids.includes(id))
  const onlyNew = n.ids.filter((id) => !o.ids.includes(id))
  const mark = same ? 'same' : c.expectDifference ? 'DIFF (expected: explain)' : 'DIFF (unexpected)'
  if (!same && !c.expectDifference) failures++
  console.log(`${c.name.padEnd(40)} old ${String(o.total).padStart(4)}  new ${String(n.total).padStart(4)}  ${mark}${same ? '' : `  only-old=${onlyOld.length} only-new=${onlyNew.length}`}`)
  if (!same) console.log(`    old: ?${c.old}\n    new: ?${canonical}\n    only-old: ${onlyOld.slice(0, 10).join(', ')}\n    only-new: ${onlyNew.slice(0, 10).join(', ')}`)
}
if (timeMode) console.log(`overall p50 ${pct(allMs, 50).toFixed(0)} ms  p95 ${pct(allMs, 95).toFixed(0)} ms  (${allMs.length} calls; target p95 < 500 ms, NFR-01)`)
else console.log(failures ? `${failures} unexpected difference(s)` : 'parity: every case without a suburb matches')
process.exit(failures ? 1 : 0)
