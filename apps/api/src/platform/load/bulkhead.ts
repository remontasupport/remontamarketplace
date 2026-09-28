// A bulkhead: at most `maxConcurrent` runs of an expensive operation at once, a
// short bounded queue behind them, and a fast refusal beyond that (step 5b).
//
// Used for password hashing (bcrypt cost 12, ~250 ms of CPU each): without it, a
// burst of sign-ups hashes all at once and starves every other request -- including
// the health check -- on the instance.
import { ApiError } from '../errors'

export interface BulkheadOptions {
  name: string
  maxConcurrent: number
  /** Callers allowed to wait for a slot. Beyond this: refused immediately. */
  maxQueue: number
  /** A waiting caller gives up after this long. */
  queueTimeoutMs: number
}

export class BulkheadFullError extends ApiError {
  constructor(name: string, why: 'queue-full' | 'queue-timeout') {
    super(503, `bulkhead ${name}: ${why}`, undefined, { 'retry-after': '2' })
  }
}

export class Bulkhead {
  private active = 0
  private readonly waiting: { resolve: () => void; timer: NodeJS.Timeout }[] = []

  constructor(private readonly opts: BulkheadOptions) {
    if (opts.maxConcurrent < 1) throw new Error(`bulkhead ${opts.name}: maxConcurrent must be >= 1`)
  }

  async run<T>(work: () => Promise<T>): Promise<T> {
    await this.acquire()
    try {
      return await work()
    } finally {
      this.releaseSlot()
    }
  }

  get stats() {
    return { active: this.active, waiting: this.waiting.length }
  }

  private acquire(): Promise<void> {
    if (this.active < this.opts.maxConcurrent) {
      this.active++
      return Promise.resolve()
    }
    if (this.waiting.length >= this.opts.maxQueue) return Promise.reject(new BulkheadFullError(this.opts.name, 'queue-full'))
    return new Promise<void>((resolve, reject) => {
      const entry = {
        resolve,
        timer: setTimeout(() => {
          const i = this.waiting.indexOf(entry)
          if (i >= 0) this.waiting.splice(i, 1)
          reject(new BulkheadFullError(this.opts.name, 'queue-timeout'))
        }, this.opts.queueTimeoutMs),
      }
      this.waiting.push(entry)
    })
  }

  private releaseSlot(): void {
    const next = this.waiting.shift()
    if (next) {
      clearTimeout(next.timer)
      next.resolve() // the slot passes straight to the next caller; active is unchanged
    } else {
      this.active--
    }
  }
}
