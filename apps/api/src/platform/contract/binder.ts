// Binds contracts to handlers -- the only place routes are created (S1-design 2.2).
//
// Refuses to boot (throws BootError) when:
//   - checkContracts() reports a problem (duplicate routes, non-strict inputs,
//     a public entry missing from public-endpoints.json, ...);
//   - a contract entry has no handler, or a handler has no contract entry;
//   - a contract is bound twice, or a handler set names a contract not in the list;
//   - any route exists that no contract declared (verifyRoutes, after all plugins).
import { checkContracts, routeOf, type Contract, type EntryDef, type PublicEndpoint } from '@remonta/api-contract'
import type { FastifyInstance, RouteOptions } from 'fastify'
import { buildRouteHandler, type PipelineDeps } from '../pipeline/pipeline'
import type { Handler, HandlerSet } from './handlers'

export class BootError extends Error {
  constructor(readonly problems: string[]) {
    super(`apps/api will not start -- contract problems:\n  ${problems.join('\n  ')}`)
    this.name = 'BootError'
  }
}

export interface BindOptions {
  contracts: readonly Contract[]
  handlerSets: readonly HandlerSet[]
  publicEndpoints: readonly PublicEndpoint[]
  deps: PipelineDeps
}

/** Throws BootError before anything is registered if the binding is incomplete. */
export function planBindings(opts: Omit<BindOptions, 'deps'>): { id: string; entry: EntryDef; handler: Handler<EntryDef> }[] {
  const problems = [...checkContracts(opts.contracts, opts.publicEndpoints)]
  const byArea = new Map<string, HandlerSet>()
  for (const set of opts.handlerSets) {
    const area = set.contract.area
    if (byArea.has(area)) problems.push(`${area}: handlers bound twice`)
    if (!opts.contracts.includes(set.contract)) problems.push(`${area}: handlers for a contract that is not served`)
    byArea.set(area, set)
  }

  const bindings: { id: string; entry: EntryDef; handler: Handler<EntryDef> }[] = []
  for (const contract of opts.contracts) {
    const set = byArea.get(contract.area)
    const handlers = (set?.handlers ?? {}) as Record<string, Handler<EntryDef> | undefined>
    for (const [name, entry] of Object.entries(contract.entries)) {
      const handler = handlers[name]
      if (typeof handler !== 'function') problems.push(`${contract.area}.${name}: no handler (${routeOf(entry)})`)
      else bindings.push({ id: `${contract.area}.${name}`, entry, handler })
    }
    for (const name of Object.keys(handlers)) {
      if (!(name in contract.entries)) problems.push(`${contract.area}.${name}: handler with no contract entry`)
    }
  }
  if (problems.length) throw new BootError(problems)
  return bindings
}

export function bindContracts(app: FastifyInstance, opts: BindOptions): void {
  for (const { id, entry, handler } of planBindings(opts)) {
    const route: RouteOptions = {
      method: entry.method,
      url: entry.path,
      // Step 2: over-size JSON is refused before parsing. Multipart streams are
      // bounded per file in the pipeline instead (Fastify's bodyLimit skips them).
      bodyLimit: entry.meta.maxBodyKb * 1024,
      handler: buildRouteHandler(id, entry, handler, opts.deps),
    }
    app.route(route)
  }
}

/** Records every route Fastify registers. Install before any plugin or route. */
export function recordRoutes(app: FastifyInstance): { method: string; url: string }[] {
  const seen: { method: string; url: string }[] = []
  app.addHook('onRoute', (r) => {
    for (const method of [r.method].flat()) seen.push({ method, url: r.url })
  })
  return seen
}

/**
 * After all plugins and routes: every route must be a contract route. The one
 * exception is the CORS preflight the CORS plugin adds (OPTIONS *), which carries
 * no handler logic of ours.
 */
export function verifyRoutes(seen: readonly { method: string; url: string }[], contracts: readonly Contract[]): void {
  const declared = new Set(contracts.flatMap((c) => Object.values(c.entries).map(routeOf)))
  const stray = seen.filter((r) => !(r.method === 'OPTIONS' && r.url === '*') && !declared.has(`${r.method} ${r.url}`))
  if (stray.length) throw new BootError(stray.map((r) => `${r.method} ${r.url}: route not declared in any contract`))
}
