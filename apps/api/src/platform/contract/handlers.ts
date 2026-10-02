// What a module provides for its area's contract: one handler per entry, typed from
// the contract. Handlers receive validated, normalised input and return a success
// response; everything else (limits, bot check, auth, validation, output shaping,
// audit enforcement, errors) is the pipeline's job.
import type { Contract, ContractDef, EntryDef, RequestOutput, SuccessResponse } from '@remonta/api-contract'
import type { FastifyBaseLogger } from 'fastify'
import type { AuditRecorder } from '../audit'
import type { Principal } from '../auth/authenticator'

export interface UploadedFile {
  filename: string
  /** As declared by the client -- untrusted; check the bytes (magic number). */
  declaredType: string
  data: Buffer
}

export type Files<E extends EntryDef> = E['body'] extends { kind: 'multipart'; files: infer F } ? { [K in keyof F]: UploadedFile } : undefined

export interface HandlerContext {
  requestId: string
  ip: string
  principal: Principal | null
  /** The body as received, before validation: only for noticing what validation dropped (e.g. a malformed zohoLeadId). */
  rawBody: unknown
  log: FastifyBaseLogger
  audit: AuditRecorder
}

export type HandlerRequest<E extends EntryDef> = RequestOutput<E> & { files: Files<E> }

export type Handler<E extends EntryDef> = (req: HandlerRequest<E>, ctx: HandlerContext) => Promise<SuccessResponse<E>>

export type Handlers<C extends ContractDef> = { [N in keyof C]: Handler<C[N]> }

/**
 * A contract with its handlers, as the binder consumes it. The entry-level types
 * are checked in defineHandlers; here they are erased, so sets for different areas
 * can sit in one list without a cast at every composition root.
 */
export interface HandlerSet {
  contract: Contract
  handlers: Record<string, Handler<EntryDef>>
}

/** Pairs a contract with its handlers; the types make a missing or mistyped handler a compile error. */
export function defineHandlers<C extends ContractDef>(contract: Contract<C>, handlers: NoInfer<Handlers<C>>): HandlerSet {
  return { contract, handlers: handlers as unknown as HandlerSet['handlers'] }
}
