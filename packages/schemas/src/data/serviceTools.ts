// The tools a worker can say they bring (worker-tools U1, E1, 2026-10-22): one list per
// service that has one, keyed by the catalogue's category id. The Services step offers
// these labels, `worker_services."toolIds"` stores the ids, and the admin search filters
// by the same ids. One list, read by the page, the api contract and the dashboard.
//
// Ids are unique across every list (the admin `tools` filter carries no service) and are
// never reused for another tool; a label can be reworded without a data change (BR-1).

export const SERVICE_TOOLS = {
  'cleaning-services': [
    { id: 'vacuum-cleaner', label: 'Vacuum cleaner' },
    { id: 'mop-and-bucket', label: 'Mop and bucket' },
    { id: 'steam-mop', label: 'Steam mop' },
    { id: 'broom-and-dustpan', label: 'Broom and dustpan' },
    { id: 'microfibre-cloths', label: 'Microfibre cloths' },
    { id: 'cleaning-products', label: 'Cleaning products' },
    { id: 'eco-cleaning-products', label: 'Eco-friendly cleaning products' },
    { id: 'scrubbing-brushes', label: 'Scrubbing brushes and sponges' },
    { id: 'window-cleaning-kit', label: 'Window cleaning kit (squeegee, extension pole)' },
    { id: 'carpet-cleaner', label: 'Carpet cleaner' },
    { id: 'oven-bbq-cleaning-kit', label: 'Oven and BBQ cleaning kit' },
    { id: 'extendable-duster', label: 'Extendable duster' },
    { id: 'step-ladder', label: 'Step ladder' },
    { id: 'gloves-protective-gear', label: 'Gloves and protective gear' },
  ],
  'home-yard-maintenance': [
    { id: 'push-mower', label: 'Push lawn mower' },
    { id: 'ride-on-mower', label: 'Ride-on mower' },
    { id: 'whipper-snipper', label: 'Whipper snipper' },
    { id: 'hedge-trimmer', label: 'Hedge trimmer' },
    { id: 'leaf-blower', label: 'Leaf blower' },
    { id: 'chainsaw', label: 'Chainsaw' },
    { id: 'pressure-washer', label: 'Pressure washer' },
    { id: 'pruning-shears', label: 'Pruning shears and loppers' },
    { id: 'garden-hand-tools', label: 'Rake, shovel and garden hand tools' },
    { id: 'wheelbarrow', label: 'Wheelbarrow' },
    { id: 'ladder', label: 'Ladder' },
    { id: 'trailer', label: 'Trailer' },
    { id: 'power-drill', label: 'Power drill' },
    { id: 'hand-tools', label: 'Hand tools (hammer, screwdrivers, spanners)' },
    { id: 'gutter-cleaning-kit', label: 'Gutter cleaning kit' },
  ],
} as const

export type ToolService = keyof typeof SERVICE_TOOLS
export type ToolId = (typeof SERVICE_TOOLS)[ToolService][number]['id']

/** The services that have a list, in declaration order. */
export const TOOL_SERVICES = Object.keys(SERVICE_TOOLS) as [ToolService, ...ToolService[]]

/** Every tool id, list by list, in list order. */
export const TOOL_IDS = TOOL_SERVICES.flatMap((s) => SERVICE_TOOLS[s].map((t) => t.id)) as [ToolId, ...ToolId[]]

/** BR-6: at most this many free-text tools per service, each at most this long (after cleaning). */
export const OTHER_TOOLS_MAX = 5
export const OTHER_TOOL_MAX_CHARS = 60

export const isToolService = (categoryId: string): categoryId is ToolService => Object.hasOwn(SERVICE_TOOLS, categoryId)

/** The service whose list holds `id`; undefined for an id on no list. */
export function toolServiceOf(id: string): ToolService | undefined {
  return TOOL_SERVICES.find((s) => SERVICE_TOOLS[s].some((t) => t.id === id))
}

/** The label of a tool id, or undefined when the id is on no list (a stale id: BR-9). */
export function toolLabelOf(id: string): string | undefined {
  for (const s of TOOL_SERVICES) for (const t of SERVICE_TOOLS[s]) if (t.id === id) return t.label
  return undefined
}

/** BR-5: the ids of `service`'s list that `ids` names, in list order, each once; ids of no or another list dropped. */
export function inListOrder(service: ToolService, ids: Iterable<string>): ToolId[] {
  const chosen = new Set(ids)
  return SERVICE_TOOLS[service].filter((t) => chosen.has(t.id)).map((t) => t.id)
}

const collapse = (s: string) => s.trim().replace(/\s+/g, ' ')
const key = (s: string) => s.toLocaleLowerCase('en-AU')

/**
 * BR-6, the free-text tools cleaned: trimmed, inner whitespace collapsed, empties dropped, an entry equal (ignoring
 * case) to a label of the service's list dropped (the worker ticks that one instead), duplicates (ignoring case) dropped
 * keeping the first spelling. The limits (OTHER_TOOLS_MAX, OTHER_TOOL_MAX_CHARS) are the caller's to check, so it can
 * name the field. Idempotent.
 */
export function normaliseOtherTools(raw: readonly string[], service: ToolService): string[] {
  const seen = new Set(SERVICE_TOOLS[service].map((t) => key(t.label)))
  const out: string[] = []
  for (const r of raw) {
    const v = collapse(r)
    if (!v || seen.has(key(v))) continue
    seen.add(key(v))
    out.push(v)
  }
  return out
}
