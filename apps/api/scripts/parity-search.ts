// Parity of the worker searches (search-locations U1, NFR-2): the app's Next routes against the api's entries, on
// the staging copy of the data.
//
//   pnpm --filter @remonta/api parity:search -- --old=<preview base url> --cookie="<client session cookie>" \
//        --new=<staging api url> --token=<client jwt> [--cases=scripts/parity-search.json] [--pace=550]
//
// For every place in the cases file, every radius, with and without a service, on both searches: every page of the
// old route (GET <old>/api/{client,public}/workers, the cookie for the client one) and of the new entry (GET
// <new>/v1/{client,public}/workers, the bearer token, Cache-Control: no-cache so the memo is bypassed). It compares
// the id sets. Without a place a difference fails the run. With a place each worker found by one side only is
// explained from the database named by REHEARSAL_DATABASE_URL (or DATABASE_URL): no HOME row (FR-4), the legacy
// point away from the HOME point, or within 2 km (or 5 %) of the radius from either point, where Google's point for
// the text and the suburb's centre disagree. Anything else is unexplained and fails the run.
import { readFile } from 'node:fs/promises'
import { createClient, searchContract } from '@remonta/api-contract'
import { resolvePlace, type Place } from '../src/modules/locations/domain/place'
import { placeLookup } from '../src/modules/locations/place-lookup'
import { createDb } from '../src/platform/persistence/db'

interface Cases {
  places: string[]
  clientRadii: number[]
  publicRadii: number[]
  clientService: string
  publicService: string
}

function flag(name: string): string | undefined {
  const a = process.argv.find((x) => x.startsWith(`--${name}=`))
  return a ? a.slice(name.length + 3) : undefined
}

