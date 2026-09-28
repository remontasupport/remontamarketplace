// Suburb search for sign-up (S1-data-model 2.2): GET /v1/localities?q=.
//
// The current (not retired) rows of au_localities -- ~15,500, ~2 MB -- are held in
// memory and reloaded hourly, so a keystroke costs a lookup, not a query, and a
// burst of typing never reaches the database. A reload that fails keeps serving
// the previous list (it is refreshed twice a year; an hour-old copy is fine).
import type { Db } from '../../platform/persistence/db'
import { localityLabel, type Locality } from '../locations/domain/home'

export interface LocalityMatch {
  id: number
  suburb: string
  state: 'NSW' | 'VIC' | 'QLD' | 'WA' | 'SA' | 'TAS' | 'ACT' | 'NT' | 'OT'
  postcode: string
  label: string
}

interface Entry extends LocalityMatch {
  searchName: string
  words: string[]
}

export const MAX_RESULTS = 10

/**
 * Ranks matches for a query:
 *   - digits: postcodes starting with it;
 *   - text: suburbs whose name starts with it, then suburbs with a later word
 *     starting with it ("kilda" finds St Kilda), each alphabetical.
 * A query of "suburb postcode" ("parramatta 2150") narrows by both.
 */
export function searchLocalities(entries: readonly Entry[], q: string, limit = MAX_RESULTS): LocalityMatch[] {
  const query = q.trim().toLowerCase().replace(/\s+/g, ' ')
  if (query.length < 2) return []
  const m = /^(.*?)\s*(\d{1,4})$/.exec(query)
  const text = m ? m[1]!.trim() : query
  const digits = m ? m[2]! : ''

  const byPostcode = (e: Entry) => !digits || e.postcode.startsWith(digits)
  let hits: Entry[]
  if (!text) {
    hits = entries.filter(byPostcode)
  } else {
    const first = entries.filter((e) => e.searchName.startsWith(text) && byPostcode(e))
    const later = entries.filter((e) => !e.searchName.startsWith(text) && e.words.slice(1).some((w) => w.startsWith(text)) && byPostcode(e))
    hits = [...first, ...later]
  }
  return hits.slice(0, limit).map(({ id, suburb, state, postcode, label }) => ({ id, suburb, state, postcode, label }))
}

export function toEntry(l: Pick<Locality, 'id' | 'suburb' | 'state' | 'postcode'> & { searchName: string }): Entry {
  return {
    id: l.id,
    suburb: l.suburb,
    state: l.state as Entry['state'],
    postcode: l.postcode,
    label: localityLabel(l),
    searchName: l.searchName,
    words: l.searchName.split(/[ -]/),
  }
}

const compare = (a: Entry, b: Entry) => (a.searchName < b.searchName ? -1 : a.searchName > b.searchName ? 1 : a.state < b.state ? -1 : a.state > b.state ? 1 : a.postcode < b.postcode ? -1 : 1)

export class LocalityDirectory {
  private entries: Entry[] = []
  private loadedAt = 0
  private loading: Promise<void> | undefined

  constructor(
    private readonly db: Db,
    private readonly ttlMs = 3_600_000,
  ) {}

  async search(q: string): Promise<LocalityMatch[]> {
    await this.fresh()
    return searchLocalities(this.entries, q)
  }

  private async fresh(): Promise<void> {
    if (Date.now() - this.loadedAt < this.ttlMs && this.entries.length) return
    this.loading ??= this.load().finally(() => (this.loading = undefined))
    try {
      await this.loading
    } catch (err) {
      if (!this.entries.length) throw err // nothing to fall back on
    }
  }

  private async load(): Promise<void> {
    const rows = await this.db.auLocality.findMany({
      where: { retiredAt: null },
      select: { id: true, suburb: true, searchName: true, state: true, postcode: true },
    })
    this.entries = rows.map(toEntry).sort(compare)
    this.loadedAt = Date.now()
  }
}
