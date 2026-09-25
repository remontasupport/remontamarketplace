// Pipeline step 10. An entry whose contract declares `audit` must, on success,
// either record that action (in the same transaction as its change) or say why
// there was nothing to audit. The pipeline refuses a success that did neither, so
// a handler cannot forget the audit trail.
import type { Prisma, Tx } from './persistence/db'

export interface AuditRecorder {
  /** Writes an audit_logs row inside `tx`. */
  record(tx: Tx, entry: { action: string; userId?: string | null; metadata?: Prisma.InputJsonValue }): Promise<void>
  /** No change happened, so there is nothing to audit (e.g. registration on an existing email). */
  skip(reason: string): void
}

export class RequestAudit implements AuditRecorder {
  recorded: string[] = []
  skipped: string | undefined

  constructor(private readonly request: { ip: string; userAgent: string | undefined; requestId: string }) {}

  async record(tx: Tx, entry: { action: string; userId?: string | null; metadata?: Prisma.InputJsonValue }): Promise<void> {
    await tx.auditLog.create({
      data: {
        action: entry.action as never, // an AuditAction value; the database enum rejects anything else
        userId: entry.userId ?? null,
        ipAddress: this.request.ip,
        userAgent: this.request.userAgent?.slice(0, 500) ?? null,
        metadata: { requestId: this.request.requestId, ...(isObject(entry.metadata) ? entry.metadata : {}) },
      },
    })
    this.recorded.push(entry.action)
  }

  skip(reason: string): void {
    this.skipped = reason
  }

  /** True if the declared action was recorded or explicitly skipped. */
  satisfies(action: string): boolean {
    return this.recorded.includes(action) || this.skipped !== undefined
  }
}

function isObject(v: unknown): v is Record<string, Prisma.InputJsonValue> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}
