// The contract shape. A thin in-house replacement for ts-rest, which cannot infer
// types from Zod 4 schemas (D1, 2026-09-25): declarations only, no runtime beyond
// what the client, the OpenAPI generator and the checks need.
import type * as z from 'zod'
import type { Meta } from './meta'

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

/** A file part of a multipart body. The server also checks the file signature. */
export interface FileRule {
  maxBytes: number
  mimeTypes: readonly [string, ...string[]]
}

export type BodyDef =
  | { kind: 'json'; schema: z.ZodType }
  | { kind: 'multipart'; files: Record<string, FileRule> }

export interface EntryDef {
  method: HttpMethod
  /** Starts with /v1/; path parameters as :name. */
  path: string
  summary: string
  pathParams?: z.ZodObject
  query?: z.ZodObject
  body?: BodyDef
  /** Success responses only. Error responses share one shape (errors.ts). */
  responses: Partial<Record<200 | 201 | 202 | 204, z.ZodType>>
  meta: Meta
}

export type ContractDef = Record<string, EntryDef>

export interface Contract<C extends ContractDef = ContractDef> {
  /** The area, e.g. 'registration'. Becomes the operationId prefix. */
  area: string
  entries: C
}

export function defineContract<const C extends ContractDef>(area: string, entries: C): Contract<C> {
  return { area, entries }
}

// ---- Types derived from an entry -------------------------------------------------
// Input types are what a caller sends (z.input); server types are what a handler
// receives after validation and normalisation (z.output).

type Infer<S, IO extends 'in' | 'out'> = S extends z.ZodType ? (IO extends 'in' ? z.input<S> : z.output<S>) : undefined

export type BodyInput<E extends EntryDef> = E['body'] extends { kind: 'json'; schema: infer S }
  ? Infer<S, 'in'>
  : E['body'] extends { kind: 'multipart' }
    ? FormData
    : undefined

export type BodyOutput<E extends EntryDef> = E['body'] extends { kind: 'json'; schema: infer S } ? Infer<S, 'out'> : undefined

export interface RequestInput<E extends EntryDef> {
  params: Infer<E['pathParams'], 'in'>
  query: Infer<E['query'], 'in'>
  body: BodyInput<E>
}

export interface RequestOutput<E extends EntryDef> {
  params: Infer<E['pathParams'], 'out'>
  query: Infer<E['query'], 'out'>
  body: BodyOutput<E>
}

/** A success response as a discriminated union on status. */
export type SuccessResponse<E extends EntryDef> = {
  [S in keyof E['responses'] & number]: { status: S; body: Infer<E['responses'][S], 'out'> }
}[keyof E['responses'] & number]
