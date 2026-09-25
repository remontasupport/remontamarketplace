// Load shedding (step 5b). Under a burst, a fast 503 with Retry-After is better than
// letting every request queue until they all time out: the caller can retry, and
// the requests already admitted still finish in time. Runs first, before any work.
//
// Two signals, both cheap:
//   - requests in flight on this instance above maxInFlight;
//   - event-loop delay above maxEventLoopDelayMs: the process is CPU-saturated and
//     every request is already waiting behind others.
import { monitorEventLoopDelay, type IntervalHistogram } from 'node:perf_hooks'

export interface LoadShedderOptions {
  maxInFlight: number
  maxEventLoopDelayMs: number
  /** Seconds to suggest in Retry-After. */
  retryAfterSeconds?: number
  /** Replaces the event-loop probe (tests). Returns the current delay in ms. */
  delayProbe?: () => number
}

export type ShedDecision = { admit: true } | { admit: false; reason: 'in-flight' | 'event-loop'; retryAfter: number }

export class LoadShedder {
  private inFlight = 0
  private readonly histogram: IntervalHistogram | undefined
  private readonly probe: () => number
  private readonly retryAfter: number

  constructor(private readonly opts: LoadShedderOptions) {
    this.retryAfter = opts.retryAfterSeconds ?? 2
    if (opts.delayProbe) {
      this.probe = opts.delayProbe
    } else {
      const h = monitorEventLoopDelay({ resolution: 10 })
      h.enable()
      this.histogram = h
      // Recent p99, reset every second so a past spike does not shed forever.
      let last = 0
      const timer = setInterval(() => {
        last = h.percentile(99) / 1e6
        h.reset()
      }, 1000)
      timer.unref()
      this.probe = () => last
    }
  }

  /** Call on every request; if admitted, call release() when the response is sent. */
  tryAdmit(): ShedDecision {
    if (this.inFlight >= this.opts.maxInFlight) return { admit: false, reason: 'in-flight', retryAfter: this.retryAfter }
    if (this.probe() > this.opts.maxEventLoopDelayMs) return { admit: false, reason: 'event-loop', retryAfter: this.retryAfter }
    this.inFlight++
    return { admit: true }
  }

  release(): void {
    if (this.inFlight > 0) this.inFlight--
  }

  get current(): number {
    return this.inFlight
  }

  stop(): void {
    this.histogram?.disable()
  }
}
