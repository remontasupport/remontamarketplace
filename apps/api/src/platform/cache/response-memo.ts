// An in-process memo of recent 200 bodies (U2 admin-search, D16, R8.3): the same
// question from any admin within the window is answered without running the handler
// or a statement. Bounded by count (least recently used evicted) and by age; per
// instance; empty at start. Keys are `<entry id>|<canonical query>` -- never the
// caller, because the body does not depend on who asks.
import type { Clock } from '../clock'
import { systemClock } from '../clock'

export interface ResponseMemoOptions {
  maxEntries?: number
  ttlMs?: number
  clock?: Clock
}

export const MEMO_MAX_ENTRIES = 500
export const MEMO_TTL_MS = 60_000

export class ResponseMemo {
  private readonly entries = new Map<string, { body: unknown; storedAt: number }>()
  private readonly maxEntries: number
  private readonly ttlMs: number
  private readonly clock: Clock

  constructor(opts: ResponseMemoOptions = {}) {
    this.maxEntries = opts.maxEntries ?? MEMO_MAX_ENTRIES
    this.ttlMs = opts.ttlMs ?? MEMO_TTL_MS
    this.clock = opts.clock ?? systemClock
  }

  /** The stored body if it is younger than the window, else undefined (and the entry is dropped). */
  get(key: string): unknown {
    const e = this.entries.get(key)
    if (!e) return undefined
    if (this.clock().getTime() - e.storedAt >= this.ttlMs) {
      this.entries.delete(key)
      return undefined
    }
    // Most recently used: re-insert at the end of the map's order.
    this.entries.delete(key)
    this.entries.set(key, e)
    return e.body
  }

  set(key: string, body: unknown): void {
    this.entries.delete(key)
    this.entries.set(key, { body, storedAt: this.clock().getTime() })
    while (this.entries.size > this.maxEntries) {
      const oldest = this.entries.keys().next().value
      if (oldest === undefined) break
      this.entries.delete(oldest)
    }
  }

  get size(): number {
    return this.entries.size
  }

  clear(): void {
    this.entries.clear()
  }
}
