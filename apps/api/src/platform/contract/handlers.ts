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
  userAgent: string | undefined
  principal: Principal | null
  log: FastifyBaseLogger
  audit: AuditRecorder
}

export type HandlerRequest<E extends EntryDef> = RequestOutput<E> & { files: Files<E> }

export type Handler<E extends EntryDef> = (req: HandlerRequest<E>, ctx: HandlerContext) => Promise<SuccessResponse<E>>

export type Handlers<C extends ContractDef> = { [N in keyof C]: Handler<C[N]> }

export interface HandlerSet<C extends ContractDef = ContractDef> {
  contract: Contract<C>
  handlers: Handlers<C>
}

/** Pairs a contract with its handlers; the types make a missing handler a compile error. */
export function defineHandlers<C extends ContractDef>(contract: Contract<C>, handlers: NoInfer<Handlers<C>>): HandlerSet<C> {
  return { contract, handlers }
}