const oldBase = flag('old')
const cookie = flag('cookie')
const newBase = flag('new')
const token = flag('token')
const casesPath = flag('cases') ?? new URL('./parity-search.json', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')
const paceMs = Number(flag('pace') ?? 550)
const dbUrl = process.env.REHEARSAL_DATABASE_URL ?? process.env.DATABASE_URL
const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

if (!oldBase || !cookie || !newBase || !token || !dbUrl) {
  console.error('usage: parity-search --old=<app base> --cookie=<client cookie> --new=<api base> --token=<client jwt>  (REHEARSAL_DATABASE_URL set)')
  process.exit(2)
}
if (/ep-delicate-recipe/.test(dbUrl)) {
  console.error('refusing the production database: point REHEARSAL_DATABASE_URL at the staging copy')
  process.exit(2)
}

const cases = JSON.parse(await readFile(casesPath, 'utf8')) as Cases
const db = createDb(dbUrl)
const places = placeLookup(db)
const api = createClient(searchContract, { baseUrl: newBase, headers: { authorization: `Bearer ${token}`, 'cache-control': 'no-cache' } })

let last = 0
async function paced<T>(call: () => Promise<T>): Promise<T> {
  const wait = last + paceMs - Date.now()
  if (wait > 0) await sleep(wait)
  last = Date.now()
  return call()
}

type Side = 'client' | 'public'

async function oldIds(side: Side, query: Record<string, string>): Promise<Set<string>> {
  const ids = new Set<string>()
  for (let page = 1; ; page++) {
    const res = await paced(() => fetch(`${oldBase}/api/${side}/workers?${new URLSearchParams({ ...query, page: String(page), pageSize: '50' })}`, { headers: side === 'client' ? { cookie: cookie! } : {} }))
    if (!res.ok) throw new Error(`old ${side} answered ${res.status}`)
    const body = (await res.json()) as { data: { id: string }[]; pagination: { hasNext: boolean } }
    for (const r of body.data) ids.add(r.id)
    if (!body.pagination.hasNext) return ids
  }
}

async function newIds(side: Side, query: Record<string, string>): Promise<Set<string>> {
  const ids = new Set<string>()
  for (let page = 1; ; page++) {
    const q = { ...query, page: String(page), pageSize: '50' }
    const res = await paced(async (): Promise<{ ok: boolean; status: number; body: unknown }> => (side === 'client' ? api.searchWorkersForClient({ query: q as never }) : api.searchPublicWorkers({ query: q as never })))
    if (!res.ok) throw new Error(`new ${side} answered ${res.status} ${JSON.stringify(res.body)}`)
    const body = res.body as { data: { id: string }[]; pagination: { hasNext: boolean } }
    for (const r of body.data) ids.add(r.id)
    if (!body.pagination.hasNext) return ids
  }
}

/** Haversine distance in km. */
function km(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180
  const a = Math.sin(toRad(lat2 - lat1) / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(toRad(lng2 - lng1) / 2) ** 2
  return 2 * 6371.0088 * Math.asin(Math.sqrt(a))
}

/** Why a worker is on one side only, or null when nothing explains it. */
async function explain(id: string, place: Place | null, radius: number): Promise<string | null> {
  const w = await db.workerProfile.findUnique({ where: { id }, select: { latitude: true, longitude: true, locations: { where: { kind: 'HOME' }, select: { latitude: true, longitude: true } } } })
  if (!w) return 'gone since the call'
  const home = w.locations[0]
  if (!home) return 'no HOME row (FR-4)'
  if (w.latitude === null || w.longitude === null) return 'no legacy point (old route could not see it)'
  if (km(w.latitude, w.longitude, home.latitude, home.longitude) > 1) return 'legacy point ≠ HOME point'
  // FD-Q1 A: text that pins no suburb ("Gold Coast") is searched without a place; Google gave the old route one.
  if (!place) return 'no place for this text (FD-Q1 A)'
  const edge = Math.max(2, radius * 0.05)
  if (Math.abs(km(home.latitude, home.longitude, place.lat, place.lng) - radius) < edge) return 'at the radius edge (Google point vs suburb centre)'
  return null
}

let unexplained = 0
async function compare(side: Side, label: string, query: Record<string, string>, place: Place | null, radius: number) {
  const [o, n] = [await oldIds(side, query), await newIds(side, query)]
  const onlyOld = [...o].filter((id) => !n.has(id))
  const onlyNew = [...n].filter((id) => !o.has(id))
  const reasons = new Map<string, number>()
  const bad: string[] = []
  for (const id of [...onlyOld, ...onlyNew]) {
    const why = query.location === undefined ? null : await explain(id, place, radius)
    if (why) reasons.set(why, (reasons.get(why) ?? 0) + 1)
    else bad.push(id)
  }
  unexplained += bad.length
  const summary = onlyOld.length + onlyNew.length === 0 ? 'same' : `only-old=${onlyOld.length} only-new=${onlyNew.length}  ${[...reasons].map(([r, c]) => `${r}: ${c}`).join('; ')}${bad.length ? `  UNEXPLAINED: ${bad.slice(0, 5).join(', ')}` : ''}`
  console.log(`${side.padEnd(6)} ${label.padEnd(48)} old ${String(o.size).padStart(4)}  new ${String(n.size).padStart(4)}  ${summary}`)
}

console.log(`old: ${oldBase}  new: ${newBase}  places: ${cases.places.length}`)
await compare('client', '(no place)', { services: cases.clientService }, null, 0)
await compare('public', '(no place)', { typeOfSupport: cases.publicService }, null, 0)
for (const text of cases.places) {
  const place = await resolvePlace(text, places)
  console.log(`-- ${text}: ${place ? `${place.via} ${place.lat.toFixed(4)},${place.lng.toFixed(4)}` : 'no place (searched without one)'}`)
  for (const r of cases.clientRadii) {
    await compare('client', `${text} ${r} km`, { location: text, within: String(r) }, place, r)
    if (r === cases.clientRadii[1]) await compare('client', `${text} ${r} km + service`, { location: text, within: String(r), services: cases.clientService }, place, r)
  }
  for (const r of cases.publicRadii) {
    await compare('public', `${text} ${r} km`, { location: text, within: String(r) }, place, r)
    if (r === cases.publicRadii[1]) await compare('public', `${text} ${r} km + service`, { location: text, within: String(r), typeOfSupport: cases.publicService }, place, r)
  }
}
await db.$disconnect()
console.log(unexplained ? `${unexplained} unexplained difference(s)` : 'parity: every difference explained')
process.exit(unexplained ? 1 : 0)
