// Password hashing off the event loop (step 5b).
//
// bcrypt cost 12 is ~250 ms of CPU. bcryptjs (what apps/app uses) runs it on the
// main thread, and the burst test showed what that does: while hashing, the process
// cannot even accept requests, so health checks took 6-22 s and in-process load
// shedding had nothing to act on. Here each hash runs in a worker thread; the
// event loop stays free, and the Bulkhead in front bounds the queue and turns
// overflow into a fast 503.
import { existsSync } from 'node:fs'
import { Worker } from 'node:worker_threads'
import { Bulkhead } from '../load/bulkhead'

export interface PasswordHasher {
  hash(password: string): Promise<string>
  verify(password: string, hash: string): Promise<boolean>
  close(): Promise<void>
}

export const BCRYPT_COST = 12

interface Pending {
  resolve: (v: unknown) => void
  reject: (e: Error) => void
}

interface Slot {
  worker: Worker
  pending: Map<number, Pending>
}

function workerFile(): URL {
  // Beside this module in src/ (tests), or beside the bundle in dist/.
  for (const candidate of ['./hash-worker.js', './platform/security/hash-worker.js']) {
    const u = new URL(candidate, import.meta.url)
    if (existsSync(u)) return u
  }
  throw new Error('hash-worker.js not found next to the module or the bundle')
}

export class WorkerPoolHasher implements PasswordHasher {
  private readonly slots: Slot[] = []
  private readonly bulkhead: Bulkhead
  private next = 0
  private seq = 0
  private closed = false

  constructor(opts: { threads: number; maxQueue?: number; queueTimeoutMs?: number; cost?: number }) {
    this.cost = opts.cost ?? BCRYPT_COST
    this.bulkhead = new Bulkhead({ name: 'password-hash', maxConcurrent: opts.threads, maxQueue: opts.maxQueue ?? opts.threads * 4, queueTimeoutMs: opts.queueTimeoutMs ?? 2000 })
    for (let i = 0; i < opts.threads; i++) this.slots.push(this.spawn())
  }

  private readonly cost: number

  hash(password: string): Promise<string> {
    return this.bulkhead.run(() => this.call({ op: 'hash', password, cost: this.cost })) as Promise<string>
  }

  verify(password: string, hash: string): Promise<boolean> {
    return this.bulkhead.run(() => this.call({ op: 'verify', password, hash })) as Promise<boolean>
  }

  async close(): Promise<void> {
    this.closed = true
    await Promise.all(this.slots.map((s) => s.worker.terminate()))
  }

  private spawn(): Slot {
    const slot: Slot = { worker: new Worker(workerFile()), pending: new Map() }
    slot.worker.on('message', (m: { id: number; ok: boolean; result?: unknown; error?: string }) => {
      const p = slot.pending.get(m.id)
      if (!p) return
      slot.pending.delete(m.id)
      if (m.ok) p.resolve(m.result)
      else p.reject(new Error(`password hashing failed: ${m.error}`))
    })
    // A crashed worker fails its in-flight calls and is replaced.
    slot.worker.on('error', (err) => this.replace(slot, err))
    slot.worker.on('exit', (code) => {
      if (!this.closed) this.replace(slot, new Error(`hash worker exited with code ${code}`))
    })
    return slot
  }

  private replace(slot: Slot, err: Error) {
    for (const p of slot.pending.values()) p.reject(err)
    slot.pending.clear()
    const i = this.slots.indexOf(slot)
    if (i >= 0 && !this.closed) this.slots[i] = this.spawn()
  }

  private call(msg: Record<string, unknown>): Promise<unknown> {
    // The bulkhead admits at most `threads` calls, so round-robin never doubles up.
    const slot = this.slots[this.next++ % this.slots.length]!
    const id = ++this.seq
    return new Promise((resolve, reject) => {
      slot.pending.set(id, { resolve, reject })
      slot.worker.postMessage({ id, ...msg })
    })
  }
}
