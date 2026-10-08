// Contract checks. The package's tests run them (CI fails the build), and apps/api
// runs them at boot and refuses to start on any problem (S1-design 2.2). They cover
// what types cannot: cross-entry uniqueness, the reviewed public allow-list, and
// that every JSON body rejects unknown fields (P9).
import * as z from 'zod'
import type { Contract, EntryDef } from './define'

export interface PublicEndpoint {
  /** "GET /v1/localities" */
  route: string
  /** Why this endpoint needs no sign-in. */
  reason: string
}

export function routeOf(e: Pick<EntryDef, 'method' | 'path'>): string {
  return `${e.method} ${e.path}`
}

export function* allEntries(contracts: readonly Contract[]): Generator<{ id: string; entry: EntryDef }> {
  for (const c of contracts) for (const [name, entry] of Object.entries(c.entries)) yield { id: `${c.area}.${name}`, entry }
}

export function checkContracts(contracts: readonly Contract[], publicAllowList: readonly PublicEndpoint[]): string[] {
  const problems: string[] = []
  const areas = new Set<string>()
  const routes = new Map<string, string>()

  for (const c of contracts) {
    if (!/^[a-z][a-zA-Z]+$/.test(c.area)) problems.push(`area "${c.area}": must be camelCase letters`)
    if (areas.has(c.area)) problems.push(`area "${c.area}": declared twice`)
    areas.add(c.area)
  }

  for (const { id, entry: e } of allEntries(contracts)) {
    const route = routeOf(e)
    const clash = routes.get(route)
    if (clash) problems.push(`${id}: ${route} is also ${clash}`)
    routes.set(route, id)

    if (!/^\/v1(\/(:?[a-z][a-zA-Z0-9-]*))+$/.test(e.path)) problems.push(`${id}: path ${e.path} must be /v1/... with :camelCase params`)
    const inPath = [...e.path.matchAll(/:([a-zA-Z0-9]+)/g)].map((m) => m[1]).sort()
    const declared = Object.keys(e.pathParams?.shape ?? {}).sort()
    if (inPath.join() !== declared.join()) problems.push(`${id}: path params ${inPath} do not match pathParams ${declared}`)

    if (e.method === 'GET' && e.body) problems.push(`${id}: a GET cannot have a body`)
    if (e.meta.bot !== 'none' && e.method === 'GET') problems.push(`${id}: CAPTCHA on a GET`)
    if (e.meta.cacheSeconds && (e.method !== 'GET' || e.meta.access !== 'public')) {
      problems.push(`${id}: only public GETs may be cached`)
    }
    if (e.meta.privateCacheSeconds !== undefined) {
      if (e.method !== 'GET' || e.meta.access === 'public') problems.push(`${id}: privateCacheSeconds needs a role-restricted GET (a public entry uses cacheSeconds)`)
      if (e.meta.cacheSeconds) problems.push(`${id}: cacheSeconds and privateCacheSeconds never together`)
    }
    if (Object.keys(e.responses).length === 0) problems.push(`${id}: no success response`)
    if (e.meta.probe && (e.method !== 'GET' || e.body || e.query || e.pathParams)) {
      problems.push(`${id}: only a GET with no input may be a probe`)
    }

    if (e.body?.kind === 'json' && !rejectsUnknownFields(e.body.schema, 'input')) problems.push(`${id}: body must be a strict object (P9)`)
    if (e.query && !rejectsUnknownFields(e.query, 'input')) problems.push(`${id}: query must be a strict object (P9)`)
    for (const [status, schema] of Object.entries(e.responses)) {
      // Output mode: a plain z.object strips unknown keys, which is what P10 asks; only a
      // loose object (passthrough) can leak a field the handler added by accident.
      if (schema && !rejectsUnknownFields(schema, 'output')) problems.push(`${id}: ${status} response must not pass unknown fields through (P10)`)
    }
    if (e.body?.kind === 'multipart') {
      const largest = Math.max(...Object.values(e.body.files).map((f) => f.maxBytes))
      if (largest > e.meta.maxBodyKb * 1024) problems.push(`${id}: a file limit exceeds maxBodyKb`)
    }
  }

  // The allow-list and the public entries must match exactly, in both directions:
  // a public entry nobody reviewed, or a reviewed route that no longer exists.
  const publicRoutes = new Set([...allEntries(contracts)].filter((x) => x.entry.meta.access === 'public').map((x) => routeOf(x.entry)))
  const allowed = new Set(publicAllowList.map((p) => p.route))
  for (const r of publicRoutes) if (!allowed.has(r)) problems.push(`${r}: public but not on public-endpoints.json`)
  for (const p of publicAllowList) {
    if (!publicRoutes.has(p.route)) problems.push(`public-endpoints.json: ${p.route} is not a public entry`)
    if (p.reason.trim().length < 10) problems.push(`public-endpoints.json: ${p.route} needs a reason`)
  }
  return problems
}

function rejectsUnknownFields(schema: z.ZodType, io: 'input' | 'output'): boolean {
  const js = z.toJSONSchema(schema, { io, unrepresentable: 'any' }) as { type?: string; additionalProperties?: unknown }
  return js.type === 'object' && js.additionalProperties === false
}
