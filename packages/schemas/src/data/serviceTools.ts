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

// ---- Tool search (tool-search addendum TS-1..TS-3, approved 2026-10-22) ------------------------------------------
// One matcher, used by the admin page (to narrow the buttons as the admin types) and by the api (to build its query),
// so what the page shows and what the api finds cannot disagree. A word matches anywhere in a name; several words must
// all match within one name; a reviewed list of other names counts as the same tool.

/** TS-1, approved 2026-10-22: other names that count as the same listed tool. */
export const TOOL_SYNONYMS: Readonly<Record<ToolId, readonly string[]>> = {
  'vacuum-cleaner': ['vacuum', 'vac', 'hoover'],
  'mop-and-bucket': ['mop'],
  'steam-mop': ['steam cleaner'],
  'broom-and-dustpan': ['broom', 'dustpan', 'dust pan'],
  'microfibre-cloths': ['microfiber', 'cloths', 'rags'],
  'cleaning-products': ['cleaning chemicals', 'detergent', 'disinfectant'],
  'eco-cleaning-products': ['eco products', 'green cleaning products', 'natural cleaning products'],
  'scrubbing-brushes': ['scrubbing brush', 'scrubber', 'sponge'],
  'window-cleaning-kit': ['squeegee', 'window cleaner'],
  'carpet-cleaner': ['carpet shampooer', 'rug doctor'],
  'oven-bbq-cleaning-kit': ['oven cleaner', 'bbq cleaner'],
  'extendable-duster': ['duster', 'cobweb brush'],
  'step-ladder': ['stepladder'],
  'gloves-protective-gear': ['gloves', 'ppe'],
  'push-mower': ['lawn mower', 'lawnmower', 'mower'],
  'ride-on-mower': ['rideon', 'mower'], // "ride on mower" is the label once normalised (TS-2)
  'whipper-snipper': ['whippersnipper', 'line trimmer', 'brushcutter', 'brush cutter', 'strimmer', 'weed eater'],
  'hedge-trimmer': ['hedge cutter', 'hedger'],
  'leaf-blower': ['blower', 'blower vac'],
  chainsaw: ['chain saw'],
  'pressure-washer': ['pressure cleaner', 'high pressure cleaner', 'gurney', 'water blaster'],
  'pruning-shears': ['secateurs', 'pruners', 'loppers'],
  'garden-hand-tools': ['rake', 'shovel', 'spade', 'hoe', 'trowel'],
  wheelbarrow: ['barrow'],
  ladder: ['extension ladder'],
  trailer: ['box trailer'],
  'power-drill': ['drill', 'cordless drill'],
  'hand-tools': ['hammer', 'screwdriver', 'spanner', 'toolkit', 'tool kit'],
  'gutter-cleaning-kit': ['gutter cleaner', 'gutter'],
}

export const TOOL_SEARCH_MAX_CHARS = 60
export const TOOL_SEARCH_MAX_WORDS = 5

/** TS-2 step 1, for the query and for every name compared: lower case, hyphens/slashes/dots as spaces, one space. */
export function normaliseToolText(s: string): string {
  return s.toLocaleLowerCase('en-AU').replace(/[-/.]+/g, ' ').replace(/\s+/g, ' ').trim()
}

/** TS-2 step 3: brushes -> brush, mowers -> mower, gloves -> glove; "glass", "gas" and short words untouched. */
export function singularOf(word: string): string {
  if (/(ches|shes|xes|sses)$/.test(word)) return word.slice(0, -2)
  if (word.length >= 4 && word.endsWith('s') && !word.endsWith('ss')) return word.slice(0, -1)
  return word
}

/** TS-2: the query's words -- normalised, one-character words dropped, plurals singular, at most 5, each once. */
export function toolSearchWords(text: string): string[] {
  const words = normaliseToolText(text.slice(0, TOOL_SEARCH_MAX_CHARS)).split(' ').filter((w) => w.length > 1).map(singularOf)
  return [...new Set(words)].slice(0, TOOL_SEARCH_MAX_WORDS)
}

/** TS-3: a name matches when every word appears somewhere in it (normalised). */
export function nameMatches(name: string, words: readonly string[]): boolean {
  const n = normaliseToolText(name)
  return words.length > 0 && words.every((w) => n.includes(w))
}

/** The words a name puts in an own-tool pattern (normalised, one-character words dropped; not singularised). */
const patternOf = (name: string) => normaliseToolText(name).split(' ').filter((w) => w.length > 1)

export interface ToolSearch {
  /** The services searched, in declaration order. */
  services: ToolService[]
  /** The query's words (TS-2). */
  words: string[]
  /** Listed tools whose label or another name matches, in list order. */
  listedIds: ToolId[]
  /**
   * An own tool matches when it contains every word of one pattern: the query's words, and the words of each name of a
   * matched listed tool (so "pressure washer" also finds an own "Gurney 2000"). Deduplicated, the query's first.
   */
  ownPatterns: string[][]
  /** The other names of the matched tools, for "Also matches: ..." on the page; label-equal names left out. */
  otherNames: string[]
}

/**
 * TS-3: what a search text matches, over `services` (both by default). null when the text keeps no word (TS-2: the
 * search is then ignored, never an error).
 */
export function toolSearchOf(text: string, services: readonly ToolService[] = TOOL_SERVICES): ToolSearch | null {
  const words = toolSearchWords(text)
  if (!words.length) return null
  const searched = TOOL_SERVICES.filter((s) => services.includes(s))
  const listedIds: ToolId[] = []
  const patterns: string[][] = [words]
  const otherNames: string[] = []
  for (const s of searched) {
    for (const t of SERVICE_TOOLS[s]) {
      const names = [t.label, ...TOOL_SYNONYMS[t.id]]
      if (!names.some((n) => nameMatches(n, words))) continue
      listedIds.push(t.id)
      for (const n of names) {
        const p = patternOf(n)
        if (p.length) patterns.push(p)
      }
      for (const n of TOOL_SYNONYMS[t.id]) if (!otherNames.includes(n)) otherNames.push(n)
    }
  }
  const seen = new Set<string>()
  const ownPatterns = patterns.filter((p) => {
    const k = p.join(' ')
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
  return { services: searched, words, listedIds, ownPatterns, otherNames }
}

/** TS-3 in memory: does an own tool match a search (the api's SQL does the same on the stored own tools). */
export function ownToolMatches(own: string, search: Pick<ToolSearch, 'ownPatterns'>): boolean {
  const n = normaliseToolText(own)
  return search.ownPatterns.some((p) => p.every((w) => n.includes(w)))
}
